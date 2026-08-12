const assert = require('node:assert/strict');
const test = require('node:test');
const {
  COLORS,
  getRandomColor,
  loadColorConfiguration,
  startColorSeries,
} = require('../public/series');

function createStorage(value) {
  return {
    getItem() {
      return value;
    },
  };
}

test('selects each supported color from the random value', () => {
  const selectedColors = COLORS.map((_, index) => (
    getRandomColor(() => (index + 0.5) / COLORS.length)
  ));

  assert.deepEqual(selectedColors, COLORS);
});

test('loads a valid color configuration', () => {
  const configuration = loadColorConfiguration(createStorage(JSON.stringify({
    seriesType: 'colors',
    timerSeconds: 3,
  })));

  assert.deepEqual(configuration, {
    seriesType: 'colors',
    timerSeconds: 3,
  });
});

test('rejects missing, unsupported, and invalid configurations', () => {
  assert.equal(loadColorConfiguration(createStorage(null)), null);
  assert.equal(loadColorConfiguration(createStorage('{invalid')), null);
  assert.equal(loadColorConfiguration(createStorage(JSON.stringify({
    seriesType: 'numbers',
    timerSeconds: 3,
  }))), null);
  assert.equal(loadColorConfiguration(createStorage(JSON.stringify({
    seriesType: 'colors',
    timerSeconds: 0,
  }))), null);
});

test('shows a color immediately and schedules changes at the configured interval', () => {
  const display = { style: {} };
  let scheduledCallback;
  let scheduledDelay;
  const randomValues = [0, 0.3];
  const schedule = (callback, delay) => {
    scheduledCallback = callback;
    scheduledDelay = delay;
    return 42;
  };

  const timerId = startColorSeries(
    { timerSeconds: 3 },
    display,
    schedule,
    () => randomValues.shift(),
  );

  assert.equal(display.style.backgroundColor, 'blue');
  assert.equal(scheduledDelay, 3000);
  assert.equal(timerId, 42);

  scheduledCallback();
  assert.equal(display.style.backgroundColor, 'white');
});
