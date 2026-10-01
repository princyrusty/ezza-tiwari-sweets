/* Ezza by Tiwari Sweets — storefront logic */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const rupee = (n) => "₹" + Number(n).toLocaleString("en-IN");

  let PRODUCTS = [];
  let CONFIG = { whatsapp: "" };
  let cart = load();

  /* ---------- Aipan mandala (drawn in SVG) ---------- */
  function mandalaSVG() {
    const NS = "http://www.w3.org/2000/svg";
    const g = [];
    g.push(`<circle r="96" fill="none" stroke="currentColor" stroke-width="2"/>`);
    g.push(`<circle r="88" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2 5"/>`);
    for (let i = 0; i < 24; i++) {
      const a = (i * 15 * Math.PI) / 180;
      g.push(`<circle cx="${(92 * Math.cos(a)).toFixed(2)}" cy="${(92 * Math.sin(a)).toFixed(2)}" r="2.2" fill="currentColor"/>`);
    }
    for (let i = 0; i < 16; i++) {
      g.push(`<path transform="rotate(${i * 22.5})" d="M0 -82 C 14 -66 14 -52 0 -40 C -14 -52 -14 -66 0 -82Z" fill="none" stroke="currentColor" stroke-width="1.6"/>`);
      g.push(`<circle transform="rotate(${i * 22.5 + 11.25})" cx="0" cy="-70" r="3" fill="currentColor"/>`);
    }
    g.push(`<circle r="38" fill="none" stroke="currentColor" stroke-width="1.6"/>`);
    for (let i = 0; i < 8; i++) {
      g.push(`<path transform="rotate(${i * 45})" d="M0 -36 Q 10 -20 0 -8 Q -10 -20 0 -36Z" fill="currentColor" opacity=".9"/>`);
    }
    g.push(`<circle r="6" fill="currentColor"/>`);
    return g.join("");
  }
  const mSvg = mandalaSVG();
  $$("svg.mandala").forEach((s) => (s.innerHTML = mSvg));

  /* ---------- Loader ---------- */
  window.addEventListener("load", () => setTimeout(() => $("#loader").classList.add("done"), 500));
  setTimeout(() => $("#loader").classList.add("done"), 3500);

  /* ---------- Header + nav ---------- */
  const bar = $("#top-bar");
  const onScroll = () => bar.classList.toggle("scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  $("#burger").addEventListener("click", () => document.body.classList.toggle("nav-open"));
  $$("#nav a").forEach((a) => a.addEventListener("click", () => document.body.classList.remove("nav-open")));

  /* ---------- Falling marigold petals ---------- */
  const petals = $("#petals");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function petal() {
    if (document.hidden) return;
    const p = document.createElement("i");
    p.className = "petal" + (Math.random() < 0.35 ? " r" : "");
    p.style.left = Math.random() * 100 + "%";
    p.style.setProperty("--dx", (Math.random() * 200 - 100).toFixed(0) + "px");
    p.style.animationDuration = 7 + Math.random() * 6 + "s";
    p.style.transform = `scale(${0.6 + Math.random() * 0.8})`;
    petals.appendChild(p);
    setTimeout(() => p.remove(), 14000);
  }
  if (!reduce) setInterval(petal, 650);

  /* ---------- Scroll reveal ---------- */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))),
    { threshold: 0.15 }
  );
  const watch = () => $$(".reveal:not(.in)").forEach((el) => io.observe(el));

  /* ---------- Cart storage ---------- */
  function load() {
    try { return JSON.parse(localStorage.getItem("ezza-cart")) || {}; } catch { return {}; }
  }
  function save() {
    try { localStorage.setItem("ezza-cart", JSON.stringify(cart)); } catch {}
  }

  /* ---------- Products ---------- */
  function renderProducts() {
    $("#productGrid").innerHTML = PRODUCTS.map(
      (p, i) => `
      <article class="card reveal ${i % 2 ? "delay" : ""}" data-id="${p.id}">
        <div class="img">
          <img src="${p.image}" alt="${p.name}" loading="lazy">
          <div class="price">${rupee(p.price)}<small>${p.unit}</small></div>
        </div>
        <div class="body">
          <div class="hi">${p.hindi}</div>
          <h3>${p.name}</h3>
          <div class="tl">${p.tagline}</div>
          <p class="desc">${p.description}</p>
          <div class="meta"><span>⏳ 10–15 days shelf life</span><span>🚚 Pan India</span></div>
          <div class="buy">
            <div class="qty"><button data-d="-1" aria-label="Decrease">−</button><span>1</span><button data-d="1" aria-label="Increase">+</button></div>
            <button class="add">Add to cart</button>
          </div>
          <div class="credit">${p.credit}</div>
        </div>
      </article>`
    ).join("");

    $$(".card").forEach((card) => {
      const q = $(".qty span", card);
      $$(".qty button", card).forEach((b) =>
        b.addEventListener("click", () => (q.textContent = Math.min(50, Math.max(1, +q.textContent + +b.dataset.d))))
      );
      $(".add", card).addEventListener("click", () => {
        add(card.dataset.id, +q.textContent);
        q.textContent = "1";
      });
      // gentle 3D tilt
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-6px)`;
      });
      card.addEventListener("mouseleave", () => (card.style.transform = ""));
    });

    $("#priceList").innerHTML = PRODUCTS.map((p) => `<li><span>${p.name} (${p.unit})</span><b>${rupee(p.price)}</b></li>`).join("");
    $("#credits").textContent = "Images: " + PRODUCTS.map((p) => p.credit.replace("Photo: ", "")).join(" · ") + " · Almora hills: Pradeepwb, CC BY-SA 4.0";
    watch();
  }

  /* ---------- Cart ---------- */
  function add(id, qty) {
    cart[id] = Math.min(50, (cart[id] || 0) + qty);
    save();
    renderCart();
    const btn = $("#openCart");
    btn.classList.remove("bump"); void btn.offsetWidth; btn.classList.add("bump");
    const p = PRODUCTS.find((x) => x.id === id);
    toast(`${qty} × ${p.name} added to your box`);
  }
  function renderCart() {
    const ids = Object.keys(cart).filter((id) => cart[id] > 0 && PRODUCTS.some((p) => p.id === id));
    const count = ids.reduce((s, id) => s + cart[id], 0);
    $("#cartCount").textContent = count;
    const box = $("#cartItems");
    if (!ids.length) {
      box.innerHTML = `<div class="empty"><svg class="mandala" viewBox="-100 -100 200 200" width="80" height="80">${mSvg}</svg>Your mithai box is empty.<br>Add some sweetness from Almora!</div>`;
    } else {
      box.innerHTML = ids.map((id) => {
        const p = PRODUCTS.find((x) => x.id === id);
        return `<div class="ci" data-id="${id}">
          <img src="${p.image}" alt="">
          <div class="n"><b>${p.name}</b><small>${rupee(p.price)} · ${p.unit}</small><br><button class="rm">Remove</button></div>
          <div class="qty"><button data-d="-1">−</button><span>${cart[id]}</span><button data-d="1">+</button></div>
        </div>`;
      }).join("");
      $$(".ci", box).forEach((row) => {
        const id = row.dataset.id;
        $$(".qty button", row).forEach((b) => b.addEventListener("click", () => {
          cart[id] = Math.min(50, cart[id] + +b.dataset.d);
          if (cart[id] <= 0) delete cart[id];
          save(); renderCart();
        }));
        $(".rm", row).addEventListener("click", () => { delete cart[id]; save(); renderCart(); });
      });
    }
    const sub = ids.reduce((s, id) => s + PRODUCTS.find((p) => p.id === id).price * cart[id], 0);
    $("#subtotal").textContent = rupee(sub);
    $("#checkout").style.display = ids.length ? "" : "none";
  }

  const openCart = () => document.body.classList.add("cart-open");
  const closeCart = () => document.body.classList.remove("cart-open");
  $("#openCart").addEventListener("click", openCart);
  $("#closeCart").addEventListener("click", closeCart);
  $("#overlay").addEventListener("click", closeCart);
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeCart());

  /* ---------- Checkout → WhatsApp ---------- */
  $("#checkout").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("#err");
    err.textContent = "";
    const data = Object.fromEntries(new FormData(e.target));
    const items = Object.entries(cart).filter(([, q]) => q > 0).map(([id, qty]) => ({ id, qty }));
    const btn = $("#placeBtn");
    btn.disabled = true;
    // open the tab synchronously so popup blockers allow it
    const win = window.open("", "_blank");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, customer: data })
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Something went wrong");
      if (win) win.location.href = out.whatsappUrl; else window.location.href = out.whatsappUrl;
      toast(`Order ${out.orderId} ready, sending to WhatsApp…`);
      cart = {}; save(); renderCart(); e.target.reset(); closeCart();
    } catch (ex) {
      if (win) win.close();
      err.textContent = ex.message;
    } finally {
      btn.disabled = false;
    }
  });

  /* ---------- WhatsApp quick links ---------- */
  function wireWa() {
    const url = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent("Namaste Ezza by Tiwari Sweets! I'd like to know more about your sweets.")}`;
    $$(".js-wa").forEach((a) => { a.href = url; a.target = "_blank"; a.rel = "noopener"; });
  }

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2600);
  }

  $("#yr").textContent = new Date().getFullYear();
  watch();

  Promise.all([fetch("/api/products").then((r) => r.json()), fetch("/api/config").then((r) => r.json())])
    .then(([p, c]) => { PRODUCTS = p; CONFIG = c; renderProducts(); renderCart(); wireWa(); })
    .catch(() => { $("#productGrid").innerHTML = "<p>Could not load sweets. Please refresh.</p>"; });
})();
