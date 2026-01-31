// ================== FIREBASE IMPORTS ==================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

// ================== SIDEBAR ==================
let sidebarOpen = false;

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const content = document.getElementById("content");

  sidebarOpen = !sidebarOpen;
  sidebar.classList.toggle("open", sidebarOpen);
  content.classList.toggle("shift", sidebarOpen);
}

// ================== SECTION SWITCH ==================
function showSection(section) {
  document.querySelectorAll(".view").forEach(v => v.style.display = "none");

  if (section === "alumni") document.getElementById("searchView").style.display = "block";
  if (section === "events") document.getElementById("eventsView").style.display = "block";
  if (section === "message") document.getElementById("messagesView").style.display = "block";
}

// Default section
showSection("alumni");

// ================== ALUMNI SEARCH ==================
const alumniGrid = document.getElementById("alumniGrid");
const searchInput = document.getElementById("alumniSearch");
let allUsers = [];

// ================== AUTH CHECK ==================
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "/login";
    return;
  }
  loadUsers();
});

// ================== LOAD USERS ==================
async function loadUsers() {
  alumniGrid.innerHTML = "<p>Loading alumnis or students...</p>";
  allUsers = [];

  try {
    const snapshot = await getDocs(collection(db, "users"));
    snapshot.forEach(doc => allUsers.push(doc.data()));
    renderUsers(allUsers);
  } catch (err) {
    console.error(err);
    alumniGrid.innerHTML = "<p>Error loading alumni</p>";
  }
}

// ================== RENDER USERS ==================
function renderUsers(users) {
  alumniGrid.innerHTML = "";

  if (users.length === 0) {
    alumniGrid.innerHTML = "<p>No users found</p>";
    return;
  }

  users.forEach(user => {
    const card = document.createElement("div");
    card.className = "card";

    const roleBadge = user.role === "alumni"
      ? `<span class="badge alumni">Alumni</span>`
      : `<span class="badge student">Student</span>`;

    let details = "";
if (user.role === "alumni") {
  details = `
    <p>${user.dept || "Dept N/A"} | Passout ${user.aluPass || "N/A"}</p>
    <p>${user.company || "Company N/A"} ${user.job ? "• " + user.job : ""}</p>
  `;
} else {
  details = `
    <p>${user.dept || "Dept N/A"} | Admission ${user.stuYear || "N/A"}</p>
  `;
}


    card.innerHTML = `
      ${roleBadge}
      <h3>${user.fullName || "No Name"}</h3>
      ${details}
      <button class="btn send-btn">Send Message</button>
    `;

    card.querySelector(".send-btn").addEventListener("click", () => {
      openMessage(user.fullName || "");
    });

    alumniGrid.appendChild(card);
  });
}


// ================== SEARCH FILTER ==================
searchInput.addEventListener("input", () => {
  const value = searchInput.value.toLowerCase();

  const filtered = allUsers.filter(user =>
    (user.fullName && user.fullName.toLowerCase().includes(value)) ||
    (user.company && user.company.toLowerCase().includes(value)) ||
    (user.aluDept && user.aluDept.toLowerCase().includes(value)) ||
    (user.stuDept && user.stuDept.toLowerCase().includes(value)) ||
    (user.aluPass && String(user.aluPass).includes(value)) ||
    (user.stuYear && String(user.stuYear).includes(value))
  );

  renderUsers(filtered);
});

// ================== MESSAGE AUTO FILL ==================
function openMessage(name) {
  showSection("message");
  document.getElementById("toName").value = name;
}

// ================== DOM EVENTS ==================
document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menuBtn");
  if (menuBtn) menuBtn.addEventListener("click", toggleSidebar);
});




// ================== EXPOSE ONLY REQUIRED FUNCTIONS ==================
window.showSection = showSection;
