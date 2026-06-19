function dots(count) {
  return '.'.repeat(Math.max(0, count));
}

function dashes(count) {
  return '-'.repeat(Math.max(0, count));
}

function buildNumberSignal(number) {
  const tens = Math.floor(number / 10);
  const ones = number % 10;

  const dashCount = tens + 1;
  const dotCount = ones + 1;

  return dashes(dashCount) + dots(dotCount);
}

function buildLetterSignal(letter) {
  const map = {
    a: '.',
    b: '..',
    c: '...',
    d: '....',
    e: '.....',
    f: '......'
  };

  return map[letter] || '.';
}

module.exports = {
  buildNumberSignal,
  buildLetterSignal
};