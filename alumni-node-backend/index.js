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
  origin: true,                // allow all origins safely
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.options("*", cors());


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ================== TEST ROUTE ==================
app.get("/", (_req, res) => {
  res.send("🚀 Alumni Node Backend (Email Service) is running");
});

// ================== EMAIL TRANSPORTER ==================
// Using Gmail App Password

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


// ================== SEND EMAIL ENDPOINT ==================
app.post("/send-email", async (req, res) => {
  console.log("🔥 /send-email reached");
  console.log("📦 BODY:", req.body);

  const { emails, message } = req.body;

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: "Emails required" });
  }

  if (!message) {
    return res.status(400).json({ error: "Message required" });
  }

  try {
    const info = await transporter.sendMail({
      from: `"SGDTP Alumni Portal" <${process.env.EMAIL_USER}>`,
      to: emails.join(","),
      subject: "New Message from Alumni Portal",
      text: message,
      html: `<p>${message}</p>`
    });

    console.log("✅ Email sent:", info.messageId);

    res.json({
      success: true,
      message: "Email sent successfully"
    });

  } catch (err) {
    console.error("❌ MAIL ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ================== START SERVER ==================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
