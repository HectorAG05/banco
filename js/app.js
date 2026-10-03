(function () {
  "use strict";

  var CONFIG = window.CONFIG;
  var PRODUCTOS = window.PRODUCTOS;
  var TALLES = window.TALLES;
  var STORAGE_KEY = "vuelo-carrito";

  var GENEROS = { hombre: "Hombre", mujer: "Mujer", ninos: "Niños", unisex: "Unisex" };
  var TIPOS = { running: "Running", urbano: "Urbano", basquet: "Básquet" };

  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  var money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
  function fmt(n) { return money.format(n); }

  function byId(id) {
    for (var i = 0; i < PRODUCTOS.length; i++) if (PRODUCTOS[i].id === id) return PRODUCTOS[i];
    return null;
  }

  function waLink(text) {
    return "https://wa.me/" + CONFIG.whatsapp + (text ? "?text=" + encodeURIComponent(text) : "");
  }

  function waDisplay() {
    var n = CONFIG.whatsapp;
    // Formato argentino: +54 9 11 2345-6789
    var m = n.match(/^(54)(9)(\d{2})(\d{4})(\d{4})$/);
    return m ? "+" + m[1] + " " + m[2] + " " + m[3] + " " + m[4] + "-" + m[5] : "+" + n;
  }

  /* ---------- Dibujo de zapatilla (SVG) ---------- */
  function sneakerSVG(c, label) {
    return '' +
      '<svg class="sneaker" viewBox="0 0 400 230" role="img" aria-label="' + label + '">' +
      '<ellipse cx="205" cy="208" rx="170" ry="10" fill="#000" opacity=".12"/>' +
      // suela
      '<path d="M30 176 Q30 196 52 198 L356 196 Q382 194 380 176 Z" fill="' + c.outsole + '" stroke="#14161c" stroke-width="3" stroke-linejoin="round"/>' +
      // entresuela
      '<path d="M32 150 Q28 178 52 182 L354 180 Q384 178 382 162 Q380 148 362 146 L60 146 Q36 144 32 150 Z" fill="' + c.sole + '" stroke="#14161c" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M70 170 L340 168" stroke="#14161c" stroke-width="1.5" stroke-dasharray="2 7" opacity=".45"/>' +
      // capellada
      '<path d="M38 150 L42 96 Q44 72 70 66 L118 58 Q140 56 152 72 L196 102 Q240 112 296 120 Q352 128 374 152 Z" fill="' + c.upper + '" stroke="#14161c" stroke-width="3" stroke-linejoin="round"/>' +
      // talón
      '<path d="M38 150 L42 96 Q44 72 70 66 L84 64 Q90 116 116 150 Z" fill="' + c.panel + '" stroke="#14161c" stroke-width="3" stroke-linejoin="round"/>' +
      // puntera
      '<path d="M302 121 Q354 128 374 152 L288 152 Q290 134 302 121 Z" fill="' + c.panel + '" stroke="#14161c" stroke-width="3" stroke-linejoin="round"/>' +
      // lengüeta
      '<path d="M140 62 Q146 36 172 40 Q186 44 186 60 L196 102 L160 82 Z" fill="' + c.panel + '" stroke="#14161c" stroke-width="3" stroke-linejoin="round"/>' +
      // ala lateral (logo VUELO)
      '<path d="M112 140 Q170 88 286 112 Q200 108 150 146 Z" fill="' + c.accent + '" stroke="#14161c" stroke-width="3" stroke-linejoin="round"/>' +
      // cordones
      '<g stroke="' + c.lace + '" stroke-width="6" stroke-linecap="round">' +
      '<path d="M156 74 L170 66"/><path d="M170 84 L186 76"/><path d="M184 94 L200 88"/><path d="M200 102 L216 98"/>' +
      '</g>' +
      '<g fill="#14161c"><circle cx="156" cy="74" r="2.5"/><circle cx="170" cy="84" r="2.5"/><circle cx="184" cy="94" r="2.5"/><circle cx="200" cy="102" r="2.5"/></g>' +
      // costuras
      '<path d="M92 70 Q100 118 122 146" fill="none" stroke="#14161c" stroke-width="1.5" stroke-dasharray="4 5" opacity=".5"/>' +
      '<path d="M298 128 Q294 138 294 148" fill="none" stroke="#14161c" stroke-width="1.5" stroke-dasharray="4 5" opacity=".5"/>' +
      // tirador talón
      '<path d="M44 92 Q34 86 40 72 L52 70" fill="none" stroke="#14161c" stroke-width="3" stroke-linecap="round"/>' +
      '</svg>';
  }

  /* ---------- Estado ---------- */
  var state = { filtro: "todos", busqueda: "", orden: "destacados", cart: loadCart() };
  var modal = { producto: null, color: 0, talle: null, cantidad: 1 };
  var cardColor = {}; // color seleccionado en cada tarjeta

  function loadCart() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data.filter(function (it) { return byId(it.id); }) : [];
    } catch (e) { return []; }
  }
  function saveCart() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart)); } catch (e) { /* sin almacenamiento */ }
  }

  /* ---------- Catálogo ---------- */
  function filtrados() {
    var q = state.busqueda.trim().toLowerCase();
    var list = PRODUCTOS.filter(function (p) {
      var f = state.filtro;
      var ok = f === "todos" ||
        (f === "ofertas" && p.precioAntes) ||
        (TIPOS[f] && p.tipo === f) ||
        (GENEROS[f] && (p.genero === f || (p.genero === "unisex" && f !== "ninos")));
      if (!ok) return false;
      if (!q) return true;
      var hay = [p.nombre, p.codigo, GENEROS[p.genero], TIPOS[p.tipo]]
        .concat(p.colores.map(function (c) { return c.nombre; })).join(" ").toLowerCase();
      return hay.indexOf(q) !== -1;
    });
    if (state.orden === "precio-asc") list.sort(function (a, b) { return a.precio - b.precio; });
    if (state.orden === "precio-desc") list.sort(function (a, b) { return b.precio - a.precio; });
    if (state.orden === "nombre") list.sort(function (a, b) { return a.nombre.localeCompare(b.nombre, "es"); });
    return list;
  }

  function priceHTML(p) {
    return '<span class="price">' + fmt(p.precio) + '</span>' +
      (p.precioAntes ? ' <s class="price-old">' + fmt(p.precioAntes) + '</s>' : "");
  }

  function badgeHTML(p) {
    if (!p.etiqueta) return "";
    var cls = p.precioAntes ? "badge badge-sale" : "badge";
    var txt = p.precioAntes ? "−" + Math.round((1 - p.precio / p.precioAntes) * 100) + "%" : p.etiqueta;
    return '<span class="' + cls + '">' + txt + '</span>';
  }

  function renderGrid() {
    var list = filtrados();
    var grid = $("#grid");
    grid.innerHTML = list.map(function (p) {
      var ci = cardColor[p.id] || 0;
      var c = p.colores[ci];
      return '<article class="card" data-id="' + p.id + '">' +
        '<button type="button" class="card-media" data-open="' + p.id + '" aria-label="Ver ' + p.nombre + '">' +
          badgeHTML(p) + sneakerSVG(c, p.nombre + " " + c.nombre) +
        '</button>' +
        '<div class="card-body">' +
          '<div class="card-row"><h3>' + p.nombre + '</h3><p class="card-price">' + priceHTML(p) + '</p></div>' +
          '<p class="card-meta">' + GENEROS[p.genero] + ' · ' + TIPOS[p.tipo] + ' · ' + p.colores.length + (p.colores.length > 1 ? " colores" : " color") + '</p>' +
          '<div class="card-foot">' +
            '<div class="swatches" role="group" aria-label="Colores de ' + p.nombre + '">' +
              p.colores.map(function (col, i) {
                return '<button type="button" class="swatch' + (i === ci ? " is-active" : "") + '" data-swatch="' + p.id + '" data-i="' + i + '" ' +
                  'style="--a:' + col.upper + ';--b:' + col.accent + '" aria-label="' + col.nombre + '" aria-pressed="' + (i === ci) + '"></button>';
              }).join("") +
            '</div>' +
            '<span class="code mono">' + p.codigo + '</span>' +
          '</div>' +
        '</div>' +
      '</article>';
    }).join("");
    $("#empty").hidden = list.length > 0;
    $("#result-count").textContent = list.length + (list.length === 1 ? " modelo" : " modelos");
  }

  function setFiltro(f) {
    state.filtro = f;
    $$(".chip").forEach(function (b) { b.classList.toggle("is-active", b.dataset.filter === f); });
    $$(".nav-link").forEach(function (b) { b.classList.toggle("is-active", b.dataset.nav === f); });
    renderGrid();
  }

  /* ---------- Modal de producto ---------- */
  function openProduct(id, colorIndex) {
    var p = byId(id);
    if (!p) return;
    modal.producto = p;
    modal.color = colorIndex || 0;
    modal.talle = null;
    modal.cantidad = 1;
    $("#pm-cat").textContent = GENEROS[p.genero] + " · " + TIPOS[p.tipo];
    $("#pm-name").textContent = p.nombre;
    $("#pm-price").innerHTML = priceHTML(p);
    $("#pm-desc").textContent = p.descripcion;
    $("#pm-code").textContent = "Estilo " + p.codigo;
    $("#pm-size-error").hidden = true;
    renderModal();
    var dlg = $("#product-modal");
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
  }

  function renderModal() {
    var p = modal.producto;
    var c = p.colores[modal.color];
    $("#pm-art").innerHTML = sneakerSVG(c, p.nombre + " " + c.nombre);
    $("#pm-color-name").textContent = c.nombre;
    $("#pm-colors").innerHTML = p.colores.map(function (col, i) {
      return '<button type="button" class="pm-color' + (i === modal.color ? " is-active" : "") + '" data-color="' + i + '" aria-pressed="' + (i === modal.color) + '" aria-label="' + col.nombre + '">' +
        sneakerSVG(col, col.nombre) + '</button>';
    }).join("");
    $("#pm-sizes").innerHTML = p.talles.map(function (t) {
      return '<button type="button" class="size' + (t === modal.talle ? " is-active" : "") + '" data-size="' + t + '" aria-pressed="' + (t === modal.talle) + '">' + t + '</button>';
    }).join("");
    var eq = modal.talle && TALLES[modal.talle];
    $("#pm-size-eq").textContent = eq ? "· " + modal.talle + " = US " + eq.us + " · " + eq.cm + " cm" : "";
    $("#pm-qty").textContent = modal.cantidad;
  }

  function closeProduct() {
    var dlg = $("#product-modal");
    if (dlg.open) { if (typeof dlg.close === "function") dlg.close(); else dlg.removeAttribute("open"); }
  }

  function requireSize() {
    if (modal.talle) return true;
    $("#pm-size-error").hidden = false;
    $("#pm-sizes").classList.add("shake");
    setTimeout(function () { $("#pm-sizes").classList.remove("shake"); }, 400);
    return false;
  }

  function itemLabel(p, colorIdx, talle) {
    return p.nombre + " — " + p.colores[colorIdx].nombre + " — Talle AR " + talle;
  }

  /* ---------- Carrito ---------- */
  function addToCart(id, color, talle, cantidad) {
    var key = id + "|" + color + "|" + talle;
    var found = state.cart.filter(function (it) { return it.key === key; })[0];
    if (found) found.qty = Math.min(found.qty + cantidad, 10);
    else state.cart.push({ key: key, id: id, color: color, talle: talle, qty: cantidad });
    saveCart();
    renderCart();
    var badge = $("#cart-count");
    badge.classList.remove("bump");
    void badge.offsetWidth;
    badge.classList.add("bump");
  }

  function totals() {
    var sub = state.cart.reduce(function (s, it) { return s + byId(it.id).precio * it.qty; }, 0);
    var pago = $("#c-pay").value;
    var disc = pago === "Transferencia" ? Math.round(sub * CONFIG.descuentoTransferencia) : 0;
    var envio = entrega() === "envio" ? (sub - disc >= CONFIG.envioGratisDesde ? 0 : CONFIG.costoEnvio) : 0;
    return { sub: sub, disc: disc, envio: envio, total: sub - disc + envio };
  }

  function entrega() {
    return $("#c-ship-pickup").checked ? "retiro" : "envio";
  }

  function renderCart() {
    var count = state.cart.reduce(function (s, it) { return s + it.qty; }, 0);
    $("#cart-count").textContent = count;
    $("#cart-count").classList.toggle("has-items", count > 0);
    var empty = state.cart.length === 0;
    $("#cart-empty").hidden = !empty;
    $("#checkout").hidden = empty;
    $("#cart-foot").hidden = empty;
    $("#cart-list").innerHTML = state.cart.map(function (it) {
      var p = byId(it.id);
      var c = p.colores[it.color];
      return '<li class="cart-item">' +
        '<div class="cart-art">' + sneakerSVG(c, p.nombre) + '</div>' +
        '<div class="cart-info">' +
          '<p class="cart-name">' + p.nombre + '</p>' +
          '<p class="cart-meta">' + c.nombre + ' · AR ' + it.talle + '</p>' +
          '<div class="cart-row">' +
            '<div class="qty qty-sm">' +
              '<button type="button" data-dec="' + it.key + '" aria-label="Restar uno">−</button>' +
              '<output>' + it.qty + '</output>' +
              '<button type="button" data-inc="' + it.key + '" aria-label="Sumar uno">+</button>' +
            '</div>' +
            '<span class="cart-price">' + fmt(p.precio * it.qty) + '</span>' +
          '</div>' +
          '<button type="button" class="link-btn remove" data-remove="' + it.key + '">Quitar</button>' +
        '</div>' +
      '</li>';
    }).join("");
    if (!empty) renderTotals();
  }

  function renderTotals() {
    var t = totals();
    $("#t-sub").textContent = fmt(t.sub);
    $("#t-disc-row").hidden = t.disc === 0;
    $("#t-disc").textContent = "−" + fmt(t.disc);
    $("#t-ship").textContent = entrega() === "retiro" ? "Retiro gratis" : (t.envio === 0 ? "Gratis" : fmt(t.envio));
    $("#t-total").textContent = fmt(t.total);
    $("#c-address-wrap").hidden = entrega() === "retiro";
  }

  function changeQty(key, delta) {
    state.cart = state.cart.map(function (it) {
      if (it.key === key) it.qty = Math.max(0, Math.min(10, it.qty + delta));
      return it;
    }).filter(function (it) { return it.qty > 0; });
    saveCart();
    renderCart();
  }

  var lastFocus = null;
  function openCart() {
    lastFocus = document.activeElement;
    $("#sent").hidden = true;
    $("#cart").classList.add("is-open");
    $("#cart").setAttribute("aria-hidden", "false");
    $("#overlay").hidden = false;
    document.body.classList.add("no-scroll");
    setTimeout(function () { $("#cart-close").focus(); }, 50);
  }
  function closeCart() {
    $("#cart").classList.remove("is-open");
    $("#cart").setAttribute("aria-hidden", "true");
    $("#overlay").hidden = true;
    document.body.classList.remove("no-scroll");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------- Mensajes de WhatsApp ---------- */
  function orderNumber() {
    return "VL-" + Date.now().toString(36).toUpperCase().slice(-5);
  }

  function buildOrderMessage() {
    var t = totals();
    var lines = [];
    lines.push("¡Hola " + CONFIG.tienda + "! Quiero hacer este pedido:");
    lines.push("");
    lines.push("*Pedido " + orderNumber() + "*");
    state.cart.forEach(function (it) {
      var p = byId(it.id);
      lines.push("• " + it.qty + "x " + itemLabel(p, it.color, it.talle) + " — " + fmt(p.precio * it.qty));
    });
    lines.push("");
    lines.push("Subtotal: " + fmt(t.sub));
    if (t.disc) lines.push("Descuento transferencia: −" + fmt(t.disc));
    lines.push("Envío: " + (entrega() === "retiro" ? "Retiro en showroom" : (t.envio === 0 ? "Gratis" : fmt(t.envio))));
    lines.push("*Total: " + fmt(t.total) + "*");
    lines.push("");
    lines.push("Nombre: " + $("#c-name").value.trim());
    lines.push("Entrega: " + (entrega() === "retiro" ? "Retiro en showroom" : "Envío a " + $("#c-address").value.trim()));
    lines.push("Pago: " + $("#c-pay").value);
    var notas = $("#c-notes").value.trim();
    if (notas) lines.push("Notas: " + notas);
    lines.push("");
    lines.push("¿Me confirman stock y cómo seguimos?");
    return lines.join("\n");
  }

  function validateCheckout() {
    var errs = [];
    if (!$("#c-name").value.trim()) errs.push("tu nombre");
    if (entrega() === "envio" && !$("#c-address").value.trim()) errs.push("la dirección de envío");
    var box = $("#c-error");
    if (errs.length) {
      box.textContent = "Para enviar el pedido falta completar " + errs.join(" y ") + ".";
      box.hidden = false;
      (errs[0] === "tu nombre" ? $("#c-name") : $("#c-address")).focus();
      return false;
    }
    box.hidden = true;
    return true;
  }

  function copyText(text, okMsg, fallbackEl) {
    var done = function () { toast(okMsg); };
    var fallback = function () {
      if (fallbackEl) { fallbackEl.focus(); fallbackEl.select(); toast("Seleccionamos el texto: copialo con Ctrl+C"); }
      else toast("No pudimos copiar automáticamente");
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
      else fallback();
    } catch (e) { fallback(); }
  }

  var toastTimer = null;
  function toast(msg) {
    var el = $("#toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 2600);
  }

  /* ---------- Guía de talles ---------- */
  function renderSizeTable() {
    var adultos = Object.keys(TALLES).map(Number).filter(function (t) { return t >= 35; });
    var rows = $$(".size-table tr");
    rows[0].insertAdjacentHTML("beforeend", adultos.map(function (t) { return '<td>' + t + '</td>'; }).join(""));
    rows[1].insertAdjacentHTML("beforeend", adultos.map(function (t) { return '<td>' + TALLES[t].us + '</td>'; }).join(""));
    rows[2].insertAdjacentHTML("beforeend", adultos.map(function (t) { return '<td>' + TALLES[t].cm + '</td>'; }).join(""));
  }

  /* ---------- Hero ---------- */
  function renderHero() {
    var p = PRODUCTOS[0];
    $("#hero-art").innerHTML = sneakerSVG(p.colores[0], p.nombre);
    $("#hero-name").textContent = p.nombre;
    $("#hero-code").textContent = p.codigo;
    $("#hero-price").textContent = fmt(p.precio);
    $("#hero-view").addEventListener("click", function () { openProduct(p.id, 0); });
  }

  /* ---------- Eventos ---------- */
  function bind() {
    $$(".chip").forEach(function (b) {
      b.addEventListener("click", function () { setFiltro(b.dataset.filter); });
    });
    $$(".nav-link").forEach(function (b) {
      b.addEventListener("click", function () {
        setFiltro(b.dataset.nav);
        $("#catalogo").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    $("#search").addEventListener("input", function (e) {
      state.busqueda = e.target.value;
      renderGrid();
    });
    $("#search").addEventListener("keydown", function (e) {
      if (e.key === "Enter") $("#catalogo").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    $("#sort").addEventListener("change", function (e) { state.orden = e.target.value; renderGrid(); });

    $("#grid").addEventListener("click", function (e) {
      var sw = e.target.closest("[data-swatch]");
      if (sw) {
        cardColor[sw.dataset.swatch] = Number(sw.dataset.i);
        renderGrid();
        return;
      }
      var open = e.target.closest("[data-open]");
      if (open) openProduct(open.dataset.open, cardColor[open.dataset.open] || 0);
    });

    // Modal
    $("#pm-colors").addEventListener("click", function (e) {
      var b = e.target.closest("[data-color]");
      if (b) { modal.color = Number(b.dataset.color); renderModal(); }
    });
    $("#pm-sizes").addEventListener("click", function (e) {
      var b = e.target.closest("[data-size]");
      if (b) { modal.talle = Number(b.dataset.size); $("#pm-size-error").hidden = true; renderModal(); }
    });
    $("#pm-minus").addEventListener("click", function () { modal.cantidad = Math.max(1, modal.cantidad - 1); renderModal(); });
    $("#pm-plus").addEventListener("click", function () { modal.cantidad = Math.min(10, modal.cantidad + 1); renderModal(); });
    $("#pm-add").addEventListener("click", function () {
      if (!requireSize()) return;
      addToCart(modal.producto.id, modal.color, modal.talle, modal.cantidad);
      closeProduct();
      toast(modal.producto.nombre + " agregada al carrito");
      openCart();
    });
    $("#pm-buy").addEventListener("click", function (e) {
      if (!requireSize()) { e.preventDefault(); return; }
      var p = modal.producto;
      var text = "¡Hola " + CONFIG.tienda + "! Quiero comprar:\n\n• " + modal.cantidad + "x " +
        itemLabel(p, modal.color, modal.talle) + " — " + fmt(p.precio * modal.cantidad) +
        "\nEstilo " + p.codigo + "\n\n¿Tienen stock? ¿Cómo sigo con el pago y el envío?";
      this.href = waLink(text);
    });
    $("#product-modal").addEventListener("click", function (e) {
      if (e.target === this) closeProduct(); // clic en el fondo
    });

    // Carrito
    $("#cart-open").addEventListener("click", openCart);
    $("#cart-close").addEventListener("click", closeCart);
    $("#overlay").addEventListener("click", closeCart);
    $("#cart-browse").addEventListener("click", function () {
      closeCart();
      $("#catalogo").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && $("#cart").classList.contains("is-open")) closeCart();
    });
    $("#cart-list").addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.inc) changeQty(b.dataset.inc, 1);
      if (b.dataset.dec) changeQty(b.dataset.dec, -1);
      if (b.dataset.remove) changeQty(b.dataset.remove, -99);
    });
    ["#c-pay", "#c-ship-home", "#c-ship-pickup"].forEach(function (sel) {
      $(sel).addEventListener("change", renderTotals);
    });
    $("#checkout").addEventListener("submit", function (e) { e.preventDefault(); });
    $("#checkout-wa").addEventListener("click", function (e) {
      if (!state.cart.length || !validateCheckout()) { e.preventDefault(); return; }
      var msg = buildOrderMessage();
      this.href = waLink(msg);
      $("#order-text").value = msg;
      $("#sent").hidden = false;
    });
    $("#copy-order").addEventListener("click", function () {
      copyText($("#order-text").value, "Mensaje copiado", $("#order-text"));
    });
    $("#copy-number").addEventListener("click", function () {
      copyText("+" + CONFIG.whatsapp, "Número copiado", null);
    });
  }

  function init() {
    var consulta = waLink("¡Hola " + CONFIG.tienda + "! Quería hacer una consulta sobre las zapatillas.");
    $("#hero-wa").href = consulta;
    $("#wa-float").href = consulta;
    $("#wa-display").textContent = waDisplay();
    $("#sent-number").textContent = waDisplay();
    $("#year").textContent = new Date().getFullYear();
    renderHero();
    renderSizeTable();
    renderGrid();
    renderCart();
    bind();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
