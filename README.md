# CO-Calendar

A shared calendar and list app where users can plan tasks, keep lists and share them with others.

Built as a group project in [course name] at Jönköping University.

## Features

- Register and log in (passwords hashed with bcrypt)
- Monthly calendar with tasks per day: add, edit and delete
- Lists: create and delete
- Share tasks and/or lists with another user by email, who can accept the request
- My account: change name and password, delete account
- Admin page: view, delete and promote users

## Tech stack

- **Frontend:** HTML, CSS, vanilla JavaScript
- **Backend:** Node.js, Express
- **Database:** MariaDB (via Docker)

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or later
- [Docker](https://www.docker.com/)

### 1. Clone and install

```bash
git clone https://github.com/alexanderSaila/Web-Development-Project.git
cd Web-Development-Project
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```
```bash
| Variable              | Description 
|                       |             
| `PORT`                | Port for the web server (e.g. `3000`) |
| `DB_HOST`             | Database host (`localhost`) |
| `DB_PORT`             | Database port (`3307`, as mapped in `docker-compose.yml`) |
| `DB_USER`             | Database user |
| `DB_PASSWORD`         | Database password |
| `DB_NAME`             | Database name (`project_calendar`) |
| `DB_CONNECTION_LIMIT` | Max connections in the pool (e.g. `5`) |
```
### 3. Start the database

```bash
docker compose up -d
docker exec -i project-calendar-db mariadb -u <DB_USER> -p<DB_PASSWORD> project_calendar < schema.sql
```

> ⚠️ `schema.sql` drops and recreates the database — running it again deletes all data.

### 4. Start the server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Creating an admin

Register an account, then promote it in the database:

```sql
UPDATE User SET is_admin = 1 WHERE email = 'you@example.com';
```

## Authors

- [Albin Karlsson](https://github.com/albinkarlsson1999)
- [Alexander Saila](https://github.com/alexanderSaila)
