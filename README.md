# CreatorOS

**AI-Powered Content Management & Automation Platform for Short-Form Video Creators**

CreatorOS is a full-stack platform for managing and automating the short-form content lifecycle — from content ideas and AI-generated scripts to browser-driven video generation, approval, scheduling, storage, and publishing.

🌐 **Live Application:** [creator-os-hq.vercel.app](https://creator-os-hq.vercel.app/)
💻 **Repository:** [github.com/AkhileshP19/creator-os](https://github.com/AkhileshP19/creator-os)

---

## Overview

Creating short-form content often requires switching between multiple AI tools, storage systems, spreadsheets, and publishing platforms.

CreatorOS brings these workflows together into a single application where creators can:

- Manage projects and content ideas
- Configure project-level content settings
- Generate structured video scripts using Google Gemini
- Trigger browser-driven video generation through Google Flow
- Store generated media in Backblaze B2
- Review and approve generated content
- Schedule and publish approved videos to YouTube
- Monitor workflows, approvals, publishing, and content activity from a centralized dashboard

---

## Content Workflow

```text
Content Idea
     ↓
AI Script Generation
     ↓
Google Gemini
     ↓
CreatorOS Backend
     ↓
Browser Worker
     ↓
Playwright + Google Flow
     ↓
Generated Video
     ↓
Backblaze B2
     ↓
Review & Approval
     ↓
Scheduling
     ↓
YouTube Publishing
```

The application database stores workflow state and content metadata, while generated media is stored in **Backblaze B2 object storage**.

---

## Key Features

### Content Management

- Project creation and management
- Content idea CRUD and scheduling
- Search and pagination
- Project-specific video settings
- Content workflow tracking

### AI & Video Generation

- Structured script generation using Google Gemini
- Persistent AI workflow and request tracking
- Workflow status and failure handling
- Browser-driven Google Flow automation
- Playwright-based browser worker
- Generated media upload to Backblaze B2

### Approval & Publishing

- Generated-content review workflow
- Approve and reject lifecycle
- Publishing workflow for approved content
- YouTube account integration
- Scheduled YouTube publishing

### Dashboard

- Content and workflow overview
- Approval status
- Publishing activity
- Recent activity
- Operational metrics

### Authentication & Security

- Clerk authentication
- Authenticated frontend-to-backend API communication
- Application-level user resolution
- Resource ownership
- Protected backend routes
- Secured external-service credentials

---

## Tech Stack

| Layer                  | Technologies                               |
| ---------------------- | ------------------------------------------ |
| **Frontend**           | Next.js 16, React 19, TypeScript           |
| **UI**                 | Tailwind CSS, shadcn/ui, Radix UI, Lucide  |
| **Forms & Validation** | React Hook Form, Zod                       |
| **Data Fetching**      | TanStack Query, Axios                      |
| **Backend**            | Node.js, Express 5, TypeScript             |
| **Browser Worker**     | Node.js, Express 5, TypeScript, Playwright |
| **Authentication**     | Clerk                                      |
| **Database**           | PostgreSQL, Neon                           |
| **ORM**                | Prisma                                     |
| **AI**                 | Google Gemini                              |
| **Video Generation**   | Google Flow                                |
| **Object Storage**     | Backblaze B2                               |
| **Publishing**         | YouTube API                                |
| **Deployment**         | Vercel, Microsoft Azure                    |
| **CI**                 | GitHub Actions                             |

---

## Architecture

```text
┌───────────────────────────────┐
│         Next.js Client        │
│   React · Clerk · TanStack    │
└───────────────┬───────────────┘
                │
                │ REST API
                ▼
┌───────────────────────────────┐
│      Express API Server       │
│   TypeScript · Zod · Clerk    │
└───────┬──────────┬────────────┘
        │          │
        │          ├──────────────► Google Gemini
        │          │
        ▼          ▼
┌─────────────┐  ┌──────────────────────────┐
│ PostgreSQL  │  │      Browser Worker      │
│   (Neon)    │  │ Express · TS · Playwright│
│             │  └────────────┬─────────────┘
│   Prisma    │               │
└─────────────┘               ▼
                         Google Flow
                              │
                              ▼
                       Generated Video
                              │
                              ▼
                       Backblaze B2
                              │
                              ▼
                     Approval Workflow
                              │
                              ▼
                         YouTube API
```

CreatorOS uses three independently runnable application layers:

1. **Next.js frontend** — user interface and dashboard
2. **Express backend** — APIs, business logic, database access, AI workflows, approvals, and publishing
3. **Browser worker** — isolated browser automation for Google Flow video generation and generated-media handling

---

## Project Structure

```text
creator-os/
├── src/                         # Next.js frontend
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── schema/
│   └── types/
│
├── backend/                     # Express API server
│   └── src/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       ├── prisma/
│       ├── app.ts
│       └── server.ts
│
├── browser-worker/              # Browser automation service
│   └── src/
│       ├── browser-service.ts
│       ├── flow-service.ts
│       ├── b2-storage-service.ts
│       ├── server.ts
│       └── types.ts
│
├── public/
├── .github/                     # GitHub Actions workflows
├── package.json
└── README.md
```

---

## Running Locally

### Prerequisites

- Node.js
- npm
- PostgreSQL / Neon database
- Clerk application
- Google Gemini API access
- Backblaze B2 bucket
- Google / YouTube OAuth credentials
- Chromium dependencies required by Playwright

### 1. Clone the repository

```bash
git clone https://github.com/AkhileshP19/creator-os.git
cd creator-os
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd backend
npm install
cd ..
```

### 4. Install browser-worker dependencies

```bash
cd browser-worker
npm install
npx playwright install chromium
cd ..
```

### 5. Configure environment variables

Create local environment files from the provided examples:

```text
.env.example
backend/.env.example
browser-worker/.env.example
```

Use the templates to configure the credentials and service URLs required for your environment.

> Never commit API keys, authentication secrets, database credentials, OAuth credentials, or storage credentials to Git.

### 6. Start the backend

```bash
cd backend
npm run dev
```

### 7. Start the browser worker

In another terminal:

```bash
cd browser-worker
npm run dev
```

### 8. Start the frontend

From the project root:

```bash
npm run dev
```

The frontend runs locally at:

```text
http://localhost:3000
```

---

## Build & Validation

### Frontend

```bash
npm run check
npm run build
```

### Backend

```bash
cd backend
npm run build
npm test
```

### Browser Worker

```bash
cd browser-worker
npm run typecheck
npm run build
```

---

## Deployment

CreatorOS uses separate deployment targets for its application layers and infrastructure:

- **Frontend:** Vercel
- **Backend:** Microsoft Azure VM
- **Browser Worker:** Microsoft Azure VM
- **Database:** Neon PostgreSQL
- **Media Storage:** Backblaze B2
- **CI:** GitHub Actions

Production secrets and environment configuration are managed separately from the source code.

---

## Engineering Highlights

- Full-stack TypeScript architecture
- Independently deployable frontend, backend, and browser-worker services
- Authentication and protected resource access
- Structured AI script-generation pipeline
- Persistent AI workflow execution and status tracking
- Playwright-powered browser automation
- External AI, storage, OAuth, and publishing integrations
- Approval and publishing workflows
- Object-storage integration for generated media
- Automated backend workflow tests
- GitHub Actions CI validation
- Production deployment across Vercel and Microsoft Azure

---

## Status

**CreatorOS MVP is complete.**

The MVP includes project and content management, project settings, AI script generation, browser-driven video generation, Backblaze B2 media storage, approval workflows, YouTube publishing, dashboard functionality, authentication, database integration, CI validation, and production deployment.

---

## Author

**Akhilesh Patil**

Software Engineer focused on **React, Next.js, TypeScript, full-stack development, and AI-integrated applications**.

[LinkedIn](https://www.linkedin.com/in/akhileshp19/) · [GitHub](https://github.com/AkhileshP19)
