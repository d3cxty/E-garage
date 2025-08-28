# 📘 E-Garage Documentation

## Overview

E-Garage is a full-stack Garage Management System.  
It provides:

- **Client Portal**:  
  - Post repair jobs  
  - View job status & payment state  
  - Chat with staff in real time  

- **Staff/Admin Dashboard**:  
  - Manage jobs (status, payments, proforma invoices, photos)  
  - Send notification emails  
  - Team global chat  
  - Manage garage account info (logo, contact, etc.)  

---

## 🚀 Tech Stack

**Backend (Node.js/Express/MongoDB):**
- Express.js REST API
- MongoDB + Mongoose
- JWT authentication
- Multer for uploads (images, PDFs)
- Cloudinary for cloud file storage
- Nodemailer (Gmail App Password) for outbound emails
- Socket.IO for real-time chat
- PDFKit for job summary exports

**Frontend (Next.js 14 + Tailwind):**
- App Router (app directory)
- Role-based layouts:  
  - Public (landing)  
  - Client portal  
  - Staff/Admin dashboard
- TailwindCSS + custom components
- Axios for API calls
- Socket.IO client for chat
- react-hot-toast for notifications
- Lucide icons for UI

---

## 👥 User Roles

- **Client**:  
  - Sign up / login  
  - Submit jobs with photos + proforma  
  - View their own jobs only  
  - Chat with staff on job pages  

- **Staff**:  
  - Login only (created by admin or seeded)  
  - Manage all jobs (update status, payment, etc.)  
  - Chat with clients & team (global chat)  
  - Send notification emails  

- **Admin**:  
  - All staff privileges  
  - Manage garage profile (logo, contact info, email)  
  - Create staff accounts  

---

## 🌐 App Flow

### Public Landing (`/`)
- Hero + About + Services + Contact
- Navbar with Login / Signup

### Client Journey
1. **Signup** → Role defaults to `client`
2. Redirect to `/client`
3. Can see:
   - `Fix My Car` → create job
   - `My Jobs` → list own jobs
   - Job detail page with chat + PDF export
4. Chat room per job: `client:{jobId}`

### Staff/Admin Journey
1. **Login** with staff/admin credentials
2. Redirect to `/dashboard`
3. Sidebar navigation:
   - Dashboard → recent jobs
   - Jobs → all jobs with filters
   - Job detail → update status/payment + chat with client
   - Emails → send / list sent emails
   - Global chat (room = `global`)
   - Account → update garage profile (logo, email, phone, address)

---

# 📡 API Reference

Base URL: `http://localhost:5000`  
Auth: Bearer JWT in `Authorization` header

---

## Authentication

### Register a User
`POST /auth/register`

```json
{
  "email": "user@example.com",
  "password": "secret123",
  "role": "client"   // optional, defaults to client. Can be "admin", "staff", "client"
}
```

### Login
`POST /auth/login`

```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

Response:
```json
{
  "token": "jwt.token.here",
  "role": "client",
  "verified": true
}
```

---

## Clients / Jobs

### Create Job
`POST /clients` (auth: client)

- Body: `multipart/form-data`
  - `names`
  - `carType`
  - `carMake`
  - `plateNumber`
  - `issues`
  - `photos[]` (images)
  - `proforma` (pdf/image)

### List Jobs
- Client: `GET /clients?mine=true`
- Staff/Admin: `GET /clients`

### Get Job Detail
`GET /clients/:id`

### Update Job
`PUT /clients/:id`

### Update Status/Payment
`PATCH /clients/:id/status`

```json
{ "status": "repairing", "payment": "paid" }
```

### Delete Job
`DELETE /clients/:id`

### Export PDF
`GET /clients/:id/pdf`

---

## Chat

### Real-time (Socket.IO)
- Connect: `io("http://localhost:5000")`
- Events:
  - `chat:message` → broadcast `{ room, text, user, at }`

### History
`GET /chat/:room/messages?limit=50`

Rooms:
- `global`
- `client:{jobId}`

---

## Emails

### List Emails
`GET /emails` (auth: staff/admin)

### Send Email
`POST /emails/send`

```json
{
  "to": "client@example.com",
  "subject": "Your car is ready",
  "body": "Hello, your vehicle has been repaired."
}
```

---

## Account / Branding

### Get Account
`GET /account`

### Update Account
`PUT /account` (auth: admin)

- Body: `multipart/form-data`
  - `name`
  - `email`
  - `phone`
  - `address`
  - `logo` (image)

---

## Health

`GET /health`

Response:
```json
{ "ok": true }
```

---

## 📁 Project Structure

### Backend
```
backend/
 ├── config/
 ├── controllers/
 ├── middleware/
 ├── models/
 ├── routes/
 ├── services/
 ├── utils/
 ├── server.js
 └── .env
```

### Frontend
```
frontend/
 ├── app/
 ├── components/
 ├── lib/
 └── .env.local
```

---

## ⚙️ Setup & Run

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in Mongo, Gmail, Cloudinary
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:5000
npm run dev
```

---

## 🔐 Environment Variables

### Backend `.env`
```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=dev_secret

GMAIL_USER=youremail@gmail.com
GMAIL_APP_PASS=xxxx xxxx xxxx xxxx
FROM_EMAIL=youremail@gmail.com

CORS_ORIGIN=http://localhost:3001

STORAGE_DRIVER=cloudinary
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## ✅ Feature Roadmap

- [x] Client job submission with uploads  
- [x] Job management for staff/admin  
- [x] Real-time chat (Socket.IO)  
- [x] Outbound email via Gmail  
- [x] PDF export of jobs  
- [x] Account/branding update  
- [ ] Role management UI (admin creating staff)  
- [ ] Email templates (HTML, logo)  
- [ ] Reports (job stats, revenue)  
