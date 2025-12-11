'use strict';

  const express = require('express');
  const axios = require('axios');
  const cors = require('cors');
  const fs = require('fs');
  const path = require('path');

  const app = express();
  app.use(cors());
  app.use(express.json());

  const AVG_BACKEND = process.env.AVG_BACKEND || "http://10.230.18.52:50587";


  const tasks = {}; // taskId -> { status, itemsToPick, result }
  const taskQueue = []; // queue neue Tasks
  let currentTaskId = null; 

  // --------------------------------------------
  // USER STARTET TASK
  // POST /api/task/start
  // --------------------------------------------
  app.post('/api/task/start', async (req, res) => {
    const items = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "items sind Pflichtfelder" });
    }

    const taskId = "task_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

    const newTask = {
      taskId,
      status: "pending",
      itemsToPick: items,
      result: null,
      polling: false
    };

    tasks[taskId] = newTask;
    console.log("Task created:", taskId);

    if (!currentTaskId) {
      startTask(newTask);
    } else {
      taskQueue.push(newTask);
      console.log("Task queued:", taskId);
    }

    const fs = require('fs');

    fs.writeFile('../data/taskId.json', JSON.stringify({ taskId }), (err) => {
        if (err) return res.status(500).json({ error: 'Fehler beim Speichern' });
        res.json({ message: 'Task-ID gespeichert' });
    });

    console.log("Write in json " + taskId);

    res.json({ taskId });
  });

  async function startTask(task) {
    currentTaskId = task.taskId;
    task.status = "running";

    try {
      await axios.post(`${AVG_BACKEND}/start`, {
        taskId: task.taskId,
        items: task.itemsToPick
      });

      pollPythonUntilDone(task.taskId);
    } catch (err) {
      console.error("Fehler beim Starten des Python-Backends:", err.message);
      task.status = "error";
      currentTaskId = null;
      startNextTask();
    }
  }

  function startNextTask() {
    if (taskQueue.length > 0) {
      const nextTask = taskQueue.shift();
      startTask(nextTask);
    }
  }




  // --------------------------------------------
  // NODE POLLT PYTHON BIS AGV FERTIG IST
  // --------------------------------------------
  async function pollPythonUntilDone(taskId) {
  const task = tasks[taskId];
  if (!task || task.polling) return;

  task.polling = true;
  console.log("Starte Polling für", taskId);

  const interval = setInterval(async () => {
    try {
      const resp = await axios.get(`${AVG_BACKEND}/status`, { params: { taskId } });
      if (!resp.data || !resp.data.status) return;

      const pyStatus = resp.data.status;

      if (pyStatus === "working") {
        task.status = "running";
        return; // weiter pollen
      }

      if (pyStatus === "waiting") {
        clearInterval(interval);
        task.status = "done";
        task.polling = false;
        console.log("Task completed:", taskId);

        currentTaskId = null;
        startNextTask();
        return;
      }

      if (pyStatus === "done") {
        task.status = "done";
        console.log("Task completed:", taskId);

        currentTaskId = null;
        startNextTask();
        return;
      }

      if (pyStatus === "error") {
        clearInterval(interval);
        task.status = "error";
        task.polling = false;

        console.log("Task ERROR:", taskId);

        currentTaskId = null;
        startNextTask();
        return;
      }

    } catch (e) {
      console.log("Polling Fehler:", e.message);
    }
  }, 2000);
}




  // --------------------------------------------
  // USER CHECKT OB TASK FERTIG IST
  // GET /api/task/:id/status
  // --------------------------------------------
  app.get('/api/task/:id/status', (req, res) => {
    const task = tasks[req.params.id];
    if (!task) return res.status(404).json({ error: "not found" });

    res.json({
      status: task.status
    });
  });






  // --------------------------------------------
  // Worker Endpunkt: alle Tasks
  // GET /api/tasks
  // --------------------------------------------
  app.get('/api/tasks', (req, res) => {
    const runningTasks = Object.entries(tasks)
      .map(([id, task]) => ({
        taskId: id,
        itemsCount: task.itemsToPick.length,
        status: task.status
      }));

    res.json(runningTasks);
  });





  // --------------------------------------------
  // Worker Endpunkt: Teile für einen Task abrufen
  // GET /api/tasks/:id/items
  // --------------------------------------------
  app.get('/api/tasks/:id/items', (req, res) => {
    const task = tasks[req.params.id];
    if (!task) return res.status(404).json({ error: "Task not found" });

    res.json({
      taskId: req.params.id,
      taskId: req.params.id,
      items: task.itemsToPick,
      status: task.status
    });
  });



  // --------------------------------------------
  // SERVER START
  // --------------------------------------------
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log("Node backend läuft auf Port", PORT);
  });


  // --------------------------------------------
  // .env an fe weitergeben
  // --------------------------------------------
  app.get('/config', (req, res) => {
    res.json({
      ipAdress: process.env.IP_ADRESS,
      port: process.env.PORT,
    });
  });







  // test funktionen 

  // test python verbindung
  app.get("/test/python", async (req, res) => {
    const testTask = {
      taskId: "test_" + Date.now(),
      items: ["item1", "item2"]
    };

    try {
      const startResp = await axios.get(`${AVG_BACKEND}/test`, testTask);

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


  // test start
 app.get('/api/task/start-dummy', (req, res) => {
  const items = [
    { partId: 1, colorId: 1 },
    { partId: 2, colorId: 2 },
    { partId: 4, colorId: 3 } 
  ];

  const taskId = "task_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

  const newTask = {
    taskId,
    status: "pending",
    itemsToPick: items,
    result: null,
    polling: false
  };

  tasks[taskId] = newTask;
  console.log("Dummy Task created:", taskId);

  if (!currentTaskId) {
    startTask(newTask);
  } else {
    taskQueue.push(newTask);
    console.log("Dummy Task queued:", taskId);
  }

  res.json({ taskId, items });
});



// test: clear tasks
app.get('/api/task/clear-dummy', (req, res) => {
  const count = Object.keys(tasks).length;
  Object.keys(tasks).forEach(id => delete tasks[id]);
  taskQueue.length = 0;
  currentTaskId = null;

  console.log(`Alle Tasks gelöscht (${count} Tasks).`);
  res.json({ success: true, message: `Alle ${count} Tasks gelöscht.` });
});




app.post('/api/save-task-id', (req, res) => {
    const { taskId } = req.body;
    const fs = require('fs');

    fs.writeFile('../data/taskId.json', JSON.stringify({ taskId }), (err) => {
        if (err) return res.status(500).json({ error: 'Fehler beim Speichern' });
    });

    console.log("Write in json " + taskId);
    res.json({ message: 'Task-ID gespeichert' });
});


app.post('/api/save-items', (req, res) => {
  const items = req.body;
  const fs =require('fs');

  fs.writeFile('../data/items.json', JSON.stringify(items), (err) => {
    if (err) return res.status(500).json({ error: 'Fehler beim Speichern' });
        res.json({ message: 'Task-ID gespeichert' });
  })
});