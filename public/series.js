const COLORS = ['#ff954d', 'white', '#b71c1c', '#d9f000'];
const CONFIGURATION_KEY = 'trainingLightsConfiguration';

function getRandomColor(random = Math.random) {
  return COLORS[Math.floor(random() * COLORS.length)];
}

function loadColorConfiguration(storage) {
  try {
    const configuration = JSON.parse(storage.getItem(CONFIGURATION_KEY));

    if (
      configuration?.seriesType !== 'colors'
      || !Number.isInteger(configuration.timerSeconds)
      || configuration.timerSeconds < 1
      || configuration.timerSeconds > 60
      || !['timeCap', 'iterations'].includes(configuration.endingType)
      || !Number.isInteger(configuration.endingValue)
      || configuration.endingValue < 1
      || (configuration.endingType === 'timeCap' && configuration.endingValue > 3600)
      || (configuration.endingType === 'iterations' && configuration.endingValue > 10000)
    ) {
      return null;
    }

    return configuration;
  } catch {
    return null;
  }
}

function startColorSeries(configuration, display, schedule = setTimeout, random = Math.random) {
  let iterations = 0;
  let ended = false;

  const showEnd = () => {
    ended = true;
    display.style.backgroundColor = 'black';
    display.classList?.add('series-end');

    if (typeof document === 'undefined') {
      display.textContent = 'END';
      return;
    }

    display.textContent = '';

    const endScreen = document.createElement('main');
    endScreen.className = 'end-screen';

    const heading = document.createElement('div');
    heading.textContent = 'END';
    heading.setAttribute('aria-live', 'polite');

    const actions = document.createElement('div');
    actions.className = 'end-actions';

    const repeatButton = document.createElement('button');
    repeatButton.type = 'button';
    repeatButton.textContent = 'Repeat series';
    repeatButton.addEventListener('click', () => {
      window.localStorage.setItem(CONFIGURATION_KEY, JSON.stringify(configuration));
      window.location.reload();
    });

    const homeButton = document.createElement('button');
    homeButton.type = 'button';
    homeButton.textContent = 'Return to configuration';
    homeButton.addEventListener('click', () => {
      window.localStorage.setItem(CONFIGURATION_KEY, JSON.stringify(configuration));
      window.location.assign('/');
    });

    actions.append(repeatButton, homeButton);
    endScreen.append(heading, actions);
    display.append(endScreen);
  };

  const stopSeries = () => {
    showEnd();
  };

  const showNextColor = () => {
    if (ended) {
      return undefined;
    }

    display.style.backgroundColor = getRandomColor(random);
    iterations += 1;

    if (configuration.endingType === 'iterations' && iterations >= configuration.endingValue) {
      showEnd();
      return undefined;
    }

    return schedule(showTransition, configuration.timerSeconds * 1000);
  };

  const showTransition = () => {
    if (ended) {
      return undefined;
    }

    display.style.backgroundColor = 'black';
    return schedule(showNextColor, 1000);
  };

  if (configuration.endingType === 'timeCap') {
    schedule(stopSeries, configuration.endingValue * 1000);
  }

  return showNextColor();
}

if (typeof window !== 'undefined') {
  const configuration = loadColorConfiguration(window.localStorage);

  if (configuration) {
    startColorSeries(configuration, document.querySelector('#series-display'));
  } else {
    window.location.replace('/');
  }
}

if (typeof module !== 'undefined') {
  module.exports = {
    COLORS,
    getRandomColor,
    loadColorConfiguration,
    startColorSeries,
  };
}
