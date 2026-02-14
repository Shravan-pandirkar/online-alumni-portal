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

// ===============================
// Google Provider
// ===============================
const provider = new GoogleAuthProvider();

// ✅ Force Google account selection every time
provider.setCustomParameters({
  prompt: "select_account"
});


// ===============================
// Popup Helper (MUST be on top)
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
  }, 5000);
}




// ===============================
// Email/Password Login + Auto Register
// ===============================
document.querySelector(".login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    showPopup("Please fill all fields!","fill");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    showPopup("Login successful!","success");


    setTimeout(() => {
    window.location.href = "/dashboard";
  }, 1000);

  } catch (error) {

    if (error.code === "auth/user-not-found") {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    showPopup("Account created & logged in!", "success");

    // ✅ Vercel-friendly redirect
    window.location.href = "Dashboard.html";

  } catch (err) {
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
// Google Login
// ===============================
document.getElementById("googleLogin").addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);

    const user = result.user;
    console.log("Google User:", user);

    showPopup("Google Login Successful!", "success");
    window.location.href = "/dashboard";

  } catch (error) {
    showPopup("Google Login Failed", "error");
  }
});

