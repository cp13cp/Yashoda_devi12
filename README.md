# Rajendra Puja Store

An online puja-samagri storefront built with React, Vite, Express, and MongoDB.

## Requirements

- Node.js 20 or newer
- MongoDB locally or a MongoDB Atlas connection string

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Set `MONGODB_URI`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` (at least 12 characters), and `SESSION_SECRET` (at least 32 characters) in `.env`.
4. Configure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` for online payments. Configure Resend (`RESEND_API_KEY` and a verified `RESEND_FROM`) or SMTP for account OTPs; SMTP is used for purchase emails.
5. Run `npm run dev` and open `http://127.0.0.1:5173`.

The admin dashboard manages products and category photos stored in MongoDB. Use the Categories tab to upload or replace category images; they appear as circular filters in the shop. Customers sign in and pay through Razorpay; an order is created only after the server verifies and captures the payment. Customers receive a tracking number after purchase and can check its order status on the Track order section. Configure Resend (`RESEND_API_KEY` and `RESEND_FROM`) for account verification and password-reset OTPs, or use SMTP as a fallback. The Resend sender address must be verified in Resend; SMTP continues to send purchase confirmations and order-status emails. Cash on Delivery and unverified UPI orders are disabled.

The floating WhatsApp button is for customer help at **+91 97708 57704**; orders are placed through the website checkout. Recent-purchase notifications show a customer's name and city only when they opt in at checkout, and only for eligible purchases from the last 15 minutes.

For production, set `NODE_ENV=production`, set `CLIENT_URL` to the site's HTTPS origin (multiple origins can be comma-separated), use a protected MongoDB deployment, configure email and payment settings, run `npm run build`, then run `npm start`. Do not commit `.env`; `.env.example` contains placeholders only.

## Deploy on Render

The repository includes a Render Blueprint in `render.yaml`. In Render, create a **Blueprint** and select `cp13cp/Yashoda_devi12`. Enter the MongoDB URI, admin credentials, Razorpay API keys, SMTP settings, Resend API key, and verified sender address when prompted; Render generates `SESSION_SECRET`.

If you serve the frontend from Render, set `CLIENT_URL` to the exact HTTPS origin Render assigns to the service. When using both Netlify and a custom domain, set `CLIENT_URL` to both HTTPS origins separated by a comma. Also allow the Render service's outbound IP addresses in MongoDB Atlas Network Access. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in the Render dashboard from your Razorpay account (use test keys for testing and keep the secret private). Enable automatic payment capture in Razorpay if your account does not allow the server to capture authorized payments. The Blueprint can build and serve the frontend from the Node web service.

## Deploy the frontend on Netlify

The `netlify.toml` file builds the React app, publishes `dist`, proxies `/api/*` requests to `https://yashoda-devi12.onrender.com`, and provides SPA routing. Connect `cp13cp/Yashoda_devi12` on the `main` branch to Netlify; the build settings are read from this file.

After Netlify assigns the site URL, update `CLIENT_URL` in the Render service's environment to that exact HTTPS origin (for example, `https://your-site.netlify.app`) and redeploy the Render service. This is required for the API's credentialed CORS requests.
