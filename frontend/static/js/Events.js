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

// ================== INITIALIZE FIREBASE ==================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ================== DOM ELEMENTS ==================
const eventsList = document.getElementById("eventsList");
const loader = document.getElementById("loader");

// ================== FIRESTORE COLLECTION ==================
const eventsRef = collection(db, "events");

// ================== REALTIME EVENTS LIST ==================
const eventsQuery = query(eventsRef, orderBy("date", "asc"));

// ✅ SHOW LOADER BEFORE FETCH
loader.classList.remove("hidden");
eventsList.innerHTML = "";

onSnapshot(
  eventsQuery,
  snapshot => {
    // ✅ HIDE LOADER ON DATA LOAD
    loader.classList.add("hidden");
    eventsList.innerHTML = "";

    if (snapshot.empty) {
      eventsList.innerHTML = "<p>No events available</p>";
      return;
    }

    snapshot.forEach(docSnap => {
      const event = docSnap.data();
      const user = auth.currentUser;

      const isInvited =
        event.invitedAlumni &&
        user &&
        event.invitedAlumni.includes(user.uid);

      const eventCard = document.createElement("div");
      eventCard.className = "event-item";

      eventCard.innerHTML = `
        <h3>${event.name}</h3>
        <hr />
        <p>📅 Date: ${event.date}</p>
        <p>👤 Created By: ${event.createdBy}</p>
        ${
          isInvited
            ? `<p class="alumni-msg">🎓 You are invited to this event</p>`
            : ""
        }
      `;

      eventsList.appendChild(eventCard);
    });
  },
  error => {
    // ❌ ERROR HANDLING
    loader.classList.add("hidden");
    eventsList.innerHTML = "<p>Error loading events</p>";
    console.error("Firestore error:", error);
  }
);