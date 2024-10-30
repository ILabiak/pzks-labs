const { generateTree, checkAndOptimise } = require('../lab2/main');

const replaceSubstring = (originalString, index, length, newSubstring) => {
  if (index < 0 || index >= originalString.length) {
    throw new Error('Index is out of bounds.');
  }

  if (index + length > originalString.length) {
    length = originalString.length - index;
  }

  const modifiedString =
    originalString.slice(0, index) +
    newSubstring +
    originalString.slice(index + length);

  return modifiedString;
};

const applyAssociativeLaw = (expression) => {
  let results = [];
  const matches = [
    ...expression.matchAll(
      /([a-z]|[\d.]+)\*([a-z]|[\d.]+)[\+\-]([a-z]|[\d.]+)\*([a-z])/g
    ),
  ];
  //   console.log(matches);
  if (!matches[0]) {
    return [];
  }
  for (let subStr of matches) {
    let operation = '+';
    if (subStr[0].includes('-')) {
      operation = '-';
    }
    if (subStr.index > 0) {
      if (expression.split('')[subStr.index - 1] == '-') {
        if (operation == '+') {
          operation = '-';
        } else {
          operation = '+';
        }
      } else if (
        expression.split('')[subStr.index - 1] == '/' ||
        expression.split('')[subStr.index - 1] == '*'
      ) {
        console.log(
          `Cannot transform because of ${
            expression.split('')[subStr.index - 1]
          } before expression`
        );
        continue;
      }
    }
    if (expression.length > subStr.index + subStr[0].length) {
      if (
        expression.split('')[subStr.index + subStr[0].length] == '*' ||
        expression.split('')[subStr.index + subStr[0].length] == '/'
      ) {
        console.log(
          `Cannot transform because of ${
            expression.split('')[subStr.index + subStr[0].length]
          } after expression`
        );
        continue;
      }
    }
    let str = subStr[0].split(/[\*\+\-]/);
    if (
      str[0] != str[3] &&
      str[0] != str[2] &&
      str[1] != str[3] &&
      str[1] != str[2]
    ) {
      console.log('cant change anything');
      continue;
    }
    const countsMap = new Map();

    // Count occurrences
    for (const letter of str) {
      if (/[a-zA-Z]/.test(letter)) {
        countsMap.set(letter, (countsMap.get(letter) || 0) + 1);
      }
    }

    const duplicates = [...countsMap.entries()]
      .filter(([letter, count]) => count >= 2)
      .map(([letter]) => letter);

    const multiplier = duplicates[0];
    // console.log(multiplier);

    const firstIndex = str.indexOf(multiplier);

    const lastIndex = str.lastIndexOf(multiplier);

    if (firstIndex !== -1) {
      str.splice(firstIndex, 1);
    }

    if (lastIndex !== -1) {
      if (lastIndex > firstIndex) {
        str.splice(lastIndex - 1, 1);
      } else {
        str.splice(lastIndex, 1);
      }
    }

    let changedSubstr = `${multiplier}*(${str[0]}${operation}${str[1]})`;
    let temp = [];
    temp.push(
      replaceSubstring(
        expression,
        subStr.index,
        changedSubstr.length,
        changedSubstr
      )
    );
    for (let res of results) {
      temp.push(
        replaceSubstring(res, subStr.index, changedSubstr.length, changedSubstr)
      );
    }
    results.push(...temp);
    // console.log(changedSubstr);
  }
  return results;
};

const applyDistributiveLaw = (expression) => {
  let results = [];
  const matches = [
    ...expression.matchAll(
      /([a-z]|[\d.]+)\*\(([a-z]|[\d.]+)[\+\-]([a-z]|[\d.]+)\)|\(([a-z]|[\d.]+)[\+\-]([a-z]|[\d.]+)\)\*([a-z]|[\d.]+)/g
    ),
  ];
  //   console.log(matches);
  if (!matches[0]) {
    return [];
  }
  for (let subStr of matches) {
    let operation = '+';
    if (subStr[0].includes('-')) {
      operation = '-';
    }
    if (subStr.index > 0) {
      if (expression.split('')[subStr.index - 1] == '-') {
        if (operation == '+') {
          operation = '-';
        } else {
          operation = '+';
        }
      } else if (
        expression.split('')[subStr.index - 1] == '/' ||
        expression.split('')[subStr.index - 1] == '*'
      ) {
        console.log(
          `Cannot transform because of ${
            expression.split('')[subStr.index - 1]
          } before expression`
        );
        continue;
      }
    }
    if (expression.length > subStr.index + subStr[0].length) {
      if (
        expression.split('')[subStr.index + subStr[0].length] == '*' ||
        expression.split('')[subStr.index + subStr[0].length] == '/'
      ) {
        console.log(
          `Cannot transform because of ${
            expression.split('')[subStr.index + subStr[0].length]
          } after expression`
        );
        continue;
      }
    }
    let charArr = subStr[0].split('*');
    // console.log(charArr);
    if (
      charArr.length != 2 &&
      (charArr[0].length != 1 || charArr[1].length != 1)
    ) {
      console.log('Some error when parsing data');
      continue;
    }
    let multiplier, args;
    if (charArr[0].length == 1) {
      multiplier = charArr[0];
      args = charArr[1].replace(/[\(\)]/g, '').split(/[+-]/g);
    } else {
      multiplier = charArr[1];
      args = charArr[0].replace(/[\(\)]/g, '').split(/[+-]/g);
    }
    // console.log({ multiplier, args });

    let changedSubstr = `${multiplier}*${args[0]}${operation}${multiplier}*${args[1]}`;
    // console.log('Changed:', changedSubstr);
    let temp = [];
    temp.push(
      replaceSubstring(
        expression,
        subStr.index,
        changedSubstr.length,
        changedSubstr
      )
    );
    for (let res of results) {
      temp.push(
        replaceSubstring(res, subStr.index, changedSubstr.length, changedSubstr)
      );
    }
    results.push(...temp);
    // console.log(changedSubstr);
  }
  return results;
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
  const [res, exp] = await checkAndOptimise('3*(b+c)+b*3.45-b*k+3-b*(3.45-k)');
  // generateTree(res, 'tree');
  if (!res) {
    console.log('Invalid expression');
  }
  const variants = new Set();
  const dVariants = applyDistributiveLaw(exp);
  const aVariants = applyAssociativeLaw(exp);
  await Promise.all(
    [...dVariants, ...aVariants].map(async (variant) => {
      const [res, optimisedExp] = await checkAndOptimise(variant);
      if (res) {
        variants.add(variant);
      }
    })
  );
  console.log('Дистрибутивне розкриття:\n', dVariants, '\n')
  console.log('Асоціативне розкриття:\n', aVariants, '\n', '\nВсі варіанти:')

  console.log(Array.from(variants));
})();
