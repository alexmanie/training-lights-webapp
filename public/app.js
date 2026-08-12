const form = document.querySelector('#configuration-form');
const summary = document.querySelector('#configuration-summary');

const labels = {
  colors: 'colors',
  numbers: 'numbers',
  both: 'colors and numbers',
};

function getConfiguration() {
  const formData = new FormData(form);
  return {
    seriesType: formData.get('seriesType'),
    timerSeconds: Number(formData.get('timerSeconds')),
  };
}

function renderSummary({ seriesType, timerSeconds }, saved = false) {
  const label = labels[seriesType] || labels.colors;
  const secondsLabel = timerSeconds === 1 ? 'second' : 'seconds';
  const prefix = saved ? 'Configuration saved' : 'Ready to start';

  summary.value = `${prefix} with ${label} every ${timerSeconds} ${secondsLabel}.`;
}

form.addEventListener('input', () => {
  renderSummary(getConfiguration());
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const configuration = getConfiguration();
  localStorage.setItem('trainingLightsConfiguration', JSON.stringify(configuration));
  renderSummary(configuration, true);
});
