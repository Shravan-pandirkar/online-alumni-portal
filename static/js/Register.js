// ===============================
// Firebase Imports
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

function showPopup(message, type = "success", delay = 1200) {
  const popup = document.getElementById("popup");
  const popupMessage = document.getElementById("popupMessage");

  if (!popup || !popupMessage) return;

  popupMessage.innerText = message;
  popup.className = `popup ${type}`;
  popup.classList.remove("hidden");

  setTimeout(() => {
    popup.classList.add("hidden");
  }, delay);
}

// ================================
// Show / Hide Password
// ================================
window.togglePassword = function (inputId) {
  const input = document.getElementById(inputId);
  input.type = input.type === "password" ? "text" : "password";
};

// ================================
// Registration Form Submit
// ================================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const errorBox = document.getElementById("error-message");

  form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = form.username.value.trim();
  const password = form.password.value.trim();

  if (!email || !password) {
    showPopup("Please fill all details", "error");
    return;
  }

  try {
    // Create user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save to Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: email,
      uid: user.uid,
      createdAt: new Date()
    });

    // ✅ Success popup
    showPopup("Registration successful!", "success", 1200);

    // Redirect after popup
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 1000);

  } catch (error) {
    showPopup("Email already exists or invalid password", "error");
  }
});

  
  });
