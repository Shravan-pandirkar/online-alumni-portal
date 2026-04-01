// ============================================================
//  SGDTP ALUMNI PORTAL — FRONT PAGE JS
//  Theme toggle uses same localStorage key as Dashboard.js
//  so the mode persists across all pages seamlessly
// ============================================================

// ── THEME TOGGLE ──────────────────────────────────────────
const THEME_KEY = "sgdtp_theme";

function applyTheme(theme, animate = false) {
    const icon = document.getElementById("themeIcon");
    const btn  = document.getElementById("themeToggle");

    if (animate && icon && btn) {
        // ── 1. Burst ring ──
        btn.classList.add("bursting");
        setTimeout(() => btn.classList.remove("bursting"), 500);

        // ── 2. Full-page ripple ──
        fireRipple(theme, btn);

        // ── 3. Icon exit ──
        btn.classList.add("theme-icon-exit");

        setTimeout(() => {
            // swap class + icon mid-flight
            btn.classList.remove("theme-icon-exit");

            if (theme === "light") {
                document.body.classList.add("light");
                if (icon) icon.textContent = "🌙";
            } else {
                document.body.classList.remove("light");
                if (icon) icon.textContent = "☀️";
            }

            // ── 4. Icon enter bounce ──
            btn.classList.add("theme-icon-enter");
            setTimeout(() => btn.classList.remove("theme-icon-enter"), 460);

        }, 220); // half of exit duration

    } else {
        // Silent apply (on page load — no animation)
        if (theme === "light") {
            document.body.classList.add("light");
            if (icon) icon.textContent = "🌙";
        } else {
            document.body.classList.remove("light");
            if (icon) icon.textContent = "☀️";
        }
    }
}

function fireRipple(nextTheme, btn) {
    // Create ripple element
    const ripple = document.createElement("div");
    ripple.id = "themeRipple";

    // Position it over the button
    const rect = btn.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    const size = Math.hypot(window.innerWidth, window.innerHeight) * 2.2;

    ripple.style.cssText = `
        width:  ${size}px;
        height: ${size}px;
        left:   ${cx - size / 2}px;
        top:    ${cy - size / 2}px;
    `;

    ripple.classList.add(nextTheme === "light" ? "ripple-light" : "ripple-dark");
    document.body.appendChild(ripple);

    // Trigger expand on next frame
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            ripple.classList.add("ripple-expanding");
        });
    });

    // Remove after animation
    setTimeout(() => ripple.remove(), 650);
}

function toggleTheme() {
    const isLight = document.body.classList.contains("light");
    const next    = isLight ? "dark" : "light";
    applyTheme(next, true);           // animated
    localStorage.setItem(THEME_KEY, next);
}

// Apply saved theme immediately (no animation — avoid flash on load)
applyTheme(localStorage.getItem(THEME_KEY) || "dark", false);

// ── MAIN DOM LOGIC ────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    console.log("SGDTP Alumni Portal Loaded!");

    // ── Theme toggle listener ──
    document.getElementById("themeToggle")
        ?.addEventListener("click", toggleTheme);


    // ── About Us Button ──
    const aboutButton = document.querySelector(".about-button");
    if (aboutButton) {
        // Click → fade out then navigate
        aboutButton.addEventListener("click", (e) => {
            e.preventDefault();
            sessionStorage.setItem("animateButtonNextPage", "true");
            document.body.style.opacity = "0";
            document.body.style.transition = "opacity .5s ease";
            setTimeout(() => {
                window.location.href = aboutButton.getAttribute("href");
            }, 500);
        });

        // Restore animation if coming back from About page
        if (sessionStorage.getItem("animateButtonNextPage") === "true") {
            sessionStorage.removeItem("animateButtonNextPage");
        }
    }

    // ── Login / Register links — smooth page transition ──
    const links = document.querySelectorAll(".login-link, .register-link");
    links.forEach(link => {
        link.addEventListener("click", (e) => {
            // Don't intercept if it opens in a new tab
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

    // ── Fade body back in on page load (after transition) ──
    document.body.style.opacity = "0";
    document.body.style.transition = "opacity .5s ease";
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.body.style.opacity = "1";
        });
    });
});