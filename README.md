# Rajendra Puja Store

An online puja-samagri storefront built with React, Vite, Express, and MongoDB.

## Requirements

- Node.js 20 or newer
- MongoDB locally or a MongoDB Atlas connection string

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Set `MONGODB_URI`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` (at least 12 characters), and `SESSION_SECRET` (at least 32 characters) in `.env`.
4. Optionally configure SMTP for email notifications and `UPI_ID` for QR payments.
5. Run `npm run dev` and open `http://127.0.0.1:5173`.

The admin dashboard manages the products stored in MongoDB. Customers sign in to place orders with Cash on Delivery or UPI. UPI payments require manual verification by the store.

The floating WhatsApp button is for customer help at **+91 97708 57704**; orders are placed through the website checkout. Recent-purchase notifications show a customer's name and city only when they opt in at checkout, and only for eligible purchases from the last 15 minutes.

For production, set `NODE_ENV=production`, set `CLIENT_URL` to the site's HTTPS origin, use a protected MongoDB deployment, configure email and payment settings, run `npm run build`, then run `npm start`. Do not commit `.env`; `.env.example` contains placeholders only.

## Deploy on Render

The repository includes a Render Blueprint in `render.yaml`. In Render, create a **Blueprint** and select `cp13cp/Yashoda_devi12`. Enter the MongoDB URI, admin credentials, UPI ID, and SMTP settings when prompted; Render generates `SESSION_SECRET`.

Set `CLIENT_URL` to the exact HTTPS origin Render assigns to the service (for example, `https://rajendra-puja-store.onrender.com`). The app uses that value to allow secure same-site API requests. Also allow the Render service's outbound IP addresses in MongoDB Atlas Network Access. The Blueprint builds the frontend and serves it from the Node web service.
