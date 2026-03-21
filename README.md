<div align="center">

<br/>

# 🎓 SGDTP Online Alumni Portal

**Reconnect. Network. Grow.**

A full-stack alumni engagement platform built for the SGDTP community at  
**Pillai HOC College of Engineering and Technology**, Rasayani.

<br/>

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-online--alumni--portal.vercel.app-0070f3?style=for-the-badge)](https://online-alumni-portal.vercel.app/)
[![Made with Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Performance Optimizations](#-performance-optimizations)
- [Team](#-team)
- [License](#-license)

---

## 🌟 Overview

The **SGDTP Online Alumni Portal** is a modern, web-based platform designed to bridge the gap between alumni and their alma mater. It serves as a central hub where graduates can reconnect with peers, stay informed about campus events, celebrate achievements, and inspire current students — building a stronger, lasting community around the college.

> *"Your gateway to reconnect with SGDTP, network with fellow alumni, and stay updated with campus news and events."*

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | Secure login via Email/Password and Google Sign-In (Firebase Auth) |
| 👤 **Alumni Profiles** | Register and manage personal alumni profiles |
| 📅 **Events** | View upcoming alumni meets, campus events, and announcements |
| 🏠 **Home Feed** | Stay updated with the latest college news |
| 🖼️ **Media Uploads** | Upload profile pictures and media via Cloudinary |
| ⚡ **Fast Load Times** | Skeleton shimmer loaders and sessionStorage caching for instant UX |
| 📱 **Responsive UI** | Optimized for desktop and mobile browsers |

---

## 🛠️ Tech Stack

### Frontend
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)

### Backend & Services
![Firebase](https://img.shields.io/badge/Firebase_Auth-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![Firestore](https://img.shields.io/badge/Firestore-FF6D00?style=flat-square&logo=firebase&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=flat-square&logo=cloudinary&logoColor=white)

### Deployment
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following:

- A modern web browser
- A [Firebase](https://firebase.google.com/) project with **Firestore** and **Authentication** enabled
- A [Cloudinary](https://cloudinary.com/) account for media uploads
- *(Optional)* A static file server like `npx serve` for local development

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/online-alumni-portal.git
cd online-alumni-portal
```

---

### 2. Configure Firebase

Locate your Firebase config file and replace the placeholder values with your own Firebase project credentials:

```javascript
// firebaseConfig.js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

> 💡 Find these values in your Firebase Console → Project Settings → General → Your apps.

---

### 3. Configure Cloudinary

Update your Cloudinary **cloud name** and **upload preset** in the image upload script:

```javascript
const cloudName = "YOUR_CLOUD_NAME";
const uploadPreset = "YOUR_UPLOAD_PRESET";
```

---

### 4. Run Locally

Serve the project using any static file server:

```bash
# Using npx serve (recommended)
npx serve .

# Or using Python
python -m http.server 8000
```

Then open `http://localhost:3000` (or the port shown) in your browser.

---

### 5. Deploy to Vercel

1. Push your code to a GitHub repository.
2. Go to [vercel.com](https://vercel.com/) and import your repository.
3. Vercel will auto-detect the project and deploy it.
4. Every push to `main` triggers an automatic redeployment. ✅

---

## 📁 Project Structure

```
online-alumni-portal/
│
├── static/
│   └── images/                 # Static image assets
│       ├── alumni_Front_page.jpg
│       └── about_us.jpg
│
├── templates/
│   └── Events.html             # Events listing template
│
├── frontpage/                  # Landing / Home page
├── login/                      # Login page
├── register/                   # Registration page
├── about/                      # About us page
├── showevent/                  # Events page
│
├── firebaseConfig.js           # Firebase project configuration
└── README.md                   # Project documentation
```

---

## ⚡ Performance Optimizations

The portal is built with performance-first principles to ensure a fast, snappy experience:

- **Shimmer Skeleton Loaders** — Visual placeholders shown while Firestore data loads, eliminating blank-screen flicker.
- **`sessionStorage` Caching** — User profile data is cached in the browser session to avoid redundant Firestore reads on every page visit.
- **Parallel Firestore Reads** — Multiple data fetches run concurrently using `Promise.all()` instead of sequentially, cutting total load time significantly.
- **Non-blocking Writes** — Non-critical Firestore operations (e.g., activity logging) are fire-and-forget, keeping the UI immediately responsive.
- **Immediate Auth Redirects** — Page redirects after authentication happen instantly, with no artificial delays.

---

## 👥 Team

This project was developed as an academic capstone by:

| Name | GitHub |
|---|---|
| **Sarthak Bhoir** | [@sarthakbhoir](https://github.com/sarthakbhoir) |
| **Shravan Pandirkar** | [@shravanpandirkar](https://github.com/shravanpandirkar) |
| **Raj Patil** | [@rajpatil](https://github.com/rajpatil) |

> 📍 B.E. Computer Engineering — Pillai HOC College of Engineering and Technology, Rasayani, Maharashtra, India.

---

## 🙌 Acknowledgements

- [Firebase](https://firebase.google.com/) — Authentication & Firestore database
- [Cloudinary](https://cloudinary.com/) — Cloud-based media management
- [Vercel](https://vercel.com/) — Seamless hosting and CI/CD deployment

---

## 📄 License

This project was developed as an academic project at **Pillai HOC College of Engineering and Technology**.  
© 2025 Sarthak Bhoir, Shravan Pandirkar, Raj Patil. All rights reserved.

---

<div align="center">

Made with ❤️ by the SGDTP Alumni Portal Team

⭐ **If you found this project helpful, consider giving it a star!**

</div>
