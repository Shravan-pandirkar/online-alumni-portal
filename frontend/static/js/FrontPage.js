// ============================================================
//  SGDTP ALUMNI PORTAL — FRONT PAGE JS
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

// Apply saved theme immediately — no flash on load
applyTheme(localStorage.getItem(THEME_KEY) || "dark");

// ── MAIN DOM LOGIC ────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    console.log("SGDTP Alumni Portal Loaded!");

    // Theme toggle listener
    document.getElementById("themeToggle")
        ?.addEventListener("click", toggleTheme);

    // ── About Us Button ──
    const aboutButton = document.querySelector(".about-button");
    if (aboutButton) {
        aboutButton.addEventListener("click", (e) => {
            e.preventDefault();
            sessionStorage.setItem("animateButtonNextPage", "true");
            document.body.style.opacity = "0";
            document.body.style.transition = "opacity .5s ease";
            setTimeout(() => {
                window.location.href = aboutButton.getAttribute("href");
            }, 500);
        });

        if (sessionStorage.getItem("animateButtonNextPage") === "true") {
            sessionStorage.removeItem("animateButtonNextPage");
        }
    }

    // ── Login / Register links — smooth page transition ──
    const links = document.querySelectorAll(".login-link, .register-link");
    links.forEach(link => {
        link.addEventListener("click", (e) => {
            if (link.getAttribute("target") === "_blank") return;
            e.preventDefault();
            document.body.style.opacity = "0";
            document.body.style.transition = "opacity .5s ease";
            setTimeout(() => {
                window.location.href = link.getAttribute("href");
            }, 500);
        });
    });

    // ── Highlight active nav link ──
    const navLinks = document.querySelectorAll(".nav a");
    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            navLinks.forEach(l => l.classList.remove("active-link"));
            link.classList.add("active-link");
        });
    });

    // ── Fade body back in on page load ──
    document.body.style.opacity = "0";
    document.body.style.transition = "opacity .5s ease";
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.body.style.opacity = "1";
        });
    });
});