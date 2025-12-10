'use strict';

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --------------------------------------------
// KONFIGURATION
// --------------------------------------------
const PYTHON_BACKEND = "http://10.230.16.39:50587";  
// Beispiel-IP. Trage hier die echte Python-IP + Port ein.

// Aufbewahrung aller Tasks
const tasks = {}; // taskId -> { status, itemsToPick, result }

// --------------------------------------------
// 1) USER STARTET TASK
// POST /api/task/start
// --------------------------------------------
app.post('/api/task/start', async (req, res) => {
  const { orderId, items } = req.body;

  if (!orderId || !Array.isArray(items)) {
    return res.status(400).json({ error: "orderId und items sind Pflichtfelder" });
  }

  const taskId = "task_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

  tasks[taskId] = {
    status: "pending",      // pending → running → done
    itemsToPick: items,     // Worker sieht diese
    result: null,
    polling: false          // damit kein doppeltes Polling entsteht
  };

  console.log("Task created:", taskId);

  // an Python senden
  try {
    await axios.post(`${PYTHON_BACKEND}/start`, {
      taskId,
      orderId,
      items
    });

    tasks[taskId].status = "running"; // Task läuft jetzt
  } catch (err) {
    console.error("Fehler beim Starten des Python-Backends:", err.message);
    tasks[taskId].status = "error";
    return res.status(500).json({ error: "Python backend unreachable" });
  }

  // Polling starten
  pollPythonUntilDone(taskId);

  res.json({ taskId });
});

// --------------------------------------------
// 2) WORKER FRONTEND – Informationen abrufen
// GET /api/task/:id/worker-info
// --------------------------------------------
app.get('/api/task/:id/worker-info', (req, res) => {
  const task = tasks[req.params.id];
  if (!task) return res.status(404).json({ error: "not found" });

  res.json({
    taskId: req.params.id,
    itemsToPick: task.itemsToPick,
    status: task.status
  });
});

// --------------------------------------------
// 3) NODE POLLT PYTHON BIS AGV FERTIG IST
// --------------------------------------------
async function pollPythonUntilDone(taskId) {
  const task = tasks[taskId];
  if (!task) return;

  if (task.polling) {
    // verhindert mehrfaches Polling
    return;
  }

  task.polling = true;

  console.log("Starte Polling für", taskId);

  const interval = setInterval(async () => {
    try {
      const resp = await axios.get(`${PYTHON_BACKEND}/status/${taskId}`);

      if (!resp.data || !resp.data.status) {
        console.log("Unerwartete Antwort:", resp.data);
        return;
      }

      console.log("Status von", taskId, "=", resp.data.status);

      if (resp.data.status === "done") {
        clearInterval(interval);

        task.status = "done";
        task.result = resp.data.result || {};
        task.polling = false;

        console.log("AGV finished:", taskId);
      }

      if (resp.data.status === "error") {
        clearInterval(interval);
        task.status = "error";
        task.polling = false;
        console.log("AGV Fehler:", taskId);
      }

    } catch (e) {
      console.log("Polling Fehler:", e.message);
    }
  }, 2000);
}

// --------------------------------------------
// 4) USER CHECKT OB TASK FERTIG IST
// GET /api/task/:id/status
// --------------------------------------------
app.get('/api/task/:id/status', (req, res) => {
  const task = tasks[req.params.id];
  if (!task) return res.status(404).json({ error: "not found" });

  res.json({
    status: task.status,
    result: task.result
  });
});

// --------------------------------------------
// SERVER START
// --------------------------------------------
const PORT = 3000;
app.listen(PORT, () => {
  console.log("Node backend läuft auf Port", PORT);
});






app.get("/test/python", async (req, res) => {
  const testTask = {
    taskId: "test_" + Date.now(),
    orderId: "testOrder",
    items: ["item1", "item2"]
  };

  try {
    // POST /start auf Python testen
    const startResp = await axios.get(`${PYTHON_BACKEND}/test`, testTask);

    res.json({
      success: true,
      message: "Python /start erreichbar",
      pythonResponse: startResp.data
    });
  } catch (err) {
    res.json({
      success: false,
      error: err.message
    });
  }
});