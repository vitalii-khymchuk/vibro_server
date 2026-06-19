const fs = require('fs');
const path = require('path');

const QUEUE_FILE = path.join(__dirname, '..', 'queue.json');

function ensureQueueFile() {
  if (!fs.existsSync(QUEUE_FILE)) {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

function loadQueue() {
  ensureQueueFile();

  try {
    const raw = fs.readFileSync(QUEUE_FILE, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    return [];
  }
}

function saveQueue(queue) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf8');
}

function enqueueSignal(signal) {
  if (typeof signal !== 'string') {
    return;
  }

  const trimmed = signal.trim();
  if (!trimmed) {
    return;
  }

  const queue = loadQueue();
  queue.push(trimmed);
  saveQueue(queue);
}

function dequeueAllSignals() {
  const queue = loadQueue();
  saveQueue([]);
  return queue;
}

function clearQueue() {
  saveQueue([]);
}

function getQueueCount() {
  return loadQueue().length;
}

module.exports = {
  ensureQueueFile,
  loadQueue,
  saveQueue,
  enqueueSignal,
  dequeueAllSignals,
  clearQueue,
  getQueueCount
};