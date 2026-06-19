require('dotenv').config()
const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = process.env?.PORT ?? 3000;

const QUEUE_FILE = path.join(__dirname, "queue.json");
const TEMP_FILE = path.join(__dirname, "queue.json.tmp");

app.use(express.json());

let fileOp = Promise.resolve();

function withLock(task) {
  const run = fileOp.then(() => task());
  fileOp = run.catch(() => {});
  return run;
}

async function ensureQueueFile() {
  try {
    await fs.access(QUEUE_FILE);
  } catch {
    await writeQueueAtomic([]);
  }
}

async function readQueue() {
  const raw = await fs.readFile(QUEUE_FILE, "utf8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("queue.json must contain a JSON array");
  }

  return parsed;
}

async function writeQueueAtomic(queue) {
  const json = JSON.stringify(queue, null, 2);
  await fs.writeFile(TEMP_FILE, json, "utf8");
  await fs.rename(TEMP_FILE, QUEUE_FILE);
}

app.get("/", (req, res) => {
  res.json({
    ok: true,
    endpoints: {
      enqueue: "POST /enqueue",
      poll: "GET /poll",
      inspect: "GET /queue"
    }
  });
});

app.get("/queue", async (req, res) => {
  try {
    const queue = await withLock(async () => {
      await ensureQueueFile();
      return await readQueue();
    });

    res.json({
      size: queue.length,
      signals: queue
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/enqueue", async (req, res) => {
  try {
    const { payload } = req.body;

    if (typeof payload !== "string" || payload.trim() === "") {
      return res.status(400).json({
        error: "payload must be a non-empty string"
      });
    }

    const result = await withLock(async () => {
      await ensureQueueFile();

      const queue = await readQueue();

      const item = {
        payload: payload.trim(),
        createdAt: Date.now()
      };

      queue.push(item);
      await writeQueueAtomic(queue);

      return {
        queued: item,
        size: queue.length
      };
    });

    res.status(201).json({
      ok: true,
      queued: result.queued,
      queueSize: result.size
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/poll", async (req, res) => {
  try {
    const result = await withLock(async () => {
      await ensureQueueFile();

      const queue = await readQueue();
      const batch = [...queue];

      await writeQueueAtomic([]);

      return batch;
    });

    res.json({
      signals: result.map(item => item.payload)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, async () => {
  await ensureQueueFile();
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});