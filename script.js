/* Blue Sky — shared script: theme, navbar, cart, products, order, checkout */
(function () {
  'use strict';

  /* ---------- Product data (เปลี่ยน img เป็นรูปจริง เช่น 'images/basic.jpg') ---------- */
  const PRODUCTS = [
    { id: 'basic', name: 'Blue Sky Original', desc: 'เยลลี่รสฟ้าใส 1 ซอง (10 ชิ้น) พร้อมสติกเกอร์น้องหมี 1 ดวง', price: 59, unit: 'ซอง', icon: 'bi-cloud-fill', colors: '#4fc3f7,#7b5cff', img: '' },
    { id: 'standard', name: 'Sky Share Box', desc: 'เยลลี่ 3 ซอง (30 ชิ้น) เลือกได้ 2 รสชาติ แบ่งปันกับเพื่อน ส่งฟรีทั่วประเทศ', price: 159, unit: 'กล่อง', icon: 'bi-droplet-half', colors: '#7b5cff,#f3a6ff', img: '' },
    { id: 'premium', name: 'Sky Gift Set', desc: 'เยลลี่ 8 ซอง ครบทุกรส + ตุ๊กตาน้องหมี + กล่องของขวัญและการ์ดอวยพร', price: 359, unit: 'เซ็ต', icon: 'bi-balloon-heart-fill', colors: '#f3a6ff,#ff8fa3', img: '' }
  ];
  const FREE_SHIP_MIN = 159, SHIP_FEE = 40, MAX_QTY = 99;

  const $ = (s, r) => (r || document).querySelector(s);
  const fmt = n => '฿' + n.toLocaleString('th-TH');
  const find = id => PRODUCTS.find(p => p.id === id);
  const clamp = q => Math.max(1, Math.min(MAX_QTY, q));
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };

  /* ---------- Dark / Light theme ---------- */
  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.setAttribute('data-bs-theme', t);
    store.set('bs_theme', t);
  }
  setTheme(store.get('bs_theme', 'dark'));

  /* ---------- Cart state ---------- */
  let cart = store.get('bs_cart', {});               // { productId: qty }
  const saveCart = () => { store.set('bs_cart', cart); renderCart(); };
  const cartLines = () => Object.keys(cart).filter(id => find(id)).map(id => ({ p: find(id), qty: cart[id] }));
  const subtotal = () => cartLines().reduce((s, l) => s + l.p.price * l.qty, 0);
  const shipping = sub => (sub === 0 || sub >= FREE_SHIP_MIN ? 0 : SHIP_FEE);
  function addToCart(id, qty) { cart[id] = clamp((cart[id] || 0) + qty); saveCart(); }

  /* ---------- Reusable markup ---------- */
  const imgBox = (p, cls) => p.img
    ? `<img src="${p.img}" alt="${p.name}" class="product-img ${cls || ''} object-fit-cover">`
    : `<div class="product-img ${cls || ''}" style="background:linear-gradient(135deg,${p.colors})" role="img" aria-label="${p.name}"><i class="bi ${p.icon}"></i></div>`;
  const stepper = (id, q) => `<div class="qty-stepper" role="group" aria-label="จำนวน">
      <button type="button" class="btn-qty" data-act="dec" data-id="${id}" aria-label="ลดจำนวน"><i class="bi bi-dash-lg"></i></button>
      <span class="qty-val" aria-live="polite">${q}</span>
      <button type="button" class="btn-qty" data-act="inc" data-id="${id}" aria-label="เพิ่มจำนวน"><i class="bi bi-plus-lg"></i></button></div>`;

  /* ---------- Navbar + cart drawer (shared by every page) ---------- */
  function buildNav() {
    const host = $('#site-nav'); if (!host) return;
    const page = document.body.dataset.page;
    const links = [['home', 'index.html#home', 'Home'], ['features', 'index.html#features', 'Features'], ['product', 'index.html#product', 'Product'],
    ['pricing', 'index.html#pricing', 'Price List'], ['social', 'index.html#social', 'Social'], ['about', 'about.html', 'Team Members']];
    host.outerHTML = `
<nav class="navbar navbar-expand-lg navbar-bs sticky-top">
  <div class="container-fluid px-3 px-lg-4">
    <a class="navbar-brand d-flex align-items-center gap-2" href="index.html#home">
      <span class="brand-logo"><i class="bi bi-balloon-heart-fill"></i></span>
      <span class="brand-text">Blue<br>Sky</span>
    </a>
    <div class="d-flex align-items-center gap-2 order-lg-last">
      <button class="cart-btn" type="button" data-bs-toggle="offcanvas" data-bs-target="#cartCanvas" aria-label="เปิดตะกร้าสินค้า">
        <i class="bi bi-cart3"></i><span class="cart-badge" id="cartCount">0</span>
      </button>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="เปิดเมนู">
        <span class="navbar-toggler-icon"></span>
      </button>
    </div>
    <div class="collapse navbar-collapse" id="mainNav">
      <ul class="navbar-nav mx-auto">
        ${links.map(l => `<li class="nav-item"><a class="nav-link${l[0] === page ? ' active' : ''}" href="${l[1]}">${l[2]}</a></li>`).join('')}
      </ul>
      <div class="theme-toggle ms-lg-3 me-lg-4 mt-3 mt-lg-0" id="themeToggle" role="button" tabindex="0" aria-label="สลับโหมดมืด/สว่าง">
        <i class="bi bi-moon-stars-fill moon"></i><i class="bi bi-brightness-high-fill sun"></i>
      </div>
    </div>
  </div>
</nav>`;
    document.body.insertAdjacentHTML('beforeend', `
<div class="offcanvas offcanvas-end cart-canvas" tabindex="-1" id="cartCanvas" aria-labelledby="cartTitle">
  <div class="offcanvas-header">
    <h2 class="h5 mb-0" id="cartTitle"><i class="bi bi-cart3 me-2"></i>ตะกร้าสินค้า</h2>
    <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="ปิด"></button>
  </div>
  <div class="offcanvas-body d-flex flex-column">
    <div id="cartItems" class="flex-grow-1"></div>
    <div class="border-top pt-3 mt-3">
      <div class="d-flex justify-content-between fw-bold fs-5 mb-3"><span>รวม</span><span id="cartTotal">฿0</span></div>
      <a href="checkout.html" id="cartCheckout" class="btn btn-fly w-100">ชำระเงิน</a>
    </div>
  </div>
</div>`);
    const tg = $('#themeToggle');
    const flip = () => setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    tg.addEventListener('click', flip);
    tg.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
    $('#cartItems').addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const id = b.dataset.id;
      if (b.dataset.act === 'inc') cart[id] = clamp(cart[id] + 1);
      if (b.dataset.act === 'dec') cart[id] = clamp(cart[id] - 1);
      if (b.dataset.act === 'del') delete cart[id];
      saveCart();
    });
  }

  function renderCart() {
    const box = $('#cartItems'); if (!box) return;
    const lines = cartLines(), count = lines.reduce((s, l) => s + l.qty, 0);
    $('#cartCount').textContent = count;
    $('#cartCount').classList.toggle('d-none', count === 0);
    $('#cartTotal').textContent = fmt(subtotal());
    $('#cartCheckout').classList.toggle('disabled', count === 0);
    box.innerHTML = lines.length ? lines.map(({ p, qty }) => `
      <div class="cart-row">
        ${imgBox(p, 'thumb')}
        <div class="flex-grow-1">
          <div class="fw-semibold">${p.name}</div>
          <div class="text-soft small mb-2">${fmt(p.price)} / ${p.unit}</div>
          ${stepper(p.id, qty)}
        </div>
        <div class="text-end">
          <div class="fw-bold">${fmt(p.price * qty)}</div>
          <button type="button" class="btn btn-link btn-sm text-soft p-0 mt-2" data-act="del" data-id="${p.id}" aria-label="ลบ ${p.name}"><i class="bi bi-trash3"></i></button>
        </div>
      </div>`).join('')
      : `<div class="text-center text-soft py-5"><i class="bi bi-cart-x fs-1 d-block mb-2"></i>ตะกร้ายังว่าง<br>เลือกเยลลี่ที่ชอบได้เลย</div>`;
    renderSummary();
  }

  /* ---------- Product section (index.html) ---------- */
  function initProducts() {
    const grid = $('#productGrid'); if (!grid) return;
    const qtys = {};
    grid.innerHTML = PRODUCTS.map(p => {
      qtys[p.id] = 1; return `
      <div class="col-12 col-md-6 col-lg-4" data-id="${p.id}">
        <article class="glass-card p-4 text-center d-flex flex-column">
          <a href="order.html?id=${p.id}" class="text-decoration-none" aria-label="ดูรายละเอียด ${p.name}">${imgBox(p, 'mb-3')}</a>
          <h3 class="h4">${p.name}</h3>
          <p class="text-soft flex-grow-1">${p.desc}</p>
          <div class="d-flex justify-content-between align-items-center mb-3">
            ${stepper(p.id, 1)}
            <div class="price-live"><small class="text-soft">${fmt(p.price)} / ${p.unit}</small><div class="fs-3 fw-bold" data-total>${fmt(p.price)}</div></div>
          </div>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-outline-fly flex-fill" data-act="order" data-id="${p.id}">สั่งซื้อ</button>
            <button type="button" class="btn btn-fly flex-fill px-2" data-act="add" data-id="${p.id}"><i class="bi bi-cart-plus me-1"></i>ใส่ตะกร้า</button>
          </div>
        </article>
      </div>`;
    }).join('');
    grid.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const id = b.dataset.id, col = b.closest('[data-id]'), p = find(id), act = b.dataset.act;
      if (act === 'inc' || act === 'dec') {
        qtys[id] = clamp(qtys[id] + (act === 'inc' ? 1 : -1));
        $('.qty-val', col).textContent = qtys[id];
        $('[data-total]', col).textContent = fmt(p.price * qtys[id]);
      }
      if (act === 'add') { addToCart(id, qtys[id]); bootstrap.Offcanvas.getOrCreateInstance($('#cartCanvas')).show(); }
      if (act === 'order') location.href = `order.html?id=${id}&qty=${qtys[id]}`;
    });
  }

  /* ---------- Order page (order.html) ---------- */
  function initOrder() {
    const view = $('#orderView'); if (!view) return;
    const q = new URLSearchParams(location.search);
    const p = find(q.get('id')) || PRODUCTS[0];
    let qty = clamp(parseInt(q.get('qty'), 10) || 1);
    view.innerHTML = `
      <div class="col-lg-6">${imgBox(p, 'product-img-lg')}</div>
      <div class="col-lg-6">
        <div class="glass-card p-4">
          <h2 class="h3">${p.name}</h2>
          <p class="text-soft">${p.desc}</p>
          <ul class="list-unstyled price-list mb-4">
            <li class="d-flex justify-content-between"><span>ราคาต่อหน่วย</span><span>${fmt(p.price)} / ${p.unit}</span></li>
            <li class="d-flex justify-content-between align-items-center"><span>จำนวน</span>${stepper(p.id, qty)}</li>
            <li class="d-flex justify-content-between"><span>ค่าจัดส่ง</span><span id="oShip"></span></li>
            <li class="d-flex justify-content-between fw-bold fs-5"><span>ยอดรวม</span><span id="oTotal"></span></li>
          </ul>
          <div class="d-flex flex-wrap gap-2">
            <button type="button" class="btn btn-outline-fly flex-fill" id="oAdd"><i class="bi bi-cart-plus me-1"></i>ใส่ตะกร้า</button>
            <button type="button" class="btn btn-fly flex-fill" id="oBuy">สั่งซื้อทันที</button>
          </div>
          <p class="small text-soft mt-3 mb-0">ส่งฟรีเมื่อสั่งครบ ${fmt(FREE_SHIP_MIN)} ขึ้นไป</p>
        </div>
      </div>`;
    const calc = () => {
      const sub = p.price * qty;
      $('.qty-val', view).textContent = qty;
      $('#oShip').textContent = shipping(sub) ? fmt(shipping(sub)) : 'ฟรี';
      $('#oTotal').textContent = fmt(sub + shipping(sub));
    };
    calc();
    view.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      qty = clamp(qty + (b.dataset.act === 'inc' ? 1 : -1)); calc();
    });
    $('#oAdd').addEventListener('click', () => { addToCart(p.id, qty); bootstrap.Offcanvas.getOrCreateInstance($('#cartCanvas')).show(); });
    $('#oBuy').addEventListener('click', () => { addToCart(p.id, qty); location.href = 'checkout.html'; });
  }

  /* ---------- Checkout (checkout.html) ---------- */
  function renderSummary() {
    const list = $('#sumList'); if (!list) return;
    const lines = cartLines(), sub = subtotal(), ship = shipping(sub);
    list.innerHTML = lines.length ? lines.map(({ p, qty }) => `
      <li class="d-flex justify-content-between"><span>${p.name} × ${qty}</span><span>${fmt(p.price * qty)}</span></li>`).join('')
      : '<li class="text-soft">ยังไม่มีสินค้า — <a class="text-reset" href="index.html#product">เลือกสินค้า</a></li>';
    $('#sumSub').textContent = fmt(sub);
    $('#sumShip').textContent = ship ? fmt(ship) : 'ฟรี';
    $('#sumTotal').textContent = fmt(sub + ship);
    $('#placeOrder').disabled = !lines.length;
  }

  function initCheckout() {
    const form = $('#checkoutForm'); if (!form) return;
    const method = $('#payMethod'), slip = $('#slip'), prev = $('#slipPreview');
    const sync = () => {
      const card = method.value === 'card';
      $('#cardFields').classList.toggle('d-none', card === false);
      $('#transferInfo').classList.toggle('d-none', card);
      $('#slipWrap').classList.toggle('d-none', card);
      slip.required = !card;
      $('#cardFields').querySelectorAll('input').forEach(i => { i.required = card; });
    };
    method.addEventListener('change', sync); sync();
    slip.addEventListener('change', () => {
      const f = slip.files[0]; prev.innerHTML = '';
      slip.setCustomValidity('');
      if (!f) return;
      if (!/^image\/|application\/pdf/.test(f.type) || f.size > 5 * 1024 * 1024) {
        slip.setCustomValidity('ไฟล์ต้องเป็นรูปภาพหรือ PDF ขนาดไม่เกิน 5 MB'); slip.value = ''; $('#slipError').textContent = 'ไฟล์ต้องเป็นรูปภาพหรือ PDF ขนาดไม่เกิน 5 MB'; return;
      }
      prev.innerHTML = f.type.startsWith('image/')
        ? `<img src="${URL.createObjectURL(f)}" alt="สลิปที่เลือก" class="slip-thumb">` : `<i class="bi bi-file-earmark-pdf me-1"></i>${f.name}`;
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      form.classList.add('was-validated');
      if (!form.checkValidity()) { const bad = $(':invalid', form); if (bad) bad.focus(); return; }
      const no = 'BS' + Date.now().toString().slice(-8), total = $('#sumTotal').textContent;
      // หน้าเว็บนี้เป็น static: ยังไม่ได้ส่งข้อมูลไปเซิร์ฟเวอร์ (ต่อ API ได้ที่นี่) และไม่เก็บข้อมูลบัตรไว้
      cart = {}; saveCart();
      $('#checkoutWrap').innerHTML = `<div class="glass-card p-5 text-center">
        <div class="feature-icon"><i class="bi bi-check-lg"></i></div>
        <h2 class="h3">ขอบคุณสำหรับคำสั่งซื้อ</h2>
        <p class="text-soft mb-1">หมายเลขคำสั่งซื้อ <strong>${no}</strong> • ยอดชำระ ${total}</p>
        <p class="text-soft">เราจะตรวจสอบการชำระเงินและแจ้งสถานะทางอีเมล</p>
        <a href="index.html" class="btn btn-fly">กลับหน้าแรก</a></div>`;
    });
  }

  buildNav(); renderCart(); initProducts(); initOrder(); initCheckout();
})();
