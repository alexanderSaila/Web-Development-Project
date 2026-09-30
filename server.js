const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

async function ensureDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (e) {
        console.log("failed to create data directory:", e);
    }
}

function getFilePath(year, month) {
    return path.join(DATA_DIR, `tasks-${year}-${month}.json`)
}

async function readTasksFromFile(filePath) {
    try {
        const data = await fs.readFile(filePath, "utf-8");
        return JSON.parse(data);
    } catch (e) {
        
        if(e.code !== "ENOENT"){
            console.log(`Error reading file ${filePath}`);
        }
        return [];
    }
}

async function writeTasksToFile(filePath, tasks) {
    await fs.writeFile(filePath, JSON.stringify(tasks, null, 2), "utf-8");
}

app.get('/api/tasks/:year/:month', async (req, res) => {
    const { year, month } = req.params;

    const filePath = getFilePath(year, month);
    try {
        const tasks = await readTasksFromFile(filePath);
        res.json(tasks);
    } catch (e) {
        res.status(500).json({ error: "Failed to read tasks" });
    }
});

app.post('/api/tasks/:year/:month', async (req, res) => {
    const { year, month } = req.params;
    const { task_date, title } = req.body;

    if (!task_date || !title) {
        return res.status(400).json({ error: 'task_date and title required' });
    }

    const filePath = getFilePath(year, month);
    try {
        const tasks = await readTasksFromFile(filePath);
        const newTask = {
            id: Date.now().toString(),
            task_date: task_date,
            title: title.trim()
        };
        tasks.push(newTask);
        await writeTasksToFile(filePath, tasks);
        res.status(201).json(newTask);
    } catch (e) {
        res.status(500).json({ error: 'Failed to save task' });
    }
});

app.delete('/api/tasks/:year/:month/:id', async (req, res) => {
    const { year, month, id } = req.params;
    const filePath = getFilePath(year, month);

    try {
        const tasks = await readTasksFromFile(filePath);
        const filteredTasks = tasks.filter((task) => task.id !== id);

        await writeTasksToFile(filePath, filteredTasks);
        res.json({ message: 'Task deleted successfully', id });
    } catch (e) {
        res.status(500).json({ error: 'Failed to delete task' });
    }

});


ensureDataDir().then(() => {
  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
});