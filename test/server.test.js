const assert = require('node:assert/strict');
const { once } = require('node:events');
const test = require('node:test');
const { createServer } = require('../server');

async function fetchFromTestServer(pathname, options) {
  const server = createServer().listen(0);
  await once(server, 'listening');
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}${pathname}`, options);
    return {
      body: await response.text(),
      headers: response.headers,
      status: response.status,
    };
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}

test('serves the configuration page at the root route', async () => {
  const response = await fetchFromTestServer('/');

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/html; charset=utf-8');
  assert.match(response.body, /Configure your training series/);
  assert.match(response.body, /Colors and numbers/);
  assert.match(response.body, /Time between elements/);
});

test('serves frontend assets', async () => {
  const response = await fetchFromTestServer('/app.js');

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/javascript; charset=utf-8');
  assert.match(response.body, /trainingLightsConfiguration/);
});

test('supports HEAD requests for static files', async () => {
  const response = await fetchFromTestServer('/', { method: 'HEAD' });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/html; charset=utf-8');
  assert.equal(response.body, '');
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
