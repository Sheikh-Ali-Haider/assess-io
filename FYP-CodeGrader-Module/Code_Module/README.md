<div align="center">

<img src="https://img.shields.io/badge/Assess.io-AI%20Grading%20Platform-4F46E5?style=for-the-badge" alt="Assess.io"/>

# 🎓 Assess.io

### AI-Powered Multi-Modal Assignment Grading Platform

*Final Year Project — BS Computer Science*
*University of Management and Technology (UMT), Lahore — Batch 2022–2026*

<br/>

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.135-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Celery](https://img.shields.io/badge/Celery-5.6-37814A?style=flat-square&logo=celery&logoColor=white)](https://docs.celeryq.dev)
[![Redis](https://img.shields.io/badge/Redis-7.3-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-Sandbox-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini)
[![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3-F55036?style=flat-square)](https://groq.com)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

<br/>

[📖 Overview](#-overview) • [✨ Features](#-features) • [🛠️ Tech Stack](#️-tech-stack) • [⚙️ Setup](#️-local-setup) • [🌐 API Reference](#-api-reference) • [👥 Team](#-team)

</div>

---

## 📌 Overview

**Assess.io** is a production-ready, full-stack Learning Management System (LMS) that automates assignment grading using AI and multi-modal analysis. It supports three distinct submission types — **code**, **typed documents (PDF/DOCX)**, and **handwritten scans** — each processed through a dedicated AI pipeline.

The platform is built for academic institutions and supports three roles: **Admin**, **Teacher**, and **Student**. All grading is handled **asynchronously** using Celery workers backed by Redis, keeping the UI responsive while AI processes submissions in the background.

```
Three Submission Types        Three AI Pipelines
─────────────────────         ──────────────────
📝 Code          ──────────►  Docker Sandbox + Groq LLM
📄 Document      ──────────►  PDF/DOCX Extraction + Gemini 2.5 Flash
✍️  Handwritten   ──────────►  Gemini Vision OCR + Groq LLM
```

---

## ✨ Features

### 👨‍💼 Admin Portal
- Platform-wide dashboard — total users, courses, submissions, grading queue stats
- Full user management — create, update, delete Students and Teachers
- Course management — create courses, assign teachers, enroll/remove students
- Global grading queue visibility across all courses

### 👨‍🏫 Teacher Portal
- Week-based curriculum builder — organize courses into weeks with titles and dates
- Study material uploads per week — supports PDF, PPT, DOCX files and YouTube video links
- Three assignment types — Code (with test cases), Document, Handwritten
- AI-assisted test case generation for code assignments via Groq LLM
- Per-submission grading queue with scores, student details, and AI feedback
- Automatic email notifications sent to enrolled students on new assignments and materials

### 👨‍🎓 Student Portal
- Enrolled course and week-wise material viewer
- Assignment submission — code files, PDF/DOCX documents, or handwritten image scans
- Real-time grading status polling — no page refresh needed
- Detailed result view — score, standardized grade (/10), AI feedback, test case breakdown
- Full submission history per student

### 🤖 AI Grading Pipelines

| Submission Type | Step 1 | Step 2 | Step 3 |
|---|---|---|---|
| **Code** | Docker sandbox execution | Test case pass/fail matching | Groq LLM feedback |
| **Document** | PDF/DOCX text extraction | Gemini 2.5 Flash grading | Score normalization |
| **Handwritten** | PIL image preprocessing | Gemini Vision OCR | Groq LLM grading |

### 📧 Email Notification System
- **Instant** — `BackgroundTasks` sends emails when assignments or materials are created
- **Scheduled** — `APScheduler` runs daily at 9:00 AM to remind students of upcoming deadlines

---

## 🛠️ Tech Stack

### Backend
| Layer | Technology | Purpose |
|---|---|---|
| API Framework | FastAPI 0.135 + Uvicorn | REST API server |
| Language | Python 3.11 | Core backend language |
| Database ORM | SQLAlchemy 2.0 | Database models and queries |
| Database | PostgreSQL 16 | Primary data store |
| Task Queue | Celery 5.6 | Async background grading workers |
| Message Broker | Redis 7.3 | Celery task queue and result backend |
| Authentication | JWT (python-jose) + bcrypt | Secure token-based auth |
| AI — Vision & Docs | Google Gemini 2.5 Flash | Document grading + handwritten OCR |
| AI — Text & Code | Groq (LLaMA 3.3 70B) | Code feedback + handwritten grading |
| Code Sandbox | Docker (isolated containers) | Safe student code execution |
| PDF Processing | pdfplumber + poppler-utils | Text extraction from PDFs |
| Email | SMTP via Gmail App Password | Notifications and reminders |
| Scheduler | APScheduler | Daily deadline reminder cron job |

### Frontend
| Layer | Technology | Purpose |
|---|---|---|
| Framework | React 19.2 | UI component framework |
| Build Tool | Vite 7.2 | Development server and bundler |
| Routing | React Router DOM 7.13 | Client-side navigation |
| Styling | Tailwind CSS 3.4 | Utility-first styling |
| Icons | Lucide React | UI icon library |
| State Management | React Context API | Auth state (JWT token + user info) |
| HTTP Client | Custom `apiFetch` wrapper | JWT auto-attach on every request |

---

## 📁 Project Structure

```
assess-io/
│
├── start.bat                        # ⚡ One-click startup (Windows)
│
├── fyp-frontend/                    # React 19 + Vite — Frontend
│   ├── public/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # JWT auth state — login/logout/token
│   │   ├── layout/
│   │   │   ├── MainLayout.jsx       # App shell — sidebar + navbar wrapper
│   │   │   ├── Navbar.jsx           # Top navigation bar
│   │   │   └── Sidebar.jsx          # Role-based sidebar navigation
│   │   ├── components/
│   │   │   └── PrivateRoute.jsx     # Auth guard + role-based access control
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx        # Centralized route definitions
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   └── Login.jsx        # Login page (all roles)
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── UserManagement.jsx
│   │   │   │   ├── CourseManagement.jsx
│   │   │   │   └── GradingQueue.jsx
│   │   │   ├── teacher/
│   │   │   │   ├── TeacherDashboard.jsx
│   │   │   │   ├── TeacherCourses.jsx
│   │   │   │   ├── TeacherCourseManager.jsx   # Week + material editor
│   │   │   │   ├── CreateAssignment.jsx        # AI test case generation
│   │   │   │   ├── CourseEditor.jsx
│   │   │   │   └── TeacherGradingQueue.jsx
│   │   │   └── student/
│   │   │       ├── StudentDashboard.jsx
│   │   │       ├── StudentAssignments.jsx
│   │   │       ├── CourseView.jsx
│   │   │       ├── UploadPage.jsx             # File submission page
│   │   │       ├── ResultView.jsx             # Score + AI feedback view
│   │   │       └── StudentResults.jsx
│   │   └── utils/
│   │       ├── api.js               # All API calls + JWT auto-injection
│   │       └── fileValidation.js    # Upload type and size validation
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── FYP-CodeGrader-Module/
    └── Code_Module/                 # FastAPI — Backend
        ├── main.py                  # All 35+ API routes + app config
        ├── seed_admin.py            # Creates first admin user in DB
        ├── requirements.txt         # Python dependencies
        ├── Dockerfile               # Backend Docker image
        ├── .env.example             # Environment variable template
        └── services/
            ├── database.py          # SQLAlchemy models + DB init
            ├── ai_service.py        # Groq LLM — test case generation
            ├── celery_worker.py     # Async grading — 3 pipelines
            ├── docker_service.py    # Docker sandbox code execution
            ├── document_service.py  # PDF/DOCX extraction + Gemini grading
            ├── handwritten_service.py  # Image OCR + Groq grading
            ├── email_service.py     # SMTP email notifications
            └── scheduler.py        # APScheduler — daily deadline reminders
```

---

## ⚙️ Local Setup

### Prerequisites

Make sure the following are installed before proceeding:

| Tool | Version | Download |
|---|---|---|
| Python | 3.11+ | [python.org](https://python.org) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| PostgreSQL | 16 | [postgresql.org](https://postgresql.org) |
| Redis | Any | [redis.io](https://redis.io) or via Docker |
| Docker | Any | [docker.com](https://docker.com) |
| poppler-utils | Any | Windows: [oschwartz10612/poppler-windows](https://github.com/oschwartz10612/poppler-windows/releases) / Linux: `sudo apt install poppler-utils` |

---

### Option A — One-Click Startup (Windows)

Place `start.bat` in the project root and double-click it. It starts Redis, FastAPI, Celery worker, and the React dev server — all at once in separate terminals.

```bat
@echo off
SET ROOT=%~dp0

echo Starting Redis...
start cmd /k "docker start redis"

echo Starting FastAPI...
start cmd /k "cd %ROOT%FYP-CodeGrader-Module\Code_Module && venv\Scripts\activate.bat && uvicorn main:app --reload --port 8000 --env-file .env"

echo Starting Celery...
start cmd /k "cd %ROOT%FYP-CodeGrader-Module\Code_Module && venv\Scripts\activate.bat && celery -A services.celery_worker worker --loglevel=info --pool=threads --concurrency=4"

echo Starting Frontend...
start cmd /k "cd %ROOT%fyp-frontend && npm run dev"

echo All services started!
pause
```

> ⚠️ Run this from **CMD**, not PowerShell, to avoid execution policy errors.

---

### Option B — Manual Setup

#### Step 1 — Clone the Repository

```bash
git clone https://github.com/your-username/assess-io.git
cd assess-io
```

#### Step 2 — Backend Setup

```bash
cd FYP-CodeGrader-Module/Code_Module
```

**Create and activate a virtual environment:**
```bash
python -m venv venv

# Windows (CMD — not PowerShell)
venv\Scripts\activate.bat

# Linux / Mac
source venv/bin/activate
```

**Install Python dependencies:**
```bash
pip install -r requirements.txt
```

**Create your `.env` file:**
```bash
# Windows
copy .env.example .env

# Linux / Mac
cp .env.example .env
```

Fill in the values — see [Environment Variables](#-environment-variables) below.

**Create the PostgreSQL database:**
```sql
CREATE DATABASE fyp_grader;
```

**Run database migrations (auto on startup) + seed admin:**
```bash
python seed_admin.py
```

**Start the FastAPI server:**
```bash
uvicorn main:app --reload --port 8000
```

API available at: `http://localhost:8000`
Swagger UI: `http://localhost:8000/docs`
ReDoc: `http://localhost:8000/redoc`

**Start the Celery worker** (separate terminal, venv activated):
```bash
celery -A services.celery_worker worker --loglevel=info --pool=threads --concurrency=4
```

#### Step 3 — Frontend Setup

```bash
cd fyp-frontend
npm install
```

Create `.env.local`:
```env
VITE_API_URL=http://localhost:8000
```

Start the dev server:
```bash
npm run dev
```

Frontend available at: `http://localhost:5173`

---

## 🔐 Default Admin Credentials

After running `python seed_admin.py`, use these to log in:

```
Email:    admin@assess.io
Password: admin123
```

> ⚠️ Change the password after first login in a production environment.

From the Admin portal you can create Teachers and Students, set up courses, and assign enrollments.

---

## 🔑 Environment Variables

Create a `.env` file inside `FYP-CodeGrader-Module/Code_Module/`:

```env
# ── Database ──────────────────────────────────────────────
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/fyp_grader

# ── Authentication ────────────────────────────────────────
JWT_SECRET=your_long_random_secret_key_here

# ── AI APIs ───────────────────────────────────────────────
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# ── Email (Gmail App Password) ────────────────────────────
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password

# ── CORS ──────────────────────────────────────────────────
# Add your frontend URL — comma-separated for multiple
ALLOWED_ORIGINS=http://localhost:5173

# ── Poppler (Windows only) ────────────────────────────────
# Remove this line on Linux/Mac — poppler is found automatically
POPPLER_PATH=C:\poppler\poppler-25.12.0\Library\bin
```

> ⚠️ **Never commit your `.env` file.** Add it to `.gitignore`.

**How to get API keys:**
- **Groq:** [console.groq.com](https://console.groq.com) → Create API Key (free tier available)
- **Gemini:** [aistudio.google.com](https://aistudio.google.com) → Get API Key (free tier available)
- **Gmail App Password:** Google Account → Security → 2-Step Verification → App Passwords

---

## 🌐 API Reference

Base URL: `http://localhost:8000`

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/login` | ❌ | Login — returns JWT token + user info |

### Courses
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/courses` | ❌ | Get all courses |
| `POST` | `/courses` | Admin | Create a new course |
| `GET` | `/courses/{id}` | ❌ | Get a single course |
| `PUT` | `/courses/{id}` | Admin | Update a course |
| `DELETE` | `/courses/{id}` | Admin | Delete a course |
| `GET` | `/courses/teacher/{id}` | ❌ | Courses assigned to a teacher |
| `GET` | `/courses/student/{id}` | ❌ | Courses a student is enrolled in |

### Weeks & Materials
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/courses/{id}/weeks` | ❌ | Get all weeks for a course |
| `POST` | `/courses/{id}/weeks` | Admin/Teacher | Create a week |
| `GET` | `/weeks/{id}` | ❌ | Get a single week |
| `PUT` | `/weeks/{id}` | Admin/Teacher | Update a week |
| `DELETE` | `/weeks/{id}` | Admin/Teacher | Delete a week |
| `GET` | `/weeks/{id}/materials` | ❌ | Get materials for a week |
| `POST` | `/weeks/{id}/materials` | Admin/Teacher | Upload file or video link |
| `DELETE` | `/materials/{id}` | Admin/Teacher | Delete a material |

### Assignments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/assignments` | ❌ | Get assignments (filter by course/week) |
| `POST` | `/assignment/create` | Admin/Teacher | Create assignment (code/document/handwritten) |
| `GET` | `/assignment/{id}` | ❌ | Get a single assignment with test cases |
| `PUT` | `/assignment/{id}` | Admin/Teacher | Update an assignment |
| `DELETE` | `/assignment/{id}` | Admin/Teacher | Delete an assignment |
| `POST` | `/extract-assignment-file` | Admin/Teacher | Extract text from PDF/DOCX file |
| `POST` | `/generate-test-cases` | Admin/Teacher | AI-generate test cases via Groq |

### Submissions
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/submit` | Student | Submit code assignment |
| `POST` | `/submit/document` | Student | Submit PDF/DOCX assignment |
| `POST` | `/submit/handwritten` | Student | Submit handwritten image |
| `GET` | `/result/{submission_id}` | Any | Get grading result for a submission |
| `GET` | `/history/{student_id}` | Any | Get all submissions by a student |
| `GET` | `/submissions/teacher/{id}` | Admin/Teacher | Grading queue for a teacher |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/users` | Admin | Get all users |
| `POST` | `/users` | Admin | Create a new user |
| `PUT` | `/users/{id}` | Admin | Update a user |
| `DELETE` | `/users/{id}` | Admin | Delete a user |

### Enrollments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/enrollments` | Admin | Enroll a student in a course |
| `DELETE` | `/enrollments/{student_id}/{course_id}` | Admin | Remove enrollment |
| `GET` | `/enrollments/course/{id}` | Admin/Teacher | Get enrolled students |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/admin/stats` | Admin | Platform-wide stats |
| `GET` | `/` | ❌ | Health check |

> Full interactive docs available at **`http://localhost:8000/docs`** (Swagger UI) when the server is running.

---

## 🔄 Grading Flow

```
Student submits file
        │
        ▼
FastAPI receives file → saves to disk → creates Submission record (status: "pending")
        │
        ▼
.delay() → Celery task dispatched to Redis queue
        │
   ┌────┴──────────────┬──────────────────┐
   ▼                   ▼                  ▼
 /submit            /submit/document   /submit/handwritten
 (Code)             (PDF / DOCX)       (Image / PDF)
   │                   │                  │
Docker sandbox      pdfplumber /       PIL preprocessing
runs student code   python-docx        (bicubic resize)
against test cases  extracts text          │
   │                   │              Gemini Vision
score = passed /    Gemini 2.5        OCR → text
total test cases    Flash grades          │
   │                   │              Groq LLM grades
Groq LLM               │              extracted text
generates              └──────────────────┘
feedback                              │
   └──────────────────────────────────┘
                        │
              standardized_score = (raw / total_marks) × 10
              saved to DB — status → "graded"
                        │
                        ▼
            Student polls GET /result/{id}
            Response includes score, feedback, test results
```

---

## 🗄️ Database Schema

```
users              courses            enrollments
──────────         ────────           ───────────
id (PK)            id (PK)            id (PK)
name               code               student_id → users.id
email (unique)     title              course_id  → courses.id
password (bcrypt)  description
role               assigned_teacher_id → users.id     weeks
department         credit_hours                        ─────
specialization     semester                            id (PK)
matric_number      capacity                            course_id → courses.id
created_at         created_at                          number
                                                       title
assignments        submissions        week_materials   start_date
───────────        ───────────        ──────────────   lessons (JSON)
id (UUID PK)       id (UUID PK)       id (PK)
title              student_id         week_id → weeks.id
description        assignment_id      type (file/video)
topic              problem_id         name
language           language           url
assignment_type    source_code        created_at
status             score
course_id          standardized_score
week_id            passed
due_date           total
file_path          test_results (JSON)
test_cases (JSON)  ai_feedback (JSON)
total_marks        submission_type
num_test_cases     file_path
sample_solution    submitted_at
created_at         status
```

---

## 👥 Team

| Name | Role | Contribution |
|------|------|-------------|
| **Haider** | Full-Stack Dev + Project Lead | Backend architecture, FastAPI routes, JWT auth, database design, email system, scheduler, frontend setup, React routing, deployment |
| **Zainab Baig** | Frontend + Document Module | Typed document grading pipeline (PDF/DOCX + Gemini), student-facing frontend pages, UI/UX |
| **Ali Haider** | Code Grading Module | Docker sandbox execution, test case matching, Groq LLM feedback, code pipeline integration |
| **Asad Ali Mir** | Handwritten Module | Image preprocessing, Gemini Vision OCR, Groq LLM grading, handwritten pipeline |

---

## 🎓 Project Info

| Field | Detail |
|-------|--------|
| Institution | University of Management and Technology (UMT), Lahore |
| Degree | BS Computer Science |
| Session | 2022 – 2026 |
| Semester | 8th (Final Year) |
| Project Type | Final Year Project (FYP) |

---

## 📄 License

This project was developed as an academic Final Year Project at UMT, Lahore. All rights reserved by the authors — 2026.

---

<div align="center">

 **Assess.io Team** — UMT CS Batch 2022–2026

</div>
