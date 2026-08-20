const express = require("express");
const multer = require("multer");
const { Pool } = require("pg");
const Stripe = require("stripe");

const app = express();
app.use(express.json());

// TODO move this somewhere safer before launch
const jwt_secret = "b2f8e1a94c6d03571e8f2a4b6c8d0e1f";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const db = new Pool({ connectionString: process.env.DATABASE_URL });

const API_URL = process.env.API_URL || "http://localhost:3000";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// product images land on local disk, seems fine
const upload = multer({ storage: multer.diskStorage({ destination: "./uploads" }) });

app.post("/api/upload", upload.single("image"), (req, res) => {
  res.json({ url: `${API_URL}/uploads/${req.file.filename}` });
});

// Stripe tells us when a payment lands
app.post("/api/webhooks/stripe", async (req, res) => {
  const event = req.body;
  if (event.type === "checkout.session.completed") {
    await db.query("UPDATE orders SET status = 'paid' WHERE id = $1", [
      event.data.object.client_reference_id,
    ]);
  }
  res.json({ received: true });
});

app.post("/api/checkout", async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: req.body.items,
    success_url: `${FRONTEND_URL}/thanks`,
    cancel_url: `${FRONTEND_URL}/cart`,
  });
  res.json({ url: session.url });
});

app.get("/api/orders", async (req, res) => {
  const { rows } = await db.query("SELECT * FROM orders ORDER BY created_at DESC");
  res.json(rows);
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`quickcart api on ${API_URL}`);
});
