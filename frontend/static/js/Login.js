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
provider.addScope("email");
provider.addScope("profile");

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
document.querySelector(".login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    showPopup("Please fill all fields!", "fill");
    return;
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    // Save / update Firestore
    await setDoc(
      doc(db, "users", user.uid),
      {
        email: user.email,
        provider: "password",
        lastLogin: serverTimestamp()
      },
      { merge: true }
    );

    showPopup("Login successful!", "success");
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 1000); 

  } catch (error) {
    if (error.code === "auth/user-not-found") {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const user = cred.user;

        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          provider: "password",
          createdAt: serverTimestamp()
        });

        showPopup("Account created & logged in!", "success");
        window.location.href = "/dashboard";

      } catch (err) {
        console.error(err);
        showPopup("Registration failed", "error");
      }
    } else if (error.code === "auth/wrong-password") {
      showPopup("Wrong password!", "error");
    } else {
      console.error(error);
      showPopup("Login failed!", "error");
    }
  }
});

// ===============================
// Google Login (No Profile Photo)
// ===============================
document.getElementById("googleLogin").addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // 🔑 SAFELY get email
    const email =
      user.email ||
      user.providerData?.[0]?.email ||
      "unknown@gmail.com";

    await setDoc(
      doc(db, "users", user.uid),
      {
        email: email,
        fullName: user.displayName || "Google User",
        provider: "google",
        lastLogin: serverTimestamp()
      },
      { merge: true }
    );

    showPopup("Google Login Successful!", "success");
    window.location.href = "/dashboard";

  } catch (error) {
    console.error(error);
    showPopup("Google Login Failed", "error");
  }
});