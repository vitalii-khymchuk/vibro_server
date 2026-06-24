const fs = require('fs');
const path = require('path');

const QUEUE_FILE = path.join(__dirname, '..', 'queue.json');

function normalizeState(data) {
  const safe = data && typeof data === 'object' ? data : {};

  return {
    signals: Array.isArray(safe.signals)
      ? safe.signals.map(x => String(x))
      : [],
    busy: Boolean(safe.busy)
  };
}

function saveState(state) {
  const normalized = normalizeState(state);
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(normalized, null, 2), 'utf8');
}

function ensureQueueFile() {
  if (!fs.existsSync(QUEUE_FILE)) {
    saveState({
      signals: [],
      busy: false
    });
    return;
  }

  try {
    const raw = fs.readFileSync(QUEUE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const normalized = normalizeState(parsed);
    saveState(normalized);
  } catch (err) {
    saveState({
      signals: [],
      busy: false
    });
  }
}

function loadState() {
  ensureQueueFile();

  try {
    const raw = fs.readFileSync(QUEUE_FILE, 'utf8');
    return normalizeState(JSON.parse(raw));
  } catch (err) {
    return {
      signals: [],
      busy: false
    };
  }
}

function loadQueue() {
  return loadState().signals;
}

function enqueueSignal(signal) {
  const trimmed = String(signal || '').trim();
  if (!trimmed) {
    return;
  }

  const state = loadState();
  state.signals.push(trimmed);
  saveState(state);
}

function dequeueAllSignals() {
  const state = loadState();
  const signals = state.signals.slice();
  state.signals = [];
  saveState(state);
  return signals;
}

function clearQueue() {
  const state = loadState();
  state.signals = [];
  saveState(state);
}

function getQueueCount() {
  return loadState().signals.length;
}

function setBusy(value) {
  const state = loadState();
  state.busy = Boolean(value);
  saveState(state);
}

function getBusy() {
  return loadState().busy;
}

module.exports = {
  ensureQueueFile,
  loadState,
  loadQueue,
  enqueueSignal,
  dequeueAllSignals,
  clearQueue,
  getQueueCount,
  setBusy,
  getBusy
};