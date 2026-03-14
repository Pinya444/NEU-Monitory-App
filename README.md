# 📖 NEU Library – Visitor Management System

A web-based visitor management system for the **New Era University Library**, built with Next.js and Firebase. Library visitors can check in digitally, and admins can monitor visits, manage users, and block/unblock access — all in real time.

**Live Demo:** [neu-library-demo-project.vercel.app](https://neu-library-demo-project.vercel.app)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 Google Sign-In | NEU institutional accounts only (`@neu.edu.ph`) |
| 🏫 Onboarding | First-time users select their college or office |
| ✅ Check-In | Choose a visit purpose and log entry instantly |
| 🎉 Welcome Screen | Confirmation page with countdown auto-redirect |
| 📊 Admin Dashboard | Real-time stats, charts, visit trends |
| 🔍 User Lookup | Search visitors by email, view history |
| ⊘ Block System | Admins can block/unblock users with reasons |
| 🛡️ Access Denied | Blocked users see a clear denial screen |

---

## 🛠 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Auth & Database:** Firebase (Authentication + Firestore)
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Deployment:** Vercel

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Pinya444/NEU-Library-DEMO-Project.git
cd NEU-Library-DEMO-Project
npm install
```

### 2. Set up Firebase
1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a project
2. Enable **Authentication → Google Sign-In**
3. Create a **Firestore Database** (production mode, `asia-southeast1`)
4. Register a **Web App** and copy the config keys

### 3. Configure environment variables
```bash
cp .env.local.example .env.local
```
Fill in your Firebase keys in `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### 4. Deploy Firestore rules
```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules,firestore:indexes
```

### 5. Run the app
```bash
npm run dev
```

---

## 👤 Setting Your First Admin

1. Sign in to the app with your NEU Google account
2. Go to **Firebase Console → Firestore → users collection**
3. Find your document (by UID)
4. Change `role: "user"` → `role: "admin"`
5. Sign out and sign back in — you'll be redirected to the admin dashboard

---

## 📁 Project Structure

```
src/
├── app/
│   ├── login/          # Sign-in page
│   ├── onboarding/     # College/office setup
│   ├── checkin/        # Visit logging
│   ├── welcome/        # Post check-in confirmation
│   └── dashboard/
│       └── admin/      # Admin dashboard
├── components/
│   ├── admin/          # Charts, modals, search panel
│   └── ui/             # Shared UI components
├── hooks/              # useAuth, useVisitLog, useAdminDashboard, useBlockAction
├── lib/                # Firebase, userService, visitLogService, adminService, blockService
└── types/              # TypeScript interfaces
```

---

## 🔒 Security Model

- Firestore rules enforce role-based access — admins and users have separate read/write permissions
- Client-side `AuthGuard` redirects unauthorized users
- Block status is checked on every check-in attempt
- Only `@neu.edu.ph` Google accounts can sign in

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request against `main`

---

## 📄 License

This project was built for academic purposes at **New Era University**.
