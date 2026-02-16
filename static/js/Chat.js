// ================== FIREBASE IMPORTS ==================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs
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

// ================== CONSTANTS ==================
const DEFAULT_AVATAR =
  "https://res.cloudinary.com/dvyk0lfsb/image/upload/v1/default-avatar.png";

// ================== ELEMENTS ==================
const alumniGrid = document.getElementById("alumniList");
const selectAllCheckbox = document.getElementById("selectAll");
const searchInput = document.getElementById("searchAlumni");
const messageInput = document.getElementById("messageText");

// ================== STATE ==================
let allUsers = [];

// ================== LOAD USERS FROM FIRESTORE ==================
async function loadUsers() {
  alumniGrid.innerHTML = "Loading alumni...";
  allUsers = [];

  try {
    const snapshot = await getDocs(collection(db, "users"));

    console.log("Total docs:", snapshot.size);

    snapshot.forEach(docSnap => {
  const data = docSnap.data();

  // ✅ LOAD ONLY ALUMNI
  if (data.role !== "alumni") return;

  allUsers.push({
    id: docSnap.id,
    fullName: data.fullName || "No Name",
    role: data.role,
    phoneNumber: data.phoneNumber || data.phone || data.mobile || "",
    profilePic: data.profilePic || DEFAULT_AVATAR
  });
});


    renderUsers(allUsers);

  } catch (err) {
    console.error("Firestore error:", err);
    alumniGrid.innerHTML = "Error loading users";
  }
}

// ================== RENDER USERS ==================
function renderUsers(users) {
  alumniGrid.innerHTML = "";

  const validUsers = users.filter(
  u => u.phoneNumber && u.role === "alumni"
);


  if (validUsers.length === 0) {
    alumniGrid.innerHTML = "<p>No users found</p>";
    return;
  }

  validUsers.forEach(user => {
    const card = document.createElement("div");
    card.className = "card";

    const roleBadge =
      user.role === "alumni"
        ? `<span class="badge alumni">Alumni</span>`
        : user.role === "teacher"
        ? `<span class="badge teacher">Teacher</span>`
        : `<span class="badge student">Student</span>`;

    card.innerHTML = `
      <div class="card-top">
        <div class="card-left">
          <img src="${user.profilePic}" class="profile-pic">
          <div class="info">
            <h3>${user.fullName}</h3>
            ${roleBadge}
            <small>${user.phoneNumber}</small>
          </div>
        </div>

        <div class="card-right">
          <label>
            <input type="checkbox"
                   class="user-checkbox"
                   data-phone="${user.phoneNumber}">
            Select
          </label>
        </div>
      </div>
    `;

    alumniGrid.appendChild(card);
  });
}


// ================== SELECT ALL ==================
selectAllCheckbox.addEventListener("change", () => {
  document.querySelectorAll(".user-checkbox").forEach(cb => {
    cb.checked = selectAllCheckbox.checked;
  });
});

// ================== SEARCH ==================
searchInput.addEventListener("input", () => {
  const term = searchInput.value.toLowerCase();

  const filtered = allUsers.filter(user =>
    user.fullName.toLowerCase().includes(term)
  );

  renderUsers(filtered);
});

// ================== SEND BROADCAST SMS ==================
window.sendBroadcast = function () {
  const message = messageInput.value.trim();

  if (!message) {
    alert("Message cannot be empty");
    return;
  }

  const selectedNumbers = [
    ...document.querySelectorAll(".user-checkbox:checked")
  ].map(cb => cb.dataset.phone);

  if (selectedNumbers.length === 0) {
    alert("Please select at least one alumni");
    return;
  }

  // Open SMS app on mobile
  const smsLink = `sms:${selectedNumbers.join(",")}?body=${encodeURIComponent(message)}`;
  window.location.href = smsLink;
};

// ================== INIT ==================
loadUsers();

