require('dotenv').config();
const express = require('express');
const mariadb = require('mariadb');
const bcrypt = require('bcrypt');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT;

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: process.env.DB_CONNECTION_LIMIT,
    port: process.env.DB_PORT
});


app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser(process.env.COOKIE_SECRET));

// **********************
// RATE LIMITERS
// OBS!! 
// Ändra max-värdena när appen är i produktion
// **********************
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 5 login requests per windowMs
    message: "Too many login attempts from this IP, please try again after 15 minutes"
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000, // Limit each IP to 10 registration requests per windowMs
    message: "Too many accounts created from this IP, please try again after an hour"
});

const otherLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000, // Limit each IP to 5 requests per windowMs
    message: "Too many requests from this IP, please try again after 15 minutes"
});


// ***********************
// HELPERS
// ***********************

async function canAccessList(listId, userId) {
    const rows = await pool.query(
        `SELECT 1 FROM List
         WHERE lID = ?
           AND (uID = ?
                OR uID IN (SELECT sharer_uID FROM UserSharesList
                           WHERE shared_with_uID = ? AND is_accepted = TRUE))`,
        [listId, userId, userId]
    );
    return rows.length > 0;
}

// ***********************
// DELETE COOKIE ON LOGOUT
// ***********************
app.post('/logout', (req, res) => {
    res.clearCookie("user-id", {
        httpOnly: true,
        sameSite: "strict",
        secure: false
    });
    res.status(200).json({ message: "Logged out successfully" });
});


// ***********************
// ADMIN PAGE
// ***********************

// ***********************
// CHECK IF USER IS ADMIN
// ***********************
app.get('/admin', async (req, res) => {
    const loggedInUserId = req.signedCookies["user-id"];

    if (!loggedInUserId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const result = await pool.query(
        "SELECT is_admin FROM User WHERE uID = ?",
        [loggedInUserId]
    );

    if (result.length === 0 || !result[0].is_admin) {
        return res.status(403).json({ error: "Forbidden. Admin access required." });
    }

    res.sendFile(path.join(__dirname, 'Admin.html'));
});

// ***********************
// ADMIN PAGE - GET ALL USERS
// ***********************
app.get('/admin/users', async (req, res) => {
    const loggedInUserId = req.signedCookies["user-id"];

    if (!loggedInUserId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    try {
        const adminCheck = await pool.query(
            "SELECT is_admin FROM User WHERE uID = ?",
            [loggedInUserId]
        );

        if (adminCheck.length === 0 || !adminCheck[0].is_admin) {
            return res.status(403).json({ error: "Forbidden. Admin access required." });
        }

        const users = await pool.query(
            "SELECT uID, fName, lName, email, is_admin FROM User"
        );
        res.json(users);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to read users from database" });
    }
});


// ***********************
// ADMIN PAGE - DELETE USER
// ***********************
app.delete('/admin/users/:userId', async (req, res) => {
    const loggedInUserId = req.signedCookies["user-id"];
    const { userId } = req.params;

    if (!loggedInUserId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    try {
        const adminCheck = await pool.query(
            "SELECT is_admin FROM User WHERE uID = ?",
            [loggedInUserId]
        );

        if (adminCheck.length === 0 || !adminCheck[0].is_admin) {
            return res.status(403).json({ error: "Forbidden. Admin access required." });
        }

        if (Number(userId) === Number(loggedInUserId)) {
            return res.status(400).json({ error: "Admins cannot delete themselves" });
        }

        const result = await pool.query(
            "DELETE FROM User WHERE uID = ?",
            [userId]
        );
        res.status(200).json({ message: "User deleted successfully" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to delete user from database" });
    }
});



// ***********************
// ADMIN PAGE - MAKE USER ADMIN
// ***********************
app.put('/admin/users/:userId', async (req, res) => {
    const loggedInUserId = req.signedCookies["user-id"];
    const { userId } = req.params;
    const { is_admin } = req.body;

    if (!loggedInUserId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    try {
        const adminCheck = await pool.query(
            "SELECT is_admin FROM User WHERE uID = ?",
            [loggedInUserId]
        );

        if (adminCheck.length === 0 || !adminCheck[0].is_admin) {
            return res.status(403).json({ error: "Forbidden. Admin access required." });
        }

        const result = await pool.query(
            "UPDATE User SET is_admin = ? WHERE uID = ?",
            [is_admin, userId]
        );
        res.status(200).json({ message: "User admin status updated successfully" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to update user admin status in database" });
    }
});


// ***********************






// ***********************
// SHARES
//
// OBS!!
// Måste ligga före POST /api/tasks/:year/:month
// annars tolkas /api/tasks/share/accept som year = "share" och month = "accept"
// ***********************




// ***********************
// GET PENDING SHARE REQUESTS
// ***********************

app.get("/api/share/pending", async (req, res) => {
    const loggedInUserId = req.signedCookies["user-id"];

    if (!loggedInUserId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const query = `
        SELECT 'task' AS type, User.uID AS sharerId, User.fName, User.lName, User.email
        FROM UserSharesTask
        JOIN User ON User.uID = UserSharesTask.sharer_uID
        WHERE UserSharesTask.shared_with_uID = ? AND UserSharesTask.is_accepted = FALSE
        UNION ALL
        SELECT 'list', User.uID, User.fName, User.lName, User.email
        FROM UserSharesList
        JOIN User ON User.uID = UserSharesList.sharer_uID
        WHERE UserSharesList.shared_with_uID = ? AND UserSharesList.is_accepted = FALSE
    `;

    try {
        const pendingShares = await pool.query(query, [loggedInUserId, loggedInUserId]);
        res.json(pendingShares);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Error fetching pending shares from database" });
    }
});


// ***********************
// ACCEPT LIST SHARE
// ***********************

app.post("/api/lists/share/accept", async (req, res) => {
    const loggedInUserId = req.signedCookies["user-id"];

    if (!loggedInUserId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const { sharerId } = req.body;

    if (!sharerId) {
        return res.status(400).json({ error: "Sharer ID is required" });
    }

    try {
        const result = await pool.query(
            "UPDATE UserSharesList SET is_accepted = TRUE WHERE sharer_uID = ? AND shared_with_uID = ? AND is_accepted = FALSE",
            [sharerId, loggedInUserId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "No pending share request found" });
        }

        res.status(200).json({ message: "Share request accepted" });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Error accepting share request in database" });
    }
});


// ***********************
// ACCEPT TASK SHARE
// ***********************
app.post("/api/tasks/share/accept", async (req, res) => {
    const loggedInUserId = req.signedCookies["user-id"];

    if (!loggedInUserId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const { sharerId } = req.body;

    if (!sharerId) {
        return res.status(400).json({ error: "Sharer ID is required" });
    }

    try {
        const result = await pool.query(
            "UPDATE UserSharesTask SET is_accepted = TRUE WHERE sharer_uID = ? AND shared_with_uID = ? AND is_accepted = FALSE",
            [sharerId, loggedInUserId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "No pending share request found" });
        }

        res.status(200).json({ message: "Share request accepted" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Error accepting share request in database" });
    }
});





// **********************
// GET TASKS FOR SPECIFIC YEAR AND MONTH
// **********************
app.get('/api/tasks/:year/:month', async (req, res) => {
    const loggedInUserId = req.signedCookies["user-id"];

    if (!loggedInUserId) {
        console.log("Unauthorized. Please log in.");
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const { year, month } = req.params;

    const query = `
        SELECT Task.tID as id, Task.description as title, DATE_FORMAT(Task.date, '%Y-%m-%d') as task_date, Task.uID as userId, User.fName as name, TRUE as is_owner
        FROM Task 
        JOIN User ON Task.uID = User.uID
        WHERE Task.uID = ? AND YEAR(Task.date) = ? AND MONTH(Task.date) = ?
        UNION
        SELECT Task.tID as id, Task.description as title, DATE_FORMAT(Task.date, '%Y-%m-%d') as task_date, Task.uID as userId, User.fName as name, FALSE as is_owner
        FROM Task
        JOIN UserSharesTask ON Task.uID = UserSharesTask.sharer_uID
        JOIN User ON Task.uID = User.uID
        WHERE UserSharesTask.shared_with_uID = ? 
        AND UserSharesTask.is_accepted = TRUE
        AND YEAR(Task.date) = ? 
        AND MONTH(Task.date) = ?
    `;

    try {
        const tasks = await pool.query(query, [
            loggedInUserId, year, month,
            loggedInUserId, year, month
        ]);
        res.json(tasks);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to read tasks from database" });
    }
});


// **********************
// REGISTER NEW USER
// **********************
app.post("/api/register", registerLimiter, async (req, res) => {
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

        return res.status(201).json({ message: "Successfully registered user" });

    } catch (e) {
        console.error(e);
        if (e.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "Email already exists" });
        }

        res.status(500).json({ error: "Failed to create new user in database" });
    }
});

// **********************
// LOGIN USER
// **********************
app.post("/api/login", loginLimiter, async (req, res) => {
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
            lastName: resultUser.lName,
            is_admin: resultUser.is_admin
        };

        res.cookie("user-id", resultUser.uID, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 3600000,
            signed: true,
            secure: false
        });

        res.status(200).json(user);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to get user from database" });
    }
});

// **********************
// CHECK USER IS LOGGED IN
// **********************
app.get("/api/logged-in", otherLimiter, async (req, res) => {
    const loggedInUserId = req.signedCookies["user-id"];

    if (!loggedInUserId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }
    else {
        return res.status(200).json({ message: "User is logged in" });
    }
});

// **********************
// CHANGE PASSWORD
// **********************
app.put("/api/change-password", otherLimiter, async (req, res) => {
    const loggedInUserId = req.signedCookies["user-id"];
    const { currentPassword, newPassword } = req.body;

    if (!loggedInUserId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current and new passwords are required" });
    }

    try {
        const result = await pool.query(
            "SELECT password_hash FROM User WHERE uID = ?",
            [loggedInUserId]
        );

        if (result.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const passwordMatch = await bcrypt.compare(currentPassword, result[0].password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ error: "Current password is incorrect" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        await pool.query(
            "UPDATE User SET password_hash = ? WHERE uID = ?",
            [hashedNewPassword, loggedInUserId]
        );

        res.status(200).json({ message: "Password changed successfully" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to change password" });
    }
});


// **********************
// CHANGE NAME
// **********************
app.put("/api/change-name", otherLimiter, async (req, res) => {
    const loggedInUserId = req.signedCookies["user-id"];
    const { firstName, lastName } = req.body;

    if (!loggedInUserId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    if (!firstName || !lastName) {
        return res.status(400).json({ error: "First name and last name are required" });
    }

    try {
        await pool.query(
            "UPDATE User SET fName = ?, lName = ? WHERE uID = ?",
            [firstName.trim(), lastName.trim(), loggedInUserId]
        );

        res.status(200).json({ message: "Name changed successfully" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to change name" });
    }
});

app.delete("/api/delete-account", otherLimiter, async (req, res) => {
    const loggedInUserId = req.signedCookies["user-id"];

    if (!loggedInUserId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    try {
        await pool.query(
            "DELETE FROM User WHERE uID = ?",
            [loggedInUserId]
        );
        return res.status(200).json({ message: "Account deleted successfully" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "Failed to delete account" });
    }

});


// ***********************
// SHARE TASKS WITH ANOTHER USER
// ***********************
app.post("/api/tasks/share", otherLimiter, async (req, res) => {
    const loggedInUserId = req.signedCookies["user-id"];

    if (!loggedInUserId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    try {
        const users = await pool.query(
            "SELECT uID FROM User WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const recipientId = users[0].uID;

        if (recipientId === Number(loggedInUserId)) {
            return res.status(400).json({ error: "You cannot share with yourself" });
        }

        const existing = await pool.query(
            "SELECT 1 FROM UserSharesTask WHERE sharer_uID = ? AND shared_with_uID = ?",
            [loggedInUserId, recipientId]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: "Already shared with this user" });
        }

        await pool.query(
            "INSERT INTO UserSharesTask (sharer_uID, shared_with_uID) VALUES (?, ?)",
            [loggedInUserId, recipientId]
        );

        res.status(201).json({ message: "Share request sent" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Error sharing tasks in database" });
    }
});







// **********************
// ADD NEW TASK
// **********************
app.post("/api/tasks/:year/:month", async (req, res) => {
    const loggedInUserId = req.signedCookies["user-id"];

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
        console.error(e);
        res.status(500).json({ error: 'Failed to save task to database' });
    }
});


// **********************
// DELETE TASK
// **********************
app.delete("/api/tasks/:year/:month/:id", async (req, res) => {
    const loggedInUserId = req.signedCookies["user-id"];

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
        console.error(e);
        res.status(500).json({ error: "Failed to delete task from database" });
    }

});



// **********************
// UPDATE TASK
// **********************
app.put("/api/tasks/:id", async (req, res) => {
    const loggedInUserId = req.signedCookies["user-id"];

    if (!loggedInUserId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const { id } = req.params;
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'title required' });
    }

    try {
        const result = await pool.query(
            "UPDATE Task SET description = ? WHERE tID = ? AND uID = ?",
            [title.trim(), id, loggedInUserId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Task not found or not authorized to user" });
        }

        const updatedTask = {
            id: id,
            title: title.trim()
        };
        res.json(updatedTask);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to update task in database" });
    }
});




// ***********************
// LISTS
// ***********************

// ***********************
// GET ALL LISTS
// ***********************
app.get("/api/lists", async (req, res) => {
    const loggedInUserId = req.signedCookies["user-id"];

    if (!loggedInUserId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const query = `
        SELECT lID AS id, title, uID AS ownerId
        FROM List
        WHERE uID = ?
        UNION
        SELECT List.lID AS id, List.title, List.uID AS ownerId
        FROM List
        JOIN UserSharesList ON List.uID = UserSharesList.sharer_uID
        WHERE UserSharesList.shared_with_uID = ?
          AND UserSharesList.is_accepted = TRUE
    `;

    try {
        const lists = await pool.query(query, [loggedInUserId, loggedInUserId]);
        res.json(lists);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to read lists from database" });
    }
});



// ***********************
// GET ELEMENTS IN LIST
// ***********************
app.get("/api/lists/:listId/elements", async (req, res) => {
    const loggedInUserId = req.signedCookies["user-id"];

    if (!loggedInUserId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const { listId } = req.params;

    try {
        if (!(await canAccessList(listId, loggedInUserId))) {
            return res.status(404).json({ error: "List not found or not authorized to user" });
        }

        const result = await pool.query(
            "SELECT leID AS id, title, is_checked FROM ListElement WHERE lID = ? ORDER BY leID",
            [listId]
        );

        // is_checked kommer som 0/1 från databasen, gör om till true/false
        const elements = result.map(row => ({
            ...row,
            is_checked: Boolean(row.is_checked)
        }));

        res.status(200).json({elements});
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to read list elements from database" });
    }
});


// ***********************
// ADD LIST
// ***********************
app.post("/api/lists", async (req, res) => {
    const loggedInUserId = req.signedCookies["user-id"];

    if (!loggedInUserId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'title required' });
    }

    try {
        const result = await pool.query(
            "INSERT INTO List (title, uID) VALUES (?, ?)",
            [title.trim(), loggedInUserId]
        );
        res.status(201).json({ message: "List created successfully", id: result.insertId.toString(), title: title.trim() });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to create list in database" });
    }
});

// ***********************
// DELETE LIST
// ***********************
app.delete("/api/lists/:id", async (req, res) => {
    const loggedInUserId = req.signedCookies["user-id"];

    if (!loggedInUserId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const { id } = req.params;

    try {
        const result = await pool.query(
            "DELETE FROM List WHERE lID = ? AND uID = ?",
            [id, loggedInUserId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "List not found or not authorized to user" });
        }
        res.status(200).json({ message: "List deleted successfully" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to delete list from database" });
    }
});

// ***********************
// UPDATE LIST
// ***********************
app.put("/api/lists/:id", async (req, res) => {
    const loggedInUserId = req.signedCookies["user-id"];

    if (!loggedInUserId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const { id } = req.params;
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'title required' });
    }

    try {
        const result = await pool.query(
            "UPDATE List SET title = ? WHERE lID = ? AND uID = ?",
            [title.trim(), id, loggedInUserId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "List not found or not authorized to user" });
        }

        const updatedList = {
            id: id,
            title: title.trim()
        };

        res.json(updatedList);

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to update list in database" });
    }
});

// ***********************
// SHARE LIST WITH ANOTHER USER
// ***********************
app.post("/api/lists/share", otherLimiter, async (req, res) => {
    const loggedInUserId = req.signedCookies["user-id"];

    if (!loggedInUserId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    try {
        const users = await pool.query(
            "SELECT uID FROM User WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const recipientId = users[0].uID;

        if (recipientId === Number(loggedInUserId)) {
            return res.status(400).json({ error: "You cannot share with yourself" });
        }

        const existing = await pool.query(
            "SELECT 1 FROM UserSharesList WHERE sharer_uID = ? AND shared_with_uID = ?",
            [loggedInUserId, recipientId]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: "Already shared with this user" });
        }

        await pool.query(
            "INSERT INTO UserSharesList (sharer_uID, shared_with_uID) VALUES (?, ?)",
            [loggedInUserId, recipientId]
        );

        res.status(201).json({ message: "Share request sent" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Error sharing list in database" });
    }
});



// ***********************
// ADD ELEMENT TO LIST
// ***********************
app.post("/api/lists/:listId/elements", async (req, res) => {
    const loggedInUserId = req.signedCookies["user-id"];

    if (!loggedInUserId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const { listId } = req.params;
    const { title, description } = req.body;


    if (!title || !description) {
        return res.status(400).json({ error: 'title and description required' });
    }

    try {
        if (!(await canAccessList(listId, loggedInUserId))) {
            return res.status(404).json({ error: "List not found or not authorized to user" });
        }

        const result = await pool.query(
            "INSERT INTO ListElement (title, lID) VALUES (?, ?, ?)",
            [title.trim(), description.trim(), listId]
        );

        const newElement = {
            id: result.insertId.toString(),
            title: title.trim(),
            description: description.trim(),
            is_checked: false
        };
        res.status(201).json(newElement);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to add element to list in database" });
    }
});


// ***********************
// DELETE ELEMENT FROM LIST
// ***********************
app.delete("/api/lists/elements/:elementId", async (req, res) => {
    const loggedInUserId = req.signedCookies["user-id"];

    if (!loggedInUserId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const { elementId } = req.params;

    try {

        const result = await pool.query(
            "DELETE FROM ListElement WHERE leID = ?",
            [elementId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Element not found or not authorized to user" });
        }
        res.json({ message: 'Element deleted successfully', elementId });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to delete element from list in database" });
    }
});



// ***********************
// UPDATE ELEMENT IN LIST
// ***********************
app.put("/api/lists/elements/:elementId", async (req, res) => {
    const loggedInUserId = req.signedCookies["user-id"];

    if (!loggedInUserId) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const { elementId } = req.params;
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'title required' });
    }

    try {

        const result = await pool.query(
            "UPDATE ListElement SET title = ? WHERE leID = ?",
            [title.trim(), elementId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Element not found or not authorized to user" });
        }

        const updatedElement = {
            id: elementId,
            title: title.trim()
        };

        res.json(updatedElement);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to update element in list in database" });
    }
});









// ***********************
// START THE SERVER
// ***********************
app.listen(PORT, (err) => {
    if (err) {
        console.error(`Error starting server: ${err}`);
        return;
    }
    console.log(`Server running at http://localhost:${PORT}`);

});