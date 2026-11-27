// import dotenv from "dotenv";
// import { timingSafeEqual } from "node:crypto";
// import path from "node:path";
// import { fileURLToPath } from "node:url";

// import bcrypt from "bcryptjs";
// import cookieParser from "cookie-parser";
// import cors from "cors";
// import express from "express";
// // import rateLimit from "express-rate-limit";
// import helmet from "helmet";
// import jwt from "jsonwebtoken";
// import mongoose from "mongoose";
// import multer from "multer";

// import Product from "./models/Product.js";

// // ============================================
// // 1. ENVIRONMENT CONFIGURATION
// // ============================================

// const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

// dotenv.config({
//   path: path.resolve(currentDirectory, "../.env"),
// });

// const requiredEnvironment = [
//   "MONGODB_URI",
//   "ADMIN_USERNAME",
//   "ADMIN_PASSWORD",
//   "SESSION_SECRET",
// ];

// const missingEnvironment = requiredEnvironment.filter(
//   (key) => !process.env[key]
// );

// if (missingEnvironment.length > 0) {
//   throw new Error(
//     `Missing environment variables: ${missingEnvironment.join(", ")}`
//   );
// }

// if (process.env.SESSION_SECRET.length < 32) {
//   throw new Error("SESSION_SECRET must contain at least 32 characters.");
// }

// if (process.env.ADMIN_PASSWORD.length < 12) {
//   throw new Error("ADMIN_PASSWORD must contain at least 12 characters.");
// }

// if (Buffer.byteLength(process.env.ADMIN_PASSWORD, "utf8") > 72) {
//   throw new Error("ADMIN_PASSWORD must not exceed 72 UTF-8 bytes.");
// }

// // ============================================
// // 2. EXPRESS APP
// // ============================================

// const app = express();

// const PORT = Number(process.env.PORT || 4000);

// const IS_PRODUCTION = process.env.NODE_ENV === "production";

// const COOKIE_NAME = "yashoda_admin_session";

// const CLIENT_URL =
//   process.env.CLIENT_URL || "http://127.0.0.1:5173";

// app.disable("x-powered-by");

// app.use(
//   helmet({
//     crossOriginResourcePolicy: {
//       policy: "cross-origin",
//     },
//   })
// );

// app.use(
//   cors({
//     origin: CLIENT_URL,
//     credentials: true,
//   })
// );

// app.use(express.json({ limit: "32kb" }));

// app.use(cookieParser());

// // ============================================
// // 3. ADMIN PASSWORD HASH
// // ============================================

// const passwordHash = await bcrypt.hash(
//   process.env.ADMIN_PASSWORD,
//   12
// );

// // ============================================
// // 4. MULTER CONFIGURATION
// // ============================================

// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: {
//     fileSize: 3 * 1024 * 1024,
//     files: 1,
//   },
// });

// // ============================================
// // 5. AUTHENTICATION HELPERS
// // ============================================

// function getTokenPayload(request) {
//   try {
//     const token = request.cookies[COOKIE_NAME] || "";

//     const payload = jwt.verify(
//       token,
//       process.env.SESSION_SECRET
//     );

//     if (
//       typeof payload !== "object" ||
//       payload.role !== "admin"
//     ) {
//       return null;
//     }

//     return payload;
//   } catch {
//     return null;
//   }
// }

// function requireAdmin(request, response, next) {
//   const payload = getTokenPayload(request);

//   if (!payload) {
//     return response.status(401).json({
//       error: "Please sign in to manage products.",
//     });
//   }

//   next();
// }

// // ============================================
// // 6. PRODUCT RESPONSE FORMAT
// // ============================================

// function cleanProduct(product) {
//   return {
//     id: product._id.toString(),
//     name: product.name,
//     description: product.description,
//     category: product.category,
//     price: product.price,
//     imageUrl: product.imageContentType
//       ? `/api/products/${product._id}/image`
//       : "",
//     createdAt: product.createdAt,
//   };
// }

// // ============================================
// // 7. TEXT VALIDATION
// // ============================================

// function checkText(value, field, maxLength, required = true) {
//   if (typeof value !== "string") {
//     if (!required && (value === undefined || value === "")) {
//       return "";
//     }

//     throw new Error(`${field} is required.`);
//   }

//   const normalized = value.trim();

//   if (required && !normalized) {
//     throw new Error(`${field} is required.`);
//   }

//   if (normalized.length > maxLength) {
//     throw new Error(
//       `${field} must be ${maxLength} characters or fewer.`
//     );
//   }

//   return normalized;
// }

// // ============================================
// // 8. IMAGE SIGNATURE VALIDATION
// // ============================================

// function validateImageSignature(file) {
//   if (!file) return true;

//   const buffer = file.buffer;

//   if (file.mimetype === "image/jpeg") {
//     return (
//       buffer.length >= 4 &&
//       buffer[0] === 0xff &&
//       buffer[1] === 0xd8 &&
//       buffer.at(-2) === 0xff &&
//       buffer.at(-1) === 0xd9
//     );
//   }

//   if (file.mimetype === "image/png") {
//     return (
//       buffer.length >= 8 &&
//       buffer
//         .subarray(0, 8)
//         .equals(
//           Buffer.from([
//             0x89, 0x50, 0x4e, 0x47,
//             0x0d, 0x0a, 0x1a, 0x0a,
//           ])
//         )
//     );
//   }

//   if (file.mimetype === "image/webp") {
//     return (
//       buffer.length >= 12 &&
//       buffer.toString("ascii", 0, 4) === "RIFF" &&
//       buffer.toString("ascii", 8, 12) === "WEBP"
//     );
//   }

//   return false;
// }

// // ============================================
// // 9. HEALTH CHECK
// // ============================================

// app.get("/api/health", (_request, response) => {
//   response.json({
//     ok: true,
//     database:
//       mongoose.connection.readyState === 1
//         ? "connected"
//         : "disconnected",
//   });
// });

// // ============================================
// // 10. ADMIN LOGIN API
// // RATE LIMIT REMOVED
// // ============================================

// app.post(
//   "/api/admin/login",
//   async (request, response, next) => {
//     try {
//       const { username, password } = request.body || {};

//       if (
//         typeof username !== "string" ||
//         typeof password !== "string" ||
//         username.length > 80 ||
//         password.length > 200
//       ) {
//         return response.status(400).json({
//           error: error,
//         });
//       }

//       const receivedUsername = Buffer.from(username);
//       const configuredUsername = Buffer.from(
//         process.env.ADMIN_USERNAME
//       );

//       const usernameMatches =
//         receivedUsername.length === configuredUsername.length &&
//         timingSafeEqual(
//           receivedUsername,
//           configuredUsername
//         );

//       const passwordMatches = await bcrypt.compare(
//         password,
//         passwordHash
//       );

//       if (!usernameMatches || !passwordMatches) {
//         return response.status(401).json({
//           error: error,
//         });
//       }

//       const token = jwt.sign(
//         { role: "admin" },
//         process.env.SESSION_SECRET,
//         { expiresIn: "8h" }
//       );

//       response.cookie(COOKIE_NAME, token, {
//         httpOnly: true,
//         secure: IS_PRODUCTION,
//         sameSite: "strict",
//         maxAge: 8 * 60 * 60 * 1000,
//         path: "/",
//       });

//       return response.json({
//         authenticated: true,
//         message: "Login successful.",
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// // ============================================
// // 11. CHECK ADMIN SESSION
// // ============================================

// app.get("/api/admin/session", (request, response) => {
//   const payload = getTokenPayload(request);

//   response.json({
//     authenticated: Boolean(payload),
//   });
// });

// // ============================================
// // 12. ADMIN LOGOUT
// // ============================================

// app.post("/api/admin/logout", (_request, response) => {
//   response.clearCookie(COOKIE_NAME, {
//     httpOnly: true,
//     secure: IS_PRODUCTION,
//     sameSite: "strict",
//     path: "/",
//   });

//   response.json({
//     authenticated: false,
//     message: "Logged out successfully.",
//   });
// });

// // ============================================
// // 13. GET ALL PRODUCTS
// // ============================================

// app.get("/api/products", async (_request, response, next) => {
//   try {
//     const products = await Product.find()
//       .sort({ createdAt: -1 })
//       .lean();

//     response.json(products.map(cleanProduct));
//   } catch (error) {
//     next(error);
//   }
// });

// // ============================================
// // 14. GET PRODUCT IMAGE
// // ============================================

// app.get(
//   "/api/products/:id/image",
//   async (request, response, next) => {
//     try {
//       const product = await Product.findById(
//         request.params.id
//       ).select("+imageData imageContentType");

//       if (!product?.imageData || !product.imageContentType) {
//         return response.status(404).json({
//           error: "Product image not found.",
//         });
//       }

//       response.set("Content-Type", product.imageContentType);

//       response.set(
//         "Cache-Control",
//         "public, max-age=86400"
//       );

//       response.send(product.imageData);
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// // ============================================
// // 15. CREATE PRODUCT
// // ============================================

// app.post(
//   "/api/products",
//   requireAdmin,
//   upload.single("image"),

//   async (request, response, next) => {
//     try {
//       const name = checkText(
//         request.body.name,
//         "Product name",
//         80
//       );

//       const category = checkText(
//         request.body.category,
//         "Category",
//         40
//       );

//       const description = checkText(
//         request.body.description,
//         "Description",
//         400,
//         false
//       );

//       const price = Number(request.body.price);

//       if (
//         !Number.isFinite(price) ||
//         price < 1 ||
//         price > 10_000_000
//       ) {
//         return response.status(400).json({
//           error: "Enter a valid price of at least ₹1.",
//         });
//       }

//       if (!validateImageSignature(request.file)) {
//         return response.status(400).json({
//           error: "Upload a valid JPG, PNG, or WebP image.",
//         });
//       }

//       const product = await Product.create({
//         name,
//         category,
//         description,
//         price,

//         ...(request.file && {
//           imageData: request.file.buffer,
//           imageContentType: request.file.mimetype,
//         }),
//       });

//       return response.status(201).json(
//         cleanProduct(product)
//       );
//     } catch (error) {
//       if (
//         error instanceof Error &&
//         /^(Product name|Category|Description) /.test(
//           error.message
//         )
//       ) {
//         return response.status(400).json({
//           error: error.message,
//         });
//       }

//       next(error);
//     }
//   }
// );

// // ============================================
// // 16. DELETE PRODUCT
// // ============================================

// app.delete(
//   "/api/products/:id",
//   requireAdmin,

//   async (request, response, next) => {
//     try {
//       const product = await Product.findByIdAndDelete(
//         request.params.id
//       );

//       if (!product) {
//         return response.status(404).json({
//           error: "Product not found.",
//         });
//       }

//       return response.json({
//         deleted: true,
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// // ============================================
// // 17. ERROR HANDLER
// // ============================================

// app.use((error, _request, response, _next) => {
//   if (error instanceof multer.MulterError) {
//     const message =
//       error.code === "LIMIT_FILE_SIZE"
//         ? "Images must be 3 MB or smaller."
//         : "The selected image could not be uploaded.";

//     return response.status(400).json({
//       error: message,
//     });
//   }

//   if (error?.name === "CastError") {
//     return response.status(400).json({
//       error: "Invalid product ID.",
//     });
//   }

//   if (error?.name === "ValidationError") {
//     return response.status(400).json({
//       error: "Check the product details and try again.",
//     });
//   }

//   console.error("Request failed:", error);

//   return response.status(500).json({
//     error: "Something went wrong. Please try again.",
//   });
// });

// // ============================================
// // 18. FRONTEND STATIC FILES IN PRODUCTION
// // ============================================

// if (IS_PRODUCTION) {
//   const clientDist = path.resolve(
//     currentDirectory,
//     "../dist"
//   );

//   app.use(express.static(clientDist));

//   app.get("*", (_request, response) => {
//     response.sendFile(
//       path.join(clientDist, "index.html")
//     );
//   });
// }

// // ============================================
// // 19. CONNECT DATABASE AND START SERVER
// // ============================================

// try {
//   await mongoose.connect(process.env.MONGODB_URI);

//   console.log("MongoDB connected successfully.");

//   app.listen(PORT, () => {
//     console.log(
//       `Yashoda Mart API listening on http://127.0.0.1:${PORT}`
//     );
//   });
// } catch (error) {
//   console.error(
//     "Failed to connect to MongoDB:",
//     error.message
//   );

//   process.exit(1);
// }


import dotenv from "dotenv";
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
// import rateLimit from "express-rate-limit";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import multer from "multer";
import nodemailer from "nodemailer";

import Product from "./models/Product.js";
import User from "./models/User.js";
import Otp from "./models/Otp.js";
import Order from "./models/Order.js";
import PaymentAttempt from "./models/PaymentAttempt.js";
import Category from "./models/Category.js";
import Poster from "./models/Poster.js";

// ============================================
// 1. ENVIRONMENT CONFIGURATION
// ============================================

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: path.resolve(currentDirectory, "../.env"),
});

const requiredEnvironment = [
  "MONGODB_URI",
  "ADMIN_USERNAME",
  "ADMIN_PASSWORD",
  "SESSION_SECRET",
];

const missingEnvironment = requiredEnvironment.filter(
  (key) => !process.env[key]
);

if (missingEnvironment.length > 0) {
  throw new Error(
    `Missing environment variables: ${missingEnvironment.join(", ")}`
  );
}

if (process.env.SESSION_SECRET.length < 32) {
  throw new Error("SESSION_SECRET must contain at least 32 characters.");
}

if (process.env.ADMIN_PASSWORD.length < 12) {
  throw new Error("ADMIN_PASSWORD must contain at least 12 characters.");
}

if (Buffer.byteLength(process.env.ADMIN_PASSWORD, "utf8") > 72) {
  throw new Error("ADMIN_PASSWORD must not exceed 72 UTF-8 bytes.");
}

// ============================================
// 2. EXPRESS APP
// ============================================

const app = express();

const PORT = Number(process.env.PORT || 4000);

const IS_PRODUCTION = process.env.NODE_ENV === "production";

const COOKIE_NAME = "yashoda_admin_session";

// ============================================
// ALLOWED FRONTEND DOMAINS (CORS)
// ============================================

const CLIENT_URLS = new Set([
  "https://rajendrapujastore.netlify.app",
  "https://rajendrapujastore.in",
  "https://www.rajendrapujastore.in",

  ...(process.env.CLIENT_URL || "http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean),
]);

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID?.trim() || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET?.trim() || "";
const RAZORPAY_API_URL = "https://api.razorpay.com/v1";

class PaymentGatewayError extends Error {
  constructor() {
    super("The secure payment service is temporarily unavailable.");
    this.name = "PaymentGatewayError";
  }
}

async function razorpayRequest(endpoint, { method = "GET", body } = {}) {
  const credentials = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let providerResponse;

  try {
    providerResponse = await fetch(`${RAZORPAY_API_URL}/${endpoint}`, {
      method,
      headers: {
        Authorization: `Basic ${credentials}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });
  } catch (error) {
    console.error("Razorpay API request failed:", error.message);
    throw new PaymentGatewayError();
  } finally {
    clearTimeout(timeout);
  }

  const responseBody = await providerResponse.json().catch(() => null);
  if (!providerResponse.ok || !responseBody) {
    console.error(`Razorpay API returned HTTP ${providerResponse.status}: ${responseBody?.error?.code || "invalid response"}`);
    throw new PaymentGatewayError();
  }

  return responseBody;
}

app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

app.use(
  cors({
    origin(requestOrigin, callback) {
      if (
        !requestOrigin ||
        /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(requestOrigin) ||
        CLIENT_URLS.has(requestOrigin)
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "32kb" }));

app.use(cookieParser());

// ============================================
// 3. ADMIN PASSWORD HASH
// ============================================

const passwordHash = await bcrypt.hash(
  process.env.ADMIN_PASSWORD,
  12
);

const USER_COOKIE_NAME = "yashoda_user_session";

const mailTransport = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    })
  : null;

const resendApiKey = process.env.RESEND_API_KEY?.trim() || "";
const resendFrom = process.env.RESEND_FROM?.trim() || "";
const adminNotificationEmail = process.env.ADMIN_NOTIFICATION_EMAIL?.trim()
  || process.env.SMTP_USER?.trim()
  || "";

async function sendOtpEmail(email, code, purpose) {
  const subject = purpose === "verify_email"
    ? "Verify your Rajendra Puja Store account"
    : "Reset your Rajendra Puja Store password";
  const text = `Your Rajendra Puja Store OTP is ${code}. It expires in 10 minutes.`;

  if (resendApiKey) {
    if (!resendFrom) {
      console.error(`[OTP] ${purpose} email skipped; RESEND_FROM is not configured.`);
      return false;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: resendFrom, to: [email], subject, text }),
        signal: controller.signal,
      });
      if (!emailResponse.ok) {
        console.error(`[OTP] Resend could not send ${purpose} email (HTTP ${emailResponse.status}).`);
        return false;
      }
      return true;
    } catch (error) {
      console.error(`[OTP] Resend request failed for ${purpose} email:`, error.message);
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  if (!mailTransport) {
    console.error(`[OTP] ${purpose} email skipped; Resend or SMTP is not configured.`);
    return false;
  }

  try {
    await mailTransport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject,
      text,
    });
    return true;
  } catch (error) {
    console.error(`[OTP] Could not send ${purpose} email:`, error.message);
    return false;
  }
}

const ORDER_STATUS_LABELS = {
  new: "Pending",
  confirmed: "Confirmed",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const PAYMENT_STATUS_LABELS = {
  pending: "Pending",
  submitted: "Submitted",
  verified: "Verified",
  failed: "Failed",
};

const TRACKING_STATUS_LABELS = {
  new: "Order received",
  confirmed: "Preparing your order",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function createTrackingNumber() {
  return `YPS-${randomBytes(8).toString("hex").toUpperCase()}`;
}

async function sendOrderConfirmation(order, user) {
  if (!mailTransport) {
    console.log(`[ORDER] Email confirmation skipped; SMTP is not configured. Order ${order._id}`);
    return false;
  }
  if (!user?.email) {
    console.error(`[ORDER] Customer confirmation skipped; customer email is unavailable. Order ${order._id}`);
    return false;
  }
  if (!adminNotificationEmail) {
    console.error(`[ORDER] Admin order notification skipped; set ADMIN_NOTIFICATION_EMAIL or SMTP_USER. Order ${order._id}`);
  }

  const formatOrderPrice = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character]);
  const orderDate = new Date(order.createdAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
  const paymentMethod = order.paymentMethod === "razorpay"
    ? "Razorpay"
    : order.paymentMethod === "upi"
      ? "UPI"
      : "Cash on Delivery";
  const paymentStatus = order.paymentMethod === "cod"
    ? `Pay ${formatOrderPrice(order.subtotal)} in cash when your order arrives`
    : `Payment ${PAYMENT_STATUS_LABELS[order.paymentStatus]?.toLowerCase() || "pending"}`;
  const transactionLines = [];
  if (order.razorpayOrderId) transactionLines.push(`Razorpay order ID: ${order.razorpayOrderId}`);
  if (order.razorpayPaymentId) transactionLines.push(`Razorpay payment ID: ${order.razorpayPaymentId}`);
  if (order.utr) transactionLines.push(`UPI UTR / Reference: ${order.utr}`);
  const trackingUrl = "https://rajendrapujastore.in/#track-order";

  const itemLines = order.items.map((item) =>
    `- ${item.name}${item.category ? ` (${item.category})` : ""} | ${item.quantity} x ${formatOrderPrice(item.price)} = ${formatOrderPrice(item.price * item.quantity)}`
  );

  const text = [
    `Hello ${order.customerName},`,
    "",
    "Thank you for shopping with Rajendra Puja Store. We have received your order.",
    "",
    `Order ID: ${order._id}`,
    `Tracking number: ${order.trackingNumber}`,
    `Track your order: ${trackingUrl}`,
    `Placed on: ${orderDate}`,
    `Order status: ${ORDER_STATUS_LABELS[order.status] || "Pending"}`,
    "",
    "CUSTOMER",
    `Name: ${order.customerName}`,
    `Email: ${user.email}`,
    `Mobile: ${order.customerPhone}`,
    `Delivery address: ${order.deliveryAddress}`,
    "",
    "ITEMS",
    ...itemLines,
    "",
    `Order total: ${formatOrderPrice(order.subtotal)}`,
    "",
    "PAYMENT",
    `Method: ${paymentMethod}`,
    `Payment status: ${paymentStatus}`,
    `Amount: ${formatOrderPrice(order.subtotal)}`,
    ...transactionLines,
    "",
    "You can view this order anytime from your Rajendra Puja Store account.",
    "We will email you when there is an update to your order.",
    "",
    "Thank you,",
    "Rajendra Puja Store",
  ].join("\n");

  const itemRows = order.items.map((item) => `
    <tr>
      <td style="padding:12px 10px;border-bottom:1px solid #e8e8df">
        <strong>${escapeHtml(item.name)}</strong>
        ${item.category ? `<br><span style="color:#667267;font-size:12px">${escapeHtml(item.category)}</span>` : ""}
      </td>
      <td style="padding:12px 10px;border-bottom:1px solid #e8e8df;text-align:center">${item.quantity}</td>
      <td style="padding:12px 10px;border-bottom:1px solid #e8e8df;text-align:right">${formatOrderPrice(item.price)}</td>
      <td style="padding:12px 10px;border-bottom:1px solid #e8e8df;text-align:right;font-weight:700">${formatOrderPrice(item.price * item.quantity)}</td>
    </tr>
  `).join("");
  const html = `
    <div style="margin:0;padding:28px 12px;background:#f5f5ef;font-family:Arial,sans-serif;color:#263c2e">
      <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e5e5dc;border-radius:12px;overflow:hidden">
        <div style="padding:25px 28px;background:#365d43;color:#fff">
          <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#e4eadf">Rajendra Puja Store</div>
          <h1 style="margin:10px 0 5px;font-size:24px">Your order is received</h1>
          <p style="margin:0;color:#e4eadf">Thank you for shopping with us, ${escapeHtml(order.customerName)}.</p>
        </div>
        <div style="padding:24px 28px">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:5px 0;color:#667267">Order ID</td><td style="padding:5px 0;text-align:right;font-weight:700">${escapeHtml(order._id)}</td></tr>
            <tr><td style="padding:5px 0;color:#667267">Tracking number</td><td style="padding:5px 0;text-align:right;font-weight:700">${escapeHtml(order.trackingNumber)}</td></tr>
            <tr><td style="padding:5px 0;color:#667267">Order date</td><td style="padding:5px 0;text-align:right">${escapeHtml(orderDate)}</td></tr>
            <tr><td style="padding:5px 0;color:#667267">Order status</td><td style="padding:5px 0;text-align:right">${escapeHtml(ORDER_STATUS_LABELS[order.status] || "Pending")}</td></tr>
          </table>
          <h2 style="margin:25px 0 8px;font-size:17px">Items ordered</h2>
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead><tr style="background:#f3f5ef;color:#526455;text-align:left">
              <th style="padding:10px">Product</th><th style="padding:10px;text-align:center">Qty</th><th style="padding:10px;text-align:right">Price</th><th style="padding:10px;text-align:right">Total</th>
            </tr></thead>
            <tbody>${itemRows}</tbody>
          </table>
          <p style="margin:16px 0 26px;text-align:right;font-size:17px">Order total: <strong style="color:#365d43">${formatOrderPrice(order.subtotal)}</strong></p>
          <h2 style="margin:0 0 10px;font-size:17px">Delivery details</h2>
          <div style="padding:14px;background:#f7f7f2;border-radius:8px;line-height:1.7;font-size:13px">
            <strong>${escapeHtml(order.customerName)}</strong><br>
            ${escapeHtml(user.email)}<br>
            ${escapeHtml(order.customerPhone)}<br>
            ${escapeHtml(order.deliveryAddress).replace(/\n/g, "<br>")}
          </div>
          <h2 style="margin:24px 0 10px;font-size:17px">Payment details</h2>
          <div style="padding:14px;background:#f2f5ef;border-radius:8px;line-height:1.8;font-size:13px">
            <strong>${escapeHtml(paymentMethod)}</strong><br>
            ${escapeHtml(paymentStatus)}<br>
            Amount paid: <strong>${formatOrderPrice(order.subtotal)}</strong>
            ${order.razorpayOrderId ? `<br>Razorpay order ID: <strong>${escapeHtml(order.razorpayOrderId)}</strong>` : ""}
            ${order.razorpayPaymentId ? `<br>Razorpay payment ID: <strong>${escapeHtml(order.razorpayPaymentId)}</strong>` : ""}
            ${order.utr ? `<br>UPI UTR / Reference: <strong>${escapeHtml(order.utr)}</strong>` : ""}
          </div>
          <p style="margin:24px 0 0;color:#667267;font-size:13px;line-height:1.6">Track your order using the tracking number above at <a href="${trackingUrl}" style="color:#365d43">rajendrapujastore.in</a>. We will email you when there is an update.</p>
        </div>
      </div>
    </div>
  `;

  const adminBcc = adminNotificationEmail
    && adminNotificationEmail.toLowerCase() !== user.email.toLowerCase()
    ? adminNotificationEmail
    : undefined;
  await mailTransport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: user.email,
    bcc: adminBcc,
    subject: `Rajendra Puja Store order received — ${order._id}`,
    text,
    html,
  });
  return true;
}

async function sendOrderUpdateEmail(order, updateType) {
  if (!mailTransport) {
    console.error(`[ORDER] Status notification skipped; SMTP is not configured. Order ${order._id}`);
    return false;
  }
  if (!order.user?.email) {
    console.error(`[ORDER] Status notification skipped; customer email is unavailable. Order ${order._id}`);
    return false;
  }

  const isPaymentUpdate = updateType === "payment";
  const statusLabel = isPaymentUpdate
    ? PAYMENT_STATUS_LABELS[order.paymentStatus] || "Pending"
    : ORDER_STATUS_LABELS[order.status] || "Pending";
  const updateLabel = isPaymentUpdate ? "Payment status" : "Order status";
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character]);
  const formatOrderPrice = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  const customerName = order.user.name || order.customerName;
  const orderStatus = ORDER_STATUS_LABELS[order.status] || "Pending";
  const paymentMethod = order.paymentMethod === "razorpay"
    ? "Razorpay"
    : order.paymentMethod === "upi"
      ? "UPI"
      : "Cash on Delivery";
  const paymentStatus = order.paymentMethod === "cod"
    ? "Due on delivery"
    : PAYMENT_STATUS_LABELS[order.paymentStatus] || "Pending";
  const trackingUrl = "https://rajendrapujastore.in/#track-order";
  const itemLines = order.items.map((item) =>
    `- ${item.name}${item.category ? ` (${item.category})` : ""} | ${item.quantity} x ${formatOrderPrice(item.price)} = ${formatOrderPrice(item.price * item.quantity)}`
  );
  const itemRows = order.items.map((item) => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #e8e8df">${escapeHtml(item.name)}${item.category ? ` (${escapeHtml(item.category)})` : ""}</td>
      <td style="padding:10px;border-bottom:1px solid #e8e8df;text-align:center">${item.quantity}</td>
      <td style="padding:10px;border-bottom:1px solid #e8e8df;text-align:right">${formatOrderPrice(item.price)}</td>
      <td style="padding:10px;border-bottom:1px solid #e8e8df;text-align:right">${formatOrderPrice(item.price * item.quantity)}</td>
    </tr>
  `).join("");
  const transactionLines = [];
  if (order.razorpayOrderId) transactionLines.push(`Razorpay order ID: ${order.razorpayOrderId}`);
  if (order.razorpayPaymentId) transactionLines.push(`Razorpay payment ID: ${order.razorpayPaymentId}`);
  if (order.utr) transactionLines.push(`UPI UTR / Reference: ${order.utr}`);
  const text = [
    `Hello ${customerName},`,
    "",
    `There is an update to your Rajendra Puja Store order #${order._id}.`,
    `Tracking number: ${order.trackingNumber}`,
    `Track your order: ${trackingUrl}`,
    `${updateLabel}: ${statusLabel}`,
    `Order status: ${orderStatus}`,
    `Payment method: ${paymentMethod}`,
    `Payment status: ${paymentStatus}`,
    `Order total: ${formatOrderPrice(order.subtotal)}`,
    "",
    "ITEMS",
    ...itemLines,
    ...transactionLines,
    "",
    "Thank you,",
    "Rajendra Puja Store",
  ].join("\n");
  const html = `
    <div style="margin:0;padding:28px 12px;background:#f5f5ef;font-family:Arial,sans-serif;color:#263c2e">
      <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e5dc;border-radius:12px;padding:24px">
        <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#526455">Rajendra Puja Store</div>
        <h1 style="font-size:22px">Order update</h1>
        <p>Hello ${escapeHtml(customerName)}, there is an update to your order.</p>
        <p><strong>Order #${escapeHtml(order._id)}</strong></p>
        <p>Tracking number: <strong>${escapeHtml(order.trackingNumber)}</strong></p>
        <div style="padding:14px;background:#f2f5ef;border-radius:8px;line-height:1.8">
          <strong>${escapeHtml(updateLabel)}: ${escapeHtml(statusLabel)}</strong><br>
          Order status: ${escapeHtml(orderStatus)}<br>
          Payment method: ${escapeHtml(paymentMethod)}<br>
          Payment status: ${escapeHtml(paymentStatus)}<br>
          Order total: ${escapeHtml(formatOrderPrice(order.subtotal))}
          ${order.razorpayOrderId ? `<br>Razorpay order ID: ${escapeHtml(order.razorpayOrderId)}` : ""}
          ${order.razorpayPaymentId ? `<br>Razorpay payment ID: ${escapeHtml(order.razorpayPaymentId)}` : ""}
          ${order.utr ? `<br>UPI UTR / Reference: ${escapeHtml(order.utr)}` : ""}
        </div>
        <h2 style="margin:22px 0 8px;font-size:16px">Items in this order</h2>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="background:#f3f5ef;color:#526455;text-align:left">
            <th style="padding:10px">Product</th><th style="padding:10px;text-align:center">Qty</th><th style="padding:10px;text-align:right">Price</th><th style="padding:10px;text-align:right">Total</th>
          </tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        <p><a href="${trackingUrl}" style="color:#365d43">Track your order</a></p>
        <p>Thank you,<br>Rajendra Puja Store</p>
      </div>
    </div>
  `;

  await mailTransport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: order.user.email,
    subject: `Rajendra Puja Store ${isPaymentUpdate ? "payment" : "order"} update — ${statusLabel}`,
    text,
    html,
  });
  return true;
}

function hashOtp(code) {
  return createHash("sha256").update(code).digest("hex");
}

function normalizeIndianMobile(value) {
  if (typeof value !== "string") return "";
  const compact = value.trim().replace(/[\s()-]/g, "");
  if (!/^(?:\+?91)?[6-9]\d{9}$/.test(compact)) return "";
  return `+91${compact.replace(/^\+?91/, "")}`;
}

async function createOtp(email, purpose) {
  const code = String(randomInt(100000, 1000000));
  await Otp.deleteMany({ email: email.toLowerCase(), purpose });
  await Otp.create({
    email: email.toLowerCase(),
    codeHash: hashOtp(code),
    purpose,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  return code;
}

// ============================================
// 4. MULTER CONFIGURATION
// ============================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 3 * 1024 * 1024,
    files: 1,
  },
});

// ============================================
// 5. AUTHENTICATION HELPERS
// ============================================

function getTokenPayload(request) {
  try {
    const token = request.cookies[COOKIE_NAME] || "";

    const payload = jwt.verify(
      token,
      process.env.SESSION_SECRET
    );

    if (
      typeof payload !== "object" ||
      payload.role !== "admin"
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function requireAdmin(request, response, next) {
  const payload = getTokenPayload(request);

  if (!payload) {
    return response.status(401).json({
      error: "Please sign in to manage products.",
    });
  }

  next();
}

function getUserPayload(request) {
  try {
    const token = request.cookies[USER_COOKIE_NAME] || "";
    const payload = jwt.verify(token, process.env.SESSION_SECRET);
    return payload?.role === "user" ? payload : null;
  } catch {
    return null;
  }
}

async function requireUser(request, response, next) {
  const payload = getUserPayload(request);
  if (!payload?.userId) {
    return response.status(401).json({ error: "Please sign in to continue." });
  }

  try {
    const user = await User.findById(payload.userId);
    if (!user) {
      return response.status(401).json({ error: "Please sign in again." });
    }
    request.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

function setUserCookie(request, response, user) {
  const token = jwt.sign(
    { role: "user", userId: user._id.toString() },
    process.env.SESSION_SECRET,
    { expiresIn: "7d" },
  );

  response.cookie(USER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

// ============================================
// 6. PRODUCT RESPONSE FORMAT
// ============================================

function cleanProduct(product) {
  return {
    id: product._id.toString(),
    name: product.name,
    description: product.description,
    category: product.category,
    price: product.price,
    imageUrl: product.imageContentType
      ? `/api/products/${product._id}/image`
      : "",
    createdAt: product.createdAt,
  };
}

// ============================================
// 7. TEXT VALIDATION
// ============================================

function checkText(value, field, maxLength, required = true) {
  if (typeof value !== "string") {
    if (!required && (value === undefined || value === "")) {
      return "";
    }

    throw new Error(`${field} is required.`);
  }

  const normalized = value.trim();

  if (required && !normalized) {
    throw new Error(`${field} is required.`);
  }

  if (normalized.length > maxLength) {
    throw new Error(
      `${field} must be ${maxLength} characters or fewer.`
    );
  }

  return normalized;
}

// ============================================
// 8. IMAGE SIGNATURE VALIDATION
// ============================================

function validateImageSignature(file) {
  if (!file) return true;

  const buffer = file.buffer;

  if (file.mimetype === "image/jpeg") {
    return (
      buffer.length >= 4 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer.at(-2) === 0xff &&
      buffer.at(-1) === 0xd9
    );
  }

  if (file.mimetype === "image/png") {
    return (
      buffer.length >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(
          Buffer.from([
            0x89, 0x50, 0x4e, 0x47,
            0x0d, 0x0a, 0x1a, 0x0a,
          ])
        )
    );
  }

  if (file.mimetype === "image/webp") {
    return (
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    );
  }

  return false;
}

// ============================================
// 9. USER AND OTP AUTHENTICATION
// ============================================

app.post("/api/user/register", async (request, response, next) => {
  try {
    const { name, email, password } = request.body || {};
    const phone = normalizeIndianMobile(request.body?.phone);
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (typeof name !== "string" || !name.trim() || name.trim().length > 80) {
      return response.status(400).json({ error: "Enter a valid name." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 160) {
      return response.status(400).json({ error: "Enter a valid email address." });
    }
    if (!phone) {
      return response.status(400).json({ error: "Enter a valid Indian mobile number with 10 digits." });
    }
    if (typeof password !== "string" || password.length < 8 || password.length > 72) {
      return response.status(400).json({ error: "Password must be 8 to 72 characters." });
    }

    let user = await User.findOne({ email: normalizedEmail });
    const isNewUser = !user;
    if (user?.emailVerified || user?.phoneVerified) {
      return response.status(409).json({ error: "An account already exists with this email." });
    }
    const phoneOwner = await User.findOne({ phone });
    if (phoneOwner && phoneOwner.email !== normalizedEmail) {
      return response.status(409).json({ error: "An account already exists with this mobile number." });
    }
    if (!user) {
      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        phone,
        passwordHash: await bcrypt.hash(password, 12),
      });
    } else {
      user.name = name.trim();
      user.phone = phone;
      user.passwordHash = await bcrypt.hash(password, 12);
      await user.save();
    }

    const code = await createOtp(normalizedEmail, "verify_email");
    const emailSent = await sendOtpEmail(normalizedEmail, code, "verify_email");
    if (!emailSent) {
      await Otp.deleteMany({ email: normalizedEmail, purpose: "verify_email" });
      if (isNewUser) await User.deleteOne({ _id: user._id });
      return response.status(503).json({
        error: "We could not send the verification OTP to your email. Please try again later.",
      });
    }
    response.status(201).json({ requiresVerification: true, email: normalizedEmail });
  } catch (error) {
    next(error);
  }
});

app.post("/api/user/verify-email", async (request, response, next) => {
  try {
    const email = typeof request.body?.email === "string" ? request.body.email.trim().toLowerCase() : "";
    const otp = typeof request.body?.otp === "string" ? request.body.otp.trim() : "";
    if (!email || !/^\d{6}$/.test(otp)) {
      return response.status(400).json({ error: "Enter the 6-digit OTP." });
    }

    const record = await Otp.findOne({ email, purpose: "verify_email", expiresAt: { $gt: new Date() } });
    if (!record || record.codeHash !== hashOtp(otp)) {
      return response.status(400).json({ error: "Invalid or expired OTP." });
    }

    const user = await User.findOne({ email });
    if (!user) return response.status(404).json({ error: "Account not found." });
    user.emailVerified = true;
    await user.save();
    await Otp.deleteMany({ email, purpose: "verify_email" });
    setUserCookie(request, response, user);
    response.json({ authenticated: true, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    next(error);
  }
});

app.post("/api/user/login", async (request, response, next) => {
  try {
    const email = typeof request.body?.email === "string" ? request.body.email.trim().toLowerCase() : "";
    const password = typeof request.body?.password === "string" ? request.body.password : "";
    if (!email || !password) return response.status(400).json({ error: "Email and password are required." });

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return response.status(401).json({ error: "Invalid email or password." });
    }
    if (!user.emailVerified && !user.phoneVerified) {
      const code = await createOtp(email, "verify_email");
      const emailSent = await sendOtpEmail(email, code, "verify_email");
      if (!emailSent) {
        await Otp.deleteMany({ email, purpose: "verify_email" });
        return response.status(503).json({ error: "We could not send the verification OTP to your email. Please try again later." });
      }
      return response.status(403).json({ error: "Verify your email first.", requiresVerification: true, email });
    }

    setUserCookie(request, response, user);
    response.json({ authenticated: true, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    next(error);
  }
});

app.post("/api/user/forgot-password", async (request, response, next) => {
  try {
    const email = typeof request.body?.email === "string" ? request.body.email.trim().toLowerCase() : "";
    const user = await User.findOne({ email });
    if (user) {
      const code = await createOtp(email, "reset_password");
      const emailSent = await sendOtpEmail(email, code, "reset_password");
      if (!emailSent) {
        await Otp.deleteMany({ email, purpose: "reset_password" });
        return response.status(503).json({ error: "We could not send the password reset OTP to your email. Please try again later." });
      }
    }
    response.json({ message: "If the email is registered, a reset OTP has been sent." });
  } catch (error) {
    next(error);
  }
});

app.post("/api/user/reset-password", async (request, response, next) => {
  try {
    const email = typeof request.body?.email === "string" ? request.body.email.trim().toLowerCase() : "";
    const otp = typeof request.body?.otp === "string" ? request.body.otp.trim() : "";
    const password = typeof request.body?.password === "string" ? request.body.password : "";
    if (!/^\d{6}$/.test(otp)) return response.status(400).json({ error: "Enter the 6-digit OTP." });
    if (password.length < 8 || password.length > 72) {
      return response.status(400).json({ error: "Password must be 8 to 72 characters." });
    }

    const record = await Otp.findOne({ email, purpose: "reset_password", expiresAt: { $gt: new Date() } });
    if (!record || record.codeHash !== hashOtp(otp)) {
      return response.status(400).json({ error: "Invalid or expired OTP." });
    }
    const user = await User.findOne({ email });
    if (!user) return response.status(404).json({ error: "Account not found." });
    user.passwordHash = await bcrypt.hash(password, 12);
    await user.save();
    await Otp.deleteMany({ email, purpose: "reset_password" });
    setUserCookie(request, response, user);
    response.json({ authenticated: true, message: "Password updated.", user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    next(error);
  }
});

app.get("/api/user/session", async (request, response, next) => {
  const payload = getUserPayload(request);
  if (!payload?.userId) return response.json({ authenticated: false });

  try {
    const user = await User.findById(payload.userId);
    if (!user) return response.json({ authenticated: false });
    response.json({ authenticated: true, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    next(error);
  }
});

app.post("/api/user/logout", (_request, response) => {
  response.clearCookie(USER_COOKIE_NAME, { httpOnly: true, secure: IS_PRODUCTION, sameSite: "strict", path: "/" });
  response.json({ authenticated: false });
});

app.post("/api/payment/razorpay/order", requireUser, async (request, response, next) => {
  try {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return response.status(503).json({ error: "Online payment is not configured yet. Please contact the store." });
    }

    const rawItems = Array.isArray(request.body?.items) ? request.body.items : [];
    const customerPhone = typeof request.body?.phone === "string" ? request.body.phone.trim() : "";
    const deliveryAddress = typeof request.body?.address === "string" ? request.body.address.trim() : "";
    const showPublicPurchase = request.body?.showPublicPurchase === true;
    const city = typeof request.body?.city === "string" ? request.body.city.trim() : "";
    if (!rawItems.length || rawItems.length > 50) return response.status(400).json({ error: "Your bag is empty or contains too many items." });
    if (!/^[0-9+\-\s]{8,20}$/.test(customerPhone)) {
      return response.status(400).json({ error: "Enter a valid delivery phone number." });
    }
    if (deliveryAddress.length < 10 || deliveryAddress.length > 500) {
      return response.status(400).json({ error: "Enter a complete delivery address." });
    }
    if (showPublicPurchase && (!city || city.length > 80)) {
      return response.status(400).json({ error: "Enter a valid city to opt in to the public purchase popup." });
    }
    if (rawItems.some((item) => typeof item?.id !== "string" || !mongoose.isValidObjectId(item.id))) {
      return response.status(400).json({ error: "A bag item is no longer available." });
    }

    const productIds = [...new Set(rawItems.map((item) => item.id))];
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(products.map((product) => [product._id.toString(), product]));
    const items = [];
    for (const rawItem of rawItems) {
      const product = productMap.get(rawItem.id);
      const quantity = Number(rawItem.quantity);
      if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        return response.status(400).json({ error: "A bag item is no longer available." });
      }
      items.push({
        productId: product._id,
        name: product.name,
        category: product.category,
        price: product.price,
        quantity,
      });
    }
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const amountPaise = Math.round(subtotal * 100);
    if (!Number.isSafeInteger(amountPaise) || amountPaise < 1) {
      return response.status(400).json({ error: "The order total is invalid." });
    }

    const attempt = await PaymentAttempt.create({
      user: request.user._id,
      customerName: request.user.name,
      customerPhone,
      deliveryAddress,
      city: showPublicPurchase ? city : "",
      showPublicPurchase,
      items,
      subtotal,
      amountPaise,
      currency: "INR",
    });

    let providerOrder;
    try {
      providerOrder = await razorpayRequest("orders", {
        method: "POST",
        body: { amount: amountPaise, currency: "INR", receipt: attempt._id.toString() },
      });
      if (typeof providerOrder.id !== "string" || providerOrder.amount !== amountPaise || providerOrder.currency !== "INR") {
        throw new PaymentGatewayError();
      }
    } catch (error) {
      await PaymentAttempt.updateOne({ _id: attempt._id }, { $set: { status: "failed" } });
      throw error;
    }

    attempt.razorpayOrderId = providerOrder.id;
    attempt.status = "pending";
    await attempt.save();
    response.status(201).json({
      keyId: RAZORPAY_KEY_ID,
      amount: amountPaise,
      currency: "INR",
      razorpayOrderId: providerOrder.id,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/payment/razorpay/verify", requireUser, async (request, response, next) => {
  try {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return response.status(503).json({ error: "Online payment is not configured yet. Please contact the store." });
    }

    const orderId = typeof request.body?.razorpay_order_id === "string" ? request.body.razorpay_order_id : "";
    const paymentId = typeof request.body?.razorpay_payment_id === "string" ? request.body.razorpay_payment_id : "";
    const signature = typeof request.body?.razorpay_signature === "string" ? request.body.razorpay_signature : "";
    if (!/^order_[A-Za-z0-9]+$/.test(orderId) || !/^pay_[A-Za-z0-9]+$/.test(paymentId) || !/^[a-f0-9]{64}$/i.test(signature)) {
      return response.status(400).json({ error: "The payment confirmation is invalid." });
    }

    const attempt = await PaymentAttempt.findOne({ razorpayOrderId: orderId, user: request.user._id });
    if (!attempt) return response.status(404).json({ error: "Checkout payment was not found." });

    const expectedSignature = createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest();
    const receivedSignature = Buffer.from(signature, "hex");
    if (receivedSignature.length !== expectedSignature.length || !timingSafeEqual(receivedSignature, expectedSignature)) {
      return response.status(400).json({ error: "The payment could not be verified. No order has been placed." });
    }

    if (attempt.status === "paid") {
      if (attempt.razorpayPaymentId !== paymentId || !attempt.order) {
        return response.status(409).json({ error: "This checkout has already been completed." });
      }
      const existingOrder = await Order.findById(attempt.order);
      if (!existingOrder) return response.status(409).json({ error: "The paid checkout could not be matched to an order. Please contact the store." });
      return response.json({ ...existingOrder.toObject(), emailStatus: "already_processed" });
    }

    const payment = await razorpayRequest(`payments/${encodeURIComponent(paymentId)}`);
    const matchesAttempt = payment.order_id === orderId
      && payment.amount === attempt.amountPaise
      && payment.currency === attempt.currency;
    if (!matchesAttempt) {
      console.error(`Razorpay payment details did not match checkout ${attempt._id}.`);
      return response.status(402).json({ error: "Payment details did not match this checkout. No order has been placed; please contact the store." });
    }

    let confirmedPayment = payment;
    if (payment.status === "authorized") {
      try {
        confirmedPayment = await razorpayRequest(`payments/${encodeURIComponent(paymentId)}/capture`, {
          method: "POST",
          body: { amount: attempt.amountPaise, currency: attempt.currency },
        });
      } catch (captureError) {
        if (!(captureError instanceof PaymentGatewayError)) throw captureError;
        confirmedPayment = await razorpayRequest(`payments/${encodeURIComponent(paymentId)}`);
      }
    }
    if (confirmedPayment.status !== "captured") {
      return response.status(402).json({ error: "Payment is not complete. No order has been placed; please finish payment or contact the store." });
    }

    let order;
    try {
      order = await Order.create({
        user: attempt.user,
        customerName: attempt.customerName,
        customerPhone: attempt.customerPhone,
        deliveryAddress: attempt.deliveryAddress,
        city: attempt.city,
        showPublicPurchase: attempt.showPublicPurchase,
        paymentMethod: "razorpay",
        paymentStatus: "verified",
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        trackingNumber: createTrackingNumber(),
        items: attempt.items,
        subtotal: attempt.subtotal,
      });
    } catch (error) {
      if (error?.code !== 11000) throw error;
      order = await Order.findOne({ razorpayPaymentId: paymentId });
      if (!order) throw error;
    }

    const paidAttempt = await PaymentAttempt.findOneAndUpdate(
      { _id: attempt._id, status: { $ne: "paid" } },
      { $set: { status: "paid", razorpayPaymentId: paymentId, order: order._id } },
      { new: true },
    );
    if (!paidAttempt) {
      const savedAttempt = await PaymentAttempt.findById(attempt._id);
      if (savedAttempt?.razorpayPaymentId !== paymentId || !savedAttempt.order) {
        return response.status(409).json({ error: "This checkout has already been completed." });
      }
      const existingOrder = await Order.findById(savedAttempt.order);
      if (!existingOrder) return response.status(409).json({ error: "The paid checkout could not be matched to an order. Please contact the store." });
      return response.json({ ...existingOrder.toObject(), emailStatus: "already_processed" });
    }

    let emailStatus = "not_configured";
    if (mailTransport) {
      try {
        await sendOrderConfirmation(order, request.user);
        emailStatus = "sent";
        console.info(`Order confirmation email sent for order ${order._id}`);
      } catch (emailError) {
        emailStatus = "failed";
        console.error("Order confirmation email failed:", emailError);
      }
    }
    response.status(201).json({ ...order.toObject(), emailStatus });
  } catch (error) {
    next(error);
  }
});

app.post("/api/orders", requireUser, (_request, response) => {
  response.status(409).json({ error: "Complete Razorpay payment before placing an order." });
});

app.get("/api/orders/recent-purchases", async (_request, response, next) => {
  try {
    const cutoff = new Date(Date.now() - 15 * 60 * 1000);
    const orders = await Order.find({
      createdAt: { $gte: cutoff },
      showPublicPurchase: true,
      status: { $ne: "cancelled" },
      $or: [
        { paymentMethod: { $nin: ["upi", "razorpay"] } },
        { paymentMethod: { $in: ["upi", "razorpay"] }, paymentStatus: "verified" },
      ],
    })
      .select("customerName city items.name items.quantity createdAt -_id")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    const purchases = orders.flatMap((order) =>
      order.items.map((item) => ({
        customerName: order.customerName,
        city: order.city,
        productName: item.name,
        quantity: item.quantity,
        createdAt: order.createdAt,
      }))
    );
    response.json(purchases.slice(0, 10));
  } catch (error) {
    next(error);
  }
});

app.get("/api/orders/track/:trackingNumber", async (request, response, next) => {
  const trackingNumber = request.params.trackingNumber.trim().toUpperCase();
  if (!/^YPS-[A-F0-9]{16}$/.test(trackingNumber)) {
    return response.status(400).json({ error: "Enter a valid tracking number." });
  }

  try {
    const order = await Order.findOne({ trackingNumber })
      .select("trackingNumber status createdAt updatedAt")
      .lean();
    if (!order) return response.status(404).json({ error: "No order was found for that tracking number." });

    response.json({
      trackingNumber: order.trackingNumber,
      status: order.status,
      statusLabel: TRACKING_STATUS_LABELS[order.status] || "Order received",
      placedAt: order.createdAt,
      updatedAt: order.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/orders/history", requireUser, async (request, response, next) => {
  try {
    const orders = await Order.find({ user: request.user._id }).sort({ createdAt: -1 }).lean();
    response.json(orders);
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/dashboard", requireAdmin, async (_request, response, next) => {
  try {
    const [productCount, customerEmails, orderCount, orders] = await Promise.all([
      Product.countDocuments(),
      User.distinct("email", { $or: [{ emailVerified: true }, { phoneVerified: true }] }),
      Order.countDocuments(),
      Order.find().populate("user", "name email").sort({ createdAt: -1 }).lean(),
    ]);
    const revenue = orders.filter((order) => order.status !== "cancelled").reduce((sum, order) => sum + order.subtotal, 0);
    response.json({ stats: { productCount, userCount: customerEmails.length, orderCount, revenue }, orders });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/admin/orders/:id/payment-status", requireAdmin, async (request, response, next) => {
  try {
    const paymentStatus = request.body?.paymentStatus;
    if (!["pending", "submitted", "verified", "failed"].includes(paymentStatus)) {
      return response.status(400).json({ error: "Invalid payment status." });
    }
    const order = await Order.findById(request.params.id).populate("user", "name email");
    if (!order) return response.status(404).json({ error: "Order not found." });
    if (order.paymentMethod === "razorpay") {
      return response.status(409).json({ error: "Razorpay payment status is verified automatically." });
    }
    let emailSent = null;
    if (order.paymentStatus !== paymentStatus) {
      order.paymentStatus = paymentStatus;
      await order.save();
      try {
        emailSent = await sendOrderUpdateEmail(order, "payment");
      } catch (emailError) {
        console.error("Order payment status email failed:", emailError);
        emailSent = false;
      }
    }
    response.json({ ...order.toObject(), emailSent });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/admin/orders/:id/status", requireAdmin, async (request, response, next) => {
  try {
    const status = request.body?.status;
    if (!["new", "confirmed", "delivered", "cancelled"].includes(status)) {
      return response.status(400).json({ error: "Invalid order status." });
    }
    const order = await Order.findById(request.params.id).populate("user", "name email");
    if (!order) return response.status(404).json({ error: "Order not found." });
    let emailSent = null;
    if (order.status !== status) {
      order.status = status;
      await order.save();
      try {
        emailSent = await sendOrderUpdateEmail(order, "order");
      } catch (emailError) {
        console.error("Order status email failed:", emailError);
        emailSent = false;
      }
    }
    response.json({ ...order.toObject(), emailSent });
  } catch (error) {
    next(error);
  }
});

// ============================================
// 10. HEALTH CHECK
// ============================================

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

// ============================================
// 10. ADMIN LOGIN API
// RATE LIMIT REMOVED
// ============================================

app.post(
  "/api/admin/login",
  async (request, response, next) => {
    try {
      const { username, password } = request.body || {};

      if (
        typeof username !== "string" ||
        typeof password !== "string" ||
        username.length > 80 ||
        password.length > 200
      ) {
        return response.status(400).json({
          error: "Username and password are required.",
        });
      }

      const receivedUsername = Buffer.from(username);
      const configuredUsername = Buffer.from(
        process.env.ADMIN_USERNAME
      );

      const usernameMatches =
        receivedUsername.length === configuredUsername.length &&
        timingSafeEqual(
          receivedUsername,
          configuredUsername
        );

      const passwordMatches = await bcrypt.compare(
        password,
        passwordHash
      );

      if (!usernameMatches || !passwordMatches) {
        return response.status(401).json({
          error: "Invalid username or password.",
        });
      }

      const token = jwt.sign(
        { role: "admin" },
        process.env.SESSION_SECRET,
        { expiresIn: "8h" }
      );

      response.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: "strict",
        maxAge: 8 * 60 * 60 * 1000,
        path: "/",
      });

      return response.json({
        authenticated: true,
        message: "Login successful.",
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// 11. CHECK ADMIN SESSION
// ============================================

app.get("/api/admin/session", (request, response) => {
  const payload = getTokenPayload(request);

  response.json({
    authenticated: Boolean(payload),
  });
});

// ============================================
// 12. ADMIN LOGOUT
// ============================================

app.post("/api/admin/logout", (_request, response) => {
  response.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "strict",
    path: "/",
  });

  response.json({
    authenticated: false,
    message: "Logged out successfully.",
  });
});

// ============================================
// 13. GET ALL PRODUCTS
// ============================================

app.get("/api/products", async (_request, response, next) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .lean();

    response.json(products.map(cleanProduct));
  } catch (error) {
    next(error);
  }
});

app.get("/api/categories", async (_request, response, next) => {
  try {
    const [productCategories, categories] = await Promise.all([
      Product.distinct("category"),
      Category.find().select("name imageContentType").sort({ name: 1 }).lean(),
    ]);
    const productCategorySet = new Set(productCategories);
    const categoryByName = new Map(
      categories.map((item) => [
        item.name,
        {
          id: item._id.toString(),
          name: item.name,
          imageUrl: item.imageContentType ? `/api/categories/${item._id}/image` : "",
          inUse: productCategorySet.has(item.name),
        },
      ]),
    );
    const names = [...new Set([...productCategories, ...categories.map((item) => item.name)])];

    response.json(names.map((name) => categoryByName.get(name) || { name, imageUrl: "", inUse: true }));
  } catch (error) {
    next(error);
  }
});

app.get("/api/poster", async (_request, response, next) => {
  try {
    const poster = await Poster.findOne({ slot: "home" }).select("imageContentType updatedAt").lean();
    response.json(poster?.imageContentType ? { imageUrl: `/api/poster/image?v=${poster.updatedAt?.getTime?.() || 0}` } : null);
  } catch (error) { next(error); }
});

app.get("/api/poster/image", async (_request, response, next) => {
  try {
    const poster = await Poster.findOne({ slot: "home" }).select("+imageData imageContentType");
    if (!poster?.imageData || !poster.imageContentType) return response.status(404).json({ error: "Homepage poster not found." });
    response.set("Content-Type", poster.imageContentType);
    response.set("Cache-Control", "no-cache");
    response.send(poster.imageData);
  } catch (error) { next(error); }
});

app.put("/api/poster", requireAdmin, upload.single("image"), async (request, response, next) => {
  try {
    if (!request.file || !validateImageSignature(request.file)) return response.status(400).json({ error: "Upload a valid JPG, PNG, or WebP poster image." });
    const poster = await Poster.findOneAndUpdate(
      { slot: "home" },
      { $set: { imageData: request.file.buffer, imageContentType: request.file.mimetype } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    response.json({ imageUrl: `/api/poster/image?v=${poster.updatedAt.getTime()}` });
  } catch (error) { next(error); }
});

app.delete("/api/poster", requireAdmin, async (_request, response, next) => {
  try {
    await Poster.deleteOne({ slot: "home" });
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/categories/:id/image", async (request, response, next) => {
  try {
    const category = await Category.findById(request.params.id).select("+imageData imageContentType");
    if (!category?.imageData || !category.imageContentType) {
      return response.status(404).json({ error: "Category image not found." });
    }

    response.set("Content-Type", category.imageContentType);
    response.set("Cache-Control", "no-cache");
    response.send(category.imageData);
  } catch (error) {
    next(error);
  }
});

app.put(
  "/api/categories",
  requireAdmin,
  upload.single("image"),
  async (request, response, next) => {
    try {
      const name = checkText(request.body.name, "Category", 40);
      if (!request.file || !validateImageSignature(request.file)) {
        return response.status(400).json({ error: "Upload a valid JPG, PNG, or WebP category image." });
      }

      const category = await Category.findOneAndUpdate(
        { name },
        {
          $set: {
            imageData: request.file.buffer,
            imageContentType: request.file.mimetype,
          },
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
      );

      response.json({
        name: category.name,
        imageUrl: `/api/categories/${category._id}/image`,
      });
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Category ")) {
        return response.status(400).json({ error: error.message });
      }
      next(error);
    }
  },
);

app.delete("/api/categories/:id", requireAdmin, async (request, response, next) => {
  try {
    if (!mongoose.isValidObjectId(request.params.id)) {
      return response.status(400).json({ error: "Invalid category." });
    }
    const category = await Category.findById(request.params.id);
    if (!category) return response.status(404).json({ error: "Category not found." });
    if (await Product.exists({ category: category.name })) {
      return response.status(409).json({ error: "Reassign or remove products from this category before deleting it." });
    }
    await Category.deleteOne({ _id: category._id });
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// ============================================
// 14. GET PRODUCT IMAGE
// ============================================

app.get(
  "/api/products/:id/image",
  async (request, response, next) => {
    try {
      const product = await Product.findById(
        request.params.id
      ).select("+imageData imageContentType");

      if (!product?.imageData || !product.imageContentType) {
        return response.status(404).json({
          error: "Product image not found.",
        });
      }

      response.set("Content-Type", product.imageContentType);

      response.set(
        "Cache-Control",
        "public, max-age=86400"
      );

      response.send(product.imageData);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// 15. CREATE PRODUCT
// ============================================

app.post(
  "/api/products",
  requireAdmin,
  upload.single("image"),

  async (request, response, next) => {
    try {
      const name = checkText(
        request.body.name,
        "Product name",
        80
      );

      const category = checkText(
        request.body.category,
        "Category",
        40
      );

      const description = checkText(
        request.body.description,
        "Description",
        400,
        false
      );

      const price = Number(request.body.price);

      if (
        !Number.isFinite(price) ||
        price < 1 ||
        price > 10_000_000
      ) {
        return response.status(400).json({
          error: "Enter a valid price of at least ₹1.",
        });
      }

      if (!validateImageSignature(request.file)) {
        return response.status(400).json({
          error: "Upload a valid JPG, PNG, or WebP image.",
        });
      }

      const product = await Product.create({
        name,
        category,
        description,
        price,

        ...(request.file && {
          imageData: request.file.buffer,
          imageContentType: request.file.mimetype,
        }),
      });

      return response.status(201).json(
        cleanProduct(product)
      );
    } catch (error) {
      if (
        error instanceof Error &&
        /^(Product name|Category|Description) /.test(
          error.message
        )
      ) {
        return response.status(400).json({
          error: error.message,
        });
      }

      next(error);
    }
  }
);

app.put(
  "/api/products/:id",
  requireAdmin,
  upload.single("image"),
  async (request, response, next) => {
    try {
      const name = checkText(request.body.name, "Product name", 80);
      const category = checkText(request.body.category, "Category", 40);
      const description = checkText(request.body.description, "Description", 400, false);
      const price = Number(request.body.price);

      if (!Number.isFinite(price) || price < 1 || price > 10_000_000) {
        return response.status(400).json({ error: "Enter a valid price of at least ₹1." });
      }
      if (!validateImageSignature(request.file)) {
        return response.status(400).json({ error: "Upload a valid JPG, PNG, or WebP image." });
      }

      const product = await Product.findById(request.params.id);
      if (!product) return response.status(404).json({ error: "Product not found." });

      product.name = name;
      product.category = category;
      product.description = description;
      product.price = price;
      if (request.file) {
        product.imageData = request.file.buffer;
        product.imageContentType = request.file.mimetype;
      }
      await product.save();

      return response.json(cleanProduct(product));
    } catch (error) {
      if (error instanceof Error && /^(Product name|Category|Description) /.test(error.message)) {
        return response.status(400).json({ error: error.message });
      }
      next(error);
    }
  }
);

// ============================================
// 16. DELETE PRODUCT
// ============================================

app.delete(
  "/api/products/:id",
  requireAdmin,

  async (request, response, next) => {
    try {
      const product = await Product.findByIdAndDelete(
        request.params.id
      );

      if (!product) {
        return response.status(404).json({
          error: "Product not found.",
        });
      }

      return response.json({
        deleted: true,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// 17. ERROR HANDLER
// ============================================

app.use((error, _request, response, _next) => {
  if (error?.message === "Not allowed by CORS") {
    return response.status(403).json({
      error: "This website is not allowed to access the store API.",
    });
  }

  if (error instanceof PaymentGatewayError) {
    return response.status(502).json({
      error: "Secure payment service is temporarily unavailable. Please try again.",
    });
  }

  if (error instanceof multer.MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Images must be 3 MB or smaller."
        : "The selected image could not be uploaded.";

    return response.status(400).json({
      error: message,
    });
  }

  if (error?.name === "CastError") {
    return response.status(400).json({
      error: "Invalid product ID.",
    });
  }

  if (error?.name === "ValidationError") {
    return response.status(400).json({
      error: "Check the product details and try again.",
    });
  }

  if (mongoose.connection.readyState !== 1) {
    console.error("Request failed while MongoDB is disconnected:", error?.message || error);
    return response.status(503).json({
      error: "The store database is temporarily unavailable. Please try again shortly.",
    });
  }

  console.error("Request failed:", error);

  return response.status(500).json({
    error: "Something went wrong. Please try again.",
  });
});

// ============================================
// 18. FRONTEND STATIC FILES IN PRODUCTION
// ============================================

if (IS_PRODUCTION) {
  const clientDist = path.resolve(
    currentDirectory,
    "../dist"
  );

  app.use(express.static(clientDist));

  app.get("*", (_request, response) => {
    response.sendFile(
      path.join(clientDist, "index.html")
    );
  });
}

// ============================================
// 19. CONNECT DATABASE AND START SERVER
// ============================================

let reconnectTimeout = null;
let connectingToDatabase = false;

function scheduleDatabaseReconnect() {
  if (reconnectTimeout) return;
  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    void connectToDatabase();
  }, 5000);
  reconnectTimeout.unref();
}

async function connectToDatabase() {
  if (connectingToDatabase || mongoose.connection.readyState === 1) return;
  connectingToDatabase = true;
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    console.log("MongoDB connected successfully.");
  } catch (error) {
    console.error("Failed to connect to MongoDB; retrying shortly:", error.message);
    scheduleDatabaseReconnect();
  } finally {
    connectingToDatabase = false;
  }
}

mongoose.connection.on("disconnected", () => {
  console.error("MongoDB connection lost; reconnecting shortly.");
  scheduleDatabaseReconnect();
});

app.listen(PORT, () => {
  console.log(`Rajendra Puja Store API listening on http://127.0.0.1:${PORT}`);
  void connectToDatabase();
});