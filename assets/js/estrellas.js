// Carrusel lateral de productos estrella: se arrastra con el dedo o el mouse, con inercia y profundidad.
// Si un producto tiene video (assets/video/<id>.mp4), el avance del deslizamiento lo hace girar.
(() => {
  const lista = window.ESTRELLAS || [], C = window.CATALOGO || {};
  const $ = (id) => document.getElementById(id);
  const pista = $("show-track");
  if (!pista || !lista.length) return;
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const laminas = [...pista.querySelectorAll(".show-slide")];
  const objetos = laminas.map((l) => l.querySelector(".show-object"));
  const videos = laminas.map((l) => l.querySelector("video"));
  const puntos = [...document.querySelectorAll("#show-dots button")];
  const n = lista.length;

  let pos = 0, destino = 0, vel = 0, tomando = false, x0 = 0, ultimoX = 0, ultimoT = 0, actual = -1, relojAuto;
  const ancho = () => pista.clientWidth;
  // distancia más corta dando la vuelta: el carrusel es infinito
  const dist = (i, p) => { let d = i - p; d -= Math.round(d / n) * n; return d; };

  function poner(k) {
    if (k === actual) return;
    actual = k;
    const e = lista[k], p = C[e.id];
    puntos.forEach((b, j) => b.setAttribute("aria-pressed", String(j === k)));
    $("show-name").textContent = p.n;
    $("show-spec").textContent = e.frase;
    $("show-price").textContent = "$" + String(p.p).replace(".", ",");
    $("show-add").dataset.add = e.id;
    $("show-more").href = "#producto/" + e.id;
    if (window.gsap && !quieto) gsap.fromTo("#show-copy > *", { x: 18, opacity: 0 }, { x: 0, opacity: 1, duration: 0.55, stagger: 0.04, ease: "power3.out", overwrite: true });
    videos.forEach((v, j) => { if (v) { if (j === k && !quieto) v.play().catch(() => {}); else v.pause(); } });
  }

  function pintar() {
    laminas.forEach((l, i) => {
      const d = dist(i, pos), a = Math.abs(d);
      l.style.visibility = a > 1.2 ? "hidden" : "visible";
      if (a > 1.2) return;
      // el objeto se aleja y gira un poco como si estuviera sobre una base real
      l.style.transform = `translate3d(${d * 62}%,0,0)`;
      l.style.opacity = String(Math.max(0, 1 - a * 1.15));
      objetos[i].style.transform = `rotateY(${d * -34}deg) translateZ(${-a * 260}px) scale(${1 - a * 0.1})`;
    });
    poner(((Math.round(pos) % n) + n) % n);
  }

  function cuadro() {
    if (!tomando) {
      // resorte amortiguado: llega suave y sin rebote exagerado
      vel += (destino - pos) * 0.045;
      vel *= 0.8;
      pos += vel;
      if (Math.abs(destino - pos) < 0.0005 && Math.abs(vel) < 0.0005) { pos = destino; vel = 0; }
    }
    pintar();
    requestAnimationFrame(cuadro);
  }

  function ir(k) { destino = k; programar(); }
  function programar() {
    clearTimeout(relojAuto);
    if (!quieto) relojAuto = setTimeout(() => ir(Math.round(destino) + 1), 6500);
  }

  const zona = $("escaparate");
  zona.addEventListener("pointerdown", (e) => {
    if (e.target.closest("a,button") || (e.pointerType === "mouse" && e.button)) return;
    tomando = true; x0 = ultimoX = e.clientX; ultimoT = e.timeStamp; vel = 0;
    pista.classList.add("is-drag"); clearTimeout(relojAuto);
    zona.setPointerCapture(e.pointerId);
  });
  zona.addEventListener("pointermove", (e) => {
    if (!tomando) return;
    const dx = e.clientX - ultimoX, dt = Math.max(1, e.timeStamp - ultimoT);
    pos -= (dx / ancho()) * 1.6;
    vel = -(dx / dt) * 16 / ancho() * 1.6;
    ultimoX = e.clientX; ultimoT = e.timeStamp;
  });
  const soltar = () => {
    if (!tomando) return;
    tomando = false; pista.classList.remove("is-drag");
    ir(Math.round(pos + vel * 8));
  };
  zona.addEventListener("pointerup", soltar);
  zona.addEventListener("pointercancel", soltar);
  $("show-prev").addEventListener("click", () => ir(Math.round(destino) - 1));
  $("show-next").addEventListener("click", () => ir(Math.round(destino) + 1));
  puntos.forEach((b, k) => b.addEventListener("click", () => ir(Math.round(destino) + dist(k, destino))));
  pista.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") ir(Math.round(destino) - 1);
    if (e.key === "ArrowRight") ir(Math.round(destino) + 1);
  });
  programar();
  requestAnimationFrame(cuadro);
})();
