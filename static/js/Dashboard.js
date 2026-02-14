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
    const snapshot = await getDocs(collection(db, "users"));

cachedUsers = snapshot.docs
  .map(d => ({ uid: d.id, ...d.data() }))
  .filter(u => ["alumni", "student", "teacher"].includes(u.role));

allUsers = cachedUsers;
renderUsers(allUsers);

    

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

    // SEND MESSAGE BUTTON
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

// ================== MESSAGE ==================
/* ================== MESSAGE SECTION ================== */

let currentUserId = null;
let chattingWithId = null;
let unsubscribeMessages = null;

/* ================== AUTH USER ================== */
onAuthStateChanged(auth, user => {
  if (user) {
    currentUserId = user.uid;
    loadChatUsers(); // ✅ LOAD USERS AFTER AUTH
  } else {
    showPopup("Please login to access messages", "error");
  }
});


/* ================== LOAD CHAT USERS ================== */
/* ================== LOAD CHAT USERS WITH SEARCH ================== */
async function loadChatUsers() {
  const usersBox = document.querySelector(".chat-users");
  if (!usersBox) return;

  // Add search input at the top
  usersBox.innerHTML = `
    <input 
      type="text" 
      id="chatUserSearch" 
      placeholder="Search alumni..." 
      class="chat-search"
    >
    <div id="chatUserList"></div>
  `;

  const usersListDiv = document.getElementById("chatUserList");
  const searchInput = document.getElementById("chatUserSearch");

  let allUsers = [];

  try {
    const snapshot = await getDocs(collection(db, "users"));

    if (snapshot.empty) {
      usersListDiv.innerHTML = "<p>No users found</p>";
      return;
    }

    snapshot.forEach(docSnap => {
      if (docSnap.id === currentUserId) return; // Skip current user
      const u = docSnap.data();
      const role = (u.role || "").toLowerCase().trim();
      if (!["alumni", "student", "teacher"].includes(role)) return;

      // Add uid to user object
      allUsers.push({ uid: docSnap.id, ...u });
    });

    // Function to render users list
    function renderUsers(users) {
      usersListDiv.innerHTML = "";

      if (!users.length) {
        usersListDiv.innerHTML = "<p>No users found</p>";
        return;
      }

      users.forEach(u => {
        const div = document.createElement("div");
        div.className = "user";

        const profilePhoto = u.profilePic || "";

        div.innerHTML = `
          <div class="avatar">
            ${
              profilePhoto
                ? `<img src="${profilePhoto}" alt="👤" 
                     onerror="this.remove(); this.parentElement.innerHTML='<span class=icon>👤</span>'">`
                : `<span class="icon">👤</span>`
            }
          </div>
          <div>
            <h4>${u.fullName || "No Name"}</h4>
            <p>${(u.role || "").charAt(0).toUpperCase() + (u.role || "").slice(1)} • ${u.dept || "N/A"}</p>
          </div>
        `;

        // Click to open chat
        div.onclick = () => openChat(u.uid, u.fullName || "No Name", profilePhoto);

        usersListDiv.appendChild(div);
      });
    }

    // Initial render
    renderUsers(allUsers);

    // Live search
    searchInput.addEventListener("input", () => {
      const value = searchInput.value.toLowerCase();
      const filtered = allUsers.filter(u =>
        (u.fullName || "").toLowerCase().includes(value) ||
        (u.dept || "").toLowerCase().includes(value) ||
        (u.role || "").toLowerCase().includes(value)
      );
      renderUsers(filtered);
    });

  } catch (err) {
    console.error("Error loading chat users:", err);
    usersListDiv.innerHTML = "<p>Error loading users</p>";
  }
}



/* ================== OPEN CHAT ================== */
function openChat(userId, name, profilePhoto) {
  chattingWithId = userId;

  const headerContent = profilePhoto && profilePhoto.trim() !== ""
    ? `<img src="${profilePhoto}" alt="👤" onerror="this.remove(); this.parentElement.innerHTML='<span class=icon>👤</span>'">`
    : `<span class="icon">👤</span>`;

  // Update chat header
  document.getElementById("chatUser").innerHTML = `
    <div class="chat-user-header">
      <div class="avatar">
        ${headerContent}
      </div>
      <span class="user-name">${name || "No Name"}</span>
    </div>
  `;

  // Enable input
  document.getElementById("chatInput").disabled = false;
  document.querySelector(".chat-input button").disabled = false;

  // Clear chat messages
  const chatBox = document.getElementById("chatMessages");
  chatBox.innerHTML = "";

  // Stop previous listener
  if (unsubscribeMessages) unsubscribeMessages();

  // Load messages
  const chatRef = collection(
    db,
    "chats",
    getChatId(currentUserId, chattingWithId),
    "messages"
  );

  unsubscribeMessages = onSnapshot(chatRef, snapshot => {
    chatBox.innerHTML = "";

    snapshot.forEach(docSnap => {
  const msg = docSnap.data();
  const msgId = docSnap.id; // get the Firestore doc ID
  const msgDiv = document.createElement("div");

  msgDiv.className = "message " + (msg.senderId === currentUserId ? "sent" : "received");
  msgDiv.innerText = msg.text;

  // Add delete button only for sent messages
  if (msg.senderId === currentUserId) {
    const deleteBtn = document.createElement("span");
    deleteBtn.innerText = "🗑️";
    deleteBtn.className = "delete-msg";
    deleteBtn.title = "Delete message";
    deleteBtn.onclick = async () => {
      try {
        await deleteDoc(doc(db, "chats", getChatId(currentUserId, chattingWithId), "messages", msgId));
        showPopup("Message deleted", "success");
      } catch (err) {
        console.error("Failed to delete message:", err);
        showPopup("Failed to delete message", "error");
      }
    };
    msgDiv.appendChild(deleteBtn);
  }

  chatBox.appendChild(msgDiv);
});


    chatBox.scrollTop = chatBox.scrollHeight;
  });
}




/* ================== CHAT ID ================== */
function getChatId(uid1, uid2) {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}



/* ================== SEND MESSAGE ================== */
/* ================== SEND MESSAGE ================== */
async function sendChat() {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();

  // Prevent sending empty messages or if no user is selected
  if (!text) {
    showPopup("Cannot send empty message", "error");
    return;
  }
  if (!chattingWithId) {
    showPopup("Select a user to chat with first", "error");
    return;
  }

  try {
    const chatId = getChatId(currentUserId, chattingWithId);

    // Add message to Firestore
    await addDoc(
      collection(db, "chats", chatId, "messages"),
      {
        senderId: currentUserId,      // who sent the message
        receiverId: chattingWithId,    // optional, helps with rules or queries
        text: text,
        timestamp: serverTimestamp()
      }
    );

    // Clear input after sending
    input.value = "";

    // Optional: Scroll chat to bottom
    const chatBox = document.getElementById("chatMessages");
    chatBox.scrollTop = chatBox.scrollHeight;

  } catch (err) {
    console.error("Failed to send message:", err);
    showPopup("Failed to send message. Try again.", "error");
  }
}


/* ================== EXPOSE TO HTML ================== */
window.openChat = openChat;
window.sendChat = sendChat;
window.loadChatUsers = loadChatUsers;












