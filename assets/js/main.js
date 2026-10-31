(() => {
  const C = window.CATALOGO || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dinero = (n) => "$" + (Math.round(n * 100) / 100).toString().replace(".", ",");
  const conGsap = () => window.gsap && !quieto;

  /* ---------- Logo: eslogan del ancho del logotipo e isotipo de la misma altura ---------- */
  function ajustarLogos() {
    $$(".lockup").forEach((l) => {
      const img = $(".lockup-logo", l), tag = $(".lockup-tag", l);
      const ancho = img.getBoundingClientRect().width;
      if (!ancho) return;
      const inset = ancho * 0.006;
      tag.style.fontSize = "10px";
      const fs = (10 * (ancho - 2 * inset)) / (tag.scrollWidth - 3);
      tag.style.fontSize = fs + "px";
      tag.style.marginRight = -0.3 * fs + "px";
      tag.style.marginLeft = inset + "px";
      const iso = l.previousElementSibling;
      if (iso) iso.style.setProperty("--lockup-h", l.getBoundingClientRect().height + "px");
    });
  }
  document.fonts.ready.then(ajustarLogos);
  addEventListener("resize", ajustarLogos);
  $$(".lockup-logo").forEach((i) => (i.complete ? ajustarLogos() : i.addEventListener("load", ajustarLogos)));

  /* ---------- Toast ---------- */
  const toast = $("#toast");
  let relojToast;
  function avisar(txt) {
    toast.textContent = txt;
    toast.classList.add("show");
    clearTimeout(relojToast);
    relojToast = setTimeout(() => toast.classList.remove("show"), 2400);
  }

  /* ---------- Carrito (se guarda en este navegador) ---------- */
  let carrito = [];
  try { carrito = JSON.parse(localStorage.getItem("tecnoding-carrito") || "[]").filter((i) => C[i.id]); } catch (e) { carrito = []; }
  const guardar = () => { try { localStorage.setItem("tecnoding-carrito", JSON.stringify(carrito)); } catch (e) { /* sin almacenamiento */ } };
  const total = () => carrito.reduce((s, i) => s + i.precio * i.cant, 0);

  function agregar(id, variante, cant = 1, origen, color = "") {
    const p = C[id];
    if (!p) return;
    const v = variante || (p.v.length ? p.v[0][0] : "");
    color = color || (p.col.length ? p.col[0][0] : "");
    const precio = v ? (p.v.find((x) => x[0] === v) || [, p.p])[1] : p.p;
    const linea = carrito.find((i) => i.id === id && i.v === v && (i.color || "") === color);
    if (linea) linea.cant += cant; else carrito.push({ id, v, precio, cant, color });
    guardar();
    pintarCarrito();
    volar(origen, id);
    const cuenta = $("#cart-count");
    cuenta.classList.remove("pop"); void cuenta.offsetWidth; cuenta.classList.add("pop");
    const eleccion = [v, color].filter(Boolean).join(", ");
    avisar("¡Ding! " + p.n + (eleccion ? " (" + eleccion + ")" : "") + " va en tu carrito");
  }

  function volar(origen, id) {
    if (!origen || quieto) return;
    const desde = origen.getBoundingClientRect(), hasta = $("#cart-open").getBoundingClientRect();
    const img = document.createElement("img");
    img.src = "/assets/img/productos/" + id + ".webp";
    img.className = "fly";
    const lado = Math.min(140, desde.width);
    Object.assign(img.style, { left: desde.left + desde.width / 2 - lado / 2 + "px", top: desde.top + desde.height / 2 - lado / 2 + "px", width: lado + "px", height: lado + "px" });
    document.body.appendChild(img);
    const dx = hasta.left + hasta.width / 2 - (desde.left + desde.width / 2), dy = hasta.top + hasta.height / 2 - (desde.top + desde.height / 2);
    img.animate([
      { transform: "translate(0,0) scale(1) rotate(0)", opacity: 1 },
      { transform: `translate(${dx * 0.5}px,${dy - 80}px) scale(.6) rotate(-12deg)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px,${dy}px) scale(.12) rotate(-20deg)`, opacity: 0.2 },
    ], { duration: 750, easing: "cubic-bezier(.5,0,.3,1)" }).onfinish = () => img.remove();
  }

  function opciones(i, k) {
    const p = C[i.id];
    const lista = (etiqueta, campo, vals) => vals.length ? `<label class="cart-opt">${etiqueta}<select data-opcion="${campo}" data-linea="${k}">${vals.map((n) => `<option${n === i[campo] ? " selected" : ""}>${n}</option>`).join("")}</select></label>` : "";
    return lista("Versión", "v", p.v.map((x) => x[0])) + lista("Color", "color", p.col.map((x) => x[0]));
  }

  function pintarCarrito() {
    const n = carrito.reduce((s, i) => s + i.cant, 0);
    const cuenta = $("#cart-count");
    cuenta.textContent = n;
    cuenta.hidden = n === 0;
    $("#cart-open").setAttribute("aria-label", n ? `Abrir carrito, ${n} productos` : "Abrir carrito");
    $("#cart-empty").hidden = n > 0;
    $("#cart-foot").hidden = n === 0;
    $("#cart-total").textContent = $("#cart-total-2").textContent = dinero(total());
    $("#cart-items").innerHTML = carrito.map((i, k) => `
      <li class="cart-item">
        <span class="cart-item-img"><img src="/assets/img/productos/${i.id}.webp" alt=""></span>
        <div><b><a href="/producto/${C[i.id].u}/">${C[i.id].n}</a></b>${opciones(i, k)}<small>${dinero(i.precio)} c/u</small>
          <div class="qty"><button type="button" data-linea="${k}" data-d="-1" aria-label="Quitar uno">−</button><output>${i.cant}</output><button type="button" data-linea="${k}" data-d="1" aria-label="Agregar uno">+</button></div>
        </div>
        <div><span class="cart-item-price">${dinero(i.precio * i.cant)}</span><button type="button" class="cart-item-del" data-borrar="${k}">Quitar</button></div>
      </li>`).join("");
  }

  $("#cart-items").addEventListener("click", (ev) => {
    const b = ev.target.closest("button");
    if (!b) return;
    if (b.dataset.borrar != null) carrito.splice(+b.dataset.borrar, 1);
    else if (b.dataset.linea != null) {
      const l = carrito[+b.dataset.linea];
      l.cant += +b.dataset.d;
      if (l.cant < 1) carrito.splice(+b.dataset.linea, 1);
    }
    guardar();
    pintarCarrito();
  });

  $("#cart-items").addEventListener("change", (ev) => {
    const s = ev.target.closest("select[data-opcion]");
    if (!s) return;
    const k = +s.dataset.linea, l = carrito[k], p = C[l.id];
    l[s.dataset.opcion] = s.value;
    if (s.dataset.opcion === "v") l.precio = p.v.find((x) => x[0] === s.value)[1];
    const igual = carrito.findIndex((o, n) => n !== k && o.id === l.id && o.v === l.v && (o.color || "") === (l.color || ""));
    if (igual >= 0) { carrito[igual].cant += l.cant; carrito.splice(k, 1); }
    guardar();
    pintarCarrito();
  });

  /* ---------- Diálogo del carrito ---------- */
  let ultimoFoco = null;
  function abrir(dlg, enfocar) {
    ultimoFoco = document.activeElement;
    dlg.hidden = false;
    document.documentElement.style.overflow = "hidden";
    if (conGsap()) gsap.fromTo($(".cart-panel", dlg), { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: "power3.out", clearProps: "transform,translate,opacity" });
    (enfocar || $("button, [href], input", dlg)).focus();
  }
  function cerrar(dlg) {
    dlg.hidden = true;
    document.documentElement.style.overflow = "";
    if (ultimoFoco) ultimoFoco.focus();
  }
  document.addEventListener("keydown", (ev) => {
    const abierto = !$("#cart").hidden ? $("#cart") : null;
    if (!abierto) return;
    if (ev.key === "Escape") cerrar(abierto);
    if (ev.key === "Tab") {
      const f = $$("button:not([hidden]), [href], input:not([type=radio]), input[type=radio]:checked, select", abierto).filter((e) => e.offsetParent !== null);
      if (!f.length) return;
      if (ev.shiftKey && document.activeElement === f[0]) { ev.preventDefault(); f[f.length - 1].focus(); }
      else if (!ev.shiftKey && document.activeElement === f[f.length - 1]) { ev.preventDefault(); f[0].focus(); }
    }
  });

  /* ---------- Página de producto: fotos, colores, versiones y cantidad ---------- */
  const sheet = $("#sheet");
  if (sheet) {
    const id = sheet.dataset.id, p = C[id];
    let cant = 1;
    const stage = $("#sheet-stage"), img = $("#sheet-img");
    const verFoto = (src, esFoto) => { img.src = src; img.alt = esFoto ? p.n + ", foto real" : p.n; stage.classList.toggle("is-photo", esFoto); };
    const fotos = [["/assets/img/productos/" + id + ".webp", false], ...p.f.map((f) => ["/assets/img/fotos/" + f, true])];
    $("#sheet-thumbs").innerHTML = fotos.length > 1 ? fotos.map(([src], k) => `<button type="button" aria-pressed="${k === 0}" aria-label="${k ? "Foto real " + k : "Producto"}" data-foto="${k}"><img src="${src}" alt=""></button>`).join("") : "";
    $$("#sheet-thumbs button").forEach((b) => b.addEventListener("click", () => {
      $$("#sheet-thumbs button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      verFoto(...fotos[+b.dataset.foto]);
    }));
    $("#sheet-colors").hidden = !p.col.length;
    $("#sheet-color-list").innerHTML = p.col.map(([n, hex], k) => `<label title="${n}"><input type="radio" name="color" value="${n}" aria-label="${n}" ${k ? "" : "checked"}><span style="--c:${hex}"></span></label>`).join("");
    $("#sheet-color-name").textContent = p.col.length ? p.col[0][0] : "";
    $("#sheet-variants").hidden = !p.v.length;
    $("#sheet-variant-list").innerHTML = p.v.map(([n, pr], k) => `<label><input type="radio" name="variante" value="${n}" ${k ? "" : "checked"}><span>${n} · ${dinero(pr)}</span></label>`).join("");
    const unitario = () => { const v = $("input[name=variante]:checked", sheet); return v ? p.v.find((x) => x[0] === v.value)[1] : p.p; };
    const actualizar = () => { $("#sheet-price").textContent = dinero(unitario() * cant); };
    actualizar();
    $("#sheet-variant-list").addEventListener("change", actualizar);
    $("#sheet-color-list").addEventListener("change", (ev) => { $("#sheet-color-name").textContent = ev.target.value; });
    $$("[data-qty]", sheet).forEach((b) => b.addEventListener("click", () => {
      cant = Math.max(1, cant + +b.dataset.qty);
      $("#sheet-qty").textContent = cant;
      actualizar();
    }));
    $("#sheet-add").addEventListener("click", () => {
      const v = $("input[name=variante]:checked", sheet), col = $("input[name=color]:checked", sheet);
      agregar(id, v ? v.value : "", cant, img, col ? col.value : "");
    });
  }

  /* Enlaces viejos con # siguen llegando a su página */
  const vieja = location.hash.match(/^#(producto|categoria)\/(.+)$/);
  if (vieja) location.replace(vieja[1] === "producto" && C[vieja[2]] ? `/producto/${C[vieja[2]].u}/` : `/${vieja[1]}/${vieja[2]}/`);

  document.addEventListener("click", (ev) => {
    const add = ev.target.closest("[data-add]");
    if (!add) return;
    const p = C[add.dataset.add];
    if (!p) return;
    const tile = add.closest(".tile");
    agregar(add.dataset.add, "", 1, tile ? $(".tile-stage img", tile) : null);
  });

  /* ---------- Carrito y cuestionario de pedido ---------- */
  const cart = $("#cart"), form = $("#checkout");
  $("#cart-open").addEventListener("click", () => { mostrarPaso(false); abrir(cart, $(".sheet-x", cart)); });
  $$("[data-cart-close]", cart).forEach((b) => b.addEventListener("click", () => cerrar(cart)));
  function mostrarPaso(pedido) {
    $("#cart-items-step").hidden = pedido;
    form.hidden = !pedido;
    $("#cart-title").textContent = pedido ? "Tu pedido" : "Tu carrito";
    if (pedido) $("input[name=entrega]", form).focus();
  }
  $("#cart-next").addEventListener("click", () => mostrarPaso(true));
  $("#cart-back").addEventListener("click", () => mostrarPaso(false));
  form.addEventListener("change", (ev) => {
    if (ev.target.name !== "entrega") return;
    $$("[data-si]", form).forEach((d) => (d.hidden = d.dataset.si !== ev.target.value));
    // en envíos nacionales no se puede pagar en efectivo
    const efectivo = $("input[name=pago][value=Efectivo]", form), esEnvio = ev.target.value === "Envío nacional";
    efectivo.closest("label").hidden = esEnvio;
    efectivo.disabled = esEnvio;
    if (esEnvio) efectivo.checked = false;
  });
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const err = $("#form-error");
    const falta = !d.entrega ? "Elige cómo quieres recibir tu pedido." : !d.pago ? "Elige cómo vas a pagar." : !(d.nombre || "").trim() ? "Escribe tu nombre." : !carrito.length ? "Tu carrito está vacío." : "";
    err.textContent = falta;
    if (falta) return;
    const lineas = carrito.map((i) => `• ${i.cant} × ${C[i.id].n}${i.v || i.color ? " (" + [i.v, i.color].filter(Boolean).join(", ") + ")" : ""} — ${dinero(i.precio * i.cant)}\n${location.origin}/producto/${C[i.id].u}/`);
    let entrega = d.entrega;
    if (d.entrega === "Delivery en Barinas" && d.zona) entrega += " · " + d.zona;
    if (d.entrega === "Envío nacional") entrega += ` · ${d.agencia}${d.ciudad ? " · " + d.ciudad : ""}${d.cedula ? " · C.I. " + d.cedula : ""}`;
    const texto = ["¡Hola, Tecnoding! 👋 Quiero hacer este pedido:", "", ...lineas, "", `Total: ${dinero(total())}`, `Entrega: ${entrega}`, `Pago: ${d.pago}`, `Nombre: ${d.nombre.trim()}`]
      .concat(d.nota ? [`Nota: ${d.nota}`] : []).join("\n");
    window.open(`https://wa.me/${window.WHATSAPP}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
    avisar("¡Ding! Te abrimos WhatsApp con tu pedido");
  });
  pintarCarrito();

  /* ---------- Buscador de la barra ---------- */
  const norm = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const entrada = $("#search-input"), caja = $("#search-res");
  const indice = Object.entries(C).map(([id, p]) => ({ id, p, t: norm([p.n, p.c, ...p.s, ...p.col.map((x) => x[0])].join(" ")) }));
  function buscar() {
    const q = norm(entrada.value.trim());
    if (!q) { caja.hidden = true; return; }
    const pal = q.split(/\s+/);
    const res = indice.filter((x) => pal.every((w) => x.t.includes(w))).slice(0, 8);
    caja.innerHTML = res.length ? res.map(({ id, p }) => `<a href="/producto/${p.u}/"><img src="/assets/img/productos/${id}.webp" alt=""><span><b>${p.n}</b><small>${p.c}</small></span><strong>${dinero(p.v.length ? Math.min(...p.v.map((v) => v[1])) : p.p)}</strong></a>`).join("") : "<p>No encontramos ese producto. Escríbenos por WhatsApp y te ayudamos.</p>";
    caja.hidden = false;
  }
  entrada.addEventListener("input", buscar);
  entrada.addEventListener("focus", buscar);
  $("#search").addEventListener("submit", (ev) => { ev.preventDefault(); const a = $("a", caja); if (a) location.href = a.getAttribute("href"); });
  caja.addEventListener("click", () => { caja.hidden = true; entrada.value = ""; });
  document.addEventListener("click", (ev) => { if (!ev.target.closest("#search")) caja.hidden = true; });

  /* ---------- Entradas suaves al hacer scroll ---------- */
  function animarScroll() {
    if (!conGsap() || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    const hay = (s) => !!$(s);
    if (hay(".rail-item")) gsap.from(".rail-item", { y: 24, opacity: 0, duration: 0.7, stagger: 0.04, ease: "power3.out", scrollTrigger: { trigger: ".rail", start: "top 88%", once: true } });
    $$(".cat-head").forEach((h) => gsap.from(h.children, { y: 28, opacity: 0, duration: 0.8, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: h, start: "top 85%", once: true } }));
    if (hay(".tile")) ScrollTrigger.batch(".tile", { start: "top 92%", once: true,
      onEnter: (els) => gsap.fromTo(els, { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.06, ease: "power3.out", clearProps: "transform,opacity" }) });
    if (hay(".step-tile")) gsap.from(".step-tile", { scaleY: 0.4, transformOrigin: "50% 100%", opacity: 0, duration: 0.9, stagger: 0.12, ease: "expo.out", scrollTrigger: { trigger: ".steps", start: "top 80%", once: true } });
    if (hay(".close-copy")) gsap.from(".close-copy > *", { y: 24, opacity: 0, duration: 0.8, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: ".close", start: "top 70%", once: true } });
  }
  if (window.gsap) animarScroll(); else addEventListener("load", animarScroll);
})();
