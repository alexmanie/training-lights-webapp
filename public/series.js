const COLORS = ['blue', 'white', 'orange', 'yellow'];
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
    ) {
      return null;
    }

    return configuration;
  } catch {
    return null;
  }
}

function startColorSeries(configuration, display, schedule = setInterval, random = Math.random) {
  const showNextColor = () => {
    display.style.backgroundColor = getRandomColor(random);
  };

  showNextColor();
  return schedule(showNextColor, configuration.timerSeconds * 1000);
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
