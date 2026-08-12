const assert = require('node:assert/strict');
const { once } = require('node:events');
const test = require('node:test');
const { createServer } = require('../server');

async function fetchFromTestServer(pathname, options) {
  const server = createServer().listen(0);
  await once(server, 'listening');
  const { port } = server.address();

  try {
    return await fetch(`http://127.0.0.1:${port}${pathname}`, options);
  } finally {
    server.close();
  }
}

test('serves the configuration page at the root route', async () => {
  const response = await fetchFromTestServer('/');
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/html; charset=utf-8');
  assert.match(body, /Configure your training series/);
  assert.match(body, /Colors and numbers/);
  assert.match(body, /Time between elements/);
});

test('serves frontend assets', async () => {
  const response = await fetchFromTestServer('/app.js');
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/javascript; charset=utf-8');
  assert.match(body, /trainingLightsConfiguration/);
});

test('supports HEAD requests for static files', async () => {
  const response = await fetchFromTestServer('/', { method: 'HEAD' });
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/html; charset=utf-8');
  assert.equal(body, '');
});

test('rejects unsupported methods', async () => {
  const response = await fetchFromTestServer('/', { method: 'POST' });

  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET, HEAD');
});

test('does not serve files outside the public directory', async () => {
  const response = await fetchFromTestServer('/..%2FREADME.md');

  assert.equal(response.status, 404);
});
