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
  if (section === "alumni") document.getElementById("searchView").style.display = "block";
  if (section === "events") document.getElementById("eventsView").style.display = "block";
  if (section === "message") document.getElementById("messagesView").style.display = "block";
}
window.showSection = showSection;
showSection("alumni");

// ================== ALUMNI SEARCH ==================
const alumniGrid = document.getElementById("alumniGrid");
const searchInput = document.getElementById("alumniSearch");
let allUsers = [];

// ================== LOAD USERS ==================
onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.href = "/login";
    return;
  }
  try {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
  showPopup("Please complete your profile", "error", 5000);
  loadUsers(); // still load alumni
  return;
}

    const data = snap.data();

    // ===== CHECK REQUIRED FIELDS =====
    let incomplete = !data.fullName || !data.phone || !data.role;

    if (data.role === "student") {
      incomplete = incomplete || !data.stuYear || !data.committee;
    }

    if (data.role === "alumni") {
      incomplete = incomplete || !data.aluPass;
    }

    if (incomplete) {
      showPopup("Edit your profile first!", "error", 5000);
    }

  } catch (err) {
    console.error(err);
    showPopup("Error checking profile", "error", 5000);
  }
  loadUsers();
});

let cachedUsers = null;

const loadingContainer = document.getElementById("loadingBarContainer");

async function loadUsers() {
  if (cachedUsers) {
    allUsers = cachedUsers;   // ✅ important
    renderUsers(cachedUsers);
    return;
  }

  alumniGrid.innerHTML = "";
  loadingContainer.classList.remove("hidden");

  try {
    const q = query(
      collection(db, "users"),
      where("role", "in", ["alumni", "student", "teacher"])
    );

    const snapshot = await getDocs(q);

    cachedUsers = snapshot.docs.map(d => ({
      uid: d.id,
      ...d.data()
    }));

    allUsers = cachedUsers;   // ✅ FIX HERE
    renderUsers(allUsers);

  } catch (error) {
    console.error(error);
    alumniGrid.innerHTML = "<p>Error loading users</p>";
  } finally {
    loadingContainer.classList.add("hidden");
  }
}

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

    // ROLE BADGE
    const roleBadge =
      user.role === "alumni"
        ? `<span class="badge alumni">Alumni</span>`
        : user.role === "teacher"
        ? `<span class="badge teacher">Teacher</span>`
        : `<span class="badge student">Student</span>`;

    // DETAILS BY ROLE
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

    // USE profilePic FROM FIRESTORE
    const profilePhoto = user.profilePic || DEFAULT_AVATAR;

    // CARD STRUCTURE
    card.innerHTML = `
      <div class="card-top">
        <div class="card-left">
          <img src="${profilePhoto}" class="profile-pic" alt="👤">
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

    // TOGGLE DETAILS
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

  const toggleBtn = document.getElementById("toggleCreateEvent");
  const box = document.getElementById("createEventBox");
  const cancelBtn = document.getElementById("cancelEventBtn");

  if (toggleBtn && box) {
    toggleBtn.addEventListener("click", () => box.classList.toggle("hidden"));
    cancelBtn.addEventListener("click", () => box.classList.add("hidden"));
  }
});

// ================== EVENTS ==================
const eventsRef = collection(db, "events");
const eventsList = document.getElementById("eventsList");
const inviteAlumniCheckbox = document.getElementById("inviteAlumni");
const alumniListBox = document.getElementById("alumniListBox");
const alumniListDiv = document.getElementById("alumniList");

// LOAD ALUMNI FOR EVENT
async function loadAlumniForEvent() {
  alumniListDiv.innerHTML = "<p>Loading alumni...</p>";

  try {
    const q = query(collection(db, "users"), where("role", "==", "alumni"));
    const snapshot = await getDocs(q);
    alumniListDiv.innerHTML = "";

    if (snapshot.empty) {
      alumniListDiv.innerHTML = "<p>No alumni found</p>";
      return;
    }

    snapshot.forEach(docSnap => {
      const alumni = { uid: docSnap.id, ...docSnap.data() };
      alumniListDiv.innerHTML += `
        <div class="alumni-item">
          <label>
            <input type="checkbox" class="alumniCheck" value="${alumni.uid}">
            ${alumni.fullName} (${alumni.aluPass || "N/A"})
          </label>
        </div>
      `;
    });
  } catch (err) {
    console.error(err);
    alumniListDiv.innerHTML = "<p>Error loading alumni</p>";
  }
}

// TOGGLE ALUMNI LIST
inviteAlumniCheckbox.addEventListener("change", () => {
  if (inviteAlumniCheckbox.checked) {
    alumniListBox.classList.remove("hidden");
    loadAlumniForEvent();
  } else {
    alumniListBox.classList.add("hidden");
    alumniListDiv.innerHTML = "";
  }
});

// CREATE EVENT
// CREATE EVENT
document.getElementById("createEventBtn").addEventListener("click", async () => {
  const name = document.getElementById("eventName").value.trim();
  const date = document.getElementById("eventDate").value;
  const user = auth.currentUser;

  if (!name || !date) {
    showPopup("Please fill all fields", "error");
    return;
  }

  if (!user) {
    showPopup("Login required", "error");
    return;
  }

  try {
    // FETCH USER DATA
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      showPopup("User data not found", "error");
      return;
    }
    const userData = snap.data();

    // ===== CHECK ROLE AND COMMITTEE =====
    const isTeacher = userData.role === "teacher";
    const isCommittee = userData.role === "student" && userData.committee && userData.committee.trim() !== "";

    if (!isTeacher && !isCommittee) {
      showPopup("You are not allowed to create an event", "error");
      return;
    }

    let fullName = userData.fullName || "Unknown User";

    const invitedAlumni = [];
    document.querySelectorAll(".alumniCheck:checked").forEach(cb => invitedAlumni.push(cb.value));

    await addDoc(eventsRef, {
      name,
      date,
      createdBy: fullName,
      invitedAlumni,
      createdAt: serverTimestamp()
    });

    // Reset form
    document.getElementById("eventName").value = "";
    document.getElementById("eventDate").value = "";
    inviteAlumniCheckbox.checked = false;
    alumniListBox.classList.add("hidden");
    alumniListDiv.innerHTML = "";

    showPopup("Event created successfully 🎉");
  } catch (err) {
    console.error(err);
    showPopup("Failed to create event", "error");
  }
});



// LOAD EVENTS (REALTIME)
onSnapshot(eventsRef, snapshot => {
  eventsList.innerHTML = "";

  if (snapshot.empty) {
    eventsList.innerHTML = "<p>No events available</p>";
    return;
  }

  snapshot.forEach(eventDoc => {
    const event = eventDoc.data();
    const user = auth.currentUser;

    const isInvited =
      event.invitedAlumni &&
      user &&
      event.invitedAlumni.includes(user.uid);

    const div = document.createElement("div");
    div.className = "event-item";

    div.innerHTML = `
      <strong>${event.name}</strong>
      <p>📅 Date: ${event.date}</p>
      <p>👤 Created By: ${event.createdBy}</p>
      ${isInvited ? `<p class="alumni-msg">🎓 You are invited to this event</p>` : ""}
      <button class="delete-event-btn">🗑 Delete</button>
    `;

    div.querySelector(".delete-event-btn").addEventListener("click", async () => {
      if (!confirm("Delete this event?")) return;
      await deleteDoc(doc(db, "events", eventDoc.id));
      showPopup("Event deleted");
    });

    eventsList.appendChild(div);
  });
});












