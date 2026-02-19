// ================== IMPORTS ==================
require("dotenv").config();
const express = require("express");
const path = require("path");
const nodemailer = require("nodemailer");

// ================== APP INIT ==================
const app = express();
const PORT = process.env.PORT || 5000;

// ================== CORS (FIRST) ==================
app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Origin",
    "https://online-alumni-portal-ayej.onrender.com"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// ================== BODY PARSING ==================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================== STATIC FILES ==================
app.use("/static", express.static(path.join(__dirname, "static")));
app.use("/templates", express.static(path.join(__dirname, "templates")));

// ================== TEST ROUTE ==================
app.get("/api", (_req, res) => {
  res.send("🚀 Alumni Node Backend (API) is running");
});

// ================== EMAIL TRANSPORTER ==================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ================== SEND EMAIL ROUTE ==================
app.post("/send-email", async (req, res) => {
  try {
    const { emails, message } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Emails are required"
      });
    }

    if (!message || message.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Message is required"
      });
    }

    const mailOptions = {
      from: `"SGDTP Alumni Portal" <${process.env.EMAIL_USER}>`,
      to: emails.join(","),
      subject: "📢 New Message from SGDTP Alumni Portal",
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>${message}</h2>
          <hr />
          <small>— SGDTP Alumni Portal</small>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    return res.json({
      success: true,
      message: `Email successfully sent to ${emails.length} recipient(s)`
    });

  } catch (err) {
    console.error("❌ Email Error:", err.message);
    return res.status(500).json({
      success: false,
      error: "Failed to send email"
    });
  }
});

// ================== START SERVER ==================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
