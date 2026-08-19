const form = document.querySelector('#configuration-form');
const summary = document.querySelector('#configuration-summary');
const timeCapInput = document.querySelector('#time-cap-seconds');
const iterationInput = document.querySelector('#iteration-count');

const labels = {
  colors: 'colors',
  numbers: 'numbers',
  both: 'colors and numbers',
};

function getConfiguration() {
  const formData = new FormData(form);
  const endingType = formData.get('endingType');
  return {
    seriesType: formData.get('seriesType'),
    timerSeconds: Number(formData.get('timerSeconds')),
    endingType,
    endingValue: Number(formData.get(endingType === 'timeCap' ? 'timeCapSeconds' : 'iterationCount')),
  };
}

function updateEndingControls() {
  const endingType = new FormData(form).get('endingType');
  const timeCapSelected = endingType === 'timeCap';
  timeCapInput.disabled = !timeCapSelected;
  iterationInput.disabled = timeCapSelected;
}

function loadSavedConfiguration() {
  try {
    const configuration = JSON.parse(localStorage.getItem('trainingLightsConfiguration'));

    if (!configuration) {
      return;
    }

    const seriesTypeInput = form.querySelector(`input[name="seriesType"][value="${configuration.seriesType}"]`);
    const endingTypeInput = form.querySelector(`input[name="endingType"][value="${configuration.endingType}"]`);

    if (seriesTypeInput) {
      seriesTypeInput.checked = true;
    }

    if (endingTypeInput) {
      endingTypeInput.checked = true;
    }

    if (Number.isInteger(configuration.timerSeconds)) {
      form.elements.timerSeconds.value = configuration.timerSeconds;
    }

    if (configuration.endingType === 'timeCap' && Number.isInteger(configuration.endingValue)) {
      timeCapInput.value = configuration.endingValue;
    }

    if (configuration.endingType === 'iterations' && Number.isInteger(configuration.endingValue)) {
      iterationInput.value = configuration.endingValue;
    }
  } catch {
  }
}

function renderSummary({ seriesType, timerSeconds, endingType, endingValue }, saved = false) {
  const label = labels[seriesType] || labels.colors;
  const secondsLabel = timerSeconds === 1 ? 'second' : 'seconds';
  const endingLabel = endingType === 'iterations'
    ? `${endingValue} ${endingValue === 1 ? 'iteration' : 'iterations'}`
    : `${endingValue} ${endingValue === 1 ? 'second' : 'seconds'}`;
  const prefix = saved ? 'Configuration saved' : 'Ready to start';

  summary.value = `${prefix} with ${label} every ${timerSeconds} ${secondsLabel}, ending after ${endingLabel}.`;
}

form.addEventListener('input', () => {
  updateEndingControls();
  renderSummary(getConfiguration());
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const configuration = getConfiguration();
  localStorage.setItem('trainingLightsConfiguration', JSON.stringify(configuration));
  renderSummary(configuration, true);

  if (configuration.seriesType === 'colors') {
    window.location.assign('/series.html');
  }
});

loadSavedConfiguration();
updateEndingControls();
renderSummary(getConfiguration());
