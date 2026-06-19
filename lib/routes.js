const { URL } = require('url');
const {
  ensureQueueFile,
  loadQueue,
  enqueueSignal,
  dequeueAllSignals,
  clearQueue,
  getQueueCount
} = require('./queue-store');
const { buildNumberSignal, buildLetterSignal } = require('./signal-builder');
const { sendJson, sendText, serveFile, readBody } = require('./http-utils');

ensureQueueFile();

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    return serveFile(res, 'index.html');
  }

  if (req.method === 'GET' && url.pathname === '/health') {
    return sendJson(res, 200, {
      ok: true,
      status: 'running'
    });
  }

  if (req.method === 'GET' && url.pathname === '/queue') {
    return sendJson(res, 200, {
      queue: loadQueue()
    });
  }

  if (req.method === 'GET' && url.pathname === '/queue/count') {
    return sendJson(res, 200, {
      count: getQueueCount()
    });
  }

  if (req.method === 'POST' && url.pathname === '/queue/clear') {
    clearQueue();
    return sendJson(res, 200, {
      ok: true,
      message: 'queue cleared'
    });
  }

  if (req.method === 'GET' && url.pathname === '/poll') {
    return sendJson(res, 200, {
      signals: dequeueAllSignals()
    });
  }

  if (req.method === 'POST' && url.pathname === '/send-direct-signal') {
    try {
      const body = await readBody(req);
      const data = JSON.parse(body || '{}');
      const signal = String(data.signal || '').trim();

      if (!signal) {
        return sendJson(res, 400, { error: 'signal is required' });
      }

      enqueueSignal(signal);

      return sendJson(res, 200, {
        ok: true,
        queued: [signal]
      });
    } catch (err) {
      return sendJson(res, 400, { error: 'invalid json body' });
    }
  }

  if (req.method === 'POST' && url.pathname === '/send-form-signal') {
    try {
      const body = await readBody(req);
      const data = JSON.parse(body || '{}');

      const number = Number(data.number);
      const letter = String(data.letter || '').toLowerCase();

      if (!Number.isInteger(number) || number < 0 || number > 99) {
        return sendJson(res, 400, { error: 'number must be an integer from 0 to 99' });
      }

      if (!['a', 'b', 'c', 'd', 'e', 'f'].includes(letter)) {
        return sendJson(res, 400, { error: 'letter must be one of a,b,c,d,e,f' });
      }

      const prefix = '.-.';
      const numberSignal = buildNumberSignal(number);
      const separator = '---';
      const letterSignal = buildLetterSignal(letter);

      enqueueSignal(prefix);

      setTimeout(() => {
        enqueueSignal(numberSignal);
        enqueueSignal(separator);
        enqueueSignal(letterSignal);
      }, 5000);

      return sendJson(res, 200, {
        ok: true,
        queuedNow: [prefix],
        queuedAfter5s: [numberSignal, separator, letterSignal]
      });
    } catch (err) {
      return sendJson(res, 400, { error: 'invalid json body' });
    }
  }

  return sendText(res, 404, 'Not found');
}

module.exports = {
  handleRequest
};