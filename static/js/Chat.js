// ================== FIREBASE IMPORTS ==================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
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

// ================== CONSTANTS ==================
const DEFAULT_AVATAR =
  "https://res.cloudinary.com/dvyk0lfsb/image/upload/v1/default-avatar.png";

// ================== GLOBAL STATE ==================
let currentUserId = null;
let chattingWithId = null;
let unsubscribeMessages = null;

// ================== CHAT ID ==================
function getChatId(uid1, uid2) {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

// ================== WAIT FOR ROOT ==================
function waitForElement(selector) {
  return new Promise(resolve => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  });
}

// ================== AUTH ==================
onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  currentUserId = user.uid;

  const appRoot = await waitForElement("#chatApp");
  renderLayout(appRoot);
  loadUsers();
});

// ================== RENDER LAYOUT ==================
function renderLayout(root) {
  root.innerHTML = `
    <aside class="sidebar">
      <div class="users-list"></div>
    </aside>

    <main class="chat-area">
      <div class="chat-header"></div>
      <div class="chat-messages"></div>
      <div class="chat-input">
        <input type="text" placeholder="Type a message..." />
        <button>Send</button>
      </div>
    </main>
  `;
}

// ================== LOAD USERS ==================
function loadUsers() {
  const usersList = document.getElementById("usersList");

  onSnapshot(collection(db, "users"), (snapshot) => {
    usersList.innerHTML = "";

    snapshot.forEach((docSnap) => {
      if (docSnap.id === currentUserId) return;

      const u = docSnap.data();
      const avatar = u.profilePic || DEFAULT_AVATAR;

      const card = document.createElement("div");
      card.className = "user-card";

      card.innerHTML = `
        <img src="${avatar}" onerror="this.src='${DEFAULT_AVATAR}'">
        <div>
          <h4>${u.fullName || "No Name"}</h4>
          <p>${u.role || "Role"} • ${u.department || "Dept"}</p>
        </div>
      `;

      card.onclick = () => {
        openChat(docSnap.id, u.fullName, avatar);
      };

      usersList.appendChild(card);
    });

    if (!snapshot.size) {
      usersList.innerHTML = "<p>No users found</p>";
    }
  });
}


// ================== USER CLICK (EVENT DELEGATION) ==================
document.addEventListener("click", (e) => {
  const card = e.target.closest(".user-card");
  if (!card) return;

  openChat(card.dataset.uid, card.dataset.name, card.dataset.avatar);
});

// ================== OPEN CHAT ==================
function openChat(uid, name, avatar) {
  chattingWithId = uid;

  const header = document.querySelector(".chat-header");
  header.innerHTML = `
    <img src="${avatar}" onerror="this.src='${DEFAULT_AVATAR}'">
    <span>${name}</span>
  `;

  loadMessages();
}

// ================== LOAD MESSAGES ==================
function loadMessages() {
  const chatMessages = document.querySelector(".chat-messages");
  chatMessages.innerHTML = "";

  if (unsubscribeMessages) unsubscribeMessages();

  const chatId = getChatId(currentUserId, chattingWithId);
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("timestamp", "asc")
  );

  unsubscribeMessages = onSnapshot(q, snapshot => {
    chatMessages.innerHTML = "";

    snapshot.forEach(docSnap => {
      const m = docSnap.data();
      const msg = document.createElement("div");
      msg.className = m.senderId === currentUserId ? "sent" : "received";
      msg.textContent = m.text;
      chatMessages.appendChild(msg);
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

// ================== SEND MESSAGE (DELEGATED) ==================
document.addEventListener("click", async (e) => {
  if (!e.target.matches(".chat-input button")) return;

  const input = document.querySelector(".chat-input input");
  const text = input.value.trim();
  if (!text || !chattingWithId) return;

  const chatId = getChatId(currentUserId, chattingWithId);

  await addDoc(collection(db, "chats", chatId, "messages"), {
    text,
    senderId: currentUserId,
    receiverId: chattingWithId,
    timestamp: serverTimestamp()
  });

  input.value = "";
});
