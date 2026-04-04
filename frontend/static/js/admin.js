// ============================================================
//  SGDTP ALUMNI PORTAL — ADMIN JS
//  Theme toggle uses same localStorage key as all other pages
// ============================================================

// ── THEME TOGGLE ──────────────────────────────────────────
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

// Apply saved theme on load — runs after DOM since script is at end of body
applyTheme(localStorage.getItem(THEME_KEY) || "dark");

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("themeToggle")
    ?.addEventListener("click", toggleTheme);
});

/**************** FIREBASE IMPORTS ****************/
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

/**************** FIREBASE CONFIG ****************/
const firebaseConfig = {
  apiKey: "AIzaSyBEqicHjsRkaUnOpMza90tMzVTQcVo1CoM",
  authDomain: "alumni-portal-53425.firebaseapp.com",
  projectId: "alumni-portal-53425",
  storageBucket: "alumni-portal-53425.firebasestorage.app",
  messagingSenderId: "947099064778",
  appId: "1:947099064778:web:7eb45b444d5cc6cd651733"
};

/**************** INIT ****************/
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const eventsRef = collection(db, "events");

/**************** POPUP ****************/
function showPopup(message, type = "success", duration = 3000) {
  const popupContainer = document.getElementById("popupContainer");

  const popup = document.createElement("div");
  popup.classList.add("popup-message");
  if (type === "error") popup.classList.add("error");
  popup.textContent = message;

  popupContainer.appendChild(popup);

  setTimeout(() => popup.classList.add("show"), 10);

  setTimeout(() => {
    popup.classList.remove("show");
    setTimeout(() => popup.remove(), 500);
  }, duration);
}

/**************** DATA STORE ****************/
const dataStore = {
  students: [],
  alumni: [],
  teachers: []
};

/**************** COLUMN CONFIG ****************/
const TABLE_FIELDS = {
  students: ["fullName", "phone", "email", "dept", "stuYear", "lastLogin"],
  alumni:   ["fullName", "phone", "email", "dept", "aluPass", "job", "designation", "experience", "city", "lastLogin"],
  teachers: ["fullName", "phone", "email", "dept", "experience", "lastLogin"]
};

let started = false;

/**************** LOGIN ****************/
const ADMIN_PASSWORD = "admin@123";

window.adminLogin = async () => {
  const pwd = document.getElementById("adminPassword").value;

  if (pwd !== ADMIN_PASSWORD) {
    showPopup("Wrong Password ❌", "error");
    return;
  }

  await signInAnonymously(auth);

  showPopup("Login Successful ✅", "success");
  document.querySelector(".dashboard").classList.remove("hidden");

  if (!started) {
    startAdmin();
    started = true;
  }
};

/**************** NAV ****************/
window.showSection = id => {
  document.querySelectorAll(".section").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
};

/**************** START ADMIN ****************/
function startAdmin() {
  loadAllData();
}

/**************** LOAD ALL DATA IN PARALLEL ****************/
async function loadAllData() {
  showPopup("Loading data...", "success", 1500);

  await Promise.all([
    loadUsersByRole("student",  "studentsTable", "students"),
    loadUsersByRole("alumni",   "alumniTable",   "alumni"),
    loadUsersByRole("teacher",  "teachersTable", "teachers"),
    loadEvents()
  ]);

  showPopup("Data loaded ✅", "success");
}

window.refreshData = loadAllData;

/**************** LOAD USERS ****************/
async function loadUsersByRole(role, tableId, storeKey) {
  const table  = document.getElementById(tableId);
  const fields = TABLE_FIELDS[storeKey];

  table.innerHTML = `
    <tr>
      <th>Select</th>
      ${fields.map(f => `<th>${f}</th>`).join("")}
    </tr>
    <tr>
      <td colspan="${fields.length + 1}" style="text-align:center; padding:12px; color:#888;">
        ⏳ Loading ${storeKey}...
      </td>
    </tr>
  `;

  try {
    const q    = query(collection(db, "users"), where("role", "==", role));
    const snap = await getDocs(q);

    table.innerHTML = "";
    dataStore[storeKey] = [];

    const header = table.insertRow();
    header.innerHTML = `<th>Select</th>` + fields.map(f => `<th>${f}</th>`).join("");

    if (snap.empty) {
      const emptyRow = table.insertRow();
      emptyRow.innerHTML = `
        <td colspan="${fields.length + 1}" style="text-align:center; padding:12px; color:#aaa;">
          No ${storeKey} found.
        </td>
      `;
      return;
    }

    snap.forEach(d => {
      const data = d.data();
      data.id = d.id;
      dataStore[storeKey].push(data);

      const row = table.insertRow();
      row.innerHTML =
        `<td><input type="checkbox" data-id="${d.id}"></td>` +
        fields.map(f => {
          let val = data[f] ?? "";
          if (val?.toDate) val = val.toDate().toLocaleString();
          return `<td>${val}</td>`;
        }).join("");
    });

  } catch (err) {
    console.error(`Error loading ${storeKey}:`, err);
    table.innerHTML = `
      <tr>
        <td colspan="${fields.length + 1}" style="text-align:center; color:red; padding:12px;">
          ❌ Failed to load ${storeKey}. Try refreshing.
        </td>
      </tr>
    `;
  }
}

/**************** DELETE USERS ****************/
window.deleteSelected = async type => {
  const checks = document.querySelectorAll(`#${type} input:checked`);
  if (!checks.length) return showPopup("No records selected", "error");

  try {
    await Promise.all(
      [...checks].map(c => deleteDoc(doc(db, "users", c.dataset.id)))
    );

    showPopup("Deleted successfully 🗑️", "success");

    const storeKey = type === "studentsTable" ? "students"
                   : type === "alumniTable"   ? "alumni"
                   : "teachers";
    const roleMap  = { students: "student", alumni: "alumni", teachers: "teacher" };
    await loadUsersByRole(roleMap[storeKey], type, storeKey);

  } catch (err) {
    console.error("Delete error:", err);
    showPopup("Delete failed ❌", "error");
  }
};

/**************** EVENTS ****************/
async function loadEvents() {
  const table = document.getElementById("eventsTable");

  table.innerHTML = `
    <tr>
      <th>Name</th><th>Date</th><th>Description</th>
      <th>Created By</th><th>Created At</th><th>Action</th>
    </tr>
    <tr>
      <td colspan="6" style="text-align:center; padding:12px; color:#888;">
        ⏳ Loading events...
      </td>
    </tr>
  `;

  try {
    const snap = await getDocs(eventsRef);

    table.innerHTML = `
      <tr>
        <th>Name</th><th>Date</th><th>Description</th>
        <th>Created By</th><th>Created At</th><th>Action</th>
      </tr>
    `;

    if (snap.empty) {
      table.insertRow().innerHTML = `
        <td colspan="6" style="text-align:center; padding:12px; color:#aaa;">No events found.</td>
      `;
      return;
    }

    snap.forEach(d => {
      const e = d.data();
      table.insertRow().innerHTML = `
        <td>${e.name ?? ""}</td>
        <td>${e.date ?? ""}</td>
        <td>${e.description ?? ""}</td>
        <td>${e.createdBy ?? ""}</td>
        <td>${e.createdAt?.toDate?.().toLocaleString() ?? ""}</td>
        <td><button onclick="deleteEvent('${d.id}')">🗑️ Delete</button></td>
      `;
    });

  } catch (err) {
    console.error("Error loading events:", err);
    table.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; color:red; padding:12px;">
          ❌ Failed to load events. Try refreshing.
        </td>
      </tr>
    `;
  }
}

window.deleteEvent = async id => {
  try {
    await deleteDoc(doc(db, "events", id));
    showPopup("Event deleted 🗑️", "success");
    await loadEvents();
  } catch (err) {
    console.error("Delete event error:", err);
    showPopup("Failed to delete event ❌", "error");
  }
};

/**************** CREATE EVENT TOGGLE ****************/
const toggleCreateEventBtn = document.getElementById("toggleCreateEvent");
const createEventBox       = document.getElementById("createEventBox");
const cancelEventBtn       = document.getElementById("cancelEventBtn");

toggleCreateEventBtn.addEventListener("click", () => {
  createEventBox.classList.toggle("hidden");
});

cancelEventBtn.addEventListener("click", () => {
  createEventBox.classList.add("hidden");
});

/**************** CREATE EVENT ****************/
document.getElementById("createEventBtn").addEventListener("click", async () => {
  const name        = document.getElementById("eventName").value.trim();
  const date        = document.getElementById("eventDate").value;
  const description = document.getElementById("eventDescription").value.trim();

  if (!name || !date || !description) {
    showPopup("Please fill all fields ❌", "error");
    return;
  }

  // Optimistic UI — clear & hide the form immediately
  document.getElementById("eventName").value        = "";
  document.getElementById("eventDate").value        = "";
  document.getElementById("eventDescription").value = "";
  createEventBox.classList.add("hidden");
  showPopup("Creating event...", "success", 1000);

  try {
    const docRef = await addDoc(eventsRef, {
      name,
      date,
      description,
      createdBy: "Admin",
      invitedAlumni: [],
      createdAt: serverTimestamp()
    });

    // ✅ Append row directly — no full reload needed
    const table = document.getElementById("eventsTable");
    const now   = new Date().toLocaleString();
    const newRow = table.insertRow(); // inserts at end
    newRow.innerHTML = `
      <td>${name}</td>
      <td>${date}</td>
      <td>${description}</td>
      <td>Admin</td>
      <td>${now}</td>
      <td><button onclick="deleteEvent('${docRef.id}')">🗑️ Delete</button></td>
    `;

    showPopup("Event created successfully 🎉", "success");

  } catch (err) {
    console.error(err);
    showPopup("Failed to create event ❌", "error");
  }
});

/**************** SEND MESSAGE ****************/
window.handleSendMessage = () => {
  window.location.href = "/chat";
};

/**************** EXCEL EXPORT ****************/
window.generateExcel = () => {
  const wb = XLSX.utils.book_new();

  Object.entries(dataStore).forEach(([key, val]) => {
    const fields   = TABLE_FIELDS[key];
    const filtered = val.map(row => {
      const obj = {};
      fields.forEach(f => {
        let value = row[f] ?? "";
        if (value?.toDate) value = value.toDate().toLocaleString();
        obj[f] = value;
      });
      return obj;
    });

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(filtered),
      key.toUpperCase()
    );
  });

  XLSX.writeFile(wb, "Admin_Report.xlsx");
};