// Universal script.js for all pages
document.addEventListener("DOMContentLoaded", () => {
    console.log("SGDTP Alumni Portal Loaded!");

       const container = document.querySelector(".container");

    // Add fade-in class
    container.classList.add("fade-in");

    // Trigger the animation after a tiny delay
    setTimeout(() => {
        container.classList.add("visible");
    }, 100); // delay 100ms to ensure CSS transition works

    // --- Highlight active nav link ---
    const navLinks = document.querySelectorAll(".nav a");
    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            navLinks.forEach(l => l.classList.remove("active-link"));
            link.classList.add("active-link");
        });
    });

    // --- Dynamic greeting (only if element exists) ---
    const welcomeHeading = document.querySelector(".welcome-heading");
    if (welcomeHeading) {
        const hour = new Date().getHours();
        let greeting = "Welcome";
        if (hour < 12) greeting = "Good Morning";
        else if (hour < 18) greeting = "Good Afternoon";
        else greeting = "Good Evening";

        welcomeHeading.textContent = `${greeting}, SGDTP Alumni Portal`;
    }

    // --- About Us Button Animation ---
    const aboutButton = document.querySelector(".about-button");
    if (aboutButton) {
        const colors = ["#0c10fcff", "#7873f5", "#00c6ff", "#873cffff", "#0aa5ffff"];
        let colorIndex = 0;
        let colorInterval;

        // Start color cycle on hover
        aboutButton.addEventListener("mouseenter", () => {
            colorInterval = setInterval(() => {
                aboutButton.style.backgroundColor = colors[colorIndex];
                colorIndex = (colorIndex + 1) % colors.length;
            }, 500);
        });

        // Stop color cycle on mouse leave
        aboutButton.addEventListener("mouseleave", () => {
            clearInterval(colorInterval);
            aboutButton.style.backgroundColor = "#007bff"; // reset original color
        });

        // Click event: animate page fade-out + store flag
        aboutButton.addEventListener("click", (e) => {
            e.preventDefault(); // prevent instant navigation
            sessionStorage.setItem("animateButtonNextPage", "true");
            document.body.style.opacity = "0"; // fade-out
            setTimeout(() => {
                window.location.href = aboutButton.getAttribute("href");
            }, 600); // match transition duration
        });

        // Trigger animation if coming from previous page
        if (sessionStorage.getItem("animateButtonNextPage") === "true") {
            setInterval(() => {
                aboutButton.style.backgroundColor = colors[colorIndex];
                colorIndex = (colorIndex + 1) % colors.length;
            }, 500);

            sessionStorage.removeItem("animateButtonNextPage");
        }
    }

    // --- Login/Register link hover effects + smooth page switch ---
    const links = document.querySelectorAll(".login-link, .register-link");
    links.forEach(link => {
        // Hover animation
        link.addEventListener("mouseover", () => {
            link.style.transform = "translateY(-3px)";
            link.style.color = "#f1f1f1";
        });
        link.addEventListener("mouseout", () => {
            link.style.transform = "translateY(0)";
            link.style.color = "#ffffff";
        });

        // Smooth page transition on click
        link.addEventListener("click", (e) => {
            e.preventDefault();
            document.body.style.opacity = "0"; // fade-out
            setTimeout(() => {
                window.location.href = link.getAttribute("href");
            }, 600); // match CSS transition
        });
    });
});
