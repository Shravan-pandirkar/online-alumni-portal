// ================== IMPORTS ==================
require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");

// ================== APP INIT ==================
const app = express();
const PORT = process.env.PORT || 5000;

// ================== MIDDLEWARE ==================
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ------------------ STATIC FILES ------------------
// Serve CSS, JS, images
app.use("/static", express.static(path.join(__dirname, "static")));
app.use("/templates", express.static(path.join(__dirname, "templates"))); // optional direct access

// ================== FRONTEND ROUTES ==================
const templatesPath = path.join(__dirname, "templates");

app.get("/", (_req, res) => res.sendFile(path.join(templatesPath, "FrontPage.html"))); // default route to Chat page
app.get("/frontpage", (_req, res) => res.sendFile(path.join(templatesPath, "FrontPage.html")));
app.get("/about", (_req, res) => res.sendFile(path.join(templatesPath, "about_us.html")));
app.get("/profile", (_req, res) => res.sendFile(path.join(templatesPath, "MyProfile.html")));
app.get("/login", (_req, res) => res.sendFile(path.join(templatesPath, "Login_page.html")));
app.get("/register", (_req, res) => res.sendFile(path.join(templatesPath, "registration_page.html")));
app.get("/dashboard", (_req, res) => res.sendFile(path.join(templatesPath, "Dashboard.html")));
app.get("/chat", (_req, res) => res.sendFile(path.join(templatesPath, "Chat.html")));

// ================== TEST BACKEND ROUTE ==================
app.get("/api", (_req, res) => {
  res.send("🚀 Alumni Node Backend (API) is running");
});

// ================== EMAIL TRANSPORTER ==================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "onlinealumniportal@gmail.com",
    pass: process.env.EMAIL_PASS || "miqfmbdqytjodjpo"
  }
});

// ================== SEND EMAIL ENDPOINT ==================
app.post("/send-email", async (req, res) => {
  try {
    const { emails, message } = req.body;

    // ------------------ VALIDATION ------------------
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ success: false, error: "Emails are required" });
    }

    if (!message || message.trim() === "") {
      return res.status(400).json({ success: false, error: "Message is required" });
    }

    console.log("📧 Sending email to:", emails);

    // ------------------ EMAIL OPTIONS ------------------
    const mailOptions = {
      from: `"SGDTP Alumni Portal" <${process.env.EMAIL_USER}>`,
      to: emails.join(","), // multiple recipients
      subject: "📢 New Message from SGDTP Alumni Portal",
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>${message}</h2>
          <hr>
          <small>— SGDTP Alumni Portal</small>
        </div>
      `
    };

    // ------------------ SEND EMAIL ------------------
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.messageId);

    return res.json({
      success: true,
      message: `Email successfully sent to ${emails.length} recipient(s)`,
      messageId: info.messageId
    });

  } catch (err) {
    console.error("❌ Email Error:", err.message);
    return res.status(500).json({
      success: false,
      error: "Failed to send email",
      details: err.message
    });
  }
});

// ================== START SERVER ==================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
