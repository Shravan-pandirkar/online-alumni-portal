// ============================================================
//  SGDTP ALUMNI PORTAL — chat.js  (FIXED)
//  Firebase Realtime Chat — shows real alumni from Firestore
// ============================================================

import { initializeApp }       from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  where,
  deleteDoc,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── CONFIG ───────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyBEqicHjsRkaUnOpMza90tMzVTQcVo1CoM",
  authDomain:        "alumni-portal-53425.firebaseapp.com",
  projectId:         "alumni-portal-53425",
  storageBucket:     "alumni-portal-53425.firebasestorage.app",
  messagingSenderId: "947099064778",
  appId:             "1:947099064778:web:7eb45b444d5cc6cd651733",
  measurementId:     "G-1X15S9CD6V"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── EMOJIS ───────────────────────────────────────────────────
const EMOJIS = [
  "😀","😄","😂","🤣","😊","😍","🥰","😎",
  "😭","😅","🙏","👍","👏","🔥","❤️","✨",
  "🎉","🚀","💯","😜","🤔","👀","💪","🫂",
  "😇","🥳","🤩","😬","😏","👋","🙌","💬"
];

// ── STATE ────────────────────────────────────────────────────
let currentUser    = null;
let currentProfile = null;
let activeContact  = null;
let activeChatId   = null;
let unsubMessages  = null;
let unsubContacts  = null;
let unsubTyping    = null;
let emojiOpen      = false;
let currentFilter  = "all";
let allContacts    = [];
let typingTimer    = null;
let selectMode     = false;      // true when user is selecting messages to delete
let selectedMsgIds = new Set();  // set of message doc IDs currently selected

// ── DOM ──────────────────────────────────────────────────────
// ── Helper: safe DOM lookup with console warning if missing ──
function el(id) {
  const e = document.getElementById(id);
  if (!e) console.warn(`[Chat] Missing element: #${id} — check your HTML`);
  return e;
}

const sidebar          = el("sidebar");
const overlay          = el("overlay");
const sidebarClose     = el("sidebarClose");
const openSidebarBtn   = el("openSidebarBtn");
const contactsList     = el("contactsList");
const searchInput      = el("searchInput");
const filterBtns       = document.querySelectorAll(".filter-btn");
const emptyState       = el("emptyState");
const chatWindow       = el("chatWindow");
const messagesArea     = el("messagesArea");
const messageInput     = el("messageInput");
const sendBtn          = el("sendBtn");
const emojiBtn         = el("emojiBtn");
const emojiPicker      = el("emojiPicker");
const emojiGrid        = el("emojiGrid");
const typingIndicator  = el("typingIndicator");
const typingName       = el("typingName");
const headerName       = el("headerName");
const headerStatus     = el("headerStatus");
const headerAvatar     = el("headerAvatar");
const backBtn          = el("backBtn");
const moreBtn          = el("moreBtn");
const moreDropdown     = el("moreDropdown");
const selectMsgsBtn    = el("selectMsgsBtn");
const clearChatBtn     = el("clearChatBtn");
const blockUserBtn     = el("blockUserBtn");
const selectToolbar    = el("selectToolbar");
const headerActions    = el("headerActions");
const selectCount      = el("selectCount");
const deleteSelectedBtn= el("deleteSelectedBtn");
const cancelSelectBtn  = el("cancelSelectBtn");
const deleteModal      = el("deleteModal");
const deleteModalTitle = el("deleteModalTitle");
const deleteModalDesc  = el("deleteModalDesc");
const confirmDeleteBtn = el("confirmDeleteBtn");
const cancelDeleteBtn  = el("cancelDeleteBtn");

// ============================================================
//  INIT
// ============================================================
function init() {
  buildEmojiPicker();
  setupEventListeners();
  autoResizeTextarea();
  sendBtn.disabled = true;

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser    = user;
      currentProfile = await ensureUserProfile(user);  // FIX: always ensure profile exists
      await setOnlineStatus(true);
      loadContacts();   // FIX: no await — let it stream in real-time
    } else {
      showAuthPrompt();
    }
  });

  window.addEventListener("beforeunload", () => setOnlineStatus(false));
  window.addEventListener("pagehide",      () => setOnlineStatus(false));
}

// ============================================================
//  ENSURE USER PROFILE EXISTS IN FIRESTORE
//  FIX: This is the #1 reason alumni don't appear —
//       registration saves to Firebase Auth but NOT Firestore.
//       This function guarantees every logged-in user
//       has a document in the `users` collection.
// ============================================================
async function ensureUserProfile(user) {
  const userRef = doc(db, "users", user.uid);

  try {
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      // Profile exists — update online status and return
      await updateDoc(userRef, { status: "online" });
      return { id: user.uid, ...snap.data() };
    }

    // Profile does NOT exist — create minimal doc from Auth data
    const fullName = user.displayName
      || user.email.split("@")[0].replace(/[._]/g, " ")
         .replace(/\b\w/g, c => c.toUpperCase());

    const newProfile = {
      fullName,
      email:      user.email,
      role:       "alumni",          // lowercase — matches your DB convention
      dept:       "",
      aluPass:    "",
      company:    "",
      status:     "online",
      profilePic: user.photoURL || "",
      createdAt:  serverTimestamp()
    };

    await setDoc(userRef, newProfile);
    console.log("✅ Created Firestore profile for:", user.email);
    return { id: user.uid, ...newProfile };

  } catch (err) {
    console.error("❌ ensureUserProfile error:", err);
    return {
      id:       user.uid,
      fullName: user.displayName || user.email,
      email:    user.email,
      role:     "alumni",
      status:   "online"
    };
  }
}

// ============================================================
//  SET ONLINE / OFFLINE STATUS
// ============================================================
async function setOnlineStatus(isOnline) {
  if (!currentUser) return;
  try {
    await updateDoc(doc(db, "users", currentUser.uid), {
      status: isOnline ? "online" : "offline"
    });
  } catch (_) {}
}

// ============================================================
//  CACHE KEYS  (same pattern as dashboard.js sessionStorage)
// ============================================================
const CACHE_KEY_USERS = "sgdtp_chat_alumni";
const CACHE_KEY_META  = "sgdtp_chat_meta";
const CACHE_TTL_MS    = 5 * 60 * 1000;   // 5 minutes

function cacheSet(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch(_) {}
}

function cacheGet(key, ttl = CACHE_TTL_MS) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > ttl) { sessionStorage.removeItem(key); return null; }
    return data;
  } catch(_) { return null; }
}

function cacheClear() {
  sessionStorage.removeItem(CACHE_KEY_USERS);
  sessionStorage.removeItem(CACHE_KEY_META);
}

// ============================================================
//  LOAD CONTACTS  — 4-layer speed strategy
//
//  Layer 1 — sessionStorage cache   → instant (0 ms)
//  Layer 2 — Firestore onSnapshot   → ~200–400 ms first time
//  Layer 3 — Parallel chat meta     → non-blocking background
//  Layer 4 — Fallback all-users     → if no alumni role match
// ============================================================
function loadContacts() {
  if (!contactsList) return;

  // ── ONE delegated click listener, never stacks on re-render ──
  if (!contactsList._delegated) {
    contactsList._delegated = true;
    contactsList.addEventListener("click", e => {
      const item = e.target.closest(".contact-item");
      if (!item || !item.dataset.id) return;
      const user = allContacts.find(u => u.id === item.dataset.id);
      if (user) openChat(user);
    });
  }

  // ── LAYER 1: Render from sessionStorage cache IMMEDIATELY ──
  const cachedUsers = cacheGet(CACHE_KEY_USERS);
  const cachedMeta  = cacheGet(CACHE_KEY_META);

  if (cachedUsers && cachedUsers.length > 0) {
    allContacts = mergeUsersWithMeta(cachedUsers, cachedMeta || {});
    renderContactsWithFilter();
    console.log(`[Chat] ⚡ Instant render from cache (${cachedUsers.length} alumni)`);
    // Still attach live listener to pick up changes — but no skeleton shown
  } else {
    showContactsSkeleton();
  }

  if (unsubContacts) unsubContacts();

  // ── LAYER 2: Firestore real-time listener ──
  const alumniQuery = query(
    collection(db, "users"),
    where("role", "in", ["alumni", "Alumni", "ALUMNI"])
  );

  unsubContacts = onSnapshot(alumniQuery, async (snapshot) => {

    let users = [];
    snapshot.forEach(s => {
      if (s.id !== currentUser.uid) users.push({ id: s.id, ...s.data() });
    });

    // ── LAYER 4: Fallback — try all users if no alumni role match ──
    if (users.length === 0) {
      console.warn("[Chat] No alumni found — falling back to all users");
      try {
        const allSnap = await getDocs(collection(db, "users"));
        allSnap.forEach(s => {
          if (s.id !== currentUser.uid) users.push({ id: s.id, ...s.data() });
        });
      } catch(e) { console.error("Fallback failed:", e); }
    }

    if (users.length === 0) {
      contactsList.innerHTML = `
        <div class="no-results">
          <i class="fa-solid fa-users-slash"></i>
          No alumni registered yet
        </div>`;
      return;
    }

    // Save users to cache
    cacheSet(CACHE_KEY_USERS, users);

    // Render instantly with whatever meta we already have cached
    const existingMeta = cacheGet(CACHE_KEY_META) || {};
    allContacts = mergeUsersWithMeta(users, existingMeta);
    renderContactsWithFilter();

    // ── LAYER 3: Fetch chat meta in parallel (non-blocking) ──
    fetchAllChatMeta(users).then(chatMetaMap => {
      // Merge Firestore timestamps (not JSON-serializable) carefully
      const serializableMeta = {};
      Object.entries(chatMetaMap).forEach(([k, v]) => {
        serializableMeta[k] = {
          lastMessage:  v.lastMessage  || "",
          lastTimestamp: v.lastTimestamp ? v.lastTimestamp.toMillis() : 0,
          ["unread_" + currentUser.uid]: v["unread_" + currentUser.uid] || 0
        };
      });
      cacheSet(CACHE_KEY_META, serializableMeta);

      allContacts = users.map(u => {
        const chatId = getChatId(currentUser.uid, u.id);
        const meta   = chatMetaMap[chatId];
        return {
          ...u,
          lastMessage:   meta?.lastMessage   || "Say hello 👋",
          lastTime:      meta?.lastTimestamp  ? formatTime(meta.lastTimestamp.toDate()) : "",
          unread:        meta?.["unread_" + currentUser.uid] || 0,
          lastTimestamp: meta?.lastTimestamp  ? meta.lastTimestamp.toMillis() : 0
        };
      });
      allContacts.sort((a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0));
      renderContactsWithFilter();
    });

  }, err => {
    console.error("❌ loadContacts error:", err);
    if (contactsList) contactsList.innerHTML = `
      <div class="no-results">
        <i class="fa-solid fa-circle-exclamation"></i>
        <span>Could not load contacts.<br>Check Firestore rules.</span>
      </div>`;
  });
}

// ── Merge a users array with cached/fetched meta map ────────
function mergeUsersWithMeta(users, metaMap) {
  const merged = users.map(u => {
    const chatId = getChatId(currentUser.uid, u.id);
    const meta   = metaMap[chatId];
    const ts     = meta?.lastTimestamp || 0;
    return {
      ...u,
      lastMessage:   meta?.lastMessage || "Say hello 👋",
      lastTime:      ts ? formatTime(new Date(typeof ts === "number" ? ts : ts)) : "",
      unread:        meta?.["unread_" + currentUser.uid] || 0,
      lastTimestamp: typeof ts === "number" ? ts : (ts?.toMillis?.() || 0)
    };
  });
  merged.sort((a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0));
  return merged;
}

// ── Parallel batch fetch chat metadata ──────────────────────
async function fetchAllChatMeta(users) {
  const metaMap = {};
  await Promise.allSettled(
    users.map(async u => {
      const chatId = getChatId(currentUser.uid, u.id);
      try {
        const snap = await getDoc(doc(db, "chats", chatId));
        if (snap.exists()) metaMap[chatId] = snap.data();
      } catch(_) {}
    })
  );
  return metaMap;
}

// ============================================================
//  RENDER CONTACTS
// ============================================================
function renderContactsWithFilter() {
  const q = searchInput.value.toLowerCase().trim();
  let list = allContacts.filter(u =>
    (u.fullName || "").toLowerCase().includes(q) ||
    (u.dept     || "").toLowerCase().includes(q) ||
    (u.aluPass  || "").includes(q) ||
    (u.company  || "").toLowerCase().includes(q) ||
    (u.email    || "").toLowerCase().includes(q)
  );
  if (currentFilter === "online") list = list.filter(u => u.status === "online");
  if (currentFilter === "unread") list = list.filter(u => u.unread > 0);
  renderContacts(list);
}

function renderContacts(list) {
  contactsList.innerHTML = "";

  if (list.length === 0) {
    contactsList.innerHTML = `
      <div class="no-results">
        <i class="fa-solid fa-user-slash"></i>
        No alumni found
      </div>`;
    return;
  }

  list.forEach((user, i) => {
    const item = document.createElement("div");
    item.className     = "contact-item" + (activeContact?.id === user.id ? " active" : "");
    item.dataset.id    = user.id;
    item.style.animationDelay = `${i * 0.04}s`;

    const color      = stringToColor(user.id);
    const initials   = getInitials(user.fullName || user.email || "?");
    const unreadHTML = user.unread > 0 ? `<span class="unread-badge">${user.unread}</span>` : "";

    // profilePic matches your DB field name (from dashboard.js)
    const avatarHTML = user.profilePic
      ? `<img src="${user.profilePic}"
              style="width:44px;height:44px;border-radius:50%;
                     object-fit:cover;border:2px solid rgba(100,150,255,.4);"
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="avatar-circle" style="background:${color};display:none">${initials}</div>`
      : `<div class="avatar-circle" style="background:${color}">${initials}</div>`;

    // Subtitle: dept + passout year (alumni-specific fields from dashboard.js)
    const subtitle = [
      user.dept    ? user.dept : null,
      user.aluPass ? `Batch ${user.aluPass}` : null,
      user.company ? user.company : null
    ].filter(Boolean).join(" · ") || user.email || "Alumni";

    item.innerHTML = `
      <div class="contact-avatar">
        ${avatarHTML}
        ${(user.status === "online" || user.status === "away")
          ? `<span class="status-dot ${user.status}"></span>`
          : ""}
      </div>
      <div class="contact-info">
        <div class="contact-name">${escapeHTML(user.fullName || user.email || "Unknown")}</div>
        <div class="contact-preview" style="color:var(--text-muted);font-size:11px;margin-bottom:2px;">
          ${escapeHTML(subtitle)}
        </div>
        <div class="contact-preview">${escapeHTML(user.lastMessage || "Say hello 👋")}</div>
      </div>
      <div class="contact-meta">
        <span class="contact-time">${user.lastTime || ""}</span>
        ${unreadHTML}
      </div>
    `;

    contactsList.appendChild(item);
  });
}

function showContactsSkeleton() {
  contactsList.innerHTML = Array(5).fill(0).map(() => `
    <div class="contact-item" style="pointer-events:none;">
      <div class="contact-avatar">
        <div style="
          width:44px;height:44px;border-radius:50%;
          background:linear-gradient(90deg,#071840 25%,#0d2b70 50%,#071840 75%);
          background-size:200% 100%;animation:shimmer 1.2s infinite;"></div>
      </div>
      <div class="contact-info" style="display:flex;flex-direction:column;gap:7px;">
        <div style="height:12px;width:60%;border-radius:6px;
          background:linear-gradient(90deg,#071840 25%,#0d2b70 50%,#071840 75%);
          background-size:200% 100%;animation:shimmer 1.2s infinite;"></div>
        <div style="height:10px;width:40%;border-radius:6px;
          background:linear-gradient(90deg,#071840 25%,#0d2b70 50%,#071840 75%);
          background-size:200% 100%;animation:shimmer 1.2s infinite;"></div>
        <div style="height:10px;width:80%;border-radius:6px;
          background:linear-gradient(90deg,#071840 25%,#0d2b70 50%,#071840 75%);
          background-size:200% 100%;animation:shimmer 1.2s infinite;"></div>
      </div>
    </div>
  `).join("");
}

// ============================================================
//  OPEN CHAT
// ============================================================
async function openChat(user) {
  // Guard: prevent double-open if same contact clicked rapidly
  if (activeChatId === getChatId(currentUser.uid, user.id)) return;

  if (unsubMessages) { unsubMessages(); unsubMessages = null; }
  if (unsubTyping)   { unsubTyping();   unsubTyping   = null; }

  activeContact = user;
  activeChatId  = getChatId(currentUser.uid, user.id);

  // Highlight in sidebar
  document.querySelectorAll(".contact-item").forEach(el =>
    el.classList.toggle("active", el.dataset.id === user.id)
  );

  // Update header — displayName defined HERE before use
  const color       = stringToColor(user.id);
  const displayName = user.fullName || user.email || "Unknown";
  const initials    = getInitials(displayName);

  if (user.profilePic) {
    headerAvatar.style.background = "";
    headerAvatar.innerHTML = `<img src="${user.profilePic}"
      style="width:100%;height:100%;border-radius:50%;object-fit:cover;"
      onerror="this.style.display='none';
               this.parentElement.style.background='${color}';
               this.parentElement.textContent='${initials}'">`;
  } else {
    headerAvatar.innerHTML        = initials;
    headerAvatar.style.background = color;
  }

  headerName.textContent = displayName;
  headerStatus.className = "header-status " + (user.status || "offline");
  const statusSub = [user.dept, user.aluPass ? "Batch " + user.aluPass : null, user.company]
    .filter(Boolean).join(" · ");
  headerStatus.textContent =
    user.status === "online" ? "Online" + (statusSub ? " — " + statusSub : "") :
    user.status === "away"   ? "Away" + (statusSub ? " — " + statusSub : "") :
    statusSub || "Offline";   // offline — show dept info instead of dot

  // Show chat pane
  emptyState.style.display = "none";
  chatWindow.style.display = "flex";
  messagesArea.innerHTML   = loadingHTML();

  // Setup chat room & start listeners
  await clearUnread(activeChatId);
  updateContactUnreadBadge(user.id, 0);
  await ensureChatRoom(activeChatId, user);

  listenToMessages(activeChatId);
  unsubTyping = listenToTyping(activeChatId);

  closeSidebar();
  messageInput.focus();
}

function loadingHTML() {
  return `<div style="margin:auto;text-align:center;opacity:.4;">
    <div style="width:32px;height:32px;border:3px solid rgba(100,150,255,.2);
      border-top:3px solid #4d82ff;border-radius:50%;
      animation:spin 1s linear infinite;margin:0 auto 10px;"></div>
    <div style="font-size:12px;color:var(--text-muted);">Loading messages...</div>
  </div>`;
}

// ============================================================
//  ENSURE CHAT ROOM DOC EXISTS
// ============================================================
async function ensureChatRoom(chatId, contact) {
  try {
    const ref  = doc(db, "chats", chatId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        participants:  [currentUser.uid, contact.id],
        lastMessage:   "",
        lastTimestamp: serverTimestamp(),
        [`unread_${currentUser.uid}`]: 0,
        [`unread_${contact.id}`]:      0,
        [`typing_${currentUser.uid}`]: false,
        [`typing_${contact.id}`]:      false
      });
    }
  } catch (err) {
    console.error("❌ ensureChatRoom:", err);
  }
}

// ============================================================
//  LISTEN TO MESSAGES — REAL-TIME
//  FIX: Use docChanges() ONLY — never iterate full snapshot
//       after first load. The rendered Set lives outside the
//       callback so it persists across every snapshot event.
//       This is the fix for duplicate messages.
// ============================================================

// Rendered set lives at module scope per chat session
// Gets reset in openChat() before listenToMessages() is called
let renderedMsgIds = new Set();

function listenToMessages(chatId) {
  const msgsRef = collection(db, "chats", chatId, "messages");
  const q       = query(msgsRef, orderBy("timestamp", "asc"));

  // FIX: Always reset DOM and Set together before attaching listener
  messagesArea.innerHTML = loadingHTML();
  renderedMsgIds = new Set();

  let isFirstSnapshot = true;

  unsubMessages = onSnapshot(q, (snapshot) => {

    if (isFirstSnapshot) {
      // ── FIRST SNAPSHOT: bulk render all existing messages ──
      isFirstSnapshot = false;
      messagesArea.innerHTML = "";

      if (snapshot.empty) {
        messagesArea.innerHTML = emptyConvoHTML();
        scrollToBottom();
        return;
      }

      let lastDateLabel = "";
      snapshot.forEach(docSnap => {
        // FIX: Skip if already rendered (safety guard)
        if (renderedMsgIds.has(docSnap.id)) return;

        const data  = docSnap.data();
        const label = data.timestamp ? getDateLabel(data.timestamp.toDate()) : "Today";

        if (label !== lastDateLabel) {
          const divider       = document.createElement("div");
          divider.className   = "date-divider";
          divider.innerHTML   = `<span>${label}</span>`;
          messagesArea.appendChild(divider);
          lastDateLabel = label;
        }

        renderMessage(docSnap.id, data, false);
        renderedMsgIds.add(docSnap.id);   // mark as rendered
      });

      scrollToBottom();
      return;
    }

    // ── SUBSEQUENT SNAPSHOTS: only handle docChanges ──
    // FIX: Never re-iterate snapshot.forEach here — that caused duplicates
    snapshot.docChanges().forEach(change => {
      if (change.type !== "added") return;               // ignore modified/removed
      if (renderedMsgIds.has(change.doc.id)) return;     // already in DOM — skip

      const data = change.doc.data();

      // Clear "no messages yet" placeholder if present
      const placeholder = messagesArea.querySelector(".empty-convo");
      if (placeholder) placeholder.remove();

      renderMessage(change.doc.id, data, true);
      renderedMsgIds.add(change.doc.id);
      scrollToBottom();

      // Hide typing indicator on incoming message
      if (data.senderId !== currentUser.uid) {
        if (typingIndicator) typingIndicator.style.display = "none";
      }
    });

  }, err => {
    console.error("❌ Messages listener:", err);
    showToast("Connection issue — messages may be delayed.", "error");
  });
}

function emptyConvoHTML() {
  return `
    <div class="empty-convo" style="
      margin:auto;text-align:center;opacity:.6;padding:20px;">
      <div style="font-size:40px;margin-bottom:10px;">💬</div>
      <div style="font-family:'Sora',sans-serif;font-size:15px;
        font-weight:600;color:var(--text-secondary);margin-bottom:4px;">
        No messages yet
      </div>
      <div style="font-size:13px;color:var(--text-muted);">
        Say hello to ${escapeHTML(activeContact?.fullName || activeContact?.email || "this alumni")}!
      </div>
    </div>`;
}

// ============================================================
//  RENDER ONE BUBBLE
// ============================================================
function renderMessage(msgId, data, animate) {
  const isSent = data.senderId === currentUser.uid;
  const time   = data.timestamp ? formatTime(data.timestamp.toDate()) : "Just now";

  const row          = document.createElement("div");
  row.className      = "message-row " + (isSent ? "sent" : "received");
  row.dataset.msgid  = msgId;
  row.dataset.sender = data.senderId;
  if (!animate) row.style.animation = "none";

  const tick = isSent ? `<i class="fa-solid fa-check-double read-tick"></i>` : "";

  row.innerHTML = `
    <div class="bubble">
      ${escapeHTML(data.text)}
      <div class="bubble-time">${time} ${tick}</div>
    </div>
  `;

  // Click handler: in select mode — toggle selection; else ignore
  row.addEventListener("click", () => {
    if (!selectMode) return;
    toggleMessageSelection(row, msgId, data.senderId);
  });

  messagesArea.appendChild(row);
}

// ── Toggle a message's selected state ──
function toggleMessageSelection(row, msgId, senderId) {
  // Only allow deleting own messages
  if (senderId !== currentUser.uid) {
    showToast("You can only delete your own messages.", "fill");
    return;
  }
  if (selectedMsgIds.has(msgId)) {
    selectedMsgIds.delete(msgId);
    row.classList.remove("selected");
  } else {
    selectedMsgIds.add(msgId);
    row.classList.add("selected");
  }
  updateSelectCount();
}

function updateSelectCount() {
  if (!selectCount) return;
  const n = selectedMsgIds.size;
  selectCount.textContent = n === 0 ? "Tap messages to select"
    : n === 1 ? "1 selected" : `${n} selected`;
  if (deleteSelectedBtn) { deleteSelectedBtn.style.opacity = n > 0 ? "1" : "0.4"; deleteSelectedBtn.style.pointerEvents = n > 0 ? "auto" : "none"; }
}

// ============================================================
//  SEND MESSAGE
//  FIX: isSending guard prevents double-send on rapid clicks
//       or Enter key spam
// ============================================================
let isSending = false;

async function sendMessage() {
  if (isSending) return;                                  // guard against double-send
  const text = messageInput.value.trim();
  if (!text || !activeContact || !activeChatId) return;

  isSending = true;

  // Optimistic UI clear
  messageInput.value        = "";
  messageInput.style.height = "auto";
  sendBtn.disabled          = true;
  closeEmojiPicker();
  setTypingStatus(false);
  clearTimeout(typingTimer);

  try {
    // 1. Write message document
    await addDoc(collection(db, "chats", activeChatId, "messages"), {
      text,
      senderId:   currentUser.uid,
      senderName: currentProfile?.fullName || currentUser.displayName || currentUser.email,
      timestamp:  serverTimestamp()
    });

    // 2. Update chat room metadata
    const chatRef    = doc(db, "chats", activeChatId);
    const chatSnap   = await getDoc(chatRef);
    const prevUnread = chatSnap.exists()
      ? (chatSnap.data()[`unread_${activeContact.id}`] || 0) : 0;

    await updateDoc(chatRef, {
      lastMessage:   text,
      lastTimestamp: serverTimestamp(),
      [`unread_${activeContact.id}`]: prevUnread + 1
    });

    // Invalidate meta cache so contact list reflects new lastMessage instantly
    cacheClear();

  } catch (err) {
    console.error("❌ sendMessage:", err);
    showToast("Failed to send. Check your connection.", "error");
    messageInput.value = text;
    updateSendBtn();
  } finally {
    isSending = false;   // always release the guard
  }
}

// ============================================================
//  UNREAD MANAGEMENT
// ============================================================
async function clearUnread(chatId) {
  try {
    const ref  = doc(db, "chats", chatId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { [`unread_${currentUser.uid}`]: 0 });
    }
  } catch (_) {}
}

function updateContactUnreadBadge(contactId, count) {
  const badge = document.querySelector(`.contact-item[data-id="${contactId}"] .unread-badge`);
  if (!badge) return;
  count <= 0 ? badge.remove() : (badge.textContent = count);
}

// ============================================================
//  TYPING INDICATOR
// ============================================================
async function setTypingStatus(isTyping) {
  if (!activeChatId || !currentUser) return;
  try {
    await updateDoc(doc(db, "chats", activeChatId), {
      [`typing_${currentUser.uid}`]: isTyping
    });
  } catch (_) {}
}

function listenToTyping(chatId) {
  return onSnapshot(doc(db, "chats", chatId), (snap) => {
    if (!snap.exists() || !activeContact) return;
    const data     = snap.data();
    const theyType = data[`typing_${activeContact.id}`] === true;

    if (typingName) typingName.textContent = (activeContact.fullName || activeContact.name || "").split(" ")[0];
    if (typingIndicator) typingIndicator.style.display = theyType ? "flex" : "none";
    if (theyType) scrollToBottom();
  });
}

// ============================================================
//  AUTH PROMPT
// ============================================================
function showAuthPrompt() {
  if (!emptyState) return;
  emptyState.style.display = "flex";
  if (chatWindow) chatWindow.style.display = "none";
  emptyState.innerHTML = `
    <div class="empty-icon"><i class="fa-solid fa-lock"></i></div>
    <h2>Login Required</h2>
    <p>You need to be logged in to access the Alumni Chat.</p>
    <a href="/login" style="
      display:inline-flex;align-items:center;gap:8px;
      background:linear-gradient(135deg,#1d5cff,#00d4ff);
      color:#fff;border:none;border-radius:99px;padding:11px 24px;
      font-family:'DM Sans',sans-serif;font-size:14px;font-weight:700;
      text-decoration:none;margin-top:8px;
      box-shadow:0 4px 20px rgba(29,92,255,.35);">
      <i class="fa-solid fa-right-to-bracket"></i> Go to Login
    </a>`;
}

// ============================================================
//  EMOJI PICKER
// ============================================================
function buildEmojiPicker() {
  EMOJIS.forEach(emoji => {
    const span       = document.createElement("span");
    span.className   = "emoji-item";
    span.textContent = emoji;
    span.addEventListener("click", () => {
      insertAtCursor(messageInput, emoji);
      messageInput.focus();
      updateSendBtn();
    });
    emojiGrid.appendChild(span);
  });
}

function toggleEmojiPicker() {
  emojiOpen = !emojiOpen;
  emojiPicker.style.display = emojiOpen ? "block" : "none";
}

function closeEmojiPicker() {
  emojiOpen = false;
  emojiPicker.style.display = "none";
}

function insertAtCursor(el, text) {
  const s = el.selectionStart, e = el.selectionEnd;
  el.value = el.value.slice(0, s) + text + el.value.slice(e);
  el.selectionStart = el.selectionEnd = s + text.length;
}

// ============================================================
//  SIDEBAR (mobile)
// ============================================================
function openSidebar()  {
  sidebar?.classList.add("open");
  overlay?.classList.add("show");
}
function closeSidebar() {
  sidebar?.classList.remove("open");
  overlay?.classList.remove("show");
}

// ============================================================
//  HELPERS
// ============================================================
function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

function getInitials(name) {
  return (name || "?").split(" ").slice(0, 2)
    .map(n => n[0]?.toUpperCase() || "").join("");
}

function stringToColor(str) {
  const palette = [
    "#1d5cff","#00d4ff","#7b5ef7","#30d158",
    "#ff9f0a","#ff453a","#bf5af2","#32ade6"
  ];
  let hash = 0;
  for (let i = 0; i < (str || "").length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function formatTime(date) {
  const d = new Date(date), now = new Date();
  const same = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (same(d, now)) {
    const h = d.getHours(), m = d.getMinutes().toString().padStart(2, "0");
    return `${h % 12 || 12}:${m} ${h >= 12 ? "PM" : "AM"}`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (same(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function getDateLabel(date) {
  const d = new Date(date), now = new Date();
  const same = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (same(d, now)) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (same(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long"
  });
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    messagesArea.scrollTop = messagesArea.scrollHeight;
  });
}

function escapeHTML(str) {
  if (!str) return "";
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

function showToast(msg, type = "error") {
  const t = document.createElement("div");
  t.className       = `popup ${type}`;
  t.style.transform = "translateX(-50%)";
  t.textContent     = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function updateSendBtn() {
  if (sendBtn && messageInput) sendBtn.disabled = messageInput.value.trim().length === 0;
}

function autoResizeTextarea() {
  if (!messageInput) return;
  messageInput.addEventListener("input", () => {
    messageInput.style.height = "auto";
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + "px";
    updateSendBtn();
  });
}

// ============================================================
//  MORE OPTIONS DROPDOWN
// ============================================================
function toggleDropdown() {
  moreDropdown.classList.toggle("open");
}
function closeDropdown() {
  moreDropdown.classList.remove("open");
}

// ============================================================
//  SELECT MODE
// ============================================================
function enterSelectMode() {
  selectMode = true;
  selectedMsgIds.clear();
  messagesArea?.classList.add("select-mode");
  if (selectToolbar) selectToolbar.style.display = "flex";
  if (headerActions) headerActions.style.display = "none";
  updateSelectCount();
  closeDropdown();
  showToast("Tap your messages to select them", "success");
}

function exitSelectMode() {
  selectMode = false;
  selectedMsgIds.clear();
  messagesArea?.classList.remove("select-mode");
  if (selectToolbar) selectToolbar.style.display = "none";
  if (headerActions) headerActions.style.display = "flex";
  document.querySelectorAll(".message-row.selected")
    .forEach(r => r.classList.remove("selected"));
}

// ============================================================
//  DELETE SELECTED MESSAGES
// ============================================================
function showDeleteModal(title, desc, onConfirm) {
  if (!deleteModal) { onConfirm(); return; }  // no modal? just run
  if (deleteModalTitle) deleteModalTitle.textContent = title;
  if (deleteModalDesc)  deleteModalDesc.textContent  = desc;
  deleteModal.style.display = "flex";
  if (confirmDeleteBtn) {
    confirmDeleteBtn.onclick = async () => {
      if (deleteModal) deleteModal.style.display = "none";
      await onConfirm();
    };
  }
}

async function deleteSelectedMessages() {
  if (selectedMsgIds.size === 0) return;
  const count = selectedMsgIds.size;

  showDeleteModal(
    count === 1 ? "Delete Message?" : `Delete ${count} Messages?`,
    "This will permanently delete the selected messages for everyone.",
    async () => {
      try {
        // Delete each message from Firestore
        const deletePromises = [...selectedMsgIds].map(msgId =>
          deleteDoc(doc(db, "chats", activeChatId, "messages", msgId))
        );
        await Promise.all(deletePromises);

        // Remove from DOM immediately (listener will also fire but Set guards duplicates)
        selectedMsgIds.forEach(msgId => {
          const el = document.querySelector(`.message-row[data-msgid="${msgId}"]`);
          if (el) el.remove();
        });

        exitSelectMode();
        showToast(`${count} message${count > 1 ? "s" : ""} deleted.`, "success");

      } catch (err) {
        console.error("❌ deleteSelectedMessages:", err);
        showToast("Failed to delete. Check your permissions.", "error");
        exitSelectMode();
      }
    }
  );
}

async function clearMyChat() {
  closeDropdown();
  showDeleteModal(
    "Clear Chat?",
    "This will delete ALL your sent messages in this conversation permanently.",
    async () => {
      try {
        // Query only MY messages in this chat
        const msgsRef = collection(db, "chats", activeChatId, "messages");
        const q = query(msgsRef, where("senderId", "==", currentUser.uid));
        const snap = await getDocs(q);

        const batch = writeBatch(db);
        snap.forEach(d => batch.delete(d.ref));
        await batch.commit();

        cacheClear();
        showToast("Your messages cleared.", "success");
      } catch (err) {
        console.error("❌ clearMyChat:", err);
        showToast("Failed to clear chat.", "error");
      }
    }
  );
}

// ============================================================
//  EVENT LISTENERS
// ============================================================
function setupEventListeners() {
  // Every element uses ?. so a missing HTML id never crashes the app

  sendBtn?.addEventListener("click", sendMessage);

  messageInput?.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  messageInput?.addEventListener("input", () => {
    if (!activeChatId) return;
    setTypingStatus(true);
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => setTypingStatus(false), 2000);
  });

  searchInput?.addEventListener("input", () => renderContactsWithFilter());

  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      renderContactsWithFilter();
    });
  });

  emojiBtn?.addEventListener("click", e => { e.stopPropagation(); toggleEmojiPicker(); });

  document.addEventListener("click", e => {
    if (emojiPicker && !emojiPicker.contains(e.target) && e.target !== emojiBtn)
      closeEmojiPicker();
    if (moreDropdown && !moreDropdown.contains(e.target) && e.target !== moreBtn)
      closeDropdown();
  });

  openSidebarBtn?.addEventListener("click", openSidebar);
  sidebarClose?.addEventListener("click", closeSidebar);
  overlay?.addEventListener("click", closeSidebar);

  backBtn?.addEventListener("click", () => {
    if (unsubMessages) { unsubMessages(); unsubMessages = null; }
    if (unsubTyping)   { unsubTyping();   unsubTyping   = null; }
    setTypingStatus(false);
    clearTimeout(typingTimer);
    if (emptyState) emptyState.style.display = "flex";
    if (chatWindow) chatWindow.style.display = "none";
    activeContact = null;
    activeChatId  = null;
    openSidebar();
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      closeEmojiPicker();
      closeDropdown();
      if (selectMode) exitSelectMode();
    }
  });

  // More options dropdown
  moreBtn?.addEventListener("click", e => {
    e.stopPropagation();
    toggleDropdown();
  });

  // Dropdown menu items
  selectMsgsBtn?.addEventListener("click", enterSelectMode);
  clearChatBtn?.addEventListener("click",  clearMyChat);
  blockUserBtn?.addEventListener("click",  () => {
    closeDropdown();
    showToast("Block feature coming soon.", "fill");
  });

  // Select mode toolbar buttons
  deleteSelectedBtn?.addEventListener("click", deleteSelectedMessages);
  cancelSelectBtn?.addEventListener("click",   exitSelectMode);

  // Delete confirmation modal
  cancelDeleteBtn?.addEventListener("click", () => {
    if (deleteModal) deleteModal.style.display = "none";
  });
  deleteModal?.addEventListener("click", e => {
    if (e.target === deleteModal) deleteModal.style.display = "none";
  });
}

// ── START ────────────────────────────────────────────────────
init();