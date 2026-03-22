// ================== FIREBASE IMPORTS ==================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  where,
  doc,
  deleteDoc,
  getDoc
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

// ================== EVENT DELETE PERMISSION ==================
const allowDelete = await canDeleteEvent();

async function canDeleteEvent() {
  const user = auth.currentUser;
  if (!user) return false;

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return false;

  const data = snap.data();
  const isTeacher = data.role === "teacher";
  const isCommitteeStudent =
    data.role === "student" &&
    data.committee &&
    data.committee.trim() !== "";

  return isTeacher || isCommitteeStudent;
}

// ================== CLOUDINARY CONFIG ==================
const DEFAULT_AVATAR = "https://res.cloudinary.com/dvyk0lfsb/image/upload/v1/default-avatar.png";

// ================== SIDEBAR ==================
let sidebarOpen = false;
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const content = document.getElementById("content");
  sidebarOpen = !sidebarOpen;
  sidebar.classList.toggle("open", sidebarOpen);
  content.classList.toggle("shift", sidebarOpen);
}

// ================== POPUP ==================
function showPopup(message, type = "success") {
  const popup = document.getElementById("popup");
  const popupMessage = document.getElementById("popupMessage");
  if (!popup || !popupMessage) return;

  popupMessage.innerText = message;
  popup.className = `popup ${type}`;
  popup.classList.remove("hidden");

  setTimeout(() => popup.classList.add("hidden"), 5000);
}

// ================== SECTION SWITCH ==================
function showSection(section) {
  document.querySelectorAll(".view").forEach(v => v.style.display = "none");
  if (section === "alumni")   document.getElementById("searchView").style.display  = "block";
  if (section === "events")   document.getElementById("eventsView").style.display  = "block";
  if (section === "message")  document.getElementById("messagesView").style.display = "block";
}
window.showSection = showSection;
showSection("alumni");

// ================== ALUMNI SEARCH ==================
const alumniGrid  = document.getElementById("alumniGrid");
const searchInput = document.getElementById("alumniSearch");
let allUsers = [];

// ================== SKELETON LOADER ==================
function showSkeletons(count = 6) {
  alumniGrid.innerHTML = "";
  for (let i = 0; i < count; i++) {
    alumniGrid.innerHTML += `
      <div class="card skeleton-card">
        <div class="card-top">
          <div class="card-left">
            <div class="skeleton skeleton-avatar"></div>
            <div class="info" style="flex:1">
              <div class="skeleton skeleton-text" style="width:140px;height:14px;margin-bottom:8px;"></div>
              <div class="skeleton skeleton-text" style="width:80px;height:12px;"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// ================== CACHE KEYS ==================
const SESSION_KEY = "cachedAlumniUsers";
let cachedUsers = null;

// ================== LOAD USERS ==================
async function loadUsers() {
  // 1. In-memory cache
  if (cachedUsers) {
    allUsers = cachedUsers;
    renderUsers(cachedUsers);
    return;
  }

  // 2. sessionStorage cache
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored) {
    try {
      cachedUsers = JSON.parse(stored);
      allUsers = cachedUsers;
      renderUsers(cachedUsers);
      return;
    } catch (_) {}
  }

  // 3. Fetch from Firestore
  showSkeletons(6);

  try {
    const q = query(
      collection(db, "users"),
      where("role", "in", ["alumni", "student", "teacher"])
    );

    const snapshot = await getDocs(q);
    cachedUsers = snapshot.docs.map(d => ({ uid: d.id, ...d.data() }));

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(cachedUsers));
    allUsers = cachedUsers;
    renderUsers(allUsers);

  } catch (error) {
    console.error(error);
    alumniGrid.innerHTML = "<p>Error loading users</p>";
  }
}

// ================== ROLE-BASED CHAT NAV ==================
/**
 * Injects the correct chat link into #chatNavLink based on the
 * logged-in user's role from Firestore.
 *
 *  student  → "🎓 Chat with Alumni"
 *  alumni   → "🗨️ Chat with Alumni & Students"
 *  teacher  → "🗨️ Alumni Chat"  (default / existing behaviour)
 */
function renderChatNavLink(role) {
  const chatNavLink = document.getElementById("chatNavLink");
  if (!chatNavLink) return;

  const chatUrl = "/alumnichat"; // adjust if your Flask route differs

  let label = "🗨️ Alumni Chat"; // default (teacher)

  if (role === "student") {
    label = "🎓 Chat with Alumni";
  } else if (role === "alumni") {
    label = "🗨️ Chat with Alumni & Students";
  }

  // Build an <a> that matches the existing .register-link style
  chatNavLink.innerHTML = `
    <a href="${chatUrl}" class="register-link">${label}</a>
  `;
}

// ================== AUTH + LOAD IN PARALLEL ==================
onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.href = "/login";
    return;
  }

  // Start user list immediately — don't block on profile check
  loadUsers();

  // Profile check + chat nav run in parallel
  try {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      showPopup("Please complete your profile", "error");
      return;
    }

    const data = snap.data();

    // ── Inject role-based chat nav link ──────────────────────
    renderChatNavLink(data.role);
    // ─────────────────────────────────────────────────────────

    // Profile completeness check
    let incomplete = !data.fullName || !data.phone || !data.role;
    if (data.role === "student") incomplete = incomplete || !data.stuYear;
    if (data.role === "alumni")  incomplete = incomplete || !data.aluPass;
    if (incomplete) showPopup("Edit your profile first!", "error");

  } catch (err) {
    console.error(err);
    showPopup("Error checking profile", "error");
  }
});

// ================== RENDER USERS ==================
function renderUsers(users) {
  alumniGrid.innerHTML = "";

  if (!users.length) {
    alumniGrid.innerHTML = "<p>No users found</p>";
    return;
  }

  users.forEach(user => {
    const card = document.createElement("div");
    card.className = "card";

    const roleBadge =
      user.role === "alumni"
        ? `<span class="badge alumni">Alumni</span>`
        : user.role === "teacher"
        ? `<span class="badge teacher">Teacher</span>`
        : `<span class="badge student">Student</span>`;

    const details =
      user.role === "alumni"
        ? `
          <p><b>Department:</b> ${user.dept || "N/A"}</p>
          <p><b>Passout:</b> ${user.aluPass || "N/A"}</p>
          <p><b>Company:</b> ${user.company || "N/A"}</p>
          <p><b>Job:</b> ${user.job || "N/A"}</p>
          <p><b>City:</b> ${user.city || "N/A"}</p>
        `
        : user.role === "teacher"
        ? `
          <p><b>Department:</b> ${user.dept || "N/A"}</p>
          <p><b>Designation:</b> ${user.designation || "N/A"}</p>
          <p><b>Email:</b> ${user.email || "N/A"}</p>
        `
        : `
          <p><b>Department:</b> ${user.dept || "N/A"}</p>
          <p><b>Admission Year:</b> ${user.stuYear || "N/A"}</p>
          <p><b>Committee:</b> ${user.committee || "N/A"}</p>
        `;

    const profilePhoto = user.profilePic || DEFAULT_AVATAR;

    card.innerHTML = `
      <div class="card-top">
        <div class="card-left">
          <img src="${profilePhoto}" class="profile-pic" alt="👤" loading="lazy">
          <div class="info">
            <h3>${user.fullName || "No Name"}</h3>
            ${roleBadge}
          </div>
        </div>
        <div class="card-right">
          <button class="btn toggle-btn">
            View Details <span class="arrow">▼</span>
          </button>
        </div>
      </div>
      <div class="details hidden">
        ${details}
      </div>
    `;

    card.querySelector(".toggle-btn").addEventListener("click", () => {
      card.querySelector(".details").classList.toggle("hidden");
      card.querySelector(".arrow").classList.toggle("rotate");
    });

    alumniGrid.appendChild(card);
  });
}

// ================== SEARCH FILTER ==================
searchInput.addEventListener("input", () => {
  const value = searchInput.value.toLowerCase();
  const filtered = allUsers.filter(user =>
    Object.values(user).some(v => String(v).toLowerCase().includes(value))
  );
  renderUsers(filtered);
});

// ================== DOM EVENTS ==================
document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menuBtn");
  if (menuBtn) menuBtn.addEventListener("click", toggleSidebar);

  const toggleBtn  = document.getElementById("toggleCreateEvent");
  const box        = document.getElementById("createEventBox");
  const cancelBtn  = document.getElementById("cancelEventBtn");

  if (toggleBtn && box) {
    toggleBtn.addEventListener("click", () => box.classList.toggle("hidden"));
    cancelBtn.addEventListener("click", () => box.classList.add("hidden"));
  }
});

// ================== EVENTS LISTENER ==================
const eventsRef  = collection(db, "events");
const eventsList = document.getElementById("eventsList");

onSnapshot(eventsRef, async snapshot => {
  eventsList.innerHTML = "";

  if (snapshot.empty) {
    eventsList.innerHTML = "<p>No events available</p>";
    return;
  }

  snapshot.forEach(eventDoc => {
    const event = eventDoc.data();

    const div = document.createElement("div");
    div.className = "event-item";

    div.innerHTML = `
      <strong>${event.name}</strong>
      <p>📅 Date: ${event.date}</p>
      ${event.description ? `<p class="event-desc">📝 Description: ${event.description}</p>` : ""}
    `;

    eventsList.appendChild(div);
  });
});

// ================== SEND MESSAGE ROLE CHECK ==================
async function handleSendMessage() {
  const user = auth.currentUser;

  if (!user) {
    showPopup("Please login first", "error");
    return;
  }

  try {
    const userRef = doc(db, "users", user.uid);
    const snap    = await getDoc(userRef);

    if (!snap.exists()) {
      showPopup("User profile not found", "error");
      return;
    }

    const userData = snap.data();

    if (userData.role === "teacher") {
      window.location.href = "/chat";
    } else {
      showPopup("Only teachers can send messages", "error");
    }
  } catch (err) {
    console.error(err);
    showPopup("Permission check failed", "error");
  }
}

window.handleSendMessage = handleSendMessage;