document.addEventListener("DOMContentLoaded", () => {
    console.log("About Us Page Loaded!");

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

    // --- Smooth scroll for "Team" heading ---
    const teamHeading = document.querySelector(".team-heading");
    if (teamHeading) {
        teamHeading.addEventListener("click", () => {
            teamHeading.scrollIntoView({ behavior: "smooth" });
        });
    }
});
