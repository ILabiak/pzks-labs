const { generateTree, checkAndOptimise } = require('../lab2/main');

const operationTime = {
  '+': 5,
  '-': 5,
  '*': 7,
  '/': 7,
  sin: 10,
  cos: 10,
  tan: 10,
  cot: 10,
  sqrt: 15,
};

const transmissionTime = 2;

// Процесор
class Processor {
  constructor(id, row, col) {
    this.row = row;
    this.col = col;
    this.id = id;
  }
}

// клас системи
class MatrixSystem {
  constructor(processorCount) {
    this.processorCount = processorCount;
    // матриця процесорів
    this.processors = Array.from({ length: processorCount / 2 }, (_, i) =>
      Array.from(
        { length: processorCount / 2 },
        (_, j) => new Processor(2 * i + j + 1, i, j)
      )
    );
  }

  async transferData(fromId, toId) {
    console.log(
      `Transferring data from Processor ${fromId} to Processor ${toId}`
    );
  }

  getNeighbors(processor) {
    const row = processor.row;
    const col = processor.col;
    const maxRows = this.processors.length;
    const maxCols = this.processors[0].length;

    const neighbors = [];
    neighbors.push(this.processors[(row - 1 + maxRows) % maxRows][col]);
    neighbors.push(this.processors[row][(col + 1) % maxCols]);
    return neighbors;
  }
}

let ganttChartData = [];

// діаграма Ганта
const printGanttChart = (data) => {
  const processors = {};
  const timeGone = {};
  const totalDuration = data[data.length - 1].endTime;

  data.forEach((task) => {
    let operationStr;
    const { processorId, operation, startTime, endTime } = task;
    if (!processors[processorId]) {
      processors[processorId] = ' '.repeat(totalDuration);
    }
    const duration = endTime - startTime;
    const splitedStr = processors[processorId].split('');
    if (operation.length > 1) {
      operationStr = `[${operation}${'.'.repeat(
        duration - operation.length - 2
      )}]`;
    } else {
      operationStr = `[${operation.repeat(duration - 2)}]`;
    }

    if (startTime == 0) {
      processors[processorId] = [
        ...operationStr.split(''),
        ...splitedStr.slice(endTime),
      ].join('');
    }
    processors[processorId] = [
      ...splitedStr.slice(0, startTime),
      ...operationStr.split(''),
      ...splitedStr.slice(endTime),
    ].join('');
  });

  console.log('\nGantt Chart:');
  Object.keys(processors).forEach((processorId) => {
    console.log(`Processor ${processorId}: ${processors[processorId]}`);
  });
};

// Обчислення часу в матричній системі з кільцевою топологією, 4 процесори
const calculateParallelExecutionTime = async (
  node,
  processor,
  matrixSystem,
  logging = false
) => {
  if (node.type === 'Number' || node.type === 'Variable') {
    return 0;
  }

  if (node.type === 'BinaryExpression') {
    const neighbors = matrixSystem.getNeighbors(processor);

    if (logging) {
      //   console.log(`Процесор ${processor.id}. Його сусіди:`, neighbors, '\n\n');
    }

    const leftProcessor = neighbors[0];
    const rightProcessor = neighbors[1];

    const leftPromise = calculateParallelExecutionTime(
      node.left,
      leftProcessor,
      matrixSystem,
      logging
    );
    const rightPromise = calculateParallelExecutionTime(
      node.right,
      rightProcessor,
      matrixSystem,
      logging
    );

    const [leftTime, rightTime] = await Promise.all([
      leftPromise,
      rightPromise,
    ]);

    const operation = node.operator;
    const operationExecutionTime = operationTime[operation] || 0;
    let currentStartTime = Math.max(leftTime, rightTime);


    // console.log({startTimeBefore: currentStartTime, endTimeBefore: currentStartTime + operationExecutionTime})
    if(ganttChartData[0]){
      const sameTimeTasks = ganttChartData.filter(el =>  el.operation != operation)
      let maxEndTime = currentStartTime;
      for(let el of sameTimeTasks){
        if(maxEndTime < el.endTime){
          maxEndTime = el.endTime
        }
      }
      currentStartTime = maxEndTime
    }
  

    ganttChartData.push({
      processorId: processor.id,
      operation,
      startTime: currentStartTime,
      endTime: currentStartTime + operationExecutionTime,
    });
    // console.log({
    //   processorId: processor.id,
    //   operation,
    //   startTime: currentStartTime,
    //   endTime: currentStartTime + operationExecutionTime,
    // })
    // console.log('\n')


    if (logging) {
      console.log(`Процесор ${processor.id} виконує операцію ${operation}`);
    }

    // імітація передачі даних
    if (logging) {
      await matrixSystem.transferData(processor.id, leftProcessor.id);
      await matrixSystem.transferData(processor.id, rightProcessor.id);
    }

    // Час операції, яка зайняла більше всього часу + час обчислення операції + час передачі даних до потоків
    return currentStartTime + operationExecutionTime + transmissionTime;
  }

  if (node.type === 'FunctionExpression') {
    let argumentTime = await calculateParallelExecutionTime(
      node.argument,
      processor,
      matrixSystem,
      logging
    );
    const functionName = node.function;
    const functionExecutionTime = operationTime[functionName] || 0;
    if (logging) {
      console.log(`Процесор ${processor.id} виконує функцію ${functionName}`);
    }

    if(ganttChartData[0]){
      const sameTimeTasks = ganttChartData.filter(el => el.operation != functionName)
      let maxEndTime = argumentTime;
      for(let el of sameTimeTasks){
        if(maxEndTime < el.endTime){
          maxEndTime = el.endTime
        }
      }
      argumentTime = maxEndTime
    }

    ganttChartData.push({
      processorId: processor.id,
      operation: functionName,
      startTime: argumentTime,
      endTime: argumentTime + functionExecutionTime,
    });

    return argumentTime + functionExecutionTime;
  }

  return 0;
};

const calculateSequentialExecutionTime = async (node) => {
  if (node.type === 'Number' || node.type === 'Variable') {
    return 0;
  }

  if (node.type === 'BinaryExpression') {
    const leftTime = await calculateSequentialExecutionTime(node.left);
    const rightTime = await calculateSequentialExecutionTime(node.right);

    const operation = node.operator;
    const operationExecutionTime = operationTime[operation] || 0;

    return leftTime + rightTime + operationExecutionTime;
  }

  if (node.type === 'FunctionExpression') {
    const argumentTime = await calculateSequentialExecutionTime(node.argument);
    const functionName = node.function;
    const functionExecutionTime = operationTime[functionName] || 0;
    return argumentTime + functionExecutionTime;
  }

  return 0;
};

const calculateExecutionTime = async (expressionObj, logging = false) => {
  const matrixSystem = new MatrixSystem(4);
  const parallelTime = await calculateParallelExecutionTime(
    expressionObj,
    matrixSystem.processors[0][0],
    matrixSystem,
    logging
  );
  const sequentialTime = await calculateSequentialExecutionTime(expressionObj);
  console.log(
    `Час виконання програми у послідовному режимі: ${sequentialTime}`
  );
  console.log(
    `Час виконання програми у паралельному режимі матричної системи: ${
      parallelTime - 2
    }`
  );
  let speedupRate = sequentialTime / (parallelTime - 2);
  console.log(`Коефіцієнт прискорення: ${speedupRate.toFixed(2)}`);
  console.log(`Ефективність: ${(speedupRate / 4).toFixed(2)}`);
};

(async () => {
  // const expression = 'a*b*c*d*e*g';
  // const expression = 'a/b/c/d/e';
  // const expression = '(a*c)/(b*d)';
  // const expression = 'a-b-c-d-e-f';
  // const expression = 'a+b+c+d+e+f';
  // const expression = '3+4.2+43+14.5+3453';
  // const expression = '3-4.3-10-3.1-73.3';

  // const expression = 'a+b*(c-d)/e';
  // const expression = '3+5*(2-8)/4';
  // const expression = '(a+b)*(c-d)/e';
  // const expression = 'y=3+5*(2-8)/5';
  // const expression = 'x*(y+z)-sin(a*x)/(cos(b+y)*tan(c/x))';
  // const expression = '2.5*(3+4.81/k-q*t)/(cos(t+a*y/f+(5.616*x-t))+c*sin(t-a*y))';
  // const expression = '5.67*x + 3*(y - 4.81)';
  // const expression = 'a+b/c - 4.81/(x*y)';
  // const expression = 'cos(a)*sin(b)-tan(c)/(1+d)';
  const res = await checkAndOptimise(
    'x*(y+z)-sin(a*x)/(cos(b+y)*tan(c/x))'
  );
  generateTree(res)
  if (res) {
    await calculateExecutionTime(res, true);
  }
  printGanttChart(ganttChartData);
})();
