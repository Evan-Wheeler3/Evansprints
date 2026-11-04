/* Lead Card Customs mockup — hero zoom, customizers, cart. No dependencies. */
(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------------- product data ---------------- */
  // fx lists are applied in order, like a CSS filter chain, to recolor the photo.
  const MINI_COLORS = [
    { id: 'orange', name: 'Orange', hex: '#f26a21', fx: [] },
    { id: 'teal',   name: 'Teal',   hex: '#17a5a0', fx: [['hue', 160], ['sat', .9]] },
    { id: 'blue',   name: 'Blue',   hex: '#2b7de9', fx: [['hue', 200]] },
    { id: 'purple', name: 'Purple', hex: '#9b4fe0', fx: [['hue', 250]] },
    { id: 'pink',   name: 'Pink',   hex: '#ec4f93', fx: [['hue', 310], ['sat', .9]] },
    { id: 'yellow', name: 'Yellow', hex: '#f2c21b', fx: [['hue', 32], ['bri', 1.25], ['sat', 1.2]] },
    { id: 'black',  name: 'Black',  hex: '#26272b', fx: [['sat', 0], ['bri', .32]] },
    { id: 'glow',   name: 'Glow in the dark', hex: '#c9f2c0', fx: [['hue', 80], ['sat', .45], ['bri', 1.35]], extra: 2 },
  ];
  const METALS = [
    { id: 'stainless', name: 'Stainless', price: 18, hex: '#c3c9cf', fx: [], grad: ['#f6f8fa', '#bcc3cb', '#8e959d'], img: 'tag-stainless.jpg' },
    { id: 'brass',     name: 'Brass',     price: 22, hex: '#d4a640', fx: [['sepia', .85], ['sat', 2.2], ['hue', -8], ['bri', .95]], grad: ['#fbe6a6', '#d4a640', '#9c7419'], img: 'tag-brass.jpg' },
    { id: 'copper',    name: 'Copper',    price: 20, hex: '#c47447', fx: [['sepia', .9], ['sat', 2.6], ['hue', -28], ['bri', .72]], grad: ['#ffd2b8', '#c47447', '#8a3f1d'], img: 'tag-copper.jpg' },
  ];
  const MINI_BASE = 6, MINI_INITIALS = 1, MINI_BULK = { qty: 5, off: .15 };
  const TAG_CARABINER = 3, TAG_BULK = { qty: 10, off: .20 };

  /* ---------------- color matrices (same math as CSS filters) ---------------- */
  const mul = (a, b) => { const r = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r.push(a[i*3]*b[j] + a[i*3+1]*b[3+j] + a[i*3+2]*b[6+j]); return r; };
  const M = {
    hue(d) { const r = d * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
      return [.213+c*.787-s*.213, .715-c*.715-s*.715, .072-c*.072+s*.928,
              .213-c*.213+s*.143, .715+c*.285+s*.140, .072-c*.072-s*.283,
              .213-c*.213-s*.787, .715-c*.715+s*.715, .072+c*.928+s*.072]; },
    sat(s) { return [.213+.787*s, .715-.715*s, .072-.072*s, .213-.213*s, .715+.285*s, .072-.072*s, .213-.213*s, .715-.715*s, .072+.928*s]; },
    sepia(a) { const k = 1 - a; return [.393+.607*k, .769-.769*k, .189-.189*k, .349-.349*k, .686+.314*k, .168-.168*k, .272-.272*k, .534-.534*k, .131+.869*k]; },
    bri(b) { return [b,0,0, 0,b,0, 0,0,b]; },
  };
  const matrixValues = fx => {
    let m = [1,0,0, 0,1,0, 0,0,1];
    for (const [k, v] of fx) m = mul(M[k](v), m);
    return `${m[0]} ${m[1]} ${m[2]} 0 0 ${m[3]} ${m[4]} ${m[5]} 0 0 ${m[6]} ${m[7]} ${m[8]} 0 0 0 0 0 1 0`;
  };
  const CSS_FX = { hue: v => `hue-rotate(${v}deg)`, sat: v => `saturate(${v})`, bri: v => `brightness(${v})`, sepia: v => `sepia(${v})` };
  const cssFilter = fx => fx.map(([k, v]) => CSS_FX[k](v)).join(' ') || 'none';

  const money = n => '$' + (Number.isInteger(n) ? n : n.toFixed(2));

  /* ---------------- hero zoom ---------------- */
  const svg = $('#hero');
  const FOCUS = {
    home: null,
    mini: { x: 1190, y: 872, w: 180, h: 92, fill: .55 },
    tag:  { x: 432, y: 240, w: 165, h: 195, fill: .85 },
    tagPhone: { x: 432, y: 300, w: 160, h: 132, fill: .8 },
  };
  const wide = () => matchMedia('(min-width: 861px)').matches;
  const panel = $('#panel'), stage = $('#stage'), zoomer = $('#zoomer');
  const MAX_PX_PER_PHOTO_PX = 2.6; // limit how far the photo is blown up

  // Zoom = one CSS transform on the wrapper. The browser animates it on the GPU,
  // so nothing inside the SVG is re-rendered frame by frame.
  function targetTransform(key) {
    const f = FOCUS[key] && (!wide() && FOCUS[key + 'Phone']) || FOCUS[key];
    if (!f) return 'none';
    const W = stage.clientWidth, H = stage.clientHeight;
    const k = Math.min(W / 1536, H / 1024);           // photo px -> screen px at rest
    const ox = (W - 1536 * k) / 2, oy = (H - 1024 * k) / 2;
    const visW = wide() ? Math.max(200, W - panel.offsetWidth) : W;
    const s = Math.min(visW * f.fill / (f.w * k), H * f.fill / (f.h * k), MAX_PX_PER_PHOTO_PX / k);
    const cx = ox + (f.x + f.w / 2) * k, cy = oy + (f.y + f.h / 2) * k;
    return `translate(${(visW / 2 - s * cx).toFixed(1)}px, ${(H / 2 - s * cy).toFixed(1)}px) scale(${s.toFixed(4)})`;
  }
  let viewKey = 'home';
  function zoomTo(key, animate = true) {
    viewKey = key;
    zoomer.classList.toggle('instant', !animate);
    zoomer.style.transform = targetTransform(key);
    if (!animate) { void zoomer.offsetWidth; zoomer.classList.remove('instant'); }
  }
  addEventListener('resize', () => zoomTo(viewKey, false));

  /* ---------------- customizer state ---------------- */
  const state = {
    kind: null, qty: 1,
    mini: { color: 'orange', stamp: 'none', initials: '', finish: 'Glossy' },
    tag:  { metal: 'stainless', number: 1, font: 'block', top: 'LEAGUE', bottom: '2026', attach: 'Ball chain' },
  };
  const miniForm = $('#miniForm'), tagForm = $('#tagForm');
  const miniColor = () => MINI_COLORS.find(c => c.id === state.mini.color);
  const metal = () => METALS.find(m => m.id === state.tag.metal);

  function swatches(el, list, current, onPick) {
    el.innerHTML = '';
    el.setAttribute('role', 'radiogroup');
    for (const item of list) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'swatch'; b.setAttribute('role', 'radio');
      b.style.background = item.grad ? `linear-gradient(135deg, ${item.grad.join(',')})` : item.hex;
      b.setAttribute('aria-label', item.name); b.title = item.name;
      b.setAttribute('aria-checked', item.id === current);
      if (item.extra) b.innerHTML = `<small>+$${item.extra}</small>`;
      b.addEventListener('click', () => onPick(item.id));
      el.append(b);
    }
  }
  const renderMiniSwatches = () => swatches($('#miniSwatches'), MINI_COLORS, state.mini.color, id => { state.mini.color = id; update(); });
  const renderTagSwatches = () => swatches($('#tagSwatches'), METALS, state.tag.metal, id => { state.tag.metal = id; update(); });

  function unitPrice(kind = state.kind) {
    if (kind === 'mini') return MINI_BASE + (miniColor().extra || 0) + (state.mini.stamp === 'initials' && state.mini.initials ? MINI_INITIALS : 0);
    return metal().price + (state.tag.attach === 'Carabiner' ? TAG_CARABINER : 0);
  }
  function lineTotal(kind, unit, qty) {
    const bulk = kind === 'mini' ? MINI_BULK : TAG_BULK;
    return Math.round(unit * qty * (qty >= bulk.qty ? 1 - bulk.off : 1) * 100) / 100;
  }

  // squeeze long engraving text to fit the tag face
  function fitText(el, text, max) {
    el.textContent = text; el.removeAttribute('textLength'); el.removeAttribute('lengthAdjust');
    let w = 0; try { w = el.getComputedTextLength(); } catch {}
    if (w > max) { el.setAttribute('textLength', max); el.setAttribute('lengthAdjust', 'spacingAndGlyphs'); }
  }

  function update() {
    const k = state.kind; if (!k) return;
    if (k === 'mini') {
      const c = miniColor(), s = state.mini;
      renderMiniSwatches();
      $('#miniColorName').textContent = c.name + (c.extra ? ` (+$${c.extra})` : '');
      $('#mMini').setAttribute('values', matrixValues(s.finish === 'Matte' ? [...c.fx, ['sat', .85], ['bri', .94]] : c.fx));
      $('#initialsField').hidden = s.stamp !== 'initials';
      const txt = $('#stampText');
      txt.textContent = s.stamp === 'initials' ? s.initials.toUpperCase() : '';
      txt.setAttribute('font-size', [44, 44, 34, 27][s.initials.length] || 27);
      txt.setAttribute('fill', c.id === 'black' ? '#d9d9d9' : '#fff');
      $('#stampBasket').style.display = s.stamp === 'basket' ? '' : 'none';
      $('#stampStar').style.display = s.stamp === 'star' ? '' : 'none';
    } else {
      const m = metal(), t = state.tag;
      renderTagSwatches();
      $('#tagMetalName').textContent = `${m.name} · $${m.price}`;
      $('#mTag').setAttribute('values', matrixValues(m.fx));
      ['#pv0', '#pv1', '#pv2'].forEach((id, i) => $(id).setAttribute('stop-color', m.grad[i]));
      $('#pvNum').textContent = t.number || '';
      $('#pvNum').setAttribute('font-size', String(t.number).length > 2 ? 46 : 62);
      $('#pvTop').textContent = t.top.toUpperCase();
      $('#pvBottom').textContent = t.bottom.toUpperCase();
      const family = t.font === 'classic' ? 'Georgia, "Times New Roman", serif' : 'Inter, system-ui, sans-serif';
      $$('#tagPreview .pv-ink').forEach(n => n.setAttribute('font-family', family));
      // engraving on the photo's tag
      const num = String(t.number || '');
      $$('[data-engr="num"]').forEach(n => { n.textContent = num; n.setAttribute('font-size', [40, 40, 36, 28, 22][num.length] || 22); });
      $$('[data-engr="top"]').forEach(n => fitText(n, t.top.toUpperCase(), 62));
      $$('[data-engr="bottom"]').forEach(n => fitText(n, t.bottom.toUpperCase(), 52));
      $$('#tintTag text').forEach(n => n.setAttribute('font-family', family));
    }
    const unit = unitPrice();
    $('#panelPrice').textContent = money(unit);
    $('#qty').textContent = state.qty;
    $('#addTotal').textContent = money(lineTotal(k, unit, state.qty));
  }

  // form wiring
  miniForm.addEventListener('input', e => {
    const { name, value } = e.target;
    if (name === 'stamp') state.mini.stamp = value;
    if (name === 'initials') state.mini.initials = value.replace(/[^a-z0-9&]/gi, '').slice(0, 3);
    if (name === 'finish') state.mini.finish = value;
    if (name === 'stamp' && value === 'initials') setTimeout(() => miniForm.initials.focus(), 0);
    update();
  });
  tagForm.addEventListener('input', e => {
    const { name, value } = e.target;
    if (name === 'number') { const v = value.replace(/\D/g, '').slice(0, 4); if (v !== value) e.target.value = v; state.tag.number = v ? Number(v) : ''; }
    if (name in state.tag && name !== 'number') state.tag[name] = value;
    update();
  });
  [miniForm, tagForm].forEach(f => f.addEventListener('submit', e => e.preventDefault()));
  $$('[data-qty]').forEach(b => b.addEventListener('click', () => {
    state.qty = Math.max(1, Math.min(99, state.qty + Number(b.dataset.qty))); update();
  }));

  function syncFormsFromState() {
    miniForm.stamp.value = state.mini.stamp;
    miniForm.initials.value = state.mini.initials;
    miniForm.finish.value = state.mini.finish;
    tagForm.number.value = state.tag.number;
    tagForm.font.value = state.tag.font;
    tagForm.top.value = state.tag.top;
    tagForm.bottom.value = state.tag.bottom;
    tagForm.attach.value = state.tag.attach;
  }

  /* ---------------- open / close ---------------- */
  const body = document.body;
  function openCustomizer(kind, params) {
    closeCart();
    const s = state[kind];
    if (kind === 'mini' && MINI_COLORS.some(c => c.id === params.get('color'))) s.color = params.get('color');
    if (kind === 'tag' && METALS.some(m => m.id === params.get('metal'))) s.metal = params.get('metal');
    if (kind === 'tag' && params.get('top')) s.top = params.get('top').slice(0, 18);
    const switching = state.kind !== kind;
    if (switching) state.qty = 1;
    if (params.get('qty')) state.qty = Math.max(1, Math.min(99, parseInt(params.get('qty'), 10) || 1));
    state.kind = kind;
    syncFormsFromState();

    if (scrollY > 0) scrollTo({ top: 0, behavior: 'instant' });
    body.classList.add('customizing', 'locked');
    body.dataset.kind = kind;
    miniForm.hidden = kind !== 'mini';
    tagForm.hidden = kind !== 'tag';
    $('#panelTitle').textContent = kind === 'mini' ? 'Mini Marker' : 'Bag Tag';
    $('#panelEyebrow').textContent = kind === 'mini' ? 'Customize your' : 'Engrave your';
    panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false');
    $$('.site-nav a').forEach(a => a.toggleAttribute('aria-current', a.getAttribute('href') === '#' + kind));
    update();
    // let the layout settle (the stage shrinks on phones) before measuring the zoom target
    requestAnimationFrame(() => zoomTo(kind));
    setTimeout(() => panel.querySelector('[data-close]').focus({ preventScroll: true }), 500);
  }
  function closeCustomizer() {
    if (!state.kind) return;
    state.kind = null;
    body.classList.remove('customizing', 'locked');
    delete body.dataset.kind;
    panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true');
    $$('.site-nav a').forEach(a => a.removeAttribute('aria-current'));
    requestAnimationFrame(() => zoomTo('home'));
  }

  /* ---------------- cart ---------------- */
  const KEY = 'leadcard-cart';
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem('evansprints-cart')) || []; } catch { cart = []; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch {} };
  const cartEl = $('#cart'), scrim = $('#scrim');

  function renderCart(bump) {
    const n = cart.reduce((a, i) => a + i.qty, 0);
    $$('[data-cart-count]').forEach(el => {
      el.textContent = n; el.toggleAttribute('data-empty', n === 0);
      if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
    });
    const list = $('#cartList');
    if (!cart.length) list.innerHTML = '<p class="cart-empty">Your cart is empty.<br>Tap the mini or the tags on the bag to design one.</p>';
    else list.innerHTML = cart.map((i, idx) => `
      <div class="cart-item">
        <img src="assets/${i.img}" alt="" style="filter:${i.filter}">
        <div><h4>${i.title}</h4><p>${i.summary}<br>Qty ${i.qty}</p></div>
        <div class="right">${money(i.total)}<button type="button" data-remove="${idx}">Remove</button></div>
      </div>`).join('');
    $('#subtotal').textContent = money(Math.round(cart.reduce((a, i) => a + i.total, 0) * 100) / 100);
  }
  $('#cartList').addEventListener('click', e => {
    const i = e.target.closest('[data-remove]'); if (!i) return;
    cart.splice(Number(i.dataset.remove), 1); save(); renderCart();
  });
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  $('#addBtn').addEventListener('click', () => {
    const k = state.kind, unit = unitPrice(), qty = state.qty;
    let item;
    if (k === 'mini') {
      const c = miniColor(), s = state.mini;
      const stamp = { none: 'Ring stamp', basket: 'Basket stamp', star: 'Star stamp', initials: s.initials ? `Initials “${esc(s.initials.toUpperCase())}”` : 'Ring stamp' }[s.stamp];
      item = { title: `${c.name} Mini`, summary: `${stamp} · ${s.finish}`, img: 'mini-orange.jpg', filter: cssFilter(c.fx) };
    } else {
      const m = metal(), t = state.tag;
      item = { title: `${m.name} Bag Tag #${t.number}`, summary: `${esc(t.top || '—')} / ${esc(t.bottom || '—')} · ${t.font === 'classic' ? 'Serif' : 'Block'} · ${t.attach}`, img: m.img, filter: 'none' };
    }
    Object.assign(item, { kind: k, qty, total: lineTotal(k, unit, qty) });
    cart.push(item); save(); renderCart(true);
    toast(`Added to cart · ${money(item.total)}`);
  });
  $('#checkoutBtn').addEventListener('click', () => toast(cart.length ? 'Checkout isn’t part of this mockup' : 'Your cart is empty'));

  function openCart() {
    closeCustomizer();
    renderCart();
    cartEl.classList.add('open'); cartEl.setAttribute('aria-hidden', 'false');
    scrim.hidden = false; body.classList.add('locked');
  }
  function closeCart() {
    if (!cartEl.classList.contains('open')) return;
    cartEl.classList.remove('open'); cartEl.setAttribute('aria-hidden', 'true');
    scrim.hidden = true; if (!state.kind) body.classList.remove('locked');
  }

  let toastTimer;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  /* ---------------- featured shelves ---------------- */
  const card = (href, img, filter, name, sub, price, cta) => `
    <a class="card" href="${href}">
      <div class="img"><img src="assets/${img}" alt="${name}" loading="lazy" style="filter:${filter}"></div>
      <div class="info"><div><h3>${name}</h3><small>${sub}</small></div><span class="price">${price}</span></div>
      <span class="btn">${cta}</span>
    </a>`;
  $('#miniGrid').innerHTML = ['orange', 'teal', 'pink', 'glow'].map(id => {
    const c = MINI_COLORS.find(x => x.id === id);
    return card(`#mini?color=${id}`, 'mini-orange.jpg', cssFilter(c.fx), `${c.name} Mini`, 'Stamped plastic', money(MINI_BASE + (c.extra || 0)), 'Customize');
  }).join('');
  $('#tagGrid').innerHTML = METALS.map(m => card(`#tag?metal=${m.id}`, m.img, 'none', `${m.name} Tag`, 'Engraved · your number', money(m.price), 'Engrave yours')).join('')
    + card('#tag?qty=10&top=YOUR%20LEAGUE', 'tag-stainless.jpg', 'none', 'League Set (10)', 'Numbered set · 20% off', money(lineTotal('tag', 18, 10)), 'Build a set');

  /* ---------------- keyboard: easy to dismiss on phones ---------------- */
  const isField = el => el && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && el.type !== 'radio';
  // Return / "Done" closes the keyboard instead of submitting
  panel.addEventListener('keydown', e => { if (e.key === 'Enter' && isField(e.target)) { e.preventDefault(); e.target.blur(); } });
  // tapping anywhere that isn't a field closes it
  document.addEventListener('pointerdown', e => {
    const a = document.activeElement;
    if (isField(a) && !isField(e.target) && !e.target.closest('label.field, .kb-bar')) a.blur();
  }, true);
  // dragging the panel closes it too
  panel.addEventListener('touchmove', () => { const a = document.activeElement; if (isField(a) && a.tagName !== 'SELECT') a.blur(); }, { passive: true });
  // a "Done" bar pinned above the on-screen keyboard (iPhone number pads have no return key)
  const kb = $('#kbBar'), vv = window.visualViewport;
  const touch = matchMedia('(pointer: coarse)').matches;
  const placeKb = () => { if (vv) kb.style.transform = `translateY(${vv.offsetTop + vv.height - kb.offsetHeight}px)`; };
  panel.addEventListener('focusin', e => { if (touch && e.target.tagName === 'INPUT' && isField(e.target)) { kb.hidden = false; placeKb(); } });
  panel.addEventListener('focusout', () => setTimeout(() => { if (!isField(document.activeElement)) kb.hidden = true; }, 0));
  kb.addEventListener('pointerdown', e => e.preventDefault()); // keep focus until we blur on purpose
  kb.querySelector('button').addEventListener('click', () => document.activeElement.blur());
  if (vv) { vv.addEventListener('resize', placeKb); vv.addEventListener('scroll', placeKb); }

  /* ---------------- routing (#mini, #tag, #cart) ---------------- */
  function route(initial) {
    const [name, qs = ''] = decodeURI(location.hash.slice(1)).split('?');
    const params = new URLSearchParams(qs);
    if (name === 'mini' || name === 'tag') return openCustomizer(name, params);
    if (name === 'cart') return openCart();
    closeCart(); closeCustomizer();
    if (initial) zoomTo('home', false);
    const target = name && document.getElementById(name);
    if (target && !initial) requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth' }));
  }
  const goHome = () => { history.pushState(null, '', location.pathname + location.search); route(); };
  addEventListener('hashchange', () => route());
  addEventListener('popstate', () => route());
  $$('[data-close], [data-close-cart]').forEach(b => b.addEventListener('click', goHome));
  scrim.addEventListener('click', goHome);
  $$('[data-home]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); goHome(); scrollTo({ top: 0, behavior: 'smooth' }); }));
  addEventListener('keydown', e => { if (e.key === 'Escape' && (state.kind || cartEl.classList.contains('open'))) goHome(); });

  renderCart();
  zoomTo('home', false);
  route(true);
})();
