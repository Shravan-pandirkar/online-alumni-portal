// ===============================
// Firebase Imports
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ===============================
// Firebase Config
// ===============================
const firebaseConfig = {
  apiKey: "AIzaSyBEqicHjsRkaUnOpMza90tMzVTQcVo1CoM",
  authDomain: "alumni-portal-53425.firebaseapp.com",
  projectId: "alumni-portal-53425",
  storageBucket: "alumni-portal-53425.appspot.com",
  messagingSenderId: "947099064778",
  appId: "1:947099064778:web:7eb45b444d5cc6cd651733",
  measurementId: "G-1X15S9CD6V"
};

// ===============================
// Initialize Firebase
// ===============================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===============================
// Google Provider
// ===============================
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

// ===============================
// Popup Helper
// ===============================
function showPopup(message, type = "success") {
  const popup = document.getElementById("popup");
  const popupMessage = document.getElementById("popupMessage");

  if (!popup || !popupMessage) return;

  popupMessage.innerText = message;
  popup.className = `popup ${type}`;
  popup.classList.remove("hidden");

  setTimeout(() => {
    popup.classList.add("hidden");
  }, 1000);
}

// ===============================
// Email/Password Login + Auto Register
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.querySelector(".login-form");
  const googleBtn = document.getElementById("googleLogin");

  const showPopup = (message, type="success") => {
    const popup = document.getElementById("popup");
    const popupMessage = document.getElementById("popupMessage");
    if (!popup || !popupMessage) return;

    popupMessage.innerText = message;
    popup.className = `popup ${type}`;
    popup.classList.remove("hidden");

    setTimeout(() => popup.classList.add("hidden"), 1000);
  };

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();
      if (!email || !password) return showPopup("Fill all fields", "fill");

      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", cred.user.uid), { email: cred.user.email, lastLogin: serverTimestamp() }, { merge: true });
        showPopup("Login success", "success");
        setTimeout(() => window.location.href="/dashboard", 1000);
      } catch (err) {
        if (err.code === "auth/user-not-found") {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          await setDoc(doc(db, "users", cred.user.uid), { email: cred.user.email, createdAt: serverTimestamp() });
          showPopup("Account created", "success");
          window.location.href = "/dashboard";
        } else {
          showPopup(err.message || "Login failed", "error");
        }
      }
    });
  }

  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      try {
        const result = await signInWithPopup(auth, provider);
        await setDoc(doc(db, "users", result.user.uid), { email: result.user.email, fullName: result.user.displayName, lastLogin: serverTimestamp() }, { merge: true });
        showPopup("Google Login Success", "success");
        window.location.href="/dashboard";
      } catch (err) {
        console.error(err);
        showPopup("Google Login Failed", "error");
      }
    });
  }
});

    