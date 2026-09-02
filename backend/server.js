require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const app = express();

const PORT = process.env.PORT || 3000;

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "https://anmolragrwl314-source.github.io";

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

// --------------------------------------------------
// Razorpay configuration
// --------------------------------------------------

let razorpay = null;

if (razorpayKeyId && razorpayKeySecret) {
  razorpay = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret,
  });
}

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
  })
);

app.use(express.json({ limit: "20kb" }));

app.disable("x-powered-by");

// --------------------------------------------------
// Security headers
// --------------------------------------------------

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; frame-ancestors 'none'"
  );

  next();
});

// --------------------------------------------------
// Health
// --------------------------------------------------

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
    razorpayConfigured: Boolean(razorpay),
    timestamp: new Date().toISOString(),
  });
});

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function generateTransactionId() {
  return (
    "TXN_" +
    crypto.randomBytes(12).toString("hex").toUpperCase()
  );
}

function generateWithdrawalId() {
  return (
    "WD_" +
    crypto.randomBytes(12).toString("hex").toUpperCase()
  );
}

function isValidUserId(userId) {
  return (
    typeof userId === "string" &&
    userId.length >= 1 &&
    userId.length <= 100
  );
}

function isValidAmount(amount) {
  return (
    typeof amount === "number" &&
    Number.isFinite(amount) &&
    amount >= 10 &&
    amount <= 100000
  );
}

// --------------------------------------------------
// CREATE DEPOSIT ORDER
// --------------------------------------------------

app.post("/api/deposit/create", async (req, res) => {
  try {
    const { amount, userId } = req.body;

    if (!isValidUserId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (!isValidAmount(amount)) {
      return res.status(400).json({
        success: false,
        message: "Amount must be between ₹10 and ₹100,000",
      });
    }

    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message:
          "Payment gateway is not configured on the server",
      });
    }

    const transactionId = generateTransactionId();

    // Razorpay expects amount in paise.
    const amountInPaise = Math.round(amount * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: transactionId,
      notes: {
        userId,
        transactionId,
        purpose: "legitimate account deposit",
      },
    });

    return res.status(201).json({
      success: true,
      transactionId,
      orderId: order.id,
      amount,
      amountInPaise,
      currency: "INR",
      keyId: razorpayKeyId,
      status: "created",
    });
  } catch (error) {
    console.error("Deposit creation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create deposit order",
    });
  }
});

// --------------------------------------------------
// VERIFY DEPOSIT PAYMENT
// --------------------------------------------------

app.post("/api/deposit/verify", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      transactionId,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !transactionId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification data",
      });
    }

    if (!razorpayKeySecret) {
      return res.status(503).json({
        success: false,
        message: "Payment verification is not configured",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    const signaturesMatch = crypto.timingSafeEqual(
      Buffer.from(generatedSignature),
      Buffer.from(razorpay_signature)
    );

    if (!signaturesMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    /*
      IMPORTANT:

      Signature verification proves that the response came
      from a valid Razorpay payment flow.

      In production, DO NOT credit a user's balance here
      without maintaining a database ledger and checking
      payment/order status server-side.

      The next step is connecting this endpoint to your DB.
    */

    return res.json({
      success: true,
      transactionId,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: "verified",
      message: "Payment signature verified successfully",
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify payment",
    });
  }
});

// --------------------------------------------------
// WITHDRAWAL REQUEST
// --------------------------------------------------

app.post("/api/withdrawal/create", async (req, res) => {
  try {
    const {
      userId,
      amount,
      payoutMethod,
      payoutDetails,
    } = req.body;

    if (!isValidUserId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (!isValidAmount(amount)) {
      return res.status(400).json({
        success: false,
        message:
          "Withdrawal amount must be between ₹10 and ₹100,000",
      });
    }

    const allowedMethods = [
      "bank_transfer",
      "upi",
    ];

    if (!allowedMethods.includes(payoutMethod)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported withdrawal method",
      });
    }

    if (
      !payoutDetails ||
      typeof payoutDetails !== "object"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payout details are required",
      });
    }

    const withdrawalId = generateWithdrawalId();

    /*
      IMPORTANT:

      This creates a withdrawal REQUEST only.

      A production application must:
      1. Authenticate the user.
      2. Read the user's balance from a database.
      3. Lock/reserve the requested amount atomically.
      4. Store an immutable ledger entry.
      5. Run required verification/compliance checks.
      6. Send the payout through an approved payout provider.
      7. Confirm the provider's webhook/status.
      8. Mark the withdrawal as paid/failed.

      Never trust a balance supplied by the frontend.
    */

    return res.status(201).json({
      success: true,
      withdrawalId,
      amount,
      currency: "INR",
      payoutMethod,
      status: "pending",
      message: "Withdrawal request created",
    });
  } catch (error) {
    console.error("Withdrawal error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create withdrawal request",
    });
  }
});

// --------------------------------------------------
// TRANSACTION STATUS
// --------------------------------------------------

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

// --------------------------------------------------
// GLOBAL ERROR HANDLER
// --------------------------------------------------

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);

  if (razorpay) {
    console.log("Razorpay configuration detected.");
  } else {
    console.log(
      "WARNING: Razorpay credentials are not configured."
    );
  }
});
