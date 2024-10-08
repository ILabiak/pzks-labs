// Lab 1

/*
•	помилки на початку арифметичного виразу ( наприклад, вираз не може починатись із закритої дужки, алгебраїчних операцій * та /); ✅
•	помилки, пов’язані з неправильним написанням імен змінних,  констант та при необхідності функцій;✅
•	помилки у кінці виразу (наприклад, вираз не може закінчуватись будь-якою алгебраїчною операцією); ✅
•	помилки в середині виразу (подвійні операції ✅, відсутність операцій перед або між дужками, операції* або / після відкритої дужки тощо✅);
•	помилки, пов’язані з використанням дужок ( нерівна кількість відкритих та закритих дужок, неправильний порядок дужок, пусті дужки).✅
•	помилки, пов’язані з недопустимими символами✅
*/

const analyseCalculation = async (calculation) => {
  if (calculation.length < 1) {
    console.log('Вираз не надано\n');
    return false;
  }
  calculation = calculation.replaceAll(' ', '');
  const results = await Promise.all([
    Promise.resolve(checkCalculationStart(calculation)),
    Promise.resolve(checkCalculationEnd(calculation)),
    Promise.resolve(checkWrongCharacters(calculation)),
    Promise.resolve(checkCalculationNumbers(calculation)),
    Promise.resolve(checkCalculationConstants(calculation)),
    Promise.resolve(checkCalculationBrackets(calculation)),
    Promise.resolve(checkFunctionBrackets(calculation)),
    Promise.resolve(checkConstantVariable(calculation)),
  ]);
  const errors = [];
  for (let res of results) {
    if (!res.passed) {
      errors.push(...res.errors);
    }
  }
  if (errors.length > 0) {
    console.log(
      `Вираз ${calculation} неправильний ❌\n` + errors.join('\n') + '\n'
    );
    return false;
  }
  console.log(`Вираз ${calculation} правильний ✅\n`);
  return true;
};

//помилки на початку арифметичного виразу ( наприклад, вираз не може починатись із закритої дужки, алгебраїчних операцій * та /)
const checkCalculationStart = (calculation) => {
  if (calculation.match(/^[\/*\)\^]/g)) {
    const fistSymbol = calculation.slice(0, 1);
    return {
      passed: false,
      errors: [
        `Недопустимий символ на початку арифметичного виразу: ${fistSymbol}`,
      ],
    };
  }
  if (calculation.includes('=')) {
    if (calculation.indexOf('=') != calculation.lastIndexOf('=')) {
      return {
        passed: false,
        errors: [`Два або більше знаків "=" в арифметичному виразі`],
      };
    }
    if (calculation.indexOf('=') != 1) {
      return {
        passed: false,
        errors: [
          `Знак = в арифметичному виразі стоїть в неправильному місці. Перед знаком = може бути тільки одна змінна(назва функції)`,
        ],
      };
    }
  }
  return {
    passed: true,
  };
};

// помилки у кінці виразу (наприклад, вираз не може закінчуватись будь-якою алгебраїчною операцією)
const checkCalculationEnd = (calculation) => {
  if (calculation.match(/[\/*+\-(\^]$/g)) {
    const lastSymbol = calculation.slice(-1);
    return {
      passed: false,
      errors: [
        `Недопустимий символ в кінці арифметичного виразу: ${lastSymbol}`,
      ],
    };
  }
  return {
    passed: true,
  };
};

// перевірка на наявність некоректних символів, подвійні операції, операції */+- перед закритою дужкою, операції */ після відкритої дужки
const checkWrongCharacters = (calculation) => {
  const validationRegex =
    /([^a-z\d\.\/*+\-\=()) ])|([\/\*\\+\-^]{2})|([\/\*\+\-^]\))|(\([\/\*^])|([\.]{2})/g;
  if (!calculation.match(validationRegex)) {
    return {
      passed: true,
    };
  }
  const res = {
    passed: false,
    errors: [],
  };
  let matches = calculation.matchAll(validationRegex);

  for (const match of matches) {
    if (match[1]) {
      res.errors.push(
        `Недопустимий символ '${match[1]}' в арифметичному виразі на місці ${
          match.index + 1
        }`
      );
    } else if (match[2]) {
      res.errors.push(
        `Подвійні операції '${match[2]}' в арифметичному виразі на місці ${
          match.index + 1
        }`
      );
    } else if (match[3]) {
      res.errors.push(
        `Недопустима операція перед закриттям дужки '${
          match[3]
        }' в арифметичному виразі на місці ${match.index + 1}`
      );
    } else if (match[4]) {
      res.errors.push(
        `Недопустима операція після відкриття дужки '${
          match[4]
        }' в арифметичному виразі на місці ${match.index + 1}`
      );
    } else if (match[5]) {
      res.errors.push(
        `Подвійний символ '${match[5]}' в арифметичному виразі на місці ${
          match.index + 1
        }`
      );
    }
  }
  return res;
};

// перевірка чисел
const checkCalculationNumbers = (calculation) => {
  const numbersValidationRegex = /\d+(\.\d+){2,}/g;
  if (!calculation.match(numbersValidationRegex)) {
    return {
      passed: true,
    };
  }
  const res = {
    passed: false,
    errors: [],
  };
  let matches = calculation.matchAll(numbersValidationRegex);
  for (const match of matches) {
    res.errors.push(
      `Неправильно введене число '${
        match[0]
      }' в арифметичному виразі на місці ${match.index + 1}`
    );
  }
  return res;
};

// перевірка імен змінних, констант
const checkCalculationConstants = (calculation) => {
  const constantsValidationRegex =
    /\b(?!tan\b|cos\b|sin\b|cot\b|sqrt\b)[a-zA-Z]{2,}/g;
  if (!calculation.match(constantsValidationRegex)) {
    return {
      passed: true,
    };
  }
  const res = {
    passed: false,
    errors: [],
  };
  let matches = calculation.matchAll(constantsValidationRegex);
  for (const match of matches) {
    res.errors.push(
      `Неправильно введена змінна '${
        match[0]
      }' в арифметичному виразі на місці ${match.index + 1}`
    );
  }
  return res;
};

const checkCalculationBrackets = (calculation) => {
  const stack = [];

  for (let i = 0; i < calculation.length; i++) {
    const char = calculation[i];
    if (char === '(') {
      stack.push(char);
    } else if (char === ')') {
      if (stack.length === 0 || stack.pop() !== '(') {
        return {
          passed: false,
          errors: [`Нерівна кількість відкритих та закритих дужок`],
        };
      }
    }
  }

  if (stack.length > 0) {
    return {
      passed: false,
      errors: [`Нерівна кількість відкритих та закритих дужок`],
    };
  }

  const emptyBracketsRegex = /\(\)/g;

  if (!calculation.match(emptyBracketsRegex)) {
    return {
      passed: true,
    };
  }

  const res = {
    passed: false,
    errors: [],
  };

  const matches = calculation.matchAll(emptyBracketsRegex);
  for (const match of matches) {
    res.errors.push(`Пусті дужки '${match[0]}' на місці ${match.index + 1}`);
  }

  return res;
};

const checkFunctionBrackets = (calculation) => {
  const regex = /\b(sin|cos|tan|cot|sqrt)(?!\s*\()/g;

  if (!calculation.match(regex)) {
    return {
      passed: true,
    };
  }

  const res = {
    passed: false,
    errors: [],
  };

  const matches = calculation.matchAll(regex);
  for (const match of matches) {
    res.errors.push(
      `Функція '${match[1]}' без дужок на місці ${match.index + 1}`
    );
  }

  return res;
};

const checkConstantVariable = (calculation) => {
  const regex = /\d+[a-zA-Z]/g;

  if (!calculation.match(regex)) {
    return {
      passed: true,
    };
  }

  const res = {
    passed: false,
    errors: [],
  };

  const matches = calculation.matchAll(regex);
  for (const match of matches) {
    res.errors.push(
      `Константа біля змінної без операції множення '${match[0]}' на місці ${
        match.index + 1
      }`
    );
  }

  return res;
};

// Зробити токени для кожного елемента арифметичного виразу
const tokenize = (expression) => {
  const tokens = [];
  let i = 0;

  while (i < expression.length) {
    const char = expression[i];

    if (/\s/.test(char)) {
      i++;
    } else if (/[+\-]/.test(char)) {
      const nextChar = expression[i + 1];
      const prevToken = tokens[tokens.length - 1];

      if (
        !prevToken ||
        prevToken.type === 'Operator' ||
        prevToken.value === '('
      ) {
        if (/[0-9.]/.test(nextChar)) {
          let number = char;
          i++;
          while (i < expression.length && /[0-9.]/.test(expression[i])) {
            number += expression[i];
            i++;
          }
          tokens.push({ type: 'Number', value: parseFloat(number) });
        } else if (/[a-zA-Z]/.test(nextChar)) {
          // якщо функція
          if (/[a-zA-Z]/.test(expression[i + 2]) || prevToken?.value === ')') {
            tokens.push({ type: 'Operator', value: char });
            i++;
          } else {
            // якщо змінна
            let variable = char;
            i++;
            while (i < expression.length && /[a-zA-Z]/.test(expression[i])) {
              variable += expression[i];
              i++;
            }
            tokens.push({ type: 'Variable', value: variable });
          }
        } else {
          throw new Error('Unexpected character after -: ' + nextChar);
        }
      } else {
        tokens.push({ type: 'Operator', value: char });
        i++;
      }
    } else if (/[0-9.]/.test(char)) {
      let number = '';
      while (i < expression.length && /[0-9.]/.test(expression[i])) {
        number += expression[i];
        i++;
      }
      tokens.push({ type: 'Number', value: parseFloat(number) });
    } else if (/[a-zA-Z]/.test(char)) {
      let variable = '';
      while (i < expression.length && /[a-zA-Z]/.test(expression[i])) {
        variable += expression[i];
        i++;
      }
      tokens.push({ type: 'Variable', value: variable });
    } else if (/[*/()]/.test(char)) {
      tokens.push({ type: 'Operator', value: char });
      i++;
    } else {
      throw new Error('Unexpected character: ' + char);
    }
  }

  return tokens;
};

// Парсинг початкового елемента
const parsePrimary = (tokens) => {
  const token = tokens.shift();

  if (token.type === 'Number') {
    return { type: 'Number', value: token.value };
  }

  if (token.type === 'Variable') {
    if (tokens[0] && tokens[0].value === '(') {
      return parseFunction(token, tokens);
    }
    return { type: 'Variable', name: token.value };
  }

  if (token.value === '(') {
    const expression = parseExpression(tokens);
    tokens.shift();
    return expression;
  }

  console.log(tokens);
  throw new Error('Unexpected token: ' + token.value);
};

// Парсинг функцій
const parseFunction = (funcToken, tokens) => {
  tokens.shift();
  const arg = parseExpression(tokens);
  tokens.shift();
  return {
    type: 'FunctionExpression',
    function: funcToken.value,
    argument: arg,
  };
};

// Парсинг множення та ділення
const parseMultiplicative = (tokens) => {
  let left = parsePrimary(tokens);

  while (tokens.length > 0 && /[*/]/.test(tokens[0].value)) {
    const operator = tokens.shift().value;
    const right = parsePrimary(tokens);
    left = {
      type: 'BinaryExpression',
      left: left,
      operator: operator,
      right: right,
    };
  }

  return left;
};

// Парсинг додавання та віднімання
const parseExpression = (tokens) => {
  let left = parseMultiplicative(tokens);

  while (tokens.length > 0 && /[+\-]/.test(tokens[0].value)) {
    const operator = tokens.shift().value;
    const right = parseMultiplicative(tokens);
    left = {
      type: 'BinaryExpression',
      left: left,
      operator: operator,
      right: right,
    };
  }

  return left;
};

const parse = (expression) => {
  if (expression.includes('=')) {
    let index = expression.indexOf('=');
    expression = expression.slice(index + 1);
  }
  const tokens = tokenize(expression);
  const parsed = parseExpression(tokens);
  return parsed;
};

(async () => {
  //correct
  // await analyseCalculation(
  //   'a+b*(c*cos(t-a*x)-d*sin(t+a*x)/(4.81*k-q*t))/(d*cos(t+a*y/f+(5.616*x-t))+c*sin(t-a*y*(u-v*i)))'
  // );
  // await analyseCalculation('a+b*(c-d)/e');
  // await analyseCalculation('3+5*(2-8)/4');
  // await analyseCalculation('y=3+5*(2-8)/4');
  // await analyseCalculation('(a+b)*(c-d)/e');
  // await analyseCalculation('x*(y+z)-sin(a*x)/(cos(b+y)*tan(c/x))');
  // await analyseCalculation(
  //   '2.5*(3+4.81/k-q*t)/(cos(t+a*y/f+(5.616*x-t))+c*sin(t-a*y))'
  // );
  // await analyseCalculation('5.67*x + 3*(y - 4.81)');
  // await analyseCalculation('a+b/c - 4.81/(x*y)');
  // await analyseCalculation('cos(a)*sin(b)-tan(c)/(1+d)');
  //incorrect
  //   await analyseCalculation('a+b*(c-)/e');
  //   await analyseCalculation('3+*(2-8)');
  //   await analyseCalculation('y=3+(2-8t)=3');
  //   await analyseCalculation('(a+b)*(c-d/e');
  //   await analyseCalculation('x*(y+z-sin(a*x)/(cos(b+y');
  //   await analyseCalculation('2.5*(3+4.81..2/k-q*t)');
  //   await analyseCalculation('a+b^(c*d');
  //   await analyseCalculation('a+b^(c*d)-sqrt(x/(y*z))');
  //   await analyseCalculation('5.67*x++3*(y-4.81)');
  //   await analyseCalculation('cos(a)**sin+(b)');
  //   await analyseCalculation('a+b/ - 4.81/(x*y)');
  //   await analyseCalculation('x*(y+z)-sin(a*x)/(cos+(b+y)*tan(c/x))');
  //   await analyseCalculation('x*(y+z)-sin()/(cos(b+y)*tan(c/x))');
  //   await analyseCalculation('cos(a)*sin(b)-)3/8(/(1+d)');
  //   await analyseCalculation('g1+(a+2.3))+(6-sin(5)');
})();

module.exports = {
  analyseCalculation,
  parse,
};
