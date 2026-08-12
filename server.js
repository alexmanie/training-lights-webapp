const { createReadStream, promises: fs } = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const publicDir = path.join(__dirname, 'public');
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

function resolveStaticPath(requestUrl) {
  const { pathname } = new URL(requestUrl, 'http://localhost');
  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  let decodedPath;

  try {
    decodedPath = decodeURIComponent(requestedPath);
  } catch {
    return null;
  }

  const normalizedPath = path.normalize(decodedPath).replace(/^([/\\])+/, '');
  const filePath = path.join(publicDir, normalizedPath);
  const relativePath = path.relative(publicDir, filePath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return null;
  }

  return filePath;
}

function createServer() {
  return http.createServer(async (request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { allow: 'GET, HEAD' });
      response.end('Method Not Allowed');
      return;
    }

    const filePath = resolveStaticPath(request.url);
    if (!filePath) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not Found');
      return;
    }

    try {
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        throw Object.assign(new Error('Not a file'), { code: 'ENOENT' });
      }

      if (request.method === 'HEAD') {
        response.writeHead(200, {
          'Content-Length': stats.size,
          'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream',
        });
        response.end();
        return;
      }

      const stream = createReadStream(filePath);
      stream.on('error', () => {
        if (!response.headersSent) {
          response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          response.end('Internal Server Error');
          return;
        }

        response.destroy();
      });

      response.writeHead(200, {
        'Content-Length': stats.size,
        'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream',
      });
      stream.pipe(response);
    } catch (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500, {
        'Content-Type': 'text/plain; charset=utf-8',
      });
      response.end(error.code === 'ENOENT' ? 'Not Found' : 'Internal Server Error');
    }
  });
}

if (require.main === module) {
  const port = process.env.PORT || 3000;
  createServer().listen(port, () => {
    console.log(`Training Lights webapp running at http://localhost:${port}`);
  });
}

module.exports = { createServer, resolveStaticPath };
