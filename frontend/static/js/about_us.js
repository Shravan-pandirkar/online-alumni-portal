// ============================================================
//  SGDTP ALUMNI PORTAL — ABOUT US PAGE JS
//  Theme toggle uses same localStorage key as all other pages
//  so the mode persists across FrontPage, Dashboard, Events
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

// ── MAIN DOM LOGIC ────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    console.log("About Us Page Loaded!");

    // Apply saved theme now that DOM exists
    applyTheme(localStorage.getItem(THEME_KEY) || "dark");

    // Theme toggle listener
    document.getElementById("themeToggle")
        ?.addEventListener("click", toggleTheme);

    // Fade-in container
    const container = document.querySelector(".container");
    if (container) {
        container.classList.add("fade-in");
        setTimeout(() => container.classList.add("visible"), 100);
    }

    // Highlight active nav link
    const navLinks = document.querySelectorAll(".nav a");
    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            navLinks.forEach(l => l.classList.remove("active-link"));
            link.classList.add("active-link");
        });
    });

    // Smooth scroll on team heading click
    const teamHeading = document.querySelector(".team-heading");
    if (teamHeading) {
        teamHeading.style.cursor = "pointer";
        teamHeading.addEventListener("click", () => {
            teamHeading.scrollIntoView({ behavior: "smooth" });
        });
    }
});