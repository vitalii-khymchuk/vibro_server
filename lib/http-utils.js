const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function sendText(res, status, text, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Content-Length': Buffer.byteLength(text)
  });
  res.end(text);
}

function serveFile(res, relativePath) {
  const filePath = path.join(PUBLIC_DIR, relativePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      sendText(res, 404, 'Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = ext === '.html'
      ? 'text/html; charset=utf-8'
      : ext === '.css'
      ? 'text/css; charset=utf-8'
      : ext === '.js'
      ? 'application/javascript; charset=utf-8'
      : 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', chunk => {
      body += chunk;

      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Body too large'));
      }
    });

    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

module.exports = {
  sendJson,
  sendText,
  serveFile,
  readBody
};