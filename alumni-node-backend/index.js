// ================== IMPORTS ==================
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");

// ================== APP INIT ==================
const app = express();
const PORT = process.env.PORT || 5000;

// ================== MIDDLEWARE ==================
app.use(cors({
  origin: [
    "https://online-alumni-portal.vercel.app"
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ================== TEST ROUTE ==================
app.get("/", (_req, res) => {
  res.send("🚀 Alumni Node Backend (Email Service) is running");
});

// ================== EMAIL TRANSPORTER ==================
// Using Gmail App Password
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
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
  to: emails.join(","),
  subject: "📢 New Message from SGDTP Alumni Portal",
  text: message,
  html: `
    <div style="font-family: Arial, sans-serif;">
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
