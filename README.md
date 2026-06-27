# Task 3: TaskFlow Full-Stack Application

This repository contains both the **TaskFlow API** (Node.js/Express RESTful backend) and the **TaskFlow Lite** (HTML/CSS/JS client-side frontend) application.

## Directory Structure

```text
task-3/
├── backend/            # Express RESTful API (TaskFlow API)
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── routes/
│   ├── tests/          # Postman & automated verification scripts
│   ├── server.js
│   └── package.json
└── frontend/           # TaskFlow Lite UI
    ├── modules/        # ES Modules (storage, render, validation)
    ├── styles/         # CSS style system
    ├── index.html
    └── app.js
```

---

## 1. Backend API (`/backend`)

The backend is built with Node.js and Express. It features custom security headers, request validation using **Zod**, and rate limiting.

### Installation
Navigate to the `backend` directory and install the dependencies:
```bash
cd backend
npm install
```

### Configuration
Create a `.env` file inside the `backend` directory:
```env
PORT=5000
NODE_ENV=development
```

### Run the Server
To start the API server:
```bash
npm start
```
The backend API runs on `http://localhost:5000/api/tasks`.

### Running Verification Tests
To run the automated verification script:
```bash
node tests/verify.js
```

---

## 2. Frontend Client (`/frontend`)

The frontend is a vanilla JavaScript client using ES Modules. It renders tasks optimistically and syncs state changes (create, update, delete) to the backend.

### Setup and Running
To bypass browser CORS/ES Module security restrictions over the `file://` protocol, run a local web server in the `frontend` directory:

Using `npx serve` (requires Node.js):
```bash
cd frontend
npx serve -p 3000
```

Open **`http://localhost:3000`** in your browser. Ensure the backend API is running simultaneously on port `5000`.
