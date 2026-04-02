// ============================================================
//  SGDTP ALUMNI PORTAL — EVENTS PAGE JS (FIXED VERSION)
// ============================================================

// ================== FIREBASE IMPORTS ==================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ================== FIREBASE CONFIG ==================
const firebaseConfig = {
  apiKey: "AIzaSyBEqicHjsRkaUnOpMza90tMzVTQcVo1CoM",
  authDomain: "alumni-portal-53425.firebaseapp.com",
  projectId: "alumni-portal-53425",
  storageBucket: "alumni-portal-53425.firebasestorage.app",
  messagingSenderId: "947099064778",
  appId: "1:947099064778:web:7eb45b444d5cc6cd651733",
  measurementId: "G-1X15S9CD6V"
};

// ================== INITIALIZE ==================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ================== THEME TOGGLE ==================
const THEME_KEY = "sgdtp_theme";

function applyTheme(theme) {
  const icon = document.getElementById("themeIcon");
  if (theme === "light") {
    document.body.classList.add("light");
    if (icon) icon.textContent = "🌙";
  } else {
    document.body.classList.remove("light");
    if (icon) icon.textContent = "☀️";
  }
}

function toggleTheme() {
  const next = document.body.classList.contains("light") ? "dark" : "light";
  applyTheme(next);
  localStorage.setItem(THEME_KEY, next);
}

applyTheme(localStorage.getItem(THEME_KEY) || "dark");

// ================== DOM ELEMENTS ==================
const eventsList = document.getElementById("eventsList");
const loader = document.getElementById("loader");

// ================== FIRESTORE LISTENER ==================
const eventsRef = collection(db, "events");
const eventsQuery = query(eventsRef, orderBy("date", "asc"));

loader.classList.remove("hidden");
eventsList.innerHTML = "";

onSnapshot(
  eventsQuery,
  snapshot => {
    loader.classList.add("hidden");
    eventsList.innerHTML = "";

    if (snapshot.empty) {
      eventsList.innerHTML = `
        <div class="event-item visible" style="text-align:center; padding: 40px;">
          <p style="font-size:16px; color: var(--text-muted);">No upcoming events at the moment 📭</p>
        </div>
      `;
      return;
    }

    snapshot.forEach(docSnap => {
      const event = docSnap.data();

      const eventCard = document.createElement("div");
      eventCard.className = "event-item";

      eventCard.innerHTML = `
        <h3>${event.name}</h3>
        <hr />
        <p>📅 <strong>Date:</strong> ${event.date}</p>
        ${event.description
          ? `<p class="event-desc">📝 <strong>Description:</strong> ${event.description}</p>`
          : ""}
      `;

      eventsList.appendChild(eventCard);

      // 🔥 FIX: EVENT VISIBLE (your CSS needs this)
      requestAnimationFrame(() => eventCard.classList.add("visible"));
    });
  },
  error => {
    loader.classList.add("hidden");
    eventsList.innerHTML = `
      <div class="event-item" style="text-align:center; padding: 40px;">
        <p style="color:#ff8080;">⚠️ Error loading events. Please try again.</p>
      </div>
    `;
    console.error("Firestore error:", error);
  }
);

// ================== DOM READY ==================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("themeToggle")
    ?.addEventListener("click", toggleTheme);

  // Fade-in animation for header
  const eventsHeader = document.querySelector(".events-header");
  if (eventsHeader) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => eventsHeader.classList.add("visible"));
    });
  }
});