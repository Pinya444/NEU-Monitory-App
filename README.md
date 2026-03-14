# NEU MOA Monitoring System

A web-based Memorandum of Agreement (MOA) monitoring system for New Era University (NEU). This system tracks the approval status of MOAs entered by the university, with role-based access for students, faculty, and administrators.

## 🌐 Live Demo

**[https://neu-monitory-app.vercel.app](https://neu-monitory-app.vercel.app)**

---

## 👥 User Roles

| Role | Access |
|------|--------|
| **Admin** | Full access — manages users, MOAs, audit trails, deleted records |
| **Faculty** | Views all active MOAs — can add/edit if granted permission by admin |
| **Student** | Views approved MOAs only (company, address, contact info) |

---

## ✨ Features

### Dashboard
- Statistics cards showing Active, Processing, Expiring, and Expired MOAs
- MOA count breakdown by college
- Filterable by college and date range

### MOA Management
- Add, edit, and soft-delete MOA entries
- Recover deleted MOAs (admin only)
- Full audit trail per MOA (who added, edited, or deleted and when)
- General search bar (company, college, industry, contact, address, status)
- Filter by college, industry, status, and date range

### MOA Status Types
| Status | Description |
|--------|-------------|
| ✅ APPROVED: Signed by President | Fully approved and signed |
| ✅ APPROVED: On-going notarization | Approved, notarization in progress |
| ✅ APPROVED: No notarization needed | Approved, no notarization required |
| 🔄 PROCESSING: Awaiting HTE signature | Waiting for HTE partner to sign |
| 🔄 PROCESSING: Sent to Legal Office | MOA draft under legal review |
| 🔄 PROCESSING: Sent to VPAA/OP | Awaiting VPAA/OP approval |
| ❌ EXPIRED | MOA expired with no renewal |
| ⚠️ EXPIRING | Expiring within 2 months |

### User Management (Admin Only)
- View all registered users
- Assign roles (Admin, Faculty, Student)
- Grant/revoke faculty MOA maintenance permissions
- Block/unblock users from the system

### Access Control
- Students only see APPROVED MOAs
- Faculty sees all active MOAs (except audit trails)
- Admin sees all records including deleted rows and audit trails
- No hard deletes — all deletions are soft deletes recoverable by admin

---

## 🛠️ Tech Stack

- **Frontend:** React + Vite
- **Authentication:** Firebase Auth (Google Sign-In)
- **Database:** Firebase Firestore
- **Hosting:** Vercel
- **Version Control:** GitHub

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- A Firebase project with Firestore and Google Auth enabled
- A Google account with an NEU institutional email

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Pinya444/NEU-Monitory-App.git
cd NEU-Monitory-App/NEU-Monitory-App
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the project root:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. Start the development server:
```bash
npm run dev
```

---

## 🔐 Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Google Sign-In** under Authentication → Sign-in method
3. Create a **Firestore Database** (region: asia-southeast1)
4. Add your domain to **Authentication → Settings → Authorized domains**
5. Set Firestore rules to restrict access by role

---

## 📁 Project Structure
```
src/
├── firebase/
│   ├── config.js      # Firebase initialization
│   └── seed.js        # Sample data seeder
└── App.jsx            # Main application component
```

---

## 👨‍💻 Developer

**Angelo Joseph P. Cruz**
New Era University — College of Computer Studies (CCS)

---

## 📄 License

This project is developed for academic and institutional use at New Era University.
