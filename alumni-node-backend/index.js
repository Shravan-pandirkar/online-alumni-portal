// ================== IMPORTS ==================
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const bodyParser = require("body-parser");

// ================== APP INIT ==================
const app = express();
const PORT = process.env.PORT || 5000;

// ================== MIDDLEWARE ==================
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ================== TEST ROUTE ==================
app.get("/", (_req, res) => {
  res.send("🚀 Alumni Node Backend is running");
});

// ================== SEND SMS API (REAL SMS) ==================
app.post("/send-sms", async (req, res) => {
  try {
    const { phoneNumbers, message } = req.body;

    // 🔒 Validation
    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return res.status(400).json({ error: "Phone numbers are required" });
    }

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log("📨 Sending SMS to:", phoneNumbers);

    // 🔔 FAST2SMS API CALL
    const smsResponse = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "q",
        message: message,
        language: "english",
        numbers: phoneNumbers.join(",")
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    return res.json({
      success: true,
      provider: "Fast2SMS",
      sentTo: phoneNumbers.length,
      apiResponse: smsResponse.data
    });

  } catch (error) {
    console.error("❌ SMS Error:", error.response?.data || error.message);

    return res.status(500).json({
      error: "Failed to send SMS",
      details: error.response?.data || error.message
    });
  }
});

// ================== START SERVER ==================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
