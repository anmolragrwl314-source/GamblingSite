require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

// -------------------------
// Middleware
// -------------------------

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
  })
);

app.use(express.json({ limit: "20kb" }));

// -------------------------
// Basic security headers
// -------------------------

app.disable("x-powered-by");

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

// -------------------------
// Health check
// -------------------------

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Payment application backend is running",
    status: "online",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// -------------------------
// Generate transaction ID
// -------------------------

function generateTransactionId() {
  return (
    "TXN_" +
    crypto.randomBytes(12).toString("hex").toUpperCase()
  );
}

// -------------------------
// Create legitimate payment request
// -------------------------

app.post("/api/payment/create", async (req, res) => {
  try {
    const { amount, userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount",
      });
    }

    if (amount > 100000) {
      return res.status(400).json({
        success: false,
        message: "Amount exceeds the allowed limit",
      });
    }

    const transactionId = generateTransactionId();

    /*
      IMPORTANT:

      A real payment gateway order should be created here
      from the SERVER using credentials stored in environment
      variables.

      Never put API secrets in:
        - index.html
        - script.js
        - GitHub Pages
        - frontend JavaScript
    */

    return res.status(201).json({
      success: true,
      transactionId,
      amount,
      currency: "INR",
      status: "created",
      message: "Payment request created",
    });
  } catch (error) {
    console.error("Payment creation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create payment",
    });
  }
});

// -------------------------
// Transaction status
// -------------------------

app.get("/api/payment/:transactionId", (req, res) => {
  const { transactionId } = req.params;

  if (!/^TXN_[A-F0-9]+$/i.test(transactionId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid transaction ID",
    });
  }

  return res.json({
    success: true,
    transactionId,
    status: "pending",
  });
});

// -------------------------
// Global error handler
// -------------------------

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// -------------------------
// Start server
// -------------------------

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
