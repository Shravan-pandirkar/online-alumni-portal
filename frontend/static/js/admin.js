

/**************** FIREBASE IMPORTS ****************/
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  query,
  where
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

/**************** DATA STORE ****************/
const dataStore = {
  students: [],
  alumni: [],
  teachers: []
};

/**************** COLUMN CONFIG ****************/
const TABLE_FIELDS = {
  students: [
    "fullName",
    "phone",
    "email",
    "dept",
    "stuYear",
    "committee",
    "lastLogin"
  ],
  alumni: [
    "fullName",
    "phone",
    "email",
    "dept",
    "aluPass",
    "job",
    "designation",
    "experience",
    "city",
    "lastLogin"
  ],
  teachers: [
    "fullName",
    "phone",
    "email",
    "dept",
    "experience",
    "lastLogin"
  ]
};

let started = false;

/**************** LOGIN ****************/
window.adminLogin = async () => {
  const pwd = document.getElementById("adminPassword").value;

  if (pwd !== ADMIN_PASSWORD) {
    alert("Wrong Password ❌");
    return;
  }

  // 🔹 Sign in anonymously
  await signInAnonymously(auth);

  alert("Login Successful ✅");
  document.querySelector(".dashboard").classList.remove("hidden");

  if (!started) {
    startAdmin();
    started = true;
  }
};
/**************** NAV ****************/
const ADMIN_PASSWORD = "admin@123";
window.showSection = id => {
  document.querySelectorAll(".section").forEach(s =>
    s.classList.add("hidden")
  );
  document.getElementById(id).classList.remove("hidden");
};

/**************** START ADMIN ****************/
function startAdmin() {
  loadUsersByRole("student", "studentsTable", "students");
  loadUsersByRole("alumni", "alumniTable", "alumni");
  loadUsersByRole("teacher", "teachersTable", "teachers");
  loadEvents();
}

/**************** LOAD USERS BY ROLE ****************/
function loadUsersByRole(role, tableId, storeKey) {
  const table = document.getElementById(tableId);
  const fields = TABLE_FIELDS[storeKey];

  const q = query(
    collection(db, "users"),
    where("role", "==", role)
  );

  onSnapshot(q, snap => {
    table.innerHTML = "";
    dataStore[storeKey] = [];

    // Header
    const header = table.insertRow();
    header.innerHTML =
      `<th>Select</th>` +
      fields.map(f => `<th>${f}</th>`).join("");

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
  });
}

/**************** DELETE USERS ****************/
window.deleteSelected = async type => {
  const checks = document.querySelectorAll(`#${type}Table input:checked`);
  if (!checks.length) return alert("No records selected");

  for (const c of checks) {
    await deleteDoc(doc(db, "users", c.dataset.id));
  }

  alert("Deleted successfully 🗑️");
};

/**************** EVENTS ****************/
function loadEvents() {
  const table = document.getElementById("eventsTable");

  onSnapshot(collection(db, "events"), snap => {
    table.innerHTML = `
      <tr>
        <th>Name</th>
        <th>Date</th>
        <th>Created By</th>
        <th>Created At</th>
        <th>Action</th>
      </tr>
    `;

    snap.forEach(d => {
      const e = d.data();
      table.insertRow().innerHTML = `
        <td>${e.name ?? ""}</td>
        <td>${e.date ?? ""}</td>
        <td>${e.createdBy ?? ""}</td>
        <td>${e.createdAt?.toDate?.().toLocaleString() ?? ""}</td>
        <td>
          <button onclick="deleteEvent('${d.id}')">Delete</button>
        </td>
      `;
    });
  });
}

window.deleteEvent = async id => {
  await deleteDoc(doc(db, "events", id));
  alert("Event deleted");
};

/**************** EXCEL EXPORT ****************/
window.generateExcel = () => {
  const wb = XLSX.utils.book_new();

  Object.entries(dataStore).forEach(([key, val]) => {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(val),
      key.toUpperCase()
    );
  });

  XLSX.writeFile(wb, "Admin_Report.xlsx");
};