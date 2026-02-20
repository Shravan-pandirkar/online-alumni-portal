const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");

const app = express();

// ================== MIDDLEWARE ==================
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ================== TEST ROUTE ==================
app.get("/", (_req, res) => {
  res.send("🚀 Alumni Node Backend (Email Service) is running");
});

// ================== EMAIL TRANSPORTER ==================
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

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ success: false, error: "Emails are required" });
    }

    if (!message || message.trim() === "") {
      return res.status(400).json({ success: false, error: "Message is required" });
    }

    const mailOptions = {
      from: `"SGDTP Alumni Portal" <${process.env.EMAIL_USER}>`,
      to: emails.join(","),
      subject: "📢 New Message from SGDTP Alumni Portal",
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <p>${message}</p>
          <hr />
          <small>— SGDTP Alumni Portal</small>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: `Email sent to ${emails.length} recipient(s)`,
      messageId: info.messageId
    });

  } catch (err) {
    console.error("❌ Email Error:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ✅ Export for Vercel
module.exports = app;
