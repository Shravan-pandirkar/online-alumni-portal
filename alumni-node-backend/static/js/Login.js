// ===============================
// Firebase Imports
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
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
  }, 1500);
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
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1000);

      } catch (err) {
        console.error(err);
        showPopup("Registration failed!", "error");
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
// Google Login (Popup with Redirect fallback)
// ===============================
document.getElementById("googleLogin").addEventListener("click", async () => {
  try {
    // First try popup login
    const result = await signInWithPopup(auth, provider);
    handleGoogleUser(result.user);
  } catch (error) {
    console.warn("Popup failed, using redirect as fallback", error);
    // Fallback to redirect login if popup fails
    signInWithRedirect(auth, provider);
  }
});

// Handle Google redirect login after page reload
getRedirectResult(auth)
  .then((result) => {
    if (result?.user) {
      handleGoogleUser(result.user);
    }
  })
  .catch((error) => {
    console.error("Redirect login failed", error);
    showPopup("Google Login Failed!", "error");
  });

// ===============================
// Handle Google User Firestore Save
// ===============================
async function handleGoogleUser(user) {
  try {
    await setDoc(
      doc(db, "users", user.uid),
      {
        email: user.email,
        fullName: user.displayName || "Google User",
        provider: "google",
        lastLogin: serverTimestamp()
      },
      { merge: true }
    );

    showPopup("Google Login Successful!", "success");
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 1000);

  } catch (err) {
    console.error(err);
    showPopup("Failed to save user data!", "error");
  }
}
