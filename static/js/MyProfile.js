// ================== FIREBASE CONFIG ==================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ===== FIREBASE CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyBEqicHjsRkaUnOpMza90tMzVTQcVo1CoM",
  authDomain: "alumni-portal-53425.firebaseapp.com",
  projectId: "alumni-portal-53425",
  storageBucket: "alumni-portal-53425.appspot.com",
  messagingSenderId: "947099064778",
  appId: "1:947099064778:web:7eb45b444d5cc6cd651733",
  measurementId: "G-1X15S9CD6V"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {

  // ===== SECTIONS =====
  const viewSection = document.getElementById("viewProfile");
  const editSection = document.getElementById("editProfile");

  const editBtn = viewSection.querySelector("button");
  const backBtn = editSection.querySelector(".back-btn");

  // ===== FORM FIELDS =====
  const fullName = document.getElementById("fullName");
  const phone = document.getElementById("phone");
  const role = document.getElementById("role");

  const stuDept = document.getElementById("stuDept");
  const stuYear = document.getElementById("stuYear");

  const aluDept = document.getElementById("aluDept");
  const aluPass = document.getElementById("aluPass");
  const company = document.getElementById("company");
  const job = document.getElementById("job");
  const exp = document.getElementById("exp");
  const city = document.getElementById("city");

  const studentFields = document.getElementById("studentFields");
  const alumniFields = document.getElementById("alumniFields");

  // ===== PROFILE PIC =====
  const profilePic = document.getElementById("profilePic");
  const previewImg = document.getElementById("previewImg");

  // ===== VIEW ELEMENTS =====
  const viewImg = document.getElementById("viewImg");
  const viewName = document.getElementById("viewName");
  const viewPhone = document.getElementById("viewPhone");
  const viewRole = document.getElementById("viewRole");
  const viewEmail = document.getElementById("viewEmail");

  const viewStudent = document.getElementById("viewStudent");
  const viewAlumni = document.getElementById("viewAlumni");

  const viewStuDept = document.getElementById("viewStuDept");
  const viewYear = document.getElementById("viewYear");

  const viewAluDept = document.getElementById("viewAluDept");
  const viewPass = document.getElementById("viewPass");
  const viewCompany = document.getElementById("viewCompany");
  const viewJob = document.getElementById("viewJob");
  const viewExp = document.getElementById("viewExp");
  const viewCity = document.getElementById("viewCity");

  // ===== UI FUNCTIONS =====
  function openEdit() {
    viewSection.classList.remove("active");
    editSection.classList.add("active");
  }

  function goBack() {
    editSection.classList.remove("active");
    viewSection.classList.add("active");
  }

function showPopup(message, type = "success", delay = 1500) {
  const popup = document.getElementById("popup");
  const popupMsg = document.getElementById("popupMsg");

  if (!popup || !popupMsg) return;

  popupMsg.innerText = message;
  popup.className = `popup ${type}`;
  popup.classList.remove("hidden");

  setTimeout(() => {
    popup.classList.add("hidden");
  }, delay);
}


  function toggleRole() {
    studentFields.style.display = "none";
    alumniFields.style.display = "none";

    if (role.value === "student") studentFields.style.display = "block";
    if (role.value === "alumni") alumniFields.style.display = "block";
  }

  // ===== PHONE VALIDATION =====
  function validatePhoneNumber(value) {
    const regex = /^\+91[6-9]\d{9}$/;
    return regex.test(value);
  }

  phone.addEventListener("focus", () => {
    if (!phone.value.startsWith("+91")) {
      phone.value = "+91";
    }
  });

  // ===== SAVE PROFILE =====
  async function saveProfile() {
    const user = auth.currentUser;
    if (!user) {
      showPopup("No user logged in!", "error");
      return;
    }

    // 🔐 PHONE CHECK
    if (!validatePhoneNumber(phone.value)) {
      showPopup("Enter valid phone number (+91XXXXXXXXXX)" , "error");
      phone.focus();
      return;
    }

    const profileData = {
      fullName: fullName.value || "none",
      phone: phone.value,
      role: role.value || "select role alumni/student",
      dept: role.value === "student" ? stuDept.value : aluDept.value,
      stuYear: role.value === "student" ? Number(stuYear.value) : null,
      aluPass: role.value === "alumni" ? Number(aluPass.value) : null,
      company: company.value || "enter the company name",
      job: job.value || "enter the job role",
      experience: exp.value || "enter experience",
      city: city.value || "enter the working city",
      profilePic: previewImg.src
    };

    await setDoc(doc(db, "users", user.uid), profileData);
    loadView(profileData);
    goBack();
    showPopup("Profile updated successfully!", "success");

  }

  // ===== LOAD VIEW =====
  function loadView(data) {
    viewName.innerText = data.fullName;
    viewPhone.innerText = data.phone;
    viewRole.innerText = data.role;
    viewImg.src = data.profilePic || "https://via.placeholder.com/160";

    viewStudent.style.display = "none";
    viewAlumni.style.display = "none";

    if (data.role === "student") {
      viewStudent.style.display = "block";
      viewStuDept.innerText = data.dept;
      viewYear.innerText = data.stuYear;
    }

    if (data.role === "alumni") {
      viewAlumni.style.display = "block";
      viewAluDept.innerText = data.dept;
      viewPass.innerText = data.aluPass;
      viewCompany.innerText = data.company;
      viewJob.innerText = data.job;
      viewExp.innerText = data.experience;
      viewCity.innerText = data.city;
    }
  }

  // ===== EVENTS =====
  editBtn.addEventListener("click", openEdit);
  backBtn.addEventListener("click", goBack);
  role.addEventListener("change", toggleRole);

  previewImg.addEventListener("click", () => profilePic.click());

  profilePic.addEventListener("change", () => {
    if (profilePic.files[0]) {
      previewImg.src = URL.createObjectURL(profilePic.files[0]);
    }
  });

  editSection.querySelector("button").addEventListener("click", saveProfile);

  // ===== AUTH STATE =====
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "/login.html";
      return;
    }

    viewEmail.innerText = user.email;
    const snap = await getDoc(doc(db, "users", user.uid));

    if (snap.exists()) {
      let data = snap.data();
      const currentYear = new Date().getFullYear();

      // 🔥 AUTO STUDENT → ALUMNI
      if (data.role === "student" && data.stuYear) {
        if (currentYear - data.stuYear >= 3) {
          data.role = "alumni";
          await setDoc(doc(db, "users", user.uid), data, { merge: true });
        }
      }

      loadView(data);

      fullName.value = data.fullName || "";
      phone.value = data.phone || "+91";
      previewImg.src = data.profilePic || "";

      role.value = data.role;
      toggleRole();

      if (data.role === "student") {
        stuDept.value = data.dept || "";
        stuYear.value = data.stuYear || "";
      }

      if (data.role === "alumni") {
        aluDept.value = data.dept || "";
        aluPass.value = data.aluPass || "";
        company.value = data.company || "";
        job.value = data.job || "";
        exp.value = data.experience || "";
        city.value = data.city || "";
      }
    }else {
    window.location.href = "/login.html";
  }
  });

});