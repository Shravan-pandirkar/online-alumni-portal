// ============================================================
//  SGDTP ALUMNI PORTAL — chat_feature.js
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

// Apply saved theme immediately (module scripts are deferred — DOM exists)
applyTheme(localStorage.getItem(THEME_KEY) || "dark");

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("themeToggle")?.addEventListener("click", toggleTheme);
});

// ── END THEME TOGGLE ──────────────────────────────────────

// ============================================================
//  FIREBASE IMPORTS
// ============================================================
import { initializeApp }       from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
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

// ============================================================
//  WORD FILTER
// ============================================================
const BAD_WORDS = [
  "motherfucker","motherfuckers","mf",
  "fuck","fucking","fucker","fucked","fucks",
  "shit","shitty","bullshit","Sexy","sexy","SEXY","bhenchod",
  "bastard","bastards",
  "bitch","bitches",
  "asshole","assholes","ass",
  "dick","dicks",
  "cunt","cunts",
  "nigger","nigga",
  "faggot","fag",
  "retard","retarded",
  "whore","slut",
  "piss","pissed",
  "damn","bloody hell",
  "madarchod","bhosdike","chutiya","chutiye","benchode","lund","gandu","gand","loda","lodu","randi","rande","bhonsdi","bhonsde","bhosdi","bhosde","bhosdike","bhosdike","bhosdike","bhosdike","bhosdike","bhosdike","bhosdike","bhosdike","bhosdike","bhosdike",
  "chutiya","chutiye","chutiyapa","chutiyepan","chutiyagiri","chutiyagiri","chutiyagiri","chutiyagiri","chutiyagiri","chutiyagiri","chutiyagiri","chutiyagiri",
  "benchode","benchod","bhenchod","bhenchoda","bhenchode","bhenchodaa","bhenchodey","bhenchodna","bhenchodne","bhenchodni","bhenchodnhi",
  "lund","loda","lodu","lodu","lodu","lodu","lodu","lodu","lodu",
  "gandu","gand","gandu","gand","gandu","gand","gandu","gand","gandu",
  "randi","rande","rand","randi","rande","rand","randi","rande",
  "bhosdi","gaand","lavda","lund","randi","lavday","lavdya",
  "saala","saali","sexy","sex","xxx",
  "harami","kamina","kamine",
  "bkl","mkc","bc","mc"
];

function censorText(text) {
  let result = text;
  BAD_WORDS.forEach(word => {
    const regex    = new RegExp(word, "gi");
    const censored = word.length <= 2
      ? "*".repeat(word.length)
      : word[0] + "*".repeat(word.length - 2) + word[word.length - 1];
    result = result.replace(regex, censored);
  });
  return result;
}

// ============================================================
//  AUTO-CORRECT
// ============================================================
const AUTOCORRECT_MAP = {
  "teh":"the","hwo":"how","waht":"what","thier":"their","thre":"there",
  "becuase":"because","becaus":"because","recieve":"receive","recieved":"received",
  "definately":"definitely","definitly":"definitely","occured":"occurred",
  "tommorrow":"tomorrow","tommorow":"tomorrow","goverment":"government",
  "seperate":"separate","untill":"until","occassion":"occasion",
  "adress":"address","calender":"calendar","collegue":"colleague",
  "accomodate":"accommodate","achievment":"achievement","beleive":"believe",
  "wierd":"weird","freind":"friend","freinds":"friends","peice":"piece",
  "reccomend":"recommend","succesful":"successful","truely":"truly",
  "arguement":"argument","enviroment":"environment","experiance":"experience",
  "independant":"independent","knowlege":"knowledge","persue":"pursue",
  "proffessor":"professor","relevent":"relevant","responsibilty":"responsibility",
  "similer":"similar","wich":"which","writting":"writing",
  "youre":"you're","cant":"can't","wont":"won't","dont":"don't",
  "didnt":"didn't","isnt":"isn't","wasnt":"wasn't","werent":"weren't",
  "havent":"haven't","hasnt":"hasn't","hadnt":"hadn't",
  "im":"I'm","ive":"I've","id":"I'd","ill":"I'll"
};

function autoCorrect(text) {
  return text.split(" ").map(word => {
    const lower      = word.toLowerCase();
    const correction = AUTOCORRECT_MAP[lower];
    if (!correction) return word;
    return (word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase())
      ? correction[0].toUpperCase() + correction.slice(1)
      : correction;
  }).join(" ");
}

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
let selectMode     = false;
let replyingTo     = null;
let pinnedMessages = [];
let selectedMsgIds = new Set();

// ── DOM ──────────────────────────────────────────────────────
function el(id) {
  const e = document.getElementById(id);
  if (!e) console.warn(`[Chat] Missing element: #${id}`);
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
const replyBar         = el("replyBar");
const replyBarClose    = el("replyBarClose");
const pinnedBanner     = el("pinnedBanner");
const pinnedClose      = el("pinnedClose");
const pinnedText       = el("pinnedText");
const pinBar           = el("pinBar");
const pinBarClose      = el("pinBarClose");

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
      currentProfile = await ensureUserProfile(user);
      await setOnlineStatus(true);
      populateMyProfile();
      setupProfileDropdown();
      loadContacts();
    } else {
      showAuthPrompt();
    }
  });

  window.addEventListener("beforeunload", () => setOnlineStatus(false));
  window.addEventListener("pagehide",      () => setOnlineStatus(false));
}

// ============================================================
//  ENSURE USER PROFILE
// ============================================================
async function ensureUserProfile(user) {
  const userRef = doc(db, "users", user.uid);
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      await updateDoc(userRef, { status: "online" });
      return { id: user.uid, ...snap.data() };
    }
    const fullName = user.displayName
      || user.email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    const newProfile = {
      fullName, email: user.email, role: "alumni",
      dept: "", aluPass: "", company: "", status: "online",
      profilePic: user.photoURL || "", createdAt: serverTimestamp()
    };
    await setDoc(userRef, newProfile);
    return { id: user.uid, ...newProfile };
  } catch (err) {
    console.error("ensureUserProfile:", err);
    return { id: user.uid, fullName: user.displayName || user.email, email: user.email, role: "alumni", status: "online" };
  }
}

async function setOnlineStatus(isOnline) {
  if (!currentUser) return;
  try { await updateDoc(doc(db, "users", currentUser.uid), { status: isOnline ? "online" : "offline" }); } catch (_) {}
}

// ============================================================
//  CACHE
// ============================================================
const CACHE_KEY_USERS = "sgdtp_chat_alumni";
const CACHE_KEY_META  = "sgdtp_chat_meta";
const CACHE_TTL_MS    = 5 * 60 * 1000;

function cacheSet(key, data) {
  try { sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch(_) {}
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
//  LOAD CONTACTS
// ============================================================
function loadContacts() {
  if (!contactsList) return;

  if (!contactsList._delegated) {
    contactsList._delegated = true;
    contactsList.addEventListener("click", e => {
      const item = e.target.closest(".contact-item");
      if (!item?.dataset.id) return;
      const user = allContacts.find(u => u.id === item.dataset.id);
      if (user) openChat(user);
    });
  }

  const cachedUsers = cacheGet(CACHE_KEY_USERS);
  const cachedMeta  = cacheGet(CACHE_KEY_META);
  if (cachedUsers?.length > 0) {
    allContacts = mergeUsersWithMeta(cachedUsers, cachedMeta || {});
    renderContacts(filterContacts(allContacts));
  } else {
    showContactsSkeleton();
  }

  if (unsubContacts) unsubContacts();

  const myRole = (currentProfile?.role || "alumni").toLowerCase();
  const rolesToLoad =
    myRole === "teacher" ? ["alumni","Alumni","student","Student","teacher","Teacher"] :
    myRole === "alumni"  ? ["alumni","Alumni","student","Student"] :
                           ["alumni","Alumni"];

  unsubContacts = onSnapshot(
    query(collection(db, "users"), where("role", "in", rolesToLoad)),
    async (snapshot) => {
      let users = [];
      snapshot.forEach(s => { if (s.id !== currentUser.uid) users.push({ id: s.id, ...s.data() }); });

      if (users.length === 0) {
        try {
          const allSnap = await getDocs(collection(db, "users"));
          allSnap.forEach(s => { if (s.id !== currentUser.uid) users.push({ id: s.id, ...s.data() }); });
        } catch(e) { console.error("Fallback failed:", e); }
      }

      if (users.length === 0) {
        contactsList.innerHTML = `<div class="no-results">
          <i class="fa-solid fa-users-slash"></i>
          ${myRole === "student" ? "No alumni registered yet" : "No contacts found"}
        </div>`;
        return;
      }

      const knownMeta = cacheGet(CACHE_KEY_META) || {};
      allContacts = mergeUsersWithMeta(users, knownMeta);
      cacheSet(CACHE_KEY_USERS, users);
      renderContacts(filterContacts(allContacts));

      fetchAllChatMeta(users).then(chatMetaMap => {
        const serializableMeta = {};
        Object.entries(chatMetaMap).forEach(([k, v]) => {
          serializableMeta[k] = {
            lastMessage:   v.lastMessage  || "",
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
        patchOrRerenderContacts();
      });
    },
    err => {
      console.error("loadContacts:", err);
      contactsList.innerHTML = `<div class="no-results">
        <i class="fa-solid fa-circle-exclamation"></i>
        <span>Could not load contacts.<br>Check Firestore rules.</span>
      </div>`;
    }
  );
}

function patchOrRerenderContacts() {
  const filtered    = filterContacts(allContacts);
  const existingIds = [...contactsList.querySelectorAll(".contact-item[data-id]")].map(e => e.dataset.id);
  const newIds      = filtered.map(u => u.id);
  const orderChanged = existingIds.length !== newIds.length || existingIds.some((id, i) => id !== newIds[i]);

  if (orderChanged) { renderContacts(filtered); return; }

  filtered.forEach(user => {
    const item = contactsList.querySelector(`.contact-item[data-id="${user.id}"]`);
    if (!item) return;
    const lastPreview = previews[previews.length - 1];
    if (lastPreview) lastPreview.textContent = user.lastMessage || "Say hello 👋";
    const timeEl = item.querySelector(".contact-time");
    if (timeEl) timeEl.textContent = user.lastTime || "";
    const oldBadge = item.querySelector(".unread-badge");
    if (user.unread > 0) {
      if (oldBadge) { oldBadge.textContent = user.unread; }
      else {
        const meta  = item.querySelector(".contact-meta");
        const badge = document.createElement("span");
        badge.className   = "unread-badge";
        badge.textContent = user.unread;
        meta?.appendChild(badge);
      }
    } else { oldBadge?.remove(); }
  });
}

function filterContacts(list) {
  const q = (searchInput?.value || "").toLowerCase().trim();
  let out = list.filter(u =>
    (u.fullName    || "").toLowerCase().includes(q) ||
    (u.dept        || "").toLowerCase().includes(q) ||
    (u.aluPass     || "").includes(q) ||
    (u.stuYear     || "").includes(q) ||
    (u.company     || "").toLowerCase().includes(q) ||
    (u.committee   || "").toLowerCase().includes(q) ||
    (u.designation || "").toLowerCase().includes(q) ||
    (u.email       || "").toLowerCase().includes(q) ||
    (u.role        || "").toLowerCase().includes(q)
  );
  if (currentFilter === "online") out = out.filter(u => u.status === "online");
  if (currentFilter === "unread") out = out.filter(u => u.unread > 0);
  return out;
}

function renderContactsWithFilter() { renderContacts(filterContacts(allContacts)); }

function mergeUsersWithMeta(users, metaMap) {
  return users.map(u => {
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
  }).sort((a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0));
}

async function fetchAllChatMeta(users) {
  const metaMap = {};
  await Promise.allSettled(users.map(async u => {
    const chatId = getChatId(currentUser.uid, u.id);
    try {
      const snap = await getDoc(doc(db, "chats", chatId));
      if (snap.exists()) metaMap[chatId] = snap.data();
    } catch(_) {}
  }));
  return metaMap;
}

// ============================================================
//  RENDER CONTACTS
// ============================================================
function renderContacts(list) {
  if (!contactsList) return;

  if (list.length === 0) {
    contactsList.innerHTML = `<div class="no-results">
      <i class="fa-solid fa-user-slash"></i> No contacts found
    </div>`;
    return;
  }

  const frag = document.createDocumentFragment();

  list.forEach((user, i) => {
    const item     = document.createElement("div");
    item.className = "contact-item" + (activeContact?.id === user.id ? " active" : "");
    item.dataset.id = user.id;
    item.style.animationDelay = `${i * 0.03}s`;

    const color     = stringToColor(user.id);
    const initials  = getInitials(user.fullName || user.email || "?");
    const roleLabel = (user.role || "").toLowerCase();

    const avatarHTML = user.profilePic
      ? `<img src="${user.profilePic}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid rgba(100,150,255,.4);"
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="avatar-circle" style="background:${color};display:none">${initials}</div>`
      : `<div class="avatar-circle" style="background:${color}">${initials}</div>`;

    const roleBadgeHTML =
      roleLabel === "alumni"  ? `<span style="display:inline-block;padding:1px 8px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;background:rgba(29,92,255,.18);color:#7aa3ff;border:1px solid rgba(29,92,255,.35);margin-right:5px;">Alumni</span>` :
      roleLabel === "student" ? `<span style="display:inline-block;padding:1px 8px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;background:rgba(34,197,94,.15);color:#6ee7a7;border:1px solid rgba(34,197,94,.30);margin-right:5px;">Student</span>` :
      roleLabel === "teacher" ? `<span style="display:inline-block;padding:1px 8px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;background:rgba(245,158,11,.15);color:#fcd34d;border:1px solid rgba(245,158,11,.30);margin-right:5px;">Teacher</span>` : "";

    const subtitleParts =
      roleLabel === "alumni"  ? [user.dept, user.aluPass ? "Batch "+user.aluPass : null, user.company] :
      roleLabel === "student" ? [user.dept, user.stuYear ? "Year "+user.stuYear : null, user.committee] :
      roleLabel === "teacher" ? [user.dept, user.designation] : [user.dept];
    const subtitle = subtitleParts.filter(Boolean).join(" · ") || user.email || "";

    item.innerHTML = `
      <div class="contact-avatar">
        ${avatarHTML}
        ${(user.status === "online" || user.status === "away") ? `<span class="status-dot ${user.status}"></span>` : ""}
      </div>
      <div class="contact-info">
        <div class="contact-name">${escapeHTML(user.fullName || user.email || "Unknown")}</div>
        <div style="margin-bottom:3px;">${roleBadgeHTML}</div>
        <div class="contact-preview" style="color:var(--text-muted);font-size:11px;margin-bottom:2px;">
          ${escapeHTML(subtitle)}
        </div>
      </div>
      <div class="contact-meta">
        <span class="contact-time">${user.lastTime || ""}</span>
        ${user.unread > 0 ? `<span class="unread-badge">${user.unread}</span>` : ""}
      </div>`;

    frag.appendChild(item);
  });

  contactsList.innerHTML = "";
  contactsList.appendChild(frag);
}

function showContactsSkeleton() {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 6; i++) {
    const item = document.createElement("div");
    item.className = "contact-item";
    item.style.pointerEvents = "none";
    item.innerHTML = `
      <div class="contact-avatar">
        <div style="width:44px;height:44px;border-radius:50%;
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
      </div>`;
    frag.appendChild(item);
  }
  contactsList.innerHTML = "";
  contactsList.appendChild(frag);
}

// ============================================================
//  OPEN CHAT
// ============================================================
async function openChat(user) {
  if (activeChatId === getChatId(currentUser.uid, user.id)) return;

  if (unsubMessages) { unsubMessages(); unsubMessages = null; }
  if (unsubTyping)   { unsubTyping();   unsubTyping   = null; }

  activeContact = user;
  activeChatId  = getChatId(currentUser.uid, user.id);
  Object.keys(reactionCache).forEach(k => delete reactionCache[k]);

  document.querySelectorAll(".contact-item").forEach(el =>
    el.classList.toggle("active", el.dataset.id === user.id)
  );

  const color       = stringToColor(user.id);
  const displayName = user.fullName || user.email || "Unknown";
  const initials    = getInitials(displayName);

  if (user.profilePic) {
    headerAvatar.style.background = "";
    headerAvatar.innerHTML = `<img src="${user.profilePic}"
      style="width:100%;height:100%;border-radius:50%;object-fit:cover;"
      onerror="this.style.display='none';this.parentElement.style.background='${color}';this.parentElement.textContent='${initials}'">`;
  } else {
    headerAvatar.innerHTML        = initials;
    headerAvatar.style.background = color;
  }

  headerName.textContent = displayName;
  headerStatus.className = "header-status " + (user.status || "offline");
  const roleL = (user.role || "").toLowerCase();
  const statusSubParts =
    roleL === "alumni"  ? [user.dept, user.aluPass ? "Batch "+user.aluPass : null, user.company] :
    roleL === "student" ? [user.dept, user.stuYear ? "Year "+user.stuYear : null, user.committee] :
    roleL === "teacher" ? [user.dept, user.designation] : [user.dept];
  const statusSub = statusSubParts.filter(Boolean).join(" · ");
  headerStatus.textContent =
    user.status === "online" ? "Online"+(statusSub ? " — "+statusSub : "") :
    user.status === "away"   ? "Away"  +(statusSub ? " — "+statusSub : "") :
    statusSub || "Offline";

  emptyState.style.display = "none";
  chatWindow.style.display = "flex";
  messagesArea.innerHTML   = loadingHTML();

  await clearUnread(activeChatId);
  updateContactUnreadBadge(user.id, 0);
  await ensureChatRoom(activeChatId, user);

  pinnedMessages = [];
  cancelReply();
  updatePinBar();
  loadPinnedMessages(activeChatId);
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
//  ENSURE CHAT ROOM DOC
// ============================================================
async function ensureChatRoom(chatId, contact) {
  try {
    const ref  = doc(db, "chats", chatId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        participants: [currentUser.uid, contact.id],
        lastMessage: "", lastTimestamp: serverTimestamp(),
        [`unread_${currentUser.uid}`]: 0, [`unread_${contact.id}`]: 0,
        [`typing_${currentUser.uid}`]: false, [`typing_${contact.id}`]: false
      });
    }
  } catch (err) { console.error("ensureChatRoom:", err); }
}

// ============================================================
//  MESSAGES — REAL-TIME
// ============================================================
let renderedMsgIds = new Set();

function listenToMessages(chatId) {
  const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"));
  messagesArea.innerHTML = loadingHTML();
  renderedMsgIds = new Set();
  let isFirstSnapshot = true;

  unsubMessages = onSnapshot(q, (snapshot) => {
    if (isFirstSnapshot) {
      isFirstSnapshot = false;
      messagesArea.innerHTML = "";
      if (snapshot.empty) { messagesArea.innerHTML = emptyConvoHTML(); scrollToBottom(); return; }

      const frag = document.createDocumentFragment();
      let lastDateLabel = "";

      snapshot.forEach(docSnap => {
        if (renderedMsgIds.has(docSnap.id)) return;
        const data  = docSnap.data();
        const label = data.timestamp ? getDateLabel(data.timestamp.toDate()) : "Today";
        if (label !== lastDateLabel) {
          const div = document.createElement("div");
          div.className = "date-divider";
          div.innerHTML = `<span>${label}</span>`;
          frag.appendChild(div);
          lastDateLabel = label;
        }
        if (data.reactions) reactionCache[docSnap.id] = { ...data.reactions };
        frag.appendChild(buildMessageRow(docSnap.id, data, false));
        renderedMsgIds.add(docSnap.id);
      });

      messagesArea.appendChild(frag);
      scrollToBottom();
      return;
    }

    snapshot.docChanges().forEach(change => {
      if (change.type === "modified") {
        const data = change.doc.data();
        if (data.reactions) { reactionCache[change.doc.id] = { ...data.reactions }; updateReactionRowDOM(change.doc.id, data.reactions); }
        return;
      }
      if (change.type !== "added" || renderedMsgIds.has(change.doc.id)) return;

      const data = change.doc.data();
      if (data.reactions) reactionCache[change.doc.id] = { ...data.reactions };
      else delete reactionCache[change.doc.id];

      messagesArea.querySelector(".empty-convo")?.remove();
      messagesArea.appendChild(buildMessageRow(change.doc.id, data, true));
      renderedMsgIds.add(change.doc.id);
      scrollToBottom();

      if (data.senderId !== currentUser.uid && typingIndicator)
        typingIndicator.style.display = "none";
    });

  }, err => {
    console.error("Messages listener:", err);
    showToast("Connection issue — messages may be delayed.", "error");
  });
}

function emptyConvoHTML() {
  return `<div class="empty-convo" style="margin:auto;text-align:center;opacity:.6;padding:20px;">
    <div style="font-size:40px;margin-bottom:10px;">💬</div>
    <div style="font-family:'Sora',sans-serif;font-size:15px;font-weight:600;color:var(--text-secondary);margin-bottom:4px;">No messages yet</div>
    <div style="font-size:13px;color:var(--text-muted);">Say hello to ${escapeHTML(activeContact?.fullName || activeContact?.email || "this person")}!</div>
  </div>`;
}

// ============================================================
//  CONTEXT MENU
// ============================================================
let ctxMenu = null, ctxMenuMsgId = null, ctxMenuData = null;

function buildContextMenu() {
  if (ctxMenu) return;
  ctxMenu = document.createElement("div");
  ctxMenu.className = "ctx-menu"; ctxMenu.id = "ctxMenu";
  ctxMenu.innerHTML = `
    <div class="ctx-emoji-row">
      ${["👍","❤️","😂","😮","😢","🔥","🙏","👏"].map(e =>
        `<span class="ctx-emoji" data-emoji="${e}">${e}</span>`).join("")}
    </div>
    <div class="ctx-divider"></div>
    <button class="ctx-item" data-action="reply"><i class="fa-solid fa-reply"></i> Reply</button>
    <button class="ctx-item" data-action="copy"><i class="fa-regular fa-copy"></i> Copy</button>
    <button class="ctx-item" data-action="pin"><i class="fa-solid fa-thumbtack"></i> <span class="pin-label">Pin</span></button>
    <button class="ctx-item" data-action="select"><i class="fa-regular fa-check-square"></i> Select</button>
    <div class="ctx-divider"></div>
    <button class="ctx-item ctx-danger" data-action="delete"><i class="fa-solid fa-trash"></i> Delete</button>`;
  document.body.appendChild(ctxMenu);

  ctxMenu.querySelectorAll(".ctx-emoji").forEach(span =>
    span.addEventListener("click", e => {
      e.stopPropagation();
      if (ctxMenuMsgId) sendReaction(ctxMenuMsgId, span.dataset.emoji);
      closeCtxMenu();
    })
  );

  ctxMenu.addEventListener("click", e => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    e.stopPropagation();
    const action = btn.dataset.action, msgId = ctxMenuMsgId, data = ctxMenuData;
    closeCtxMenu();

    if (action === "reply") {
      startReply({ msgId, text: data.text, senderName: data.senderId === currentUser.uid ? "You" : (activeContact?.fullName || "them") });
    } else if (action === "copy") {
      navigator.clipboard.writeText(data.text).then(() => showToast("Copied!", "success")).catch(() => {
        const ta = document.createElement("textarea"); ta.value = data.text;
        document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove();
        showToast("Copied!", "success");
      });
    } else if (action === "pin") {
      togglePin(msgId, data.text, data.senderId);
    } else if (action === "select") {
      enterSelectMode();
      const row = document.querySelector(`.message-row[data-msgid="${msgId}"]`);
      if (row) toggleMessageSelection(row, msgId, data.senderId);
    } else if (action === "delete") {
      if (data.senderId !== currentUser.uid) { showToast("You can only delete your own messages.", "fill"); return; }
      showDeleteModal("Delete Message?", "This will permanently delete this message for everyone.", async () => {
        try {
          await deleteDoc(doc(db, "chats", activeChatId, "messages", msgId));
          document.querySelector(`.message-row[data-msgid="${msgId}"]`)?.remove();
          cacheClear(); showToast("Message deleted.", "success");
        } catch(err) { showToast("Could not delete.", "error"); }
      });
    }
  });

  document.addEventListener("click",   e => { if (ctxMenu && !ctxMenu.contains(e.target)) closeCtxMenu(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeCtxMenu(); });
}

function openCtxMenu(row, msgId, data, triggerEl) {
  buildContextMenu();
  ctxMenuMsgId = msgId; ctxMenuData = data;
  const pinLabel = ctxMenu.querySelector(".pin-label");
  if (pinLabel) pinLabel.textContent = pinnedMessages.some(p => p.msgId === msgId) ? "Unpin" : "Pin";

  ctxMenu.style.visibility = "hidden";
  ctxMenu.style.display    = "block";
  ctxMenu.classList.add("open");

  const menuW = ctxMenu.offsetWidth, menuH = ctxMenu.offsetHeight;
  const isSent = row.classList.contains("sent");
  const rect = (triggerEl || row.querySelector(".bubble") || row).getBoundingClientRect();
  const vpW = window.innerWidth, vpH = window.innerHeight;

  let left = isSent ? rect.left - menuW - 8 : rect.right + 8;
  if (isSent  && left < 8)               left = rect.right + 8;
  if (!isSent && left + menuW > vpW - 8)  left = rect.left - menuW - 8;

  let top = rect.top + window.scrollY;
  if (top + menuH > vpH + window.scrollY - 8) top = vpH + window.scrollY - menuH - 8;
  if (top < window.scrollY + 8) top = window.scrollY + 8;

  ctxMenu.style.left = left+"px"; ctxMenu.style.top = top+"px"; ctxMenu.style.visibility = "visible";
}

function closeCtxMenu() {
  if (!ctxMenu) return;
  ctxMenu.classList.remove("open"); ctxMenu.style.display = "none";
  ctxMenuMsgId = null; ctxMenuData = null;
}

// ============================================================
//  BUILD MESSAGE ROW
// ============================================================
function buildMessageRow(msgId, data, animate) {
  const isSent   = data.senderId === currentUser.uid;
  const time     = data.timestamp ? formatTime(data.timestamp.toDate()) : "Just now";
  const isPinned = pinnedMessages.some(p => p.msgId === msgId);

  const row = document.createElement("div");
  row.className      = "message-row "+(isSent ? "sent" : "received")+(isPinned ? " pinned-msg" : "");
  row.dataset.msgid  = msgId;
  row.dataset.sender = data.senderId;
  row.dataset.text   = data.text;
  if (!animate) row.style.animation = "none";

  const tick      = isSent ? `<i class="fa-solid fa-check-double read-tick"></i>` : "";
  const replyHTML = data.replyTo ? `
    <div class="reply-quote">
      <span class="reply-quote-name">${escapeHTML(data.replyTo.senderName)}</span>
      <span class="reply-quote-text">${escapeHTML(data.replyTo.text.slice(0,80))}${data.replyTo.text.length>80?"…":""}</span>
    </div>` : "";

  const reactMap  = data.reactions || {};
  const reactHTML = Object.keys(reactMap).length > 0 ? `
    <div class="reaction-row">
      ${Object.entries(reactMap).map(([emoji, uids]) =>
        `<span class="reaction-pill ${uids.includes(currentUser.uid)?"mine":""}" data-emoji="${emoji}" title="${uids.length} reaction${uids.length>1?"s":""}">
          ${emoji}${uids.length>1?` <span>${uids.length}</span>`:""}
        </span>`).join("")}
    </div>` : "";

  row.innerHTML = `
    ${isPinned ? `<i class="fa-solid fa-thumbtack pin-icon" title="Pinned"></i>` : ""}
    <div class="bubble">
      ${replyHTML}
      ${escapeHTML(data.text)}
      <div class="bubble-time">${time} ${tick}</div>
    </div>
    ${reactHTML}`;

  row.querySelectorAll(".reaction-pill").forEach(pill =>
    pill.addEventListener("click", e => { e.stopPropagation(); sendReaction(msgId, pill.dataset.emoji); })
  );

  const bubble = row.querySelector(".bubble");
  bubble.addEventListener("contextmenu", e => { e.preventDefault(); if (!selectMode) openCtxMenu(row, msgId, data, bubble); });
  bubble.addEventListener("click", e => {
    if (selectMode) { toggleMessageSelection(row, msgId, data.senderId); return; }
    clearTimeout(bubble._clickTimer);
    bubble._clickTimer = setTimeout(() => openCtxMenu(row, msgId, data, bubble), 180);
  });
  bubble.addEventListener("mousedown", () => clearTimeout(bubble._clickTimer));
  row.addEventListener("click", () => { if (selectMode) toggleMessageSelection(row, msgId, data.senderId); });

  let pressTimer = null;
  row.addEventListener("touchstart", () => { pressTimer = setTimeout(() => { if (!selectMode) openCtxMenu(row, msgId, data, bubble); }, 500); }, { passive: true });
  row.addEventListener("touchend",   () => clearTimeout(pressTimer), { passive: true });
  row.addEventListener("touchmove",  () => clearTimeout(pressTimer), { passive: true });

  return row;
}

function renderMessage(msgId, data, animate) { messagesArea.appendChild(buildMessageRow(msgId, data, animate)); }

function toggleMessageSelection(row, msgId, senderId) {
  if (senderId !== currentUser.uid) { showToast("You can only delete your own messages.", "fill"); return; }
  if (selectedMsgIds.has(msgId)) { selectedMsgIds.delete(msgId); row.classList.remove("selected"); }
  else { selectedMsgIds.add(msgId); row.classList.add("selected"); }
  updateSelectCount();
}

function updateSelectCount() {
  if (!selectCount) return;
  const n = selectedMsgIds.size;
  selectCount.textContent = n===0 ? "Tap messages to select" : n===1 ? "1 selected" : `${n} selected`;
  if (deleteSelectedBtn) { deleteSelectedBtn.style.opacity = n>0?"1":"0.4"; deleteSelectedBtn.style.pointerEvents = n>0?"auto":"none"; }
}

// ============================================================
//  REPLY
// ============================================================
function startReply(msgData) {
  replyingTo = msgData;
  const bar = document.getElementById("replyBar"); if (!bar) return;
  const nameEl = document.getElementById("replyBarName"), textEl = document.getElementById("replyBarText");
  if (nameEl) nameEl.textContent = msgData.senderName;
  if (textEl) textEl.textContent = msgData.text.slice(0,100)+(msgData.text.length>100?"…":"");
  bar.style.display = "flex";
  messageInput?.focus();
}

function cancelReply() {
  replyingTo = null;
  const bar = document.getElementById("replyBar");
  if (bar) bar.style.display = "none";
}

// ============================================================
//  REACT
// ============================================================
const reactionCache = {};

async function sendReaction(msgId, emoji) {
  if (!activeChatId || !currentUser) return;
  const current = reactionCache[msgId]||{}, uids = current[emoji]||[], isMine = uids.includes(currentUser.uid);
  const newUids = isMine ? uids.filter(u=>u!==currentUser.uid) : [...uids, currentUser.uid];
  const updated = { ...current };
  if (newUids.length===0) delete updated[emoji]; else updated[emoji]=newUids;
  reactionCache[msgId] = updated;
  updateReactionRowDOM(msgId, updated);
  try {
    await updateDoc(doc(db, "chats", activeChatId, "messages", msgId), { reactions: updated });
  } catch(err) {
    console.error("sendReaction:", err);
    reactionCache[msgId] = current; updateReactionRowDOM(msgId, current); showToast("Could not save reaction.", "error");
  }
}

function updateReactionRowDOM(msgId, reactMap) {
  const row = document.querySelector(`.message-row[data-msgid="${msgId}"]`); if (!row) return;
  let reactRow = row.querySelector(".reaction-row");
  if (Object.keys(reactMap).length===0) { reactRow?.remove(); return; }
  if (!reactRow) {
    reactRow = document.createElement("div"); reactRow.className="reaction-row";
    (row.querySelector(".bubble")?.insertAdjacentElement("afterend",reactRow)) || row.appendChild(reactRow);
  }
  reactRow.innerHTML = Object.entries(reactMap).map(([emoji,uids]) => {
    const isMine=uids.includes(currentUser.uid), count=uids.length;
    return `<span class="reaction-pill ${isMine?"mine":""} new-reaction" data-emoji="${emoji}" data-msgid="${msgId}" title="${count} reaction${count>1?"s":""}${isMine?" (tap to remove)":""}">
      ${emoji}${count>1?` <span>${count}</span>`:""}
    </span>`;
  }).join("");
  reactRow.querySelectorAll(".reaction-pill").forEach(pill=>pill.addEventListener("click",e=>{e.stopPropagation();sendReaction(pill.dataset.msgid,pill.dataset.emoji);}));
  requestAnimationFrame(()=>reactRow.querySelectorAll(".new-reaction").forEach(p=>p.classList.remove("new-reaction")));
}

// ============================================================
//  PIN / UNPIN
// ============================================================
async function togglePin(msgId, text, senderId) {
  if (!activeChatId) return;
  const alreadyPinned = pinnedMessages.some(p=>p.msgId===msgId);
  if (alreadyPinned) { pinnedMessages=pinnedMessages.filter(p=>p.msgId!==msgId); showToast("Message unpinned.","success"); }
  else {
    if (pinnedMessages.length>=3) { showToast("Max 3 messages can be pinned.","fill"); return; }
    pinnedMessages.push({msgId,text,senderId}); showToast("Message pinned! 📌","success");
  }
  try { await updateDoc(doc(db,"chats",activeChatId),{pinnedMessages}); } catch(_) {}
  updatePinBar(); refreshMessagePin(msgId,!alreadyPinned);
}

function updatePinBar() {
  const bar=document.getElementById("pinnedBanner"), textEl=document.getElementById("pinnedText"); if (!bar) return;
  if (pinnedMessages.length===0) { bar.style.display="none"; return; }
  bar.style.display="flex";
  const latest=pinnedMessages[pinnedMessages.length-1];
  if (textEl) textEl.textContent = pinnedMessages.length>1
    ? `${pinnedMessages.length} pinned — ${latest.text.slice(0,50)}…`
    : latest.text.slice(0,70)+(latest.text.length>70?"…":"");
}

function refreshMessagePin(msgId, isPinned) {
  const row=document.querySelector(`.message-row[data-msgid="${msgId}"]`); if (!row) return;
  row.classList.toggle("pinned-msg", isPinned);
  const pinBtn=row.querySelector(".pin-btn"); if (pinBtn) pinBtn.title=isPinned?"Unpin":"Pin";
}

async function loadPinnedMessages(chatId) {
  try {
    const snap=await getDoc(doc(db,"chats",chatId));
    if (snap.exists()) { pinnedMessages=snap.data().pinnedMessages||[]; updatePinBar(); }
  } catch(_) {}
}

// ============================================================
//  SEND MESSAGE
// ============================================================
let isSending = false;

async function sendMessage() {
  if (isSending) return;
  const rawText = messageInput.value.trim();
  if (!rawText || !activeContact || !activeChatId) return;

  const text = censorText(autoCorrect(rawText));
  isSending  = true;

  document.getElementById("inputWarnLabel")?.remove();
  messageInput.value        = "";
  messageInput.style.height = "auto";
  sendBtn.disabled          = true;
  closeEmojiPicker();
  setTypingStatus(false);
  clearTimeout(typingTimer);

  try {
    const msgData = {
      text,
      senderId:   currentUser.uid,
      senderName: currentProfile?.fullName || currentUser.displayName || currentUser.email,
      timestamp:  serverTimestamp(),
      reactions:  {}
    };
    if (replyingTo) {
      msgData.replyTo = { msgId: replyingTo.msgId, text: replyingTo.text, senderName: replyingTo.senderName };
      cancelReply();
    }
    await addDoc(collection(db, "chats", activeChatId, "messages"), msgData);

    const chatRef  = doc(db, "chats", activeChatId);
    const chatSnap = await getDoc(chatRef);
    const prevUnread = chatSnap.exists() ? (chatSnap.data()[`unread_${activeContact.id}`]||0) : 0;
    await updateDoc(chatRef, { lastMessage: text, lastTimestamp: serverTimestamp(), [`unread_${activeContact.id}`]: prevUnread+1 });

    cacheClear();
  } catch (err) {
    console.error("sendMessage:", err);
    showToast("Failed to send. Check your connection.", "error");
    messageInput.value = rawText; updateSendBtn();
  } finally { isSending = false; }
}

// ============================================================
//  UNREAD
// ============================================================
async function clearUnread(chatId) {
  try {
    const ref=doc(db,"chats",chatId), snap=await getDoc(ref);
    if (snap.exists()) await updateDoc(ref,{[`unread_${currentUser.uid}`]:0});
  } catch(_) {}
}

function updateContactUnreadBadge(contactId, count) {
  const badge=document.querySelector(`.contact-item[data-id="${contactId}"] .unread-badge`);
  if (!badge) return;
  count<=0 ? badge.remove() : (badge.textContent=count);
}

// ============================================================
//  TYPING
// ============================================================
async function setTypingStatus(isTyping) {
  if (!activeChatId||!currentUser) return;
  try { await updateDoc(doc(db,"chats",activeChatId),{[`typing_${currentUser.uid}`]:isTyping}); } catch(_) {}
}

function listenToTyping(chatId) {
  return onSnapshot(doc(db,"chats",chatId), snap => {
    if (!snap.exists()||!activeContact) return;
    const theyType = snap.data()[`typing_${activeContact.id}`]===true;
    if (typingName) typingName.textContent=(activeContact.fullName||"").split(" ")[0];
    if (typingIndicator) typingIndicator.style.display=theyType?"flex":"none";
    if (theyType) scrollToBottom();
  });
}

// ============================================================
//  AUTH PROMPT
// ============================================================
function showAuthPrompt() {
  if (!emptyState) return;
  emptyState.style.display="flex";
  if (chatWindow) chatWindow.style.display="none";
  emptyState.innerHTML=`
    <div class="empty-icon"><i class="fa-solid fa-lock"></i></div>
    <h2>Login Required</h2>
    <p>You need to be logged in to access the Alumni Chat.</p>
    <a href="/login" style="display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#1d5cff,#00d4ff);color:#fff;border:none;border-radius:99px;padding:11px 24px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:700;text-decoration:none;margin-top:8px;box-shadow:0 4px 20px rgba(29,92,255,.35);">
      <i class="fa-solid fa-right-to-bracket"></i> Go to Login
    </a>`;
}

// ============================================================
//  EMOJI PICKER
// ============================================================
function buildEmojiPicker() {
  EMOJIS.forEach(emoji => {
    const span=document.createElement("span"); span.className="emoji-item"; span.textContent=emoji;
    span.addEventListener("click",()=>{insertAtCursor(messageInput,emoji);messageInput.focus();updateSendBtn();});
    emojiGrid.appendChild(span);
  });
}
function toggleEmojiPicker() { emojiOpen=!emojiOpen; emojiPicker.style.display=emojiOpen?"block":"none"; }
function closeEmojiPicker()  { emojiOpen=false; emojiPicker.style.display="none"; }
function insertAtCursor(el, text) {
  const s=el.selectionStart, e2=el.selectionEnd;
  el.value=el.value.slice(0,s)+text+el.value.slice(e2);
  el.selectionStart=el.selectionEnd=s+text.length;
}

// ============================================================
//  SIDEBAR
// ============================================================
function openSidebar()  { sidebar?.classList.add("open");    overlay?.classList.add("show"); }
function closeSidebar() { sidebar?.classList.remove("open"); overlay?.classList.remove("show"); }

// ============================================================
//  HELPERS
// ============================================================
function getChatId(uid1,uid2) { return [uid1,uid2].sort().join("_"); }
function getInitials(name) { return (name||"?").split(" ").slice(0,2).map(n=>n[0]?.toUpperCase()||"").join(""); }
function stringToColor(str) {
  const palette=["#1d5cff","#00d4ff","#7b5ef7","#30d158","#ff9f0a","#ff453a","#bf5af2","#32ade6"];
  let hash=0; for (let i=0;i<(str||"").length;i++) hash=str.charCodeAt(i)+((hash<<5)-hash);
  return palette[Math.abs(hash)%palette.length];
}
function formatTime(date) {
  const d=new Date(date), now=new Date();
  const same=(a,b)=>a.getDate()===b.getDate()&&a.getMonth()===b.getMonth()&&a.getFullYear()===b.getFullYear();
  if (same(d,now)) { const h=d.getHours(),m=d.getMinutes().toString().padStart(2,"0"); return `${h%12||12}:${m} ${h>=12?"PM":"AM"}`; }
  const yesterday=new Date(now); yesterday.setDate(now.getDate()-1);
  if (same(d,yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-IN",{day:"numeric",month:"short"});
}
function getDateLabel(date) {
  const d=new Date(date), now=new Date();
  const same=(a,b)=>a.getDate()===b.getDate()&&a.getMonth()===b.getMonth()&&a.getFullYear()===b.getFullYear();
  if (same(d,now)) return "Today";
  const yesterday=new Date(now); yesterday.setDate(now.getDate()-1);
  if (same(d,yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"});
}
function scrollToBottom() { requestAnimationFrame(()=>{messagesArea.scrollTop=messagesArea.scrollHeight;}); }
function escapeHTML(str) { if (!str) return ""; const d=document.createElement("div"); d.textContent=str; return d.innerHTML; }
function showToast(msg,type="error") {
  const t=document.createElement("div"); t.className=`popup ${type}`; t.style.transform="translateX(-50%)"; t.textContent=msg;
  document.body.appendChild(t); setTimeout(()=>t.remove(),3500);
}
function updateSendBtn() { if (sendBtn&&messageInput) sendBtn.disabled=messageInput.value.trim().length===0; }
function autoResizeTextarea() {
  if (!messageInput) return;
  messageInput.addEventListener("input",()=>{
    messageInput.style.height="auto";
    messageInput.style.height=Math.min(messageInput.scrollHeight,120)+"px";
    updateSendBtn();
  });
}
function toggleDropdown() { moreDropdown.classList.toggle("open"); }
function closeDropdown()  { moreDropdown.classList.remove("open"); }

// ============================================================
//  SELECT MODE
// ============================================================
function enterSelectMode() {
  selectMode=true; selectedMsgIds.clear();
  messagesArea?.classList.add("select-mode");
  if (selectToolbar) selectToolbar.style.display="flex";
  if (headerActions) headerActions.style.display="none";
  updateSelectCount(); closeDropdown();
  showToast("Tap your messages to select them","success");
}
function exitSelectMode() {
  selectMode=false; selectedMsgIds.clear();
  messagesArea?.classList.remove("select-mode");
  if (selectToolbar) selectToolbar.style.display="none";
  if (headerActions) headerActions.style.display="flex";
  document.querySelectorAll(".message-row.selected").forEach(r=>r.classList.remove("selected"));
}

// ============================================================
//  DELETE
// ============================================================
function showDeleteModal(title, desc, onConfirm) {
  if (!deleteModal) { onConfirm(); return; }
  if (deleteModalTitle) deleteModalTitle.textContent=title;
  if (deleteModalDesc)  deleteModalDesc.textContent=desc;
  deleteModal.style.display="flex";
  if (confirmDeleteBtn) confirmDeleteBtn.onclick=async()=>{deleteModal.style.display="none"; await onConfirm();};
}

async function deleteSelectedMessages() {
  if (selectedMsgIds.size===0) return;
  const count=selectedMsgIds.size;
  showDeleteModal(count===1?"Delete Message?":`Delete ${count} Messages?`, "This will permanently delete the selected messages for everyone.", async()=>{
    try {
      await Promise.all([...selectedMsgIds].map(id=>deleteDoc(doc(db,"chats",activeChatId,"messages",id))));
      selectedMsgIds.forEach(id=>document.querySelector(`.message-row[data-msgid="${id}"]`)?.remove());
      exitSelectMode(); showToast(`${count} message${count>1?"s":""} deleted.`,"success");
    } catch(err) { console.error("deleteSelectedMessages:",err); showToast("Failed to delete. Check your permissions.","error"); exitSelectMode(); }
  });
}

async function clearMyChat() {
  closeDropdown();
  showDeleteModal("Clear Chat?","This will delete ALL your sent messages in this conversation permanently.", async()=>{
    try {
      const snap=await getDocs(query(collection(db,"chats",activeChatId,"messages"),where("senderId","==",currentUser.uid)));
      const batch=writeBatch(db); snap.forEach(d=>batch.delete(d.ref)); await batch.commit();
      cacheClear(); showToast("Your messages cleared.","success");
    } catch(err) { console.error("clearMyChat:",err); showToast("Failed to clear chat.","error"); }
  });
}

// ============================================================
//  EVENT LISTENERS
// ============================================================
function setupEventListeners() {
  sendBtn?.addEventListener("click", sendMessage);

  messageInput?.addEventListener("keydown", e=>{
    if (e.key==="Enter"&&!e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  messageInput?.addEventListener("input", ()=>{
    if (activeChatId) { setTypingStatus(true); clearTimeout(typingTimer); typingTimer=setTimeout(()=>setTypingStatus(false),2000); }
    const val=messageInput.value.toLowerCase();
    const hasBadWord=BAD_WORDS.some(w=>val.includes(w));
    let warn=document.getElementById("inputWarnLabel");
    if (hasBadWord) {
      if (!warn) {
        warn=document.createElement("div"); warn.id="inputWarnLabel";
        warn.style.cssText="color:#ff453a;font-size:11px;padding:3px 10px 0;font-family:'DM Sans',sans-serif;";
        warn.textContent="⚠️ Offensive language will be filtered on send.";
        messageInput.parentElement.appendChild(warn);
      }
    } else { warn?.remove(); }
  });

  searchInput?.addEventListener("input", renderContactsWithFilter);

  filterBtns.forEach(btn=>btn.addEventListener("click",()=>{
    filterBtns.forEach(b=>b.classList.remove("active")); btn.classList.add("active");
    currentFilter=btn.dataset.filter; renderContactsWithFilter();
  }));

  emojiBtn?.addEventListener("click", e=>{e.stopPropagation(); toggleEmojiPicker();});

  document.addEventListener("click", e=>{
    if (emojiPicker&&!emojiPicker.contains(e.target)&&e.target!==emojiBtn) closeEmojiPicker();
    if (moreDropdown&&!moreDropdown.contains(e.target)&&e.target!==moreBtn) closeDropdown();
  });

  openSidebarBtn?.addEventListener("click", openSidebar);
  sidebarClose?.addEventListener("click",   closeSidebar);
  overlay?.addEventListener("click",        closeSidebar);

  backBtn?.addEventListener("click",()=>{
    if (unsubMessages) {unsubMessages(); unsubMessages=null;}
    if (unsubTyping)   {unsubTyping();   unsubTyping=null;}
    setTypingStatus(false); clearTimeout(typingTimer);
    document.getElementById("inputWarnLabel")?.remove();
    if (emptyState) emptyState.style.display="flex";
    if (chatWindow) chatWindow.style.display="none";
    activeContact=null; activeChatId=null; openSidebar();
  });

  document.addEventListener("keydown", e=>{
    if (e.key==="Escape") { closeEmojiPicker(); closeDropdown(); if (selectMode) exitSelectMode(); }
  });

  moreBtn?.addEventListener("click", e=>{e.stopPropagation(); toggleDropdown();});
  selectMsgsBtn?.addEventListener("click", enterSelectMode);
  clearChatBtn?.addEventListener("click",  clearMyChat);
  blockUserBtn?.addEventListener("click",  ()=>{ closeDropdown(); showToast("Block feature coming soon.","fill"); });
  deleteSelectedBtn?.addEventListener("click", deleteSelectedMessages);
  cancelSelectBtn?.addEventListener("click",   exitSelectMode);

  cancelDeleteBtn?.addEventListener("click",()=>{ if (deleteModal) deleteModal.style.display="none"; });
  deleteModal?.addEventListener("click", e=>{ if (e.target===deleteModal) deleteModal.style.display="none"; });
  replyBarClose?.addEventListener("click", cancelReply);

  pinnedBanner?.addEventListener("click", e=>{
    if (e.target===pinnedClose||pinnedClose?.contains(e.target)) return;
    if (!pinnedMessages.length) return;
    const latest=pinnedMessages[pinnedMessages.length-1];
    const el2=document.querySelector(`.message-row[data-msgid="${latest.msgId}"]`);
    if (el2) { el2.scrollIntoView({behavior:"smooth",block:"center"}); el2.style.outline="2px solid var(--cyan-400)"; setTimeout(()=>el2.style.outline="",1500); }
  });

  pinnedClose?.addEventListener("click", e=>{e.stopPropagation(); if (pinnedBanner) pinnedBanner.style.display="none";});

  pinBar?.addEventListener("click", e=>{
    if (e.target.closest(".pin-bar-close")) {
      pinnedMessages=[];
      if (activeChatId) updateDoc(doc(db,"chats",activeChatId),{pinnedMessages:[]}).catch(()=>{});
      updatePinBar();
      document.querySelectorAll(".message-row.pinned-msg").forEach(r=>r.classList.remove("pinned-msg"));
      showToast("All messages unpinned.","success"); return;
    }
    if (pinnedMessages.length>0) {
      const target=document.querySelector(`.message-row[data-msgid="${pinnedMessages[pinnedMessages.length-1].msgId}"]`);
      if (target) target.scrollIntoView({behavior:"smooth",block:"center"});
    }
  });

  document.addEventListener("click", e=>{
    if (!e.target.closest(".emoji-reaction-picker")&&!e.target.closest(".react-btn"))
      document.querySelectorAll(".emoji-reaction-picker").forEach(p=>p.style.display="none");
  });
}

// ============================================================
//  MY PROFILE CARD
// ============================================================
function populateMyProfile() {
  if (!currentProfile) return;
  const p=currentProfile, role=(p.role||"alumni").toLowerCase();
  const name=p.fullName||p.email||"Me";
  const initials=name.split(" ").slice(0,2).map(n=>n[0]?.toUpperCase()||"").join("");
  const color=stringToColor(currentUser.uid);

  const avatarEl=document.getElementById("myAvatar");
  if (avatarEl) {
    if (p.profilePic) avatarEl.innerHTML=`<img src="${p.profilePic}" onerror="this.style.display='none';this.parentElement.textContent='${initials}'">`;
    else { avatarEl.textContent=initials; avatarEl.style.background=color; }
  }

  const nameEl=document.getElementById("myName"); if (nameEl) nameEl.textContent=name;
  const metaEl=document.getElementById("myMeta");
  if (metaEl) {
    const parts=role==="alumni"?[p.dept,p.aluPass?"Batch "+p.aluPass:null,p.company]:
                role==="student"?[p.dept,p.stuYear?"Year "+p.stuYear:null,p.committee]:
                role==="teacher"?[p.dept,p.designation]:[p.dept];
    metaEl.textContent=parts.filter(Boolean).join(" · ")||p.email||"";
  }
  updateMyStatusDot(p.status||"online");

  const dropHeader=document.getElementById("myDropdownHeader");
  if (dropHeader) {
    const dept=[p.dept,p.aluPass?"Batch "+p.aluPass:null].filter(Boolean).join(" · ");
    const avatarHTML=p.profilePic?`<div class="my-dropdown-avatar"><img src="${p.profilePic}"></div>`:`<div class="my-dropdown-avatar" style="background:${color}">${initials}</div>`;
    dropHeader.innerHTML=`${avatarHTML}<div>
      <div class="my-dropdown-name">${escapeHTML(name)}</div>
      <span class="my-dropdown-role ${role}">${role[0].toUpperCase()+role.slice(1)}</span>
      ${dept?`<div class="my-dropdown-dept">${escapeHTML(dept)}</div>`:""}
    </div>`;
  }
}

function updateMyStatusDot(status) {
  const dot=document.getElementById("myStatusDot");
  if (dot) dot.className="my-status-dot "+(status||"online");
}
function updateSidebarLabel() { populateMyProfile(); }

function setupProfileDropdown() {
  const menuBtn=document.getElementById("myMenuBtn"), dropdown=document.getElementById("myProfileDropdown");
  if (!menuBtn||!dropdown) return;

  menuBtn.addEventListener("click",e=>{e.stopPropagation(); dropdown.classList.toggle("open");});
  document.addEventListener("click",e=>{if (!dropdown.contains(e.target)&&e.target!==menuBtn) dropdown.classList.remove("open");});

  document.getElementById("setOnlineBtn")?.addEventListener("click", ()=>{changeMyStatus("online"); dropdown.classList.remove("open");});
  document.getElementById("setAwayBtn")?.addEventListener("click",   ()=>{changeMyStatus("away");   dropdown.classList.remove("open");});
  document.getElementById("setOfflineBtn")?.addEventListener("click",()=>{changeMyStatus("offline");dropdown.classList.remove("open");});
  document.getElementById("goProfileBtn")?.addEventListener("click", ()=>dropdown.classList.remove("open"));

  document.getElementById("logoutBtn")?.addEventListener("click", async e=>{
    e.preventDefault(); dropdown.classList.remove("open");
    if (!confirm("Are you sure you want to logout?")) return;

    const btn=document.getElementById("logoutBtn"), spinner=document.getElementById("logoutSpinner"), label=btn?.querySelector("span:first-of-type");
    if (spinner) spinner.style.display="inline";
    if (label)   label.textContent="Logging out...";
    if (btn)     btn.style.pointerEvents="none";

    try {
      await setOnlineStatus(false);
      if (unsubMessages) {unsubMessages(); unsubMessages=null;}
      if (unsubContacts) {unsubContacts(); unsubContacts=null;}
      if (unsubTyping)   {unsubTyping();   unsubTyping=null;}
      cacheClear();
      Object.keys(reactionCache).forEach(k=>delete reactionCache[k]);
      await signOut(auth);
      window.location.replace("/login");
    } catch(err) {
      console.error("Logout:",err);
      if (spinner) spinner.style.display="none";
      if (label)   label.textContent="Logout";
      if (btn)     btn.style.pointerEvents="auto";
      showToast("Logout failed. Try again.","error");
    }
  });

  document.getElementById("myStatusBtn")?.addEventListener("click", e=>{
    e.stopPropagation();
    const cur=currentProfile?.status||"online";
    changeMyStatus(cur==="online"?"away":cur==="away"?"offline":"online");
  });
}

async function changeMyStatus(status) {
  if (!currentUser||!currentProfile) return;
  currentProfile.status=status; updateMyStatusDot(status);
  try {
    await updateDoc(doc(db,"users",currentUser.uid),{status});
    showToast(status==="online"?"You are now Online 🟢":status==="away"?"You are now Away 🟡":"You appear Offline ⚫","success");
  } catch(err) { console.error("Status update failed:",err); }
}

// ── START ────────────────────────────────────────────────────
init();