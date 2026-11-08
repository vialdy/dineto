/* ==========================================================================
   Dineto · web principal
   Movimiento: GSAP 3.15 (ScrollTrigger, DrawSVG, SplitText) + Lenis.
   Todo el contenido es visible sin JavaScript; el movimiento se añade encima
   y se desactiva con "reducir movimiento".
   ========================================================================== */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var G = window.gsap, ST = window.ScrollTrigger;
  var motion = !!(G && ST && !reduce);
  var D = window.Dineto || { track: function () {}, cfg: {}, utm: {}, send: function () { return Promise.resolve({ skipped: true }); }, waLink: function (t) { return 'https://wa.me/34647299239?text=' + encodeURIComponent(t); }, calUrl: function () { return ''; } };
  root.classList.add('js');
  if (motion) root.classList.add('motion');

  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function safe(name, fn) { try { fn(); } catch (e) { if (window.console) console.warn('[dineto] ' + name, e); } }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function navH() { return ($('[data-nav]') || {}).offsetHeight || 72; }

  var lenis = null;

  /* ------------------------------------------------------------------ nav */
  safe('nav', function () {
    var nav = $('[data-nav]'), btn = $('[data-menu-toggle]'), menu = $('#nav-menu');
    function close() { btn.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); }
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open)); nav.classList.toggle('is-open', open);
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', close); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('is-open')) { close(); btn.focus(); } });
    var onScroll = function () { nav.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

    // enlace activo según la sección visible
    var links = $$('a[href^="#"]', menu), map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (l) { l.removeAttribute('aria-current'); });
          var a = map[en.target.id]; if (a) a.setAttribute('aria-current', 'true');
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      $$('main > section').forEach(function (s) { io.observe(s); });
    }
  });

  safe('year', function () { $$('[data-year]').forEach(function (n) { n.textContent = new Date().getFullYear(); }); });

  safe('cta-tracking', function () {
    d.addEventListener('click', function (e) {
      var a = e.target.closest('[data-cta]'); if (a) D.track('cta_click', { where: a.getAttribute('data-cta') });
    });
  });

  /* ------------- Acto 02: la llave roja, a medida y apuntando a "¿Cómo?" */
  function shapeBrace() {
    var svg = $('.brace'), path = svg && $('.marker', svg), q = $('.how__q p');
    if (!svg || !path) return;
    var W = Math.round(svg.getBoundingClientRect().width), H = Math.round(svg.getBoundingClientRect().height) || 70;
    if (W < 50) return;
    var r = Math.min(56, W * .06), m = Math.round(H * .45), tip = W * .125;
    if (q) { var qr = q.getBoundingClientRect(), sr = svg.getBoundingClientRect(); tip = qr.left + qr.width / 2 - sr.left; }
    tip = Math.max(r + 34, Math.min(W - r - 34, tip));
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.removeAttribute('preserveAspectRatio');
    path.removeAttribute('vector-effect');
    path.setAttribute('d', 'M3 4C4 ' + (m - 8) + ' ' + (r * .4) + ' ' + m + ' ' + r + ' ' + m + 'L' + (tip - 24) + ' ' + m +
      'C' + (tip - 9) + ' ' + m + ' ' + (tip - 2) + ' ' + (m + 8) + ' ' + tip + ' ' + (H - 3) +
      'C' + (tip + 2) + ' ' + (m + 8) + ' ' + (tip + 9) + ' ' + m + ' ' + (tip + 24) + ' ' + m +
      'L' + (W - r) + ' ' + m + 'C' + (W - r * .4) + ' ' + m + ' ' + (W - 4) + ' ' + (m - 8) + ' ' + (W - 3) + ' 4');
  }
  safe('brace', function () {
    shapeBrace();
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(shapeBrace, 120); });
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(shapeBrace);
  });

  /* ------------------------------------- Acto 02: modelo interactivo Shindan */
  var FINDINGS = {
    dependencia: 'siete de cada diez decisiones pasan por el CEO, incluidas las compras de menos de 300 €.',
    captacion: 'el 70 % de las ventas viene de tres clientes y nadie mide de dónde llegan los nuevos.',
    finanzas: 'el 20 % de los clientes no deja margen: se les vende por debajo del coste real.',
    financiacion: 'una póliza al 9 % renovada tres años seguidos sin negociar.',
    ia: 'tres personas pasan 20 horas a la semana copiando pedidos del correo al programa de gestión.',
    personas: 'solo una persona sabe cerrar el mes, y se jubila en 2027.',
    patrimonio: 'todo el patrimonio del dueño está dentro de la empresa, sin plan de salida.',
    liderazgo: 'el CEO aprueba cada pedido; el equipo espera en lugar de decidir.'
  };
  safe('model', function () {
    var model = $('[data-model]'); if (!model) return;
    var pills = $$('.pill', model), bars = $$('.bar', model), items = $$('[data-plan] li', model);
    var out = $('[data-finding]', model), report = $('.doc--report', model), current = null;

    function select(area, origin) {
      current = area;
      pills.forEach(function (p) { p.setAttribute('aria-pressed', String(p.getAttribute('data-area') === area)); });
      bars.forEach(function (b) { var on = b.getAttribute('data-area') === area; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', String(on)); });
      items.forEach(function (li) { li.classList.toggle('is-active', li.getAttribute('data-area') === area); });
      var txt = FINDINGS[area] || FINDINGS.dependencia;
      if (motion) {
        G.to(out, { autoAlpha: 0, y: 4, duration: .15, onComplete: function () { out.textContent = txt; G.to(out, { autoAlpha: 1, y: 0, duration: .3 }); } });
      } else { out.textContent = txt; }
      if (origin === 'pill' && report) {
        var r = report.getBoundingClientRect();
        if (r.top > window.innerHeight * .7 || r.bottom < 0) {
          if (lenis) lenis.scrollTo(report, { offset: -12, duration: 1.2 });
          else report.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        }
      }
      D.track('model_select', { area: area, origin: origin });
    }
    pills.forEach(function (p) { p.addEventListener('click', function () { select(p.getAttribute('data-area'), 'pill'); }); });
    bars.forEach(function (b) { b.addEventListener('click', function () { select(b.getAttribute('data-area'), 'bar'); }); });
    // Estado inicial: la peor nota, como en un informe real
    select('dependencia', 'init');
  });

  /* ---------------------------------------------- Acto 03: conversación */
  var ANSWERS = [
    { a: 'Sí, pero desde marzo. Si la subida de precios entra en enero, la caja aguanta un 15 % más para ti. Lo dejo en el plan del trimestre.', plan: 'Este trimestre · Revisar tu sueldo en marzo' },
    { a: 'Todavía no. Usáis el 64 % de la primera. Antes automatizamos los pedidos, y en junio lo decidimos con los números del semestre.', plan: 'Este año · Decidir la segunda nave en junio' },
    { a: 'Tres pasos. Hoy le llama Laura, no tú. El viernes, burofax. Y desde ya, sus pedidos solo con pago por adelantado. Te paso el texto del burofax.', plan: 'Este mes · Cobro de Distribuciones Norte' }
  ];
  safe('chat', function () {
    var chat = $('[data-chat]'), ask = $('[data-ask]'); if (!chat) return;
    var seq = $$('[data-seq]', chat), played = false, playing = false, skip = false, clock = 22;

    function scrollEnd() { chat.scrollTo({ top: chat.scrollHeight, behavior: reduce ? 'auto' : 'smooth' }); }
    function pop(li) {
      li.hidden = false;
      if (motion) G.from(li, { autoAlpha: 0, y: 14, scale: .96, transformOrigin: li.classList.contains('msg--me') ? '100% 100%' : '0% 100%', duration: .45, ease: 'back.out(1.6)' });
      var v = $('.voice', li); if (v) { li.classList.add('is-playing'); setTimeout(function () { li.classList.remove('is-playing'); }, 3600); }
      scrollEnd();
    }
    function typing() {
      var t = d.createElement('li'); t.className = 'typing'; t.setAttribute('aria-label', 'Dineto está escribiendo');
      t.innerHTML = '<i></i><i></i><i></i>'; chat.appendChild(t); scrollEnd(); return t;
    }
    async function play() {
      if (played) return; played = true; playing = true;
      for (var i = 0; i < seq.length; i++) {
        var li = seq[i];
        if (skip) { li.hidden = false; continue; }
        if (li.dataset.typing) { var t = typing(); await sleep(+li.dataset.typing); t.remove(); }
        else await sleep(+(li.dataset.wait || 500));
        if (!skip) pop(li); else li.hidden = false;
      }
      playing = false; scrollEnd();
    }
    if (motion) {
      seq.forEach(function (li) { li.hidden = true; });
      ST.create({ trigger: chat, start: 'top 75%', once: true, onEnter: play });
    }

    if (!ask) return;
    $$('[data-q]', ask).forEach(function (btn) {
      btn.addEventListener('click', async function () {
        if (btn.disabled) return;
        btn.disabled = true;
        if (playing || !played) { skip = true; seq.forEach(function (li) { li.hidden = false; }); played = true; }
        var i = +btn.getAttribute('data-q'), ans = ANSWERS[i];
        clock += 1; var tq = '23:' + String(clock).padStart(2, '0');
        var me = d.createElement('li'); me.className = 'msg msg--me';
        me.innerHTML = btn.textContent + '<time>' + tq + '</time>'; chat.appendChild(me); me.hidden = true; pop(me);
        var t = typing(); await sleep(reduce ? 200 : 1300); t.remove();
        clock += 1; var ta = '23:' + String(clock).padStart(2, '0');
        var li = d.createElement('li'); li.className = 'msg';
        li.innerHTML = ans.a + '<span class="msg__plan"><b>Plan actualizado</b>' + ans.plan + '</span><time>' + ta + '</time>';
        chat.appendChild(li); li.hidden = true; pop(li);
        D.track('chat_ask', { q: i });
      });
    });
  });

  /* ---------------------------------------------------- formulario de cierre */
  safe('form', function () {
    var form = $('#lead-form'); if (!form) return;
    var err = $('[data-err]', form), cfg = D.cfg || {};
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      err.classList.remove('is-on');
      if (!form.checkValidity()) {
        var bad = form.querySelector(':invalid'); form.reportValidity(); if (bad) bad.focus(); return;
      }
      var fd = new FormData(form), data = {};
      fd.forEach(function (v, k) { data[k] = v; });
      data.privacidad = !!data.privacidad;
      data.origen = 'web'; data.pagina = location.href; data.fecha = new Date().toISOString();
      Object.keys(D.utm || {}).forEach(function (k) { data[k] = D.utm[k]; });
      var msg = 'Hola, soy ' + data.nombre + ' de ' + data.empresa + ' (' + data.facturacion + '). Me gustaría hablar 30 minutos sobre el Shindan.';
      var btn = form.querySelector('[type=submit]');

      function done(viaWhatsApp) {
        form.classList.add('is-done');
        var extra = $('[data-done-extra]', form), cal = D.calUrl({ name: data.nombre, email: data.email });
        if (cal) {
          $('[data-done-msg]', form).textContent = 'Elige ahora el hueco que mejor te venga:';
          extra.innerHTML = '<iframe class="cal-embed" title="Reservar 30 minutos con Dineto" loading="lazy" src="' + cal + '"></iframe>';
        } else if (viaWhatsApp) {
          $('[data-done-msg]', form).textContent = 'Hemos abierto WhatsApp con tu mensaje listo para enviar. Si no se ha abierto, usa este botón:';
          extra.innerHTML = '<a class="btn btn--deep" target="_blank" rel="noopener" href="' + D.waLink(msg) + '">Enviar por WhatsApp</a>';
        }
        $('.form__done', form).focus();
        D.track('lead', { origen: 'web', facturacion: data.facturacion });
      }

      if (cfg.leadEndpoint) {
        btn.disabled = true;
        D.send(cfg.leadEndpoint, data).then(function (r) {
          if (r.ok) done(false); else throw new Error('HTTP ' + r.status);
        }).catch(function () {
          btn.disabled = false;
          err.innerHTML = 'No hemos podido enviarlo. Escríbenos por <a href="' + D.waLink(msg) + '" target="_blank" rel="noopener">WhatsApp</a> o a <a href="mailto:' + (cfg.email || 'hola@dineto.es') + '">' + (cfg.email || 'hola@dineto.es') + '</a>.';
          err.classList.add('is-on');
        });
      } else {
        // Sin CRM conectado todavía: la solicitud llega por WhatsApp.
        window.open(D.waLink(msg), '_blank', 'noopener');
        done(true);
      }
    });
  });

  /* ======================================================================
     MOVIMIENTO
     ====================================================================== */
  if (!motion) return;

  G.registerPlugin(ST);
  if (window.DrawSVGPlugin) G.registerPlugin(window.DrawSVGPlugin);
  if (window.SplitText) G.registerPlugin(window.SplitText);
  var hasDraw = !!window.DrawSVGPlugin;
  G.defaults({ ease: 'power3.out' });
  var queue = [];
  function later(name, fn) { queue.push([name, fn]); }

  /* ---------- Lenis (scroll suave, como las webs de Awwwards) ---------- */
  safe('lenis', function () {
    if (!window.Lenis) return;
    lenis = new window.Lenis({ lerp: 0.11, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', ST.update);
    G.ticker.add(function (t) { lenis.raf(t * 1000); });
    G.ticker.lagSmoothing(0);
    d.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]'); if (!a || a.classList.contains('skip')) return;
      var id = a.getAttribute('href'); if (id.length < 2 && id !== '#') return;
      var target = id === '#top' ? 0 : d.querySelector(id); if (target === null) return;
      e.preventDefault();
      // Lenis ya aplica el scroll-padding-top del CSS (altura de la barra + 16 px)
      lenis.scrollTo(target, { duration: 1.4 });
      if (id === '#hablemos') setTimeout(function () { var f = $('#f-name'); if (f) f.focus({ preventScroll: true }); }, 1500);
    });
  });

  var mm = G.matchMedia();

  /* ---------- Portada ---------- */
  safe('hero', function () {
    var tl = G.timeline({ defaults: { ease: 'expo.out', duration: 1.1 } });
    var title = $('[data-hero="title"]');
    if (window.SplitText && title) {
      var split = window.SplitText.create(title, { type: 'lines,words', mask: 'lines', linesClass: 'line' });
      tl.from(split.words, { yPercent: 110, stagger: .045, duration: 1.15 }, .1);
    } else tl.from(title, { autoAlpha: 0, y: 30 }, .1);
    tl.from(['[data-hero="lead"]', '[data-hero="actions"]', '[data-hero="micro"]'], { autoAlpha: 0, y: 22, stagger: .09 }, .45)
      .from('.hero__time', { autoAlpha: 0, x: -10 }, .55)
      .from('.noti', { autoAlpha: 0, y: -28, scale: .94, stagger: .16, duration: .9, ease: 'back.out(1.5)', clearProps: 'transform' }, .6)
      .add(function () { $('.notis').classList.add('is-live'); });
    // la marca de agua se desplaza con el scroll
    G.to('.hero .watermark', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    G.to('.hero__phone', { y: -60, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  });

  /* ---------- Titulares por líneas + apariciones ---------- */
  function headings() {
    $$('[data-split]').forEach(function (el) {
      if (!window.SplitText) { G.from(el, { autoAlpha: 0, y: 24, duration: .8, scrollTrigger: { trigger: el, start: 'top 88%', once: true } }); return; }
      window.SplitText.create(el, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit: function (self) {
          return G.from(self.lines, { yPercent: 105, duration: 1, ease: 'expo.out', stagger: .09, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
        }
      });
    });
  }
  later('reveal', function () {
    var els = $$('[data-reveal]');
    G.set(els, { autoAlpha: 0, y: 26 });
    ST.batch(els, {
      start: 'top 90%', once: true,
      onEnter: function (batch) { G.to(batch, { autoAlpha: 1, y: 0, duration: .8, stagger: .08, overwrite: true, clearProps: 'transform,opacity,visibility' }); }
    });
  });

  /* ---------- Acto 01 · El ruido ---------- */
  later('noise', function () {
    var stage = $('[data-noise]'); if (!stage) return;
    var tags = $$('.tag', stage), inners = $$('.tag__in', stage);
    inners.forEach(function (el) {
      var r = parseFloat(getComputedStyle(el).getPropertyValue('--r')) || 0;
      G.set(el, { xPercent: -50, yPercent: -50, x: 0, y: 0, rotation: r });
    });
    var cap = $('.card-problems .eq__cap'); if (cap && !canHover) cap.textContent = 'Toca la tarjeta.';

    function draw(sel, opts) {
      var paths = $$(sel, stage);
      return hasDraw ? G.from(paths, Object.assign({ drawSVG: '0%', duration: .5, stagger: .12, ease: 'power2.inOut' }, opts || {}))
                     : G.from(paths, Object.assign({ autoAlpha: 0, duration: .4, stagger: .1 }, opts || {}));
    }
    function partProblems() {
      return G.timeline()
        .from('.card-problems', { autoAlpha: 0, y: 40, duration: .6 })
        .from('.ceo', { scale: .5, autoAlpha: 0, duration: .5, ease: 'back.out(2)' }, '-=.25')
        .from(tags, {
          x: function () { return G.utils.random(-180, 180); }, y: function () { return G.utils.random(-140, 140); },
          rotation: function () { return G.utils.random(-70, 70); }, autoAlpha: 0, duration: 1, stagger: .07, ease: 'back.out(1.3)'
        }, '-=.2');
    }
    var ops = $$('.eq__op', stage);
    function partPlus(n) {
      var paths = $$('.marker', ops[n - 1]);
      return hasDraw ? G.from(paths, { drawSVG: '0%', duration: .45, stagger: .12, ease: 'power2.inOut' }) : G.from(paths, { autoAlpha: 0, duration: .4 });
    }
    function partAI() {
      return G.timeline()
        .from('.card-ai', { autoAlpha: 0, y: 40, duration: .6 })
        .from('.ai-orb', { scale: .6, autoAlpha: 0, duration: .6, ease: 'back.out(1.6)' }, '-=.2')
        .add(draw('.ai-orb .marker', { duration: 1, ease: 'power1.inOut' }), '-=.35');
    }
    function partSpeed() {
      return G.timeline()
        .from('.card-speed', { autoAlpha: 0, y: 40, duration: .6 })
        .fromTo('.speed', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: .8, ease: 'power2.inOut' }, '-=.2');
    }
    function partResult() {
      return G.timeline()
        .add(draw('.eq__equals .marker', { duration: .55, stagger: .18 }))
        .from('.q', { autoAlpha: 0, y: 30, duration: .7, stagger: .22 }, '-=.15');
    }

    mm.add('(min-width: 1024px) and (min-height: 760px)', function () {
      var tl = G.timeline({ defaults: { ease: 'power3.out' } });
      tl.add(partProblems()).add(partPlus(1), '-=.4').add(partAI(), '-=.1').add(partPlus(2), '-=.3')
        .add(partSpeed(), '-=.1').add(partResult(), '+=.1').to({}, { duration: .6 });
      ST.create({ trigger: stage, start: function () { return 'top top+=' + (navH() + 28); }, end: '+=1500', pin: true, scrub: .8, animation: tl, anticipatePin: 1, invalidateOnRefresh: true });
    });
    mm.add('(max-width: 1023px), (max-height: 759px)', function () {
      [['.card-problems', partProblems], ['.card-ai', partAI], ['.card-speed', partSpeed], ['.eq__result', partResult]].forEach(function (p) {
        var tl = p[1](); tl.pause();
        ST.create({ trigger: p[0], start: 'top 80%', once: true, onEnter: function () { tl.play(); } });
      });
      $$('.eq__op', stage).forEach(function (op, i) {
        var tl = partPlus(i + 1); tl.pause(); ST.create({ trigger: op, start: 'top 85%', once: true, onEnter: function () { tl.play(); } });
      });
    });

    /* Etiquetas que se apartan del cursor: el ruido alrededor del CEO */
    var field = $('[data-repel]', stage);
    var movers = inners.map(function (el) {
      return { el: el, x: G.quickTo(el, 'x', { duration: .55, ease: 'power3' }), y: G.quickTo(el, 'y', { duration: .55, ease: 'power3' }), cx: 0, cy: 0 };
    });
    function measure() { movers.forEach(function (m) { var r = m.el.getBoundingClientRect(); m.cx = r.left + r.width / 2; m.cy = r.top + r.height / 2; }); }
    function push(px, py, strength) {
      movers.forEach(function (m) {
        var dx = m.cx - px, dy = m.cy - py, dist = Math.hypot(dx, dy) || 1, R = 170;
        var f = Math.max(0, (R - dist) / R);
        m.x(dx / dist * f * (strength || 30)); m.y(dy / dist * f * (strength || 30));
      });
    }
    function relax() { movers.forEach(function (m) { m.x(0); m.y(0); }); }
    field.addEventListener('pointerenter', measure);
    field.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') push(e.clientX, e.clientY); });
    field.addEventListener('pointerleave', relax);
    field.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') return;
      measure(); push(e.clientX, e.clientY, 42); setTimeout(relax, 650);
    });
    // Al tocar "CEO", todo tiembla (como el móvil de la portada)
    $('.ceo', stage).addEventListener('pointerenter', function () {
      G.to(inners, { rotation: function (i, el) { return (parseFloat(getComputedStyle(el).getPropertyValue('--r')) || 0) + G.utils.random(-7, 7); },
        duration: .07, repeat: 5, yoyo: true, ease: 'none', overwrite: 'auto' });
    });

    /* Velocidad: las líneas corren más cuanto más rápido haces scroll */
    var lines = $$('.speed__line', stage), vel = 0, speed = 1;
    var runs = lines.map(function (l) {
      var w = parseFloat(l.style.getPropertyValue('--w')) || 40;
      var t = G.fromTo(l, { xPercent: -w }, { xPercent: 100, duration: G.utils.random(1.8, 3.4), ease: 'none', repeat: -1 });
      t.progress(Math.random()); return t;
    });
    ST.create({ trigger: '.card-speed', start: 'top bottom', end: 'bottom top',
      onUpdate: function (self) { vel = Math.max(vel, Math.abs(self.getVelocity())); },
      onToggle: function (self) { runs.forEach(function (t) { self.isActive ? t.resume() : t.pause(); }); } });
    G.ticker.add(function () {
      var target = 1 + Math.min(vel / 450, 8);
      speed += (target - speed) * .08; vel *= .9;
      runs.forEach(function (t) { t.timeScale(speed); });
    });
  });

  /* ---------- Acto 02 · El Shindan ---------- */
  later('shindan', function () {
    G.from('.pill', { autoAlpha: 0, y: 18, scale: .96, duration: .6, stagger: .06, scrollTrigger: { trigger: '[data-pills]', start: 'top 85%', once: true } });
    var brace = $('.brace .marker');
    if (brace && hasDraw) {
      // se dibuja desde la punta (bajo "¿Cómo?") hacia los dos extremos
      ST.addEventListener('refreshInit', shapeBrace);
      // fracción del trazo donde está la punta: el primer punto que llega al fondo del SVG
      var tipAt = function () {
        var len = brace.getTotalLength(), bottom = $('.brace').viewBox.baseVal.height - 8, at = len * .13;
        for (var s = 0; s <= len; s += 4) { if (brace.getPointAtLength(s).y > bottom) { at = s; break; } }
        return (at / len * 100).toFixed(2) + '%';
      };
      G.fromTo(brace, { drawSVG: function () { var t = tipAt(); return t + ' ' + t; } }, { drawSVG: '0% 100%', ease: 'none',
        scrollTrigger: { trigger: '.brace', start: 'top 85%', end: 'top 45%', scrub: .6, invalidateOnRefresh: true } });
    }
    var tlHow = G.timeline({ scrollTrigger: { trigger: '.how', start: 'top 80%', once: true } });
    tlHow.from('.how__q p', { autoAlpha: 0, x: -20, duration: .7 });
    if (hasDraw) tlHow.from('.how__q .marker', { drawSVG: '0%', duration: .45, stagger: .15, ease: 'power2.inOut' }, '-=.3');

    // 10 días: la regla se llena con el scroll
    var days = $('[data-days]');
    if (days) {
      var fill = $('.days__fill', days), lis = $$('.days__list li', days);
      G.set(fill, { scaleX: 0 });
      ST.create({ trigger: days, start: 'top 75%', end: 'bottom 55%', scrub: .5,
        onUpdate: function (self) {
          G.set(fill, { scaleX: self.progress });
          var day = self.progress * 10;
          lis.forEach(function (li) { li.classList.toggle('is-on', day >= (+li.getAttribute('data-from')) - .6); });
        } });
    }

    // Informe: la nota cuenta y las barras crecen
    var rep = $('.doc--report');
    if (rep) {
      var n = $('[data-count]', rep), target = +n.getAttribute('data-count'), o = { v: 0 };
      var tl = G.timeline({ scrollTrigger: { trigger: rep, start: 'top 75%', once: true } });
      tl.to(o, { v: target, duration: 1.6, ease: 'power2.out', onUpdate: function () { n.textContent = Math.round(o.v); } }, .2)
        .from($$('.bar__fill', rep), { scaleX: 0, duration: 1.1, stagger: .07, ease: 'power3.out' }, .25)
        .from($$('.bar__val', rep), { autoAlpha: 0, duration: .4, stagger: .07 }, .5);
    }
    var plan = $('.doc--plan');
    if (plan) G.from($$('.plan__block li', plan), { autoAlpha: 0, x: -14, duration: .55, stagger: .07, scrollTrigger: { trigger: plan, start: 'top 75%', once: true } });
    if (hasDraw) G.from('.deliver__arrow .marker', { drawSVG: '0%', duration: .5, stagger: .15, ease: 'power2.inOut', scrollTrigger: { trigger: '.deliver__grid', start: 'top 70%', once: true } });
  });

  /* ---------- Acto 03 · WhatsApp ---------- */
  later('pocket', function () {
    G.from('.fade-lines span', { autoAlpha: 0, y: 26, duration: .9, stagger: .22, scrollTrigger: { trigger: '[data-fade]', start: 'top 85%', once: true } });
    G.from('.phone', { y: 80, rotation: 4, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.pocket__phone', start: 'top 80%', once: true } });
    G.fromTo('.pocket__halo', { yPercent: -40 }, { yPercent: -60, ease: 'none', scrollTrigger: { trigger: '.act--pocket', start: 'top bottom', end: 'bottom top', scrub: true } });
    // El teléfono sigue al cursor (solo ratón)
    var wrap = $('.pocket__phone'), ph = $('.phone');
    if (canHover && wrap && ph) {
      var rx = G.quickTo(ph, 'rotationX', { duration: .6, ease: 'power3' }), ry = G.quickTo(ph, 'rotationY', { duration: .6, ease: 'power3' });
      wrap.addEventListener('pointermove', function (e) {
        var r = wrap.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        ry(x * 12); rx(-y * 8);
      });
      wrap.addEventListener('pointerleave', function () { rx(0); ry(0); });
    }
  });

  /* ---------- Resto de secciones ---------- */
  later('misc', function () {
    G.from('.closing .watermark', { yPercent: 20, ease: 'none', scrollTrigger: { trigger: '.closing', start: 'top bottom', end: 'bottom top', scrub: true } });
    G.from('.footer .brand__mark', { yPercent: 40, autoAlpha: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.footer', start: 'top 85%', once: true } });
  });

  /* La portada se anima ya; el resto de escenas se preparan en los ratos libres
     del navegador, una por tarea, para no bloquear la primera pintura. */
  var idle = window.requestIdleCallback || function (cb) { return setTimeout(function () { cb({ timeRemaining: function () { return 8; } }); }, 60); };
  later('headings', headings);
  var fontsReady = d.fonts && d.fonts.ready ? d.fonts.ready : Promise.resolve();
  fontsReady.then(function () {
    (function pump() {
      var job = queue.shift();
      if (!job) { ST.refresh(); return; }
      idle(function () { safe(job[0], job[1]); pump(); }, { timeout: 500 });
    })();
  });
  window.addEventListener('load', function () { setTimeout(function () { ST.refresh(); }, 50); });
})();
