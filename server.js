const express = require('express');
const mariadb = require('mariadb');
const bcrypt = require('bcrypt');
const path = require('path');
const cors = require('cors');
const { error } = require('console');

const app = express();
const PORT = 3000;

const LOGGED_IN_USER_ID = null;

const pool = mariadb.createPool({
    host: 'localhost',
    user: 'root', // Replace with your DB user
    password: 'your_secure_password', // Replace with your DB password
    database: 'user_management',
    connectionLimit: 5
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));


app.get('/api/tasks/:year/:month', async (req, res) => {
    const loggedInUserId = req.headers["user-id"];
    
    if (!loggedInUserId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const { year, month } = req.params;

    const query = `
        SELECT tID as id, description as title, DATE_FORMAT(date, '%Y-%m-%d') as task_date, uID as userId
        FROM Task 
        WHERE uID = ? AND YEAR(date) = ? AND MONTH(date) = ?
        UNION
        SELECT Task.tID as id, Task.description as title, DATE_FORMAT(Task.date, '%Y-%m-%d') as task_date, uID as userId
        FROM Task
        JOIN UserShares ON Task.uID = UserShares.sharer_uID
        WHERE UserShares.shared_with_uID = ? AND YEAR(Task.date) = ? AND MONTH(Task.date) = ?
    `;

    try {
        const tasks = await pool.query(query, [
            loggedInUserId, year, month,
            loggedInUserId, year, month
        ]);
        res.json(tasks);
    } catch (e) {
        res.status(500).json({ error: "Failed to read tasks from database" });
    }
});

app.post("/api/register", async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await pool.query(
            "INSERT INTO User (fName, lName, email, password_hash) VALUES (?, ?, ?, ?)",
            [firstName, lastName, email, hashedPassword]
        );

        res.status(201).json({ message: "Successfully registered user"});

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to create new user in database" });
    }
});

app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        const result = await pool.query(
            "SELECT * FROM User WHERE email = ?",
            [email]
        );

        if (result.length === 0) {
            return res.status(404).json({ error: "No user found" });
        }
        
        const resultUser = result[0];

        const validPassword = await bcrypt.compare(password, resultUser.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: "Invalid password" });
        }

        const user = {
            id: resultUser.uID,
            firstName: resultUser.fName,
            lastName: resultUser.lName
        };

        res.status(200).json(user);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to get user from database" });
    }
});

app.post("/api/share", async (req, res) =>{
    const loggedInUserId = req.headers["user-id"];
    
    if (!loggedInUserId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const {email} = req.body;

    try{
        const askId = await pool.query(
            "SELECT * FROM User WHERE email = ?",
            [email]
        );
        if(askId.length === 0){
            return res.status(404).json({ error: "User not found in database" });
        }

        const recipient = askId[0];

        const result = await pool.query(
            "INSERT INTO UserShares (sharer_uID, shared_with_uID) VALUES (?, ?)",
            [loggedInUserId, recipient.uID]
        );

        res.status(201).json({ message: "Successfully shared" });
    }catch (e){
        return res.status(500).json({ error: "Error sharing in database" });
    }
});

app.post("/api/tasks/:year/:month", async (req, res) => {
    const loggedInUserId = req.headers["user-id"];
    
    if (!loggedInUserId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const { task_date, title } = req.body;

    if (!task_date || !title) {
        return res.status(400).json({ error: 'task_date and title required' });
    }

    try {
        const result = await pool.query(
            "INSERT INTO Task (description, date, uID) VALUES (?, ?, ?)",
            [title.trim(), task_date, loggedInUserId]
        );

        const newTask = {
            id: result.insertId.toString(),
            task_date: task_date,
            title: title.trim()
        };
        res.status(201).json(newTask);
    } catch (e) {
        res.status(500).json({ error: 'Failed to save task to database' });
    }
});

app.delete("/api/tasks/:year/:month/:id", async (req, res) => {
    const loggedInUserId = req.headers["user-id"];
    
    if (!loggedInUserId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }
    
    const { id } = req.params;

    try {
        const result = await pool.query("DELETE FROM Task WHERE tID = ? AND uID = ?",
            [id, loggedInUserId]
        )
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Task not found or authorized to user" });
        }
        res.json({ message: 'Task deleted successfully', id });
    } catch (e) {
        res.status(500).json({ error: "Failed to delete task from database" });
    }

});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));