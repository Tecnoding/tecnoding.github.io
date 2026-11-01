// Animaciones de "Tres pasos": un puntero enseña a comprar. El HTML ya trae el estado final,
// así que sin JavaScript o con movimiento reducido se ve el resultado sin animar.
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

  function preparar(demo) {
    const vivo = { visible: false };
    new IntersectionObserver((e) => { vivo.visible = e[0].isIntersecting; }, { threshold: 0.25 }).observe(demo);
    const cursor = demo.querySelector(".d-cursor");
    // las pausas se detienen mientras el cuadro no está en pantalla
    const espera = async (ms) => {
      await dormir(ms);
      while (!vivo.visible) await dormir(250);
    };
    const mover = async (el, ms = 620) => {
      const r = el.getBoundingClientRect(), b = demo.getBoundingClientRect();
      cursor.style.transitionDuration = ms + "ms";
      cursor.style.transform = `translate(${r.left - b.left + r.width / 2}px,${r.top - b.top + r.height / 2}px)`;
      await espera(ms + 60);
    };
    const clic = async (el) => {
      cursor.classList.add("is-down");
      el.classList.add("d-press");
      await espera(150);
      cursor.classList.remove("is-down");
      el.classList.remove("d-press");
    };
    return { espera, mover, clic, cursor };
  }

  async function bucle(demo, escena) {
    const h = preparar(demo);
    await h.espera(700);
    for (;;) { await escena(demo, h); await h.espera(2200); }
  }

  /* 1. Agregar productos al carrito */
  async function carrito(demo, { espera, mover, clic }) {
    const cuenta = demo.querySelector(".d-count"), bolsa = demo.querySelector(".d-bag"), ding = demo.querySelector(".d-ding");
    const volar = (tarjeta) => {
      const img = tarjeta.querySelector("img"), a = img.getBoundingClientRect(), z = bolsa.getBoundingClientRect(), b = demo.getBoundingClientRect();
      const c = img.cloneNode();
      c.className = "d-fly";
      Object.assign(c.style, { left: a.left - b.left + "px", top: a.top - b.top + "px", width: a.width + "px", height: a.height + "px" });
      demo.appendChild(c);
      c.animate([{ transform: "translate(0,0) scale(1)", opacity: 1 }, { transform: `translate(${z.left - a.left}px,${z.top - a.top}px) scale(.18)`, opacity: .3 }],
        { duration: 650, easing: "cubic-bezier(.5,0,.3,1)" }).onfinish = () => c.remove();
    };
    cuenta.textContent = "0"; cuenta.hidden = true; ding.classList.remove("is-on");
    await espera(500);
    let n = 0;
    for (const t of demo.querySelectorAll(".d-card[data-elegir]")) {
      const mas = t.querySelector(".d-plus");
      await mover(mas);
      await clic(mas);
      volar(t);
      await espera(620);
      cuenta.textContent = ++n; cuenta.hidden = false;
      bolsa.classList.remove("d-pop"); void bolsa.offsetWidth; bolsa.classList.add("d-pop");
      ding.classList.add("is-on");
      await espera(650);
      ding.classList.remove("is-on");
    }
  }

  /* 2. Formulario del pedido */
  async function formulario(demo, { espera, mover, clic }) {
    const chips = demo.querySelectorAll(".d-chip"), nombre = demo.querySelector(".d-text"), enviar = demo.querySelector(".d-send");
    const texto = nombre.dataset.texto;
    chips.forEach((c) => c.classList.remove("is-on"));
    nombre.textContent = "";
    enviar.classList.remove("is-on");
    await espera(500);
    const entrega = demo.querySelector("[data-elegir=entrega]");
    await mover(entrega); await clic(entrega); entrega.classList.add("is-on");
    await espera(350);
    await mover(nombre.parentElement); await clic(nombre.parentElement);
    for (let i = 1; i <= texto.length; i++) { nombre.textContent = texto.slice(0, i); await espera(95); }
    await espera(300);
    const pago = demo.querySelector("[data-elegir=pago]");
    await mover(pago); await clic(pago); pago.classList.add("is-on");
    await espera(350);
    enviar.classList.add("is-on");
    await mover(enviar); await clic(enviar);
  }

  /* 3. El pedido llega al chat de WhatsApp */
  async function chat(demo, { espera }) {
    const [pedido, escribe, respuesta] = demo.querySelectorAll(".d-msg");
    [pedido, escribe, respuesta].forEach((m) => { m.hidden = true; m.classList.remove("d-in"); });
    const mostrar = (m) => { m.hidden = false; m.classList.add("d-in"); };
    await espera(800);
    mostrar(pedido);
    await espera(1500);
    mostrar(escribe);
    await espera(1500);
    escribe.hidden = true;
    mostrar(respuesta);
    await espera(1800);
  }

  const escenas = { carrito, formulario, chat };
  document.querySelectorAll("[data-demo]").forEach((d) => bucle(d, escenas[d.dataset.demo]));
})();
