/* ==========================================================================
   Dineto · test de 3 minutos
   15 preguntas de sí o no (sí = bueno) en 3 bloques de 5, 5 de cualificación,
   datos y resultado. Ligero a propósito (sin GSAP): es la página de anuncios.
   ========================================================================== */
(function () {
  'use strict';
  var d = document;
  var D = window.Dineto || { cfg: {}, utm: {}, track: function () {}, send: function () { return Promise.resolve({ skipped: true }); }, store: null,
    waLink: function (t) { return 'https://wa.me/34647299239?text=' + encodeURIComponent(t); }, calUrl: function () { return ''; } };
  var cfg = D.cfg || {};
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ------------------------------------------------------------- contenido */
  var BLOCKS = [
    { id: 'tu', name: 'Tú', by: 'por ti',
      start: 'Hoy la empresa necesita tu firma para casi todo. En el Shindan miramos qué decisiones llegan a tu mesa y cuáles podrían resolverse sin ti, y salimos con una lista de qué delegar este mes y en quién.' },
    { id: 'numeros', name: 'Tus números', by: 'por tus números',
      start: 'Sin saber qué deja cada cliente ni cuánta caja habrá en tres meses, cada decisión es una apuesta. En el Shindan calculamos el margen real por producto y por cliente, y te dejamos un cuadro de una página para leer cada mes.' },
    { id: 'equipo', name: 'Tu equipo y tu futuro', by: 'por tu equipo y tu futuro',
      start: 'La empresa funciona, pero el futuro no está escrito ni repartido. En el Shindan definimos quién decide qué, qué se puede automatizar y un plan a doce meses con responsables y fechas.' }
  ];
  var QUESTIONS = [
    { b: 0, t: '¿Te has ido una semana de vacaciones este año sin mirar el correo?' },
    { b: 0, t: '¿Alguien de tu equipo puede aprobar un gasto importante sin preguntarte?' },
    { b: 0, t: '¿Tus clientes más importantes tratan con alguien que no eres tú?' },
    { b: 0, t: '¿Están por escrito las tareas clave de la empresa?' },
    { b: 0, t: '¿Dedicas cada semana al menos medio día a pensar en el futuro, no a apagar fuegos?' },
    { b: 1, t: '¿Sabes, sin preguntar a nadie, cuánta caja tendrás dentro de tres meses?' },
    { b: 1, t: '¿Conoces el margen real de cada producto o servicio?' },
    { b: 1, t: '¿Cobras de media en menos de 60 días?' },
    { b: 1, t: '¿Ningún cliente supone más del 20 % de tu facturación?' },
    { b: 1, t: '¿Revisas cada mes una cuenta de resultados que entiendes?' },
    { b: 2, t: '¿Cada persona clave sabe qué se espera de ella y cómo se mide?' },
    { b: 2, t: '¿Usáis la IA o la automatización en el trabajo de cada día?' },
    { b: 2, t: '¿Tienes un plan escrito para los próximos doce meses?' },
    { b: 2, t: 'Si mañana te fueras, ¿alguien sabría dirigir la empresa?' },
    { b: 2, t: '¿Sabes cuánto valdría hoy tu empresa si quisieras venderla?' }
  ];
  var FIT_REVENUE = ['0,5 – 1 M€', '1 – 2 M€', '2 – 4 M€'];
  var FIT_ROLE = ['Dueño/a o socio/a', 'CEO o director/a general'];
  var QUAL = [
    { id: 'facturacion', t: '¿Cuánto factura tu empresa al año?', opts: ['Menos de 0,5 M€', '0,5 – 1 M€', '1 – 2 M€', '2 – 4 M€', 'Más de 4 M€'] },
    { id: 'cambio', t: 'Si dentro de un año tu empresa hubiera cambiado una cosa, ¿cuál querrías que fuera?', opts: ['Depender menos de mí', 'Ganar más con lo que ya vendo', 'Vender más', 'Tener el equipo adecuado', 'Prepararla para venderla o para el relevo'] },
    { id: 'impide', t: '¿Qué te lo impide hoy?', opts: ['No tengo tiempo', 'No sé por dónde empezar', 'Me faltan datos', 'Me falta la persona adecuada', 'Lo he intentado y no ha funcionado'] },
    { id: 'seguir', t: '¿Cómo prefieres seguir?', opts: ['Una llamada de 30 minutos', 'Que me escribáis por WhatsApp', 'Solo quiero mi resultado por correo'] },
    { id: 'algo_mas', t: '¿Algo más que debamos saber?', text: true }
  ];
  var MESSAGES = [
    [0, 5, 'Hoy tu empresa depende casi por completo de ti.'],
    [6, 10, 'Tu empresa aguantaría unos días sin ti. No un mes.'],
    [11, 15, 'Vas por buen camino. Veamos qué te falta para que valga más.']
  ];
  var NQ = QUESTIONS.length, NQUAL = QUAL.length, FORM_STEP = NQ + NQUAL, TOTAL = FORM_STEP + 1;

  /* --------------------------------------------------------------- estado */
  var KEY = 'dineto_test_v1';
  function load() { return (D.store && D.store.get(KEY)) || null; }
  function save() { if (D.store) D.store.set(KEY, state); }
  var state = load() || { step: 0, yn: {}, qual: {}, contact: null, done: false, started: false };

  var intro = $('[data-screen="intro"]'), run = $('[data-screen="run"]'), res = $('[data-screen="result"]');
  var card = $('[data-card]'), out = $('[data-result]'), meta = $('[data-meta]');
  var busy = false;

  function show(screen) {
    [intro, run, res].forEach(function (s) { s.hidden = s !== screen; });
    d.body.classList.toggle('is-result', screen === res);
    d.body.classList.toggle('paper-bg', screen === res);
    window.scrollTo(0, 0);
  }

  function swap(html, focusSel) {
    function put() {
      card.innerHTML = html;
      var f = focusSel && $(focusSel, card); if (f) f.focus({ preventScroll: true });
    }
    if (reduce || !card.animate || !card.innerHTML) { put(); return; }
    busy = true;
    var a = card.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-10px)' }], { duration: 150, easing: 'ease-in', fill: 'forwards' });
    a.onfinish = function () {
      put(); a.cancel();
      card.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)' });
      busy = false;
    };
  }

  function top(step) {
    var label, count;
    if (step < NQ) { var b = QUESTIONS[step].b; label = 'Bloque ' + (b + 1) + ' de 3 · ' + BLOCKS[b].name; count = 'Pregunta ' + (step + 1) + ' de ' + NQ; }
    else if (step < FORM_STEP) { label = 'Sobre tu empresa'; count = (step - NQ + 1) + ' de ' + NQUAL; }
    else { label = 'Último paso'; count = ''; }
    var pct = Math.round(step / TOTAL * 100);
    return '<div class="t-card__top"><span>' + label + '</span><span>' + count + '</span></div>' +
      '<div class="t-progress" role="progressbar" aria-label="Progreso del test" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><span style="width:' + Math.max(pct, 3) + '%"></span></div>';
  }
  function nav(step, hint) {
    return '<div class="t-nav"><button class="t-back" type="button" data-back' + (step === 0 ? ' disabled' : '') + '><span aria-hidden="true">←</span> Anterior</button>' +
      (hint ? '<span class="t-hint">' + hint + '</span>' : '') + '</div>';
  }

  /* ------------------------------------------------------------- pantallas */
  function render(step) {
    state.step = step; save();
    var html;
    if (step < NQ) {
      var q = QUESTIONS[step], v = state.yn[step];
      html = '<div class="t-stage">' + top(step) +
        '<h2 class="t-card__q t-q" id="q-t" tabindex="-1">' + esc(q.t) + '</h2>' +
        '<div class="t-yn" role="group" aria-labelledby="q-t">' +
        '<button type="button" data-yn="1" aria-pressed="' + (v === true) + '">Sí <kbd aria-hidden="true">S</kbd></button>' +
        '<button type="button" data-yn="0" aria-pressed="' + (v === false) + '">No <kbd aria-hidden="true">N</kbd></button></div>' +
        nav(step, 'También puedes pulsar S o N') + '</div>';
    } else if (step < FORM_STEP) {
      var k = QUAL[step - NQ], cur = state.qual[k.id];
      if (k.text) {
        html = '<div class="t-stage">' + top(step) +
          '<h2 class="t-card__q t-q" id="q-t" tabindex="-1">' + esc(k.t) + '</h2>' +
          '<div class="t-text"><label class="sr-only" for="t-more">' + esc(k.t) + ' (opcional)</label>' +
          '<textarea id="t-more" maxlength="1200" placeholder="Opcional. Por ejemplo: somos dos socios y uno quiere jubilarse en 2028.">' + esc(cur || '') + '</textarea></div>' +
          '<div class="t-row"><button class="btn btn--deep btn--lg" type="button" data-next>Continuar <span class="arr" aria-hidden="true">→</span></button></div>' +
          nav(step) + '</div>';
      } else {
        html = '<div class="t-stage">' + top(step) +
          '<h2 class="t-card__q t-q" id="q-t" tabindex="-1">' + esc(k.t) + '</h2>' +
          '<div class="t-opts" role="group" aria-labelledby="q-t">' +
          k.opts.map(function (o) { return '<button class="t-opt" type="button" data-opt="' + esc(o) + '" aria-pressed="' + (cur === o) + '">' + esc(o) + '</button>'; }).join('') +
          '</div>' + nav(step) + '</div>';
      }
    } else {
      var c = state.contact || {}, wantsWa = state.qual.seguir === 'Que me escribáis por WhatsApp';
      html = '<div class="t-stage">' + top(step) +
        '<div class="t-ready" style="margin-top:28px"><span class="seal" aria-hidden="true">診</span><p class="label" style="color:var(--deep-soft)">Tu resultado está listo</p></div>' +
        '<h2 class="t-card__q t-card__q--sm t-q" id="q-t" tabindex="-1" style="min-height:0;margin-top:18px">¿A quién se lo enseñamos?</h2>' +
        '<p class="t-sub">' + (cfg.testEndpoint ? 'Lo verás ahora en pantalla y te lo enviamos también por correo.' : 'Lo verás ahora mismo en pantalla.') + '</p>' +
        '<form class="t-form" novalidate data-form>' +
        '<div class="form__row"><div class="field"><label for="c-name">Nombre</label><input id="c-name" name="nombre" autocomplete="given-name" required value="' + esc(c.nombre) + '"></div>' +
        '<div class="field"><label for="c-email">Correo</label><input id="c-email" name="email" type="email" inputmode="email" autocomplete="email" required value="' + esc(c.email) + '"></div></div>' +
        '<div class="form__row"><div class="field"><label for="c-company">Empresa</label><input id="c-company" name="empresa" autocomplete="organization" required value="' + esc(c.empresa) + '"></div>' +
        '<div class="field"><label for="c-role">Cargo</label><select id="c-role" name="cargo" required><option value="">Elige uno</option>' +
        FIT_ROLE.concat(['Director/a de área', 'Otro']).map(function (r) { return '<option' + (c.cargo === r ? ' selected' : '') + '>' + r + '</option>'; }).join('') + '</select></div></div>' +
        '<div class="field"><label for="c-phone">Teléfono ' + (wantsWa ? '<small>(para escribirte por WhatsApp)</small>' : '<small>(opcional)</small>') + '</label><input id="c-phone" name="telefono" type="tel" inputmode="tel" autocomplete="tel"' + (wantsWa ? ' required' : '') + ' value="' + esc(c.telefono) + '"></div>' +
        '<label class="check"><input type="checkbox" name="privacidad" required> <span>He leído la <a href="../legal/#privacidad" target="_blank" rel="noopener">política de privacidad</a> y acepto que Dineto use estos datos para enviarme mi resultado y contactarme sobre él.</span></label>' +
        '<button class="btn btn--deep btn--lg" type="submit">Ver mi resultado <span class="arr" aria-hidden="true">→</span></button>' +
        '</form>' + nav(step) + '</div>';
    }
    swap(html, '.t-q');
  }

  function next() { if (state.step < FORM_STEP) render(state.step + 1); }
  function back() { if (state.step > 0 && !busy) render(state.step - 1); }

  card.addEventListener('click', function (e) {
    var t = e.target;
    var yn = t.closest('[data-yn]'), opt = t.closest('[data-opt]');
    if (t.closest('[data-back]')) { back(); return; }
    if (busy) return;
    if (yn) {
      state.yn[state.step] = yn.getAttribute('data-yn') === '1';
      $$('[data-yn]', card).forEach(function (b) { b.setAttribute('aria-pressed', String(b === yn)); });
      if (state.step === 4 || state.step === 9 || state.step === 14) D.track('test_block_done', { bloque: QUESTIONS[state.step].b + 1 });
      setTimeout(next, reduce ? 0 : 170);
    } else if (opt) {
      var k = QUAL[state.step - NQ];
      state.qual[k.id] = opt.getAttribute('data-opt');
      $$('[data-opt]', card).forEach(function (b) { b.setAttribute('aria-pressed', String(b === opt)); });
      setTimeout(next, reduce ? 0 : 170);
    } else if (t.closest('[data-next]')) {
      var ta = $('#t-more', card); state.qual.algo_mas = ta ? ta.value.trim() : '';
      next();
    }
  });
  card.addEventListener('input', function (e) { if (e.target.id === 't-more') { state.qual.algo_mas = e.target.value; save(); } });
  d.addEventListener('keydown', function (e) {
    if (run.hidden || busy || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || '')) return;
    if (state.step < NQ) {
      var k = e.key.toLowerCase();
      if (k === 's' || k === 'n') { var b = $('[data-yn="' + (k === 's' ? 1 : 0) + '"]', card); if (b) b.click(); }
    }
  });

  /* --------------------------------------------------------- datos y envío */
  card.addEventListener('submit', function (e) {
    var form = e.target.closest('[data-form]'); if (!form) return;
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); var bad = form.querySelector(':invalid'); if (bad) bad.focus(); return; }
    var fd = new FormData(form), c = {};
    fd.forEach(function (v, k) { c[k] = typeof v === 'string' ? v.trim() : v; });
    c.privacidad = true;
    state.contact = c;
    var r = score();
    state.done = true; state.result = r; save();
    var payload = {
      tipo: 'test_shindan', fecha: new Date().toISOString(), pagina: location.href,
      contacto: c,
      notas: { total: r.total, tu: r.blocks[0], numeros: r.blocks[1], equipo: r.blocks[2] },
      peor_bloque: BLOCKS[r.worst].name, mensaje: r.message, encaja: r.fit,
      cualificacion: state.qual,
      respuestas: QUESTIONS.map(function (q, i) { return { n: i + 1, bloque: BLOCKS[q.b].name, pregunta: q.t, respuesta: state.yn[i] ? 'Sí' : 'No' }; }),
      utm: D.utm || {}
    };
    var sent = D.send(cfg.testEndpoint, payload).then(function (x) { return x; }).catch(function (err) {
      if (window.console) console.warn('[dineto] envío del test', err); return { ok: false };
    });
    D.track('test_complete', { nota: r.total, encaja: r.fit ? 'si' : 'no', peor: BLOCKS[r.worst].id });
    D.track('lead', { origen: 'test', encaja: r.fit ? 'si' : 'no' });
    showResult(sent);
  });

  function score() {
    var blocks = [0, 0, 0];
    QUESTIONS.forEach(function (q, i) { if (state.yn[i] === true) blocks[q.b] += 1; });
    var total = blocks[0] + blocks[1] + blocks[2], worst = 0;
    for (var i = 1; i < 3; i++) if (blocks[i] < blocks[worst]) worst = i;
    var message = MESSAGES.filter(function (m) { return total >= m[0] && total <= m[1]; })[0][2];
    var fit = FIT_REVENUE.indexOf(state.qual.facturacion) > -1 && FIT_ROLE.indexOf((state.contact || {}).cargo) > -1;
    return { total: total, blocks: blocks, worst: worst, message: message, fit: fit };
  }

  /* ------------------------------------------------------------ resultado */
  function showResult(sentPromise) {
    var r = state.result || score(), c = state.contact || {}, w = BLOCKS[r.worst];
    var first = (c.nombre || '').split(' ')[0];
    var waText = 'Hola, soy ' + (c.nombre || '') + ' de ' + (c.empresa || '') + '. He hecho el test de Dineto: ' + r.total + '/15 (Tú ' + r.blocks[0] + '/5, Números ' + r.blocks[1] + '/5, Equipo ' + r.blocks[2] + '/5). Me gustaría revisarlo con un socio.';
    var cal = D.calUrl({ name: c.nombre, email: c.email, notes: 'Test Shindan: ' + r.total + '/15' });
    var cta = cal
      ? '<button class="btn btn--deep btn--lg" type="button" data-book>Revisar mi resultado con un socio <span class="arr" aria-hidden="true">→</span></button>'
      : '<a class="btn btn--deep btn--lg" href="' + D.waLink(waText) + '" target="_blank" rel="noopener" data-book>Revisar mi resultado con un socio <span class="arr" aria-hidden="true">→</span></a>';
    out.innerHTML =
      '<div class="r-score">' +
        '<span class="seal r-stamp" aria-hidden="true">診</span>' +
        '<p class="label">Tu resultado · Test Shindan</p>' +
        '<p class="r-num" aria-label="' + r.total + ' de 15"><strong data-n>' + r.total + '</strong><span>/15</span></p>' +
        '<p class="r-msg">' + esc(r.message) + '</p>' +
        '<div class="r-blocks">' + BLOCKS.map(function (b, i) {
          return '<div class="r-block' + (i === r.worst ? ' is-low' : '') + '"><span>' + b.name + '</span>' +
            '<span class="r-block__track" aria-hidden="true"><span class="r-block__fill" style="transform:scaleX(' + (reduce ? r.blocks[i] / 5 : 0) + ')" data-v="' + (r.blocks[i] / 5) + '"></span></span>' +
            '<span class="r-block__val">' + r.blocks[i] + '/5</span></div>';
        }).join('') + '</div>' +
      '</div>' +
      '<div class="r-side">' +
        '<p class="label">Por dónde empezaríamos</p>' +
        '<h2 id="r-title" tabindex="-1">' + (first ? esc(first) + ', empezaríamos ' : 'Empezaríamos ') + w.by + '.</h2>' +
        '<p class="lead">' + w.start + '</p>' +
        '<div class="r-start"><h3>Lo vemos juntos en 30 minutos.</h3><p>Un socio repasa tu resultado contigo y te dice qué miraríamos primero en tu empresa. Si no encajamos, te lo decimos en la misma llamada.</p></div>' +
        '<div class="r-cta">' + cta + '<small>30 minutos · sin compromiso · por teléfono o videollamada</small></div>' +
        '<div class="r-cal" data-cal></div>' +
        '<p class="r-sent" data-sent></p>' +
        '<div class="r-links"><a href="../">Conoce el Shindan</a><button type="button" data-again>Repetir el test</button></div>' +
      '</div>';
    if (meta) meta.textContent = 'Tu resultado';
    show(res);
    var h = $('#r-title', out); if (h) h.focus({ preventScroll: true });

    // Movimiento: sello, cifra y barras
    if (!reduce) {
      var stamp = $('.r-stamp', out);
      if (stamp.animate) stamp.animate([{ transform: 'scale(1.9) rotate(-24deg)', opacity: 0 }, { transform: 'scale(.92) rotate(-4deg)', opacity: 1, offset: .7 }, { transform: 'scale(1) rotate(-6deg)', opacity: 1 }], { duration: 650, delay: 350, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
      var n = $('[data-n]', out), t0 = null, target = r.total;
      requestAnimationFrame(function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1100); n.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); });
      setTimeout(function () { $$('.r-block__fill', out).forEach(function (f, i) { setTimeout(function () { f.style.transform = 'scaleX(' + f.getAttribute('data-v') + ')'; }, i * 120); }); }, 250);
    }

    var book = $('[data-book]', out);
    book.addEventListener('click', function () {
      D.track('booking_click', { origen: 'test', nota: r.total });
      if (cal) {
        $('[data-cal]', out).innerHTML = '<iframe class="cal-embed" title="Reservar 30 minutos con un socio de Dineto" src="' + cal + '"></iframe>';
        $('[data-cal]', out).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      }
    });
    $('[data-again]', out).addEventListener('click', function () {
      state = { step: 0, yn: {}, qual: {}, contact: state.contact, done: false, started: true };
      save(); if (meta) meta.textContent = 'Test Shindan · gratis';
      show(run); card.innerHTML = ''; render(0);
    });
    if (sentPromise && cfg.testEndpoint) sentPromise.then(function (x) {
      var s = $('[data-sent]', out); if (s && x && x.ok) s.textContent = 'También te lo hemos enviado a ' + c.email + '.';
    });
  }

  /* --------------------------------------------------------------- entrada */
  var start = $('[data-start]'), restart = $('[data-restart]');
  function begin(fresh) {
    if (fresh) state = { step: 0, yn: {}, qual: {}, contact: null, done: false, started: true };
    if (!state.started) { state.started = true; D.track('test_start', {}); }
    show(run); card.innerHTML = ''; render(state.step || 0);
  }
  start.addEventListener('click', function () { begin(false); });
  restart.addEventListener('click', function () { begin(true); D.track('test_start', { reinicio: true }); });

  if (state.done && state.result) { showResult(null); }
  else if (state.started && state.step > 0) {
    start.innerHTML = 'Continuar donde lo dejaste <span class="arr" aria-hidden="true">→</span>';
    restart.hidden = false;
  }

  // Tarjeta de muestra en la entrada: rota tres preguntas reales
  (function demo() {
    var q = $('[data-demo-q]'), n = $('[data-demo-n]'), bar = $('[data-demo-bar]');
    if (!q || reduce) return;
    var i = 0, picks = [0, 5, 13];
    setInterval(function () {
      if (intro.hidden) return;
      i = (i + 1) % picks.length; var k = picks[i];
      q.style.opacity = 0;
      setTimeout(function () {
        q.textContent = QUESTIONS[k].t; n.textContent = 'Pregunta ' + (k + 1) + ' de 15';
        bar.style.width = Math.round((k + 1) / TOTAL * 100) + '%';
        q.parentNode.firstElementChild.firstElementChild.textContent = 'Bloque ' + (QUESTIONS[k].b + 1) + ' de 3 · ' + BLOCKS[QUESTIONS[k].b].name;
        q.style.opacity = 1;
      }, 350);
    }, 3400);
  })();

  $$('[data-year]').forEach(function (y) { y.textContent = new Date().getFullYear(); });
})();
