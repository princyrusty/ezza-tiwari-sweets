// Ezza by Tiwari Sweets, Champawat — Express backend
// Serves the storefront, the product catalogue API and the WhatsApp order API.

const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

// ---- Settings (change on Render under "Environment") ----
// WhatsApp number with country code, digits only. e.g. 919876543210
const WHATSAPP_NUMBER = (process.env.WHATSAPP_NUMBER || "918755655667").replace(/\D/g, "");
const ADMIN_KEY = process.env.ADMIN_KEY || ""; // set to view orders at /api/orders?key=...
const ORDERS_FILE = path.join(__dirname, "data", "orders.json");

// ---- Product catalogue (single source of truth for prices) ----
const PRODUCTS = [
  {
    id: "chocolate-barfi",
    name: "Chocolate Barfi",
    hindi: "चॉकलेट बर्फ़ी",
    price: 600,
    unit: "1 kg box",
    tagline: "Rich khoya barfi layered with smooth chocolate",
    description:
      "Slow-cooked khoya, fine cocoa and a soft, melt-in-the-mouth bite. A modern favourite made the old pahadi way.",
    image: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Quick_fudge_-_six_squares.jpg",
    credit: "Photo: Simon Cousins, CC BY 2.0, via Wikimedia Commons",
    accent: "#5a2e1b"
  },
  {
    id: "bal-mithai",
    name: "Bal Mithai",
    hindi: "बाल मिठाई",
    price: 500,
    unit: "1 kg box",
    tagline: "Almora's legendary brown fudge with sugar pearls",
    description:
      "Roasted khoya cooked till deep brown, then coated in tiny white sugar balls. The sweet Almora is famous for.",
    image: "https://upload.wikimedia.org/wikipedia/commons/9/9a/Bal_mithai.jpg",
    credit: "Photo: vkumar, CC BY 3.0, via Wikimedia Commons",
    accent: "#7a3b16"
  },
  {
    id: "mandua-sweets",
    name: "Mandua Sweets",
    hindi: "मंडुवा मिठाई",
    price: 300,
    unit: "300 g box",
    tagline: "Wholesome finger-millet sweets from the hills",
    description:
      "Mandua (finger millet), a pahadi staple, turned into a soft, wholesome barfi finished with almonds and pistachios.",
    image: "/mandua.jpg",
    credit: "",
    accent: "#3d2a22"
  }
];

const MAX_QTY = 50;

app.use(express.json({ limit: "20kb" }));
// Static front-end files (kept in the repo root for simple uploads)
const STATIC = { "/styles.css": "styles.css", "/app.js": "app.js", "/mandua.jpg": "mandua.jpg", "/hero.jpg": "hero.jpg" };
for (const [route, file] of Object.entries(STATIC)) {
  app.get(route, (_req, res) => res.sendFile(path.join(__dirname, file), { maxAge: "1h" }));
}

// ---- Helpers ----
function readOrders() {
  try {
    return JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8"));
  } catch {
    return [];
  }
}
function saveOrder(order) {
  try {
    fs.mkdirSync(path.dirname(ORDERS_FILE), { recursive: true });
    const all = readOrders();
    all.push(order);
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(all, null, 2));
  } catch (e) {
    console.error("Could not save order:", e.message);
  }
}
const clean = (v, max = 200) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
const rupee = (n) => "₹" + n.toLocaleString("en-IN");

// ---- API ----
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/products", (_req, res) => res.json(PRODUCTS));

app.get("/api/config", (_req, res) =>
  res.json({ whatsapp: WHATSAPP_NUMBER, shelfLife: "10–15 days", delivery: "Pan India" })
);

app.post("/api/orders", (req, res) => {
  const { items, customer = {} } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Your cart is empty." });
  }

  // Re-price everything on the server so prices can't be tampered with
  const lines = [];
  for (const it of items) {
    const p = PRODUCTS.find((x) => x.id === it.id);
    const qty = Math.floor(Number(it.qty));
    if (!p || !Number.isFinite(qty) || qty < 1 || qty > MAX_QTY) {
      return res.status(400).json({ error: "Invalid item in cart." });
    }
    lines.push({ id: p.id, name: p.name, unit: p.unit, price: p.price, qty, total: p.price * qty });
  }

  const c = {
    name: clean(customer.name, 80),
    phone: clean(customer.phone, 20),
    address: clean(customer.address, 300),
    city: clean(customer.city, 60),
    state: clean(customer.state, 60),
    pincode: clean(customer.pincode, 10),
    note: clean(customer.note, 300)
  };
  if (!c.name || !/^[0-9+\-\s]{10,15}$/.test(c.phone) || !c.address || !/^\d{6}$/.test(c.pincode)) {
    return res.status(400).json({ error: "Please fill name, a valid phone, address and 6-digit PIN code." });
  }

  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const orderId = "EZZA-" + Date.now().toString(36).toUpperCase() + "-" + crypto.randomBytes(2).toString("hex").toUpperCase();

  const msg = [
    `🙏 Namaste Ezza by Tiwari Sweets!`,
    `I'd like to place an order.`,
    ``,
    `*Order ID:* ${orderId}`,
    ``,
    ...lines.map((l) => `• ${l.name} (${l.unit}) × ${l.qty} = ${rupee(l.total)}`),
    ``,
    `*Subtotal:* ${rupee(subtotal)} (+ delivery charges)`,
    ``,
    `*Deliver to:*`,
    `${c.name}, ${c.phone}`,
    `${c.address}`,
    `${[c.city, c.state].filter(Boolean).join(", ")} - ${c.pincode}`,
    c.note ? `\n*Note:* ${c.note}` : ""
  ]
    .filter((x, i, a) => !(x === "" && a[i - 1] === ""))
    .join("\n")
    .trim();

  const order = { orderId, createdAt: new Date().toISOString(), lines, subtotal, customer: c };
  saveOrder(order);

  res.json({
    orderId,
    subtotal,
    whatsappUrl: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`
  });
});

app.get("/api/orders", (req, res) => {
  if (!ADMIN_KEY || req.query.key !== ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });
  res.json(readOrders().reverse());
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.listen(PORT, () => console.log(`Ezza running on http://localhost:${PORT}`));
