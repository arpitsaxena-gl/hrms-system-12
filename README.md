# HRMS — Human Resource Management System

A full-stack HRMS application built with Node.js/Express on the backend and React/TypeScript on the frontend, backed by MongoDB Atlas.

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database & ODM |
| Socket.IO | Real-time notifications |
| JWT (jsonwebtoken) | Authentication & refresh tokens |
| bcryptjs | Password hashing |
| Multer | File uploads (avatars, documents) |
| Winston | Structured logging |
| Swagger UI | Auto-generated API docs |
| Helmet + Rate Limiter | Security middleware |
| Nodemailer | Email notifications |
| PDFKit + XLSX | Report generation |
| express-mongo-sanitize | NoSQL injection prevention |

### Frontend
| Technology | Purpose |
|---|---|
| React 19 + TypeScript | UI framework |
| Vite | Build tool & dev server |
| Tailwind CSS | Utility-first styling |
| React Router v7 | Client-side routing |
| Zustand | Global state management |
| TanStack Query v5 | Server state & caching |
| TanStack Table v8 | Data tables |
| React Hook Form + Zod | Forms & validation |
| Recharts | Charts & analytics |
| Socket.IO Client | Real-time updates |
| Axios | HTTP client |
| Lucide React | Icon library |

---

## Project Structure

```
hrms/
??? backend/                   # Express API server
?   ??? server.js              # Entry point
?   ??? seed/
?   ?   ??? index.js           # Database seeder
?   ??? uploads/
?   ?   ??? avatars/           # Employee profile photos
?   ?   ??? documents/         # Employee documents
?   ??? src/
?       ??? config/            # DB, Swagger, constants (3 files)
?       ??? controllers/       # Route handlers (20 files)
?       ??? middleware/        # Auth, audit, validation, upload (6 files)
?       ??? models/            # Mongoose schemas (16 files)
?       ??? routes/            # Express routers (20 files)
?       ??? services/          # Email, payroll, socket (3 files)
?       ??? utils/             # Logger, helpers, API response (3 files)
?
??? client/                    # React + TypeScript frontend
?   ??? src/
?       ??? components/
?       ?   ??? layout/        # Layout, Navbar, Sidebar (3 files)
?       ?   ??? ui/            # Avatar, Badge, Modal, StatCard, Table (5 files)
?       ??? hooks/             # usePermissions (1 file)
?       ??? lib/               # Axios instance (1 file)
?       ??? pages/             # One folder per module (22 pages)
?       ??? store/             # Zustand auth store (1 file)
?       ??? types/             # Global TypeScript types (1 file)
?
??? postman/                   # Postman collection for API testing
```

---

## Codebase Stats

| Metric | Count |
|---|---|
| Backend source files | 71 |
| Frontend source files | 41 |
| Backend lines of code | ~2,765 |
| Frontend lines of code | ~3,679 |
| **Total lines of code** | **~6,444** |
| API routes | 20 resource endpoints |
| React pages | 22 pages |
| Mongoose models | 16 |

---

## Modules / Features

| Module | Description |
|---|---|
| Authentication | JWT login, refresh tokens, role-based access |
| Dashboard | Summary stats, charts, recent activity |
| Employees | Full employee lifecycle management |
| Departments | Department CRUD with color coding |
| Designations | Job titles with salary ranges |
| Attendance | Check-in/out, reports |
| Leaves | Leave requests, approvals, balances |
| Payroll | Salary computation, payslip generation |
| Recruitment | Job postings, applicant tracking |
| Performance | Reviews, ratings, goals |
| Training | Programs, enrollment, completion tracking |
| Documents | Upload & manage employee documents |
| Holidays | Company holiday calendar |
| Shifts | Shift scheduling (General, Morning, Night) |
| Notifications | Real-time alerts via Socket.IO |
| Reports | PDF/Excel exports |
| Settings | Company-wide configuration |
| Users | User account management |
| Audit Logs | Activity tracking across the system |
| Profile | Employee self-service profile |

---

## Roles

| Role | Access Level |
|---|---|
| `admin` | Full access to all modules |
| `hr` | Employee, leave, payroll, recruitment management |
| `manager` | View team, approve leaves, performance reviews |
| `employee` | Self-service: attendance, leaves, profile, documents |

---

## Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB Atlas](https://cloud.mongodb.com) account (free tier works)
- npm (comes with Node.js)

---

### Step 1 — Clone the Repository

```bash
git clone <repo-url>
cd hrms
```

---

### Step 2 — Configure MongoDB Atlas

1. Log in to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a cluster (free M0 tier is sufficient)
3. **Database Access** ? Add a database user with `readWriteAnyDatabase` role
4. **Network Access** ? Add IP Address ? Allow access from anywhere (`0.0.0.0/0`) for development
5. **Clusters** ? Connect ? Drivers ? Copy the connection string

---

### Step 3 — Configure Backend Environment

Create `backend/.env`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/hrms
JWT_SECRET=your_long_random_jwt_secret
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_long_random_refresh_secret
JWT_REFRESH_EXPIRE=30d
FRONTEND_URL=http://localhost:3000
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
BCRYPT_ROUNDS=10
COMPANY_NAME=Acme Corp
COMPANY_EMAIL=hr@acmecorp.com
```

> Replace `<username>`, `<password>`, and the cluster hostname with your actual Atlas values.

---

### Step 4 — Install Backend Dependencies & Seed Database

```bash
cd backend
npm install
npm run seed
```

Seeding creates sample departments, employees, shifts, holidays, and the following default accounts:

| Role | Email | Password |
|---|---|---|
| Admin | admin@hrms.com | Admin@123 |
| HR Manager | hr@hrms.com | Hr@12345 |
| Manager | manager@hrms.com | Manager@123 |
| Employee | alice@hrms.com | Employee@123 |

---

### Step 5 — Start the Backend Server

```bash
npm run dev
```

Server starts at **http://localhost:5000**
API docs available at **http://localhost:5000/api-docs**

---

### Step 6 — Install Frontend Dependencies & Start Dev Server

Open a **new terminal**:

```bash
cd client
npm install
npm run dev
```

Frontend starts at **http://localhost:3000**

> The Vite dev server proxies all `/api` requests to `http://localhost:5000` automatically.

---

### Step 7 — Open the App

Navigate to **http://localhost:3000** and log in with:
- Email: `admin@hrms.com`
- Password: `Admin@123`

---

## Available Scripts

### Backend (`/backend`)

| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon (auto-restart on changes) |
| `npm start` | Start without nodemon (production) |
| `npm run seed` | Seed the database with sample data |

### Frontend (`/client`)

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run oxlint |

---

## API Overview

Base URL: `http://localhost:5000/api`

| Endpoint | Description |
|---|---|
| `POST /auth/login` | Login and receive JWT tokens |
| `GET /auth/me` | Get current user profile |
| `GET /employees` | List all employees (paginated) |
| `GET /dashboard` | Dashboard stats and charts |
| `GET /attendance` | Attendance records |
| `GET /leaves` | Leave requests |
| `GET /payroll` | Payroll records |
| `GET /reports` | Generate reports |
| `GET /api-docs` | Swagger UI (full API docs) |

For the full API reference, visit **http://localhost:5000/api-docs** after starting the backend.

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | Yes | `development` | Runtime environment |
| `PORT` | No | `5000` | Backend server port |
| `MONGODB_URI` | Yes | — | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | — | Secret for signing access tokens |
| `JWT_EXPIRE` | No | `7d` | Access token expiry |
| `JWT_REFRESH_SECRET` | Yes | — | Secret for signing refresh tokens |
| `JWT_REFRESH_EXPIRE` | No | `30d` | Refresh token expiry |
| `FRONTEND_URL` | No | `http://localhost:3000` | Allowed CORS origin |
| `EMAIL_HOST` | No | — | SMTP host for email |
| `EMAIL_USER` | No | — | SMTP username |
| `EMAIL_PASS` | No | — | SMTP password |
| `COMPANY_NAME` | No | `Acme Corp` | Displayed in app & emails |
| `BCRYPT_ROUNDS` | No | `10` | Password hashing cost factor |

---

## Architecture

```
Browser (React + Vite)
        ?
        ?  HTTP / WebSocket
        ?
  Vite Dev Proxy (:3000)
        ?
        ?  /api/*  ?  :5000
        ?
  Express Server (:5000)
    ??? Helmet / Rate Limiter / CORS
    ??? JWT Auth Middleware
    ??? Audit Log Middleware
    ??? Routes ? Controllers ? Services
    ??? Mongoose ODM
              ?
              ?
       MongoDB Atlas (Cloud)
```

**Data flow:**
1. React components dispatch actions via Zustand or TanStack Query
2. Axios sends requests to `/api/*` (proxied by Vite to port 5000)
3. Express middleware handles auth, rate limiting, and audit logging
4. Controllers process business logic and call Mongoose models
5. Responses return JSON; real-time events pushed via Socket.IO

---

## License

MIT
