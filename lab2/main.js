const { randomUUID } = require('crypto');
const { analyseCalculation, parse } = require('../lab1/main');
const graphviz = require('graphviz');
const path = require('path');

const optimizeAssociative = (parsed, operator) => {
  let flattenedOperands = [];

  const flatten = (node) => {
    if (node.type === 'BinaryExpression' && node.operator === operator) {
      flatten(node.left);
      flatten(node.right);
    } else {
      flattenedOperands.push(node);
    }
  };

  flatten(parsed);

  // const combine = (operands, operator) => {
  //   if (operands.length === 1) {
  //     return operands[0];
  //   }

  //   const mid = Math.floor(operands.length / 2);
  //   return {
  //     type: 'BinaryExpression',
  //     operator: operator,
  //     left: combine(operands.slice(0, mid), operator),
  //     right: combine(operands.slice(mid), operator),
  //   };
  // };

  const combine = (operands, operator) => {
    // Combine operands two at a time to ensure balancing
    while (operands.length > 1) {
      let newOperands = [];
      for (let i = 0; i < operands.length; i += 2) {
        if (i + 1 < operands.length) {
          // Combine pairs of operands
          newOperands.push({
            type: 'BinaryExpression',
            operator: operator,
            left: operands[i],
            right: operands[i + 1],
          });
        } else {
          // If there's an odd number of operands, just carry the last one forward
          newOperands.push(operands[i]);
        }
      }
      operands = newOperands; // Continue combining the newly generated operands
    }

    return operands[0]; // The last remaining operand is the root of the balanced tree
  };

  return combine(flattenedOperands, operator);
};

// оптимізація арифметичного виразу
const optimize = (parsed) => {
  if (parsed.type === 'BinaryExpression') {
    parsed.left = optimize(parsed.left);
    parsed.right = optimize(parsed.right);

    if (parsed.operator === '+') {
      if (parsed.right.type === 'Number' && parsed.right.value === 0) {
        return parsed.left;
      }
      if (parsed.left.type === 'Number' && parsed.left.value === 0) {
        return parsed.right;
      }
      return optimizeAssociative(parsed, '+');
    }

    if (parsed.operator === '-') {
      if (parsed.right.type === 'Number' && parsed.right.value === 0) {
        return parsed.left;
      }
    }

    if (parsed.operator === '*') {
      if (parsed.right.type === 'Number' && parsed.right.value === 1) {
        return parsed.left;
      }
      if (parsed.left.type === 'Number' && parsed.left.value === 1) {
        return parsed.right;
      }

      if (
        (parsed.right.type === 'Number' && parsed.right.value === 0) ||
        (parsed.left.type === 'Number' && parsed.left.value === 0)
      ) {
        return { type: 'Number', value: 0 };
      }
      return optimizeAssociative(parsed, '*');
    }

    if (parsed.operator === '/') {
      if (parsed.right.type === 'Number' && parsed.right.value === 1) {
        return parsed.left;
      }

      if (parsed.right.type === 'Number' && parsed.right.value === 0) {
        throw new Error('Error: Division by zero');
      }
    }
  }
  return parsed;
};

const createNode = (graph, node, parent = null, label = null) => {
  if (!node?.type) {
    console.log(node);
    return;
  }
  let nodeId = randomUUID();

  switch (node.type) {
    case 'BinaryExpression':
      const operatorLabel = node.operator;
      graph.addNode(nodeId, { label: operatorLabel });
      createNode(graph, node.left, nodeId, '');
      createNode(graph, node.right, nodeId, '');
      break;

    case 'FunctionExpression':
      const functionLabel = node.function;
      graph.addNode(nodeId, { label: functionLabel });
      createNode(graph, node.argument, nodeId, '');
      break;

    case 'Number':
      graph.addNode(nodeId, { label: `${node.value}` });
      break;

    case 'Variable':
      graph.addNode(nodeId, { label: node.name });
      break;

    default:
      console.log('Invalid type:', node.type);
      return;
  }

  if (parent) {
    graph.addEdge(parent, nodeId, { label: label });
  }
};

// створення зображення паралельного дерева
const generateTree = (parsedExp, filename) => {
  const tree = graphviz.digraph('G');
  createNode(tree, parsedExp);
  tree.output('png', path.join(__dirname, `${filename}.png`));
  console.log('Дерево паралельної форми було успішно згенеровано');
};

const refactorDivisiosInExpression = (expStr) => {
  const regex = /(\b[\w.]+)(\/[\w.]+){3,}/g;

  return expStr.replace(regex, (match) => {
    const parts = match.split('/');
    const transformed = `${parts[0]}/(${parts.slice(1).join('*')})`;
    return transformed;
  });
};

const negateExpression = (node) => {
  if (node.type === 'Variable') {
    node.name = '-' + node.name;
  } else if (node.type === 'Number') {
    node.value = -node.value;
  }
  return node;
};

const refactorMinusesInExpression = (node) => {
  if (node.type !== 'BinaryExpression') {
    return node;
  }

  if (node.operator === '-') {
    let minusCount = 1;
    let currentNode = node;

    while (
      currentNode.left &&
      currentNode.left.type === 'BinaryExpression' &&
      currentNode.left.operator === '-'
    ) {
      minusCount++;
      currentNode = currentNode.left;
    }

    // рефакторинг тільки коли 3 та більше мінусів
    if (minusCount >= 3) {
      currentNode = node;
      for (let i = 0; i < minusCount; i++) {
        currentNode.operator = '+';
        currentNode.right = negateExpression(currentNode.right);
        currentNode = currentNode.left;
      }
    }
  }
  node.left = refactorMinusesInExpression(node.left);
  node.right = refactorMinusesInExpression(node.right);

  return node;
};

const checkAndOptimise = async (expression) => {
  const analized = await analyseCalculation(expression);
  if (!analized) return;
  const refactoredExp = refactorDivisiosInExpression(expression);
  const parsed = parse(refactoredExp);
  // console.log(JSON.stringify(parsed, null, 2));
  if (!parsed.type) {
    console.log('Error while parsing expression');
    return;
  }
  let optimized = refactorMinusesInExpression(parsed);
  optimized = optimize(optimized);
  if (!optimized.type) {
    console.log('Error while optimizing expression');
    return;
  }
  return [optimized, refactoredExp];
}

(async () => {
  // const expression = 'x*(y+z)-sin(-3.4*x)/(cos(b+y)*sqrt(c/x))';
  // const expression = '-a+(v+p*(6-h+b*(d+u+5+10)))';
  // const expression = 'a*b*c*d*e*g';
  // const expression = 'a/b/c/d/e';
  // const expression = '(a*c)/(b*d)';
  // const expression = 'a-b-c-d-e-f';
  const expression = 'a+b+c+d+e+f';
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

 /*
  const analized = await analyseCalculation(expression);
  if (!analized) return;
  const refactoredExp = refactorDivisiosInExpression(expression);
  const parsed = parse(refactoredExp);
  console.log(JSON.stringify(parsed, null, 2));
  if (!parsed.type) {
    console.log('Error while parsing expression');
    return;
  }
  let optimized = refactorMinusesInExpression(parsed);
  optimized = optimize(optimized);
  if (!optimized.type) {
    console.log('Error while optimizing expression');
    return;
  }
  console.log(JSON.stringify(optimized, null, 2));
  generateTree(optimized, 'tree');
 */
})();

module.exports = {
  generateTree,
  checkAndOptimise
}