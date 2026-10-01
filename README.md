# Ezza by Tiwari Sweets, Almora

Full-stack storefront (Node.js + Express) for Mandua sweets, Bal Mithai and Chocolate Barfi, with WhatsApp ordering and Pan India delivery.

- `npm install && npm start` then open http://localhost:3000
- **WHATSAPP_NUMBER**: env var, country code + number, digits only (e.g. 919876543210)
- **ADMIN_KEY**: env var; view orders at `/api/orders?key=YOUR_KEY`
- Prices live in `server.js` (`PRODUCTS`); front-end is `index.html`, `styles.css`, `app.js`, and the server re-prices every order.

API: `GET /api/products`, `GET /api/config`, `POST /api/orders`, `GET /api/orders?key=`
