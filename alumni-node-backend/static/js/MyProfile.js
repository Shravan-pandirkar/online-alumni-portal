// ================== FIREBASE CONFIG ==================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ===== FIREBASE CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyBEqicHjsRkaUnOpMza90tMzVTQcVo1CoM",
  authDomain: "alumni-portal-53425.firebaseapp.com",
  projectId: "alumni-portal-53425",
  messagingSenderId: "947099064778",
  appId: "1:947099064778:web:7eb45b444d5cc6cd651733"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== CLOUDINARY CONFIG =====
const CLOUD_NAME = "dvyk0lfsb";
const UPLOAD_PRESET = "profile_upload";

document.addEventListener("DOMContentLoaded", async () => {

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
  const committee = document.getElementById("committee");

  const aluDept = document.getElementById("aluDept");
  const aluPass = document.getElementById("aluPass");
  const company = document.getElementById("company");
  const job = document.getElementById("job");
  const exp = document.getElementById("exp");
  const city = document.getElementById("city");

  const teachDept = document.getElementById("teachDept");
  const designation = document.getElementById("designation");
  const teachExp = document.getElementById("teachExp");

  const studentFields = document.getElementById("studentFields");
  const alumniFields = document.getElementById("alumniFields");
  const teacherFields = document.getElementById("teacherFields");

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
  const viewTeacher = document.getElementById("viewTeacher");

  const viewStuDept = document.getElementById("viewStuDept");
  const viewYear = document.getElementById("viewYear");
  const viewCommittee = document.getElementById("viewCommittee");

  const viewAluDept = document.getElementById("viewAluDept");
  const viewPass = document.getElementById("viewPass");
  const viewCompany = document.getElementById("viewCompany");
  const viewJob = document.getElementById("viewJob");
  const viewExp = document.getElementById("viewExp");
  const viewCity = document.getElementById("viewCity");

  const viewTeachDept = document.getElementById("viewTeachDept");
  const viewDesignation = document.getElementById("viewDesignation");
  const viewTeachExp = document.getElementById("viewTeachExp");

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

    setTimeout(() => popup.classList.add("hidden"), delay);
  }

  function toggleRole() {
    studentFields.style.display = "none";
    alumniFields.style.display = "none";
    teacherFields.style.display = "none";

    if (role.value === "student") studentFields.style.display = "block";
    if (role.value === "alumni") alumniFields.style.display = "block";
    if (role.value === "teacher") teacherFields.style.display = "block";
  }

  // ===== PHONE VALIDATION =====
  function validatePhoneNumber(value) {
    return /^\+91[6-9]\d{9}$/.test(value);
  }

  phone.addEventListener("focus", () => {
    if (!phone.value.startsWith("+91")) phone.value = "+91";
  });

  // ===== CLOUDINARY UPLOAD =====
  async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "profile_upload");

  const response = await fetch(
    "https://api.cloudinary.com/v1_1/dvyk0lfsb/image/upload",
    {
      method: "POST",
      body: formData
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Cloudinary error:", data);
    throw new Error(data.error?.message || "Image upload failed");
  }

  return data.secure_url;
}


  // ===== SAVE PROFILE =====
  async function saveProfile(e) {
    e.preventDefault();

    try {
      const user = auth.currentUser;
      if (!user) return showPopup("No user logged in!", "error");

      if (!validatePhoneNumber(phone.value)) {
        showPopup("Enter valid phone number (+91XXXXXXXXXX)", "error");
        return;
      }

      let photoURL = previewImg.src;

      if (profilePic.files[0]) {
        photoURL = await uploadToCloudinary(profilePic.files[0]);
      }

      const profileData = {
  fullName: fullName.value,
  phone: phone.value,
  role: role.value,

  dept:
    role.value === "student" ? stuDept?.value :
    role.value === "alumni" ? aluDept?.value :
    teachDept?.value,

  stuYear: role.value === "student" ? Number(stuYear?.value || 0) : null,
  committee: role.value === "student" ? committee?.value || "" : null,

  aluPass: role.value === "alumni" ? Number(aluPass?.value || 0) : null,
  company: company?.value || "",
  job: job?.value || "",
  experience:
    role.value === "teacher"
      ? teachExp?.value || ""
      : exp?.value || "",

  city: city?.value || "",
  designation: role.value === "teacher" ? designation?.value || "" : null,

  profilePic: photoURL
};


      await setDoc(doc(db, "users", user.uid), profileData);

      loadView(profileData);
      goBack();
      showPopup("Profile updated successfully!");

    } catch (err) {
      console.error(err);
      showPopup(err.message, "error", 3000);
    }
  }

  // ===== LOAD VIEW =====
  function loadView(data) {
  // BASIC INFO
  viewName.innerText = data.fullName || "";
  viewPhone.innerText = data.phone || "";
  viewRole.innerText = data.role || "";
  viewImg.src = data.profilePic || "https://via.placeholder.com/160";

  // RESET ALL SECTIONS
  viewStudent.style.display = "none";
  viewAlumni.style.display = "none";
  viewTeacher.style.display = "none";

  // STUDENT VIEW
  if (data.role === "student") {
    viewStudent.style.display = "block";
    viewStuDept.innerText = data.dept || "-";
    viewYear.innerText = data.stuYear || "-";
    viewCommittee.innerText = data.committee || "-";
  }

  // ALUMNI VIEW
  else if (data.role === "alumni") {
    viewAlumni.style.display = "block";
    viewAluDept.innerText = data.dept || "-";
    viewPass.innerText = data.aluPass || "-";
    viewCompany.innerText = data.company || "-";
    viewJob.innerText = data.job || "-";
    viewExp.innerText = data.experience || "-";
    viewCity.innerText = data.city || "-";
  }

  // TEACHER VIEW
  else if (data.role === "teacher") {
    viewTeacher.style.display = "block";
    viewTeachDept.innerText = data.dept || "-";
    viewTeachExp.innerText = data.experience || "-";
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

  // ===== ROLE LOCK LOGIC =====
function lockRoleIfTeacher() {
  if (role.value === "teacher") {
    role.innerHTML = '<option value="teacher">Teacher</option>';
    role.disabled = true; // prevent changing role
  }else if (currentRole === "student" || currentRole === "alumni") {
    // Student/Alumni cannot switch to teacher
    role.innerHTML = `
      <option value="${currentRole}">${capitalize(currentRole)}</option>
    `;
    role.disabled = true; // cannot change to teacher
  } else {
    // First-time selection (new register)
    role.disabled = false;
  }
}


// ===== AUTH STATE =====
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/login";
    return;
  }

  viewEmail.innerText = user.email || "";

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  // ===== FIRST TIME USER =====
  if (!snap.exists()) {
    const newUserData = {
      fullName: user.displayName || "",
      phone: "",
      role: "student",
      dept: "",
      profilePic: user.photoURL || "https://via.placeholder.com/160",
      createdAt: new Date()
    };

    await setDoc(userRef, newUserData);
    loadView(newUserData);
    return;
  }

  // ===== EXISTING USER =====
  let data = snap.data();
  const currentYear = new Date().getFullYear();
  let roleUpdated = false;

  // 🔥 AUTO STUDENT → ALUMNI
  if (data.role === "student" && data.stuYear) {
    if (currentYear - data.stuYear >= 3) {
      data.role = "alumni";
      data.stuYear = null;
      data.committee = "";
      data.aluPass = currentYear;
      data.company = data.company || "";
      data.job = data.job || "";
      data.experience = data.experience || "";
      data.city = data.city || "";
      roleUpdated = true;
    }
  }

  // 🔥 SAVE ROLE CHANGE
  if (roleUpdated) {
    await setDoc(userRef, data, { merge: true });
  }

  // ===== LOAD VIEW =====
  loadView(data);

  // ===== FILL EDIT FORM =====
  fullName.value = data.fullName || "";
  phone.value = data.phone || "+91";
  previewImg.src = data.profilePic || "https://via.placeholder.com/160";

  role.value = data.role;
  toggleRole();
  lockRoleIfTeacher();

  // Clear fields
  stuDept.value = "";
  stuYear.value = "";
  committee.value = "";

  aluDept.value = "";
  aluPass.value = "";
  company.value = "";
  job.value = "";
  exp.value = "";
  city.value = "";

  teachDept.value = "";
  teachExp.value = "";

  // Fill role-based
  if (data.role === "student") {
    stuDept.value = data.dept || "";
    stuYear.value = data.stuYear || "";
    committee.value = data.committee || "";
  }

  if (data.role === "alumni") {
    aluDept.value = data.dept || "";
    aluPass.value = data.aluPass || "";
    company.value = data.company || "";
    job.value = data.job || "";
    exp.value = data.experience || "";
    city.value = data.city || "";
  }

  if (data.role === "teacher") {
    teachDept.value = data.dept || "";
    teachExp.value = data.experience || "";
  }
});
});



  



