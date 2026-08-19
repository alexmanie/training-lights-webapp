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
    endingType: 'timeCap',
    endingValue: 60,
  })));

  assert.deepEqual(configuration, {
    seriesType: 'colors',
    timerSeconds: 3,
    endingType: 'timeCap',
    endingValue: 60,
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
    endingType: 'timeCap',
    endingValue: 60,
  }))), null);
  assert.equal(loadColorConfiguration(createStorage(JSON.stringify({
    seriesType: 'colors',
    timerSeconds: 3,
    endingType: 'unsupported',
    endingValue: 60,
  }))), null);
  assert.equal(loadColorConfiguration(createStorage(JSON.stringify({
    seriesType: 'colors',
    timerSeconds: 3,
    endingType: 'iterations',
    endingValue: 0,
  }))), null);
  assert.equal(loadColorConfiguration(createStorage(JSON.stringify({
    seriesType: 'colors',
    timerSeconds: 3,
    endingType: 'timeCap',
    endingValue: 3601,
  }))), null);
});

test('shows a five second countdown before the first color', () => {
  const display = { style: {} };
  const scheduledTasks = [];
  const randomValues = [0, 0.3];
  const schedule = (callback, delay) => {
    scheduledTasks.push({ callback, delay });
    return scheduledTasks.length;
  };

  const timerId = startColorSeries(
    { timerSeconds: 3, endingType: 'iterations', endingValue: 3 },
    display,
    schedule,
    () => randomValues.shift(),
  );

  assert.equal(display.style.backgroundColor, 'black');
  assert.equal(display.textContent, '5');
  assert.equal(scheduledTasks[0].delay, 1000);

  for (const expectedNumber of ['4', '3', '2', '1']) {
    scheduledTasks.shift().callback();
    assert.equal(display.textContent, expectedNumber);
    assert.equal(display.style.backgroundColor, 'black');
  }

  scheduledTasks.shift().callback();
  assert.equal(display.style.backgroundColor, '#ff954d');
  assert.equal(scheduledTasks[0].delay, 3000);
  assert.equal(display.textContent, '');
});

test('shows one second of black between colors', () => {
  const display = { style: {} };
  const scheduledTasks = [];
  const randomValues = [0, 0.3];
  const schedule = (callback, delay) => {
    scheduledTasks.push({ callback, delay });
    return scheduledTasks.length;
  };

  startColorSeries(
    { timerSeconds: 3, endingType: 'iterations', endingValue: 3 },
    display,
    schedule,
    () => randomValues.shift(),
  );

  for (let index = 0; index < 5; index += 1) {
    scheduledTasks.shift().callback();
  }

  assert.equal(display.style.backgroundColor, '#ff954d');
  assert.equal(scheduledTasks[0].delay, 3000);

  scheduledTasks.shift().callback();
  assert.equal(display.style.backgroundColor, 'black');
  assert.equal(scheduledTasks[0].delay, 1000);

  scheduledTasks.shift().callback();
  assert.equal(display.style.backgroundColor, 'white');
  assert.equal(scheduledTasks[0].delay, 3000);
});

test('stops after the configured number of iterations', () => {
  const display = { style: {} };
  const scheduledTasks = [];
  const schedule = (callback, delay) => {
    scheduledTasks.push({ callback, delay });
    return scheduledTasks.length;
  };

  startColorSeries(
    { timerSeconds: 3, endingType: 'iterations', endingValue: 1 },
    display,
    schedule,
    () => 0,
  );

  for (let index = 0; index < 5; index += 1) {
    scheduledTasks.shift().callback();
  }

  assert.equal(display.textContent, 'END');
  assert.equal(display.style.backgroundColor, 'black');
  assert.deepEqual(scheduledTasks, []);
});

test('schedules a time cap and ignores callbacks after it ends', () => {
  const display = { style: {} };
  const scheduledTasks = [];
  const schedule = (callback, delay) => {
    scheduledTasks.push({ callback, delay });
    return scheduledTasks.length;
  };

  startColorSeries(
    { timerSeconds: 3, endingType: 'timeCap', endingValue: 60 },
    display,
    schedule,
    () => 0,
  );

  for (let index = 0; index < 5; index += 1) {
    scheduledTasks.shift().callback();
  }

  assert.equal(scheduledTasks[0].delay, 60000);
  assert.equal(scheduledTasks[1].delay, 3000);
  scheduledTasks[0].callback();
  scheduledTasks[1].callback();
  assert.equal(display.textContent, 'END');
  assert.equal(display.style.backgroundColor, 'black');
  assert.equal(scheduledTasks.length, 2);
});
