// ============================================================
//  THEME TOGGLE — same localStorage key as all other pages
// ============================================================
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

// Apply saved theme immediately (module scripts are deferred — DOM exists)
applyTheme(localStorage.getItem(THEME_KEY) || "dark");

// ── END THEME TOGGLE ──────────────────────────────────────

// ================== FIREBASE IMPORTS ==================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// ================== WAIT FOR DOM ==================
document.addEventListener("DOMContentLoaded", () => {

  // Wire up theme toggle button
  document.getElementById("themeToggle")
    ?.addEventListener("click", toggleTheme);

  // ================== FIREBASE CONFIG ==================
  const firebaseConfig = {
    apiKey: "AIzaSyBEqicHjsRkaUnOpMza90tMzVTQcVo1CoM",
    authDomain: "alumni-portal-53425.firebaseapp.com",
    projectId: "alumni-portal-53425",
    storageBucket: "alumni-portal-53425.firebasestorage.app",
    messagingSenderId: "947099064778",
    appId: "1:947099064778:web:7eb45b444d5cc6cd651733"
  };

  // ================== POPUP ==================
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

  // ================== INIT ==================
  const app  = initializeApp(firebaseConfig);
  const db   = getFirestore(app);
  const auth = getAuth(app);

  // ================== ELEMENTS ==================
  const alumniGrid        = document.getElementById("alumniList");
  const selectAllCheckbox = document.getElementById("selectAll");
  const searchInput       = document.getElementById("searchAlumni");
  const messageInput      = document.getElementById("messageText");
  const sendBtn           = document.getElementById("sendBtn");

  if (!alumniGrid || !selectAllCheckbox || !searchInput || !messageInput || !sendBtn) {
    console.error("❌ Required HTML elements missing");
    return;
  }

  // ================== CONSTANTS ==================
  const DEFAULT_AVATAR =
    "https://res.cloudinary.com/dvyk0lfsb/image/upload/v1/default-avatar.png";

  // ================== STATE ==================
  let allUsers = [];

  // ================== AUTH CHECK ==================
  onAuthStateChanged(auth, user => {
    if (!user) return;
    loadUsers();
  });

  // ================== LOAD USERS ==================
  async function loadUsers() {
    const loader = document.getElementById("loader");
    alumniGrid.innerHTML = "";
    loader.classList.remove("hidden");
    allUsers = [];

    try {
      const snapshot = await getDocs(collection(db, "users"));

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.role !== "alumni") return;

        allUsers.push({
          uid:        docSnap.id,
          fullName:   data.fullName || data.name || data.displayName || "No Name",
          email:      data.email    || "No Email",
          role:       data.role     || "alumni",
          profilePic: data.profilePic || DEFAULT_AVATAR
        });
      });

      renderUsers(allUsers);
    } catch (err) {
      console.error("Firestore error:", err);
      alumniGrid.innerHTML = "<p>Permission denied</p>";
    } finally {
      loader.classList.add("hidden");
    }
  }

  // ================== RENDER USERS ==================
  function renderUsers(users) {
    alumniGrid.innerHTML = "";

    if (users.length === 0) {
      alumniGrid.innerHTML = "<p style='text-align:center;color:var(--text-muted);padding:20px;'>No alumni found</p>";
      return;
    }

    users.forEach(user => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <div class="card-top">
          <div class="card-left">
            <img src="${user.profilePic}" class="profile-pic" alt="👤"
              onerror="this.src='${DEFAULT_AVATAR}'">
            <div class="info">
              <h3>${user.fullName}</h3>
              <span class="role-badge">${user.role}</span>
              <small>${user.email}</small>
            </div>
          </div>
          <div class="card-right">
            <label class="select-user">
              <input type="checkbox" class="user-checkbox" data-email="${user.email}">
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
    renderUsers(
      allUsers.filter(u =>
        u.fullName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      )
    );
  });

  // ================== AUTO-RESIZE TEXTAREA ==================
  messageInput.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
  });

  // ================== SEND MESSAGE ==================
  sendBtn.addEventListener("click", async () => {
    const message = messageInput.value.trim();
    if (!message) return showPopup("Message cannot be empty", "error");

    const emails = [];
    document.querySelectorAll(".user-checkbox:checked").forEach(cb => {
      emails.push(cb.dataset.email);
    });

    if (emails.length === 0) {
      showPopup("Select at least one user", "error");
      return;
    }

    try {
      sendBtn.disabled   = true;
      sendBtn.innerText  = "Sending...";

      const API_URL = "https://online-alumni-portal-backend.vercel.app";
      const res = await fetch(`${API_URL}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails, message })
      });

      const data = await res.json();
      showPopup(data.message || "Email sent ✅");

      messageInput.value          = "";
      messageInput.style.height   = "50px";
      selectAllCheckbox.checked   = false;
      document.querySelectorAll(".user-checkbox").forEach(cb => cb.checked = false);

    } catch (err) {
      console.error(err);
      showPopup("Failed to send email ❌", "error");
    } finally {
      sendBtn.disabled  = false;
      sendBtn.innerText = "Send";
    }
  });

}); // end DOMContentLoaded