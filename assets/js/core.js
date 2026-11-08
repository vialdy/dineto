/* ==========================================================================
   Dineto · núcleo compartido (web y landing del test)
   --------------------------------------------------------------------------
   CONFIGURACIÓN: rellenad estos valores al conectar las herramientas.
   Mientras un campo esté vacío, la web usa una alternativa que funciona
   (WhatsApp para reservar, sin analítica, sin píxeles).
   ========================================================================== */
window.DINETO_CONFIG = Object.assign({
  whatsapp: '34647299239',          // número de dineto.es, sin "+"
  email: 'hola@dineto.es',

  // Agenda (Cal.com). Ej.: 'dineto/30min'. Vacío = el botón abre WhatsApp.
  calLink: '',
  calOrigin: 'https://cal.com',

  // Webhooks que reciben los datos (HubSpot, Make, Zapier, n8n...). POST JSON.
  leadEndpoint: '',                 // formulario "Hablemos 30 minutos"
  testEndpoint: '',                 // resultado del test (+ correo y tareas en el CRM)

  // Analítica sin cookies
  plausibleDomain: '',              // ej. 'dineto.es'
  plausibleSrc: 'https://plausible.io/js/script.tagged-events.js',

  // Píxeles de anuncios: solo se cargan si el usuario acepta
  linkedinPartnerId: '',
  metaPixelId: ''
}, window.DINETO_CONFIG || {});

(function () {
  'use strict';
  var cfg = window.DINETO_CONFIG;
  var store = {
    get: function (k, s) { try { return JSON.parse((s || localStorage).getItem(k)); } catch (e) { return null; } },
    set: function (k, v, s) { try { (s || localStorage).setItem(k, JSON.stringify(v)); } catch (e) {} },
    del: function (k, s) { try { (s || localStorage).removeItem(k); } catch (e) {} }
  };

  /* ---------- UTM y origen del anuncio (se guardan la primera vez) ---------- */
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid', 'li_fat_id'];
  function readUtm() {
    var p = new URLSearchParams(location.search), found = {}, any = false;
    UTM_KEYS.forEach(function (k) { var v = p.get(k); if (v) { found[k] = v.slice(0, 200); any = true; } });
    if (any) { found.landing = location.pathname; found.ts = new Date().toISOString(); store.set('dineto_utm', found, sessionStorage); }
    return store.get('dineto_utm', sessionStorage) || {};
  }
  var utm = readUtm();

  /* ---------- Analítica ---------- */
  function loadScript(src, attrs) {
    var s = document.createElement('script'); s.async = true; s.src = src;
    Object.keys(attrs || {}).forEach(function (k) { s.setAttribute(k, attrs[k]); });
    document.head.appendChild(s); return s;
  }
  if (cfg.plausibleDomain) {
    window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
    loadScript(cfg.plausibleSrc, { defer: '', 'data-domain': cfg.plausibleDomain });
  }

  var consent = store.get('dineto_consent'); // 'all' | 'necessary' | null
  var hasPixels = !!(cfg.linkedinPartnerId || cfg.metaPixelId);

  function loadPixels() {
    if (cfg.linkedinPartnerId && !window._linkedin_data_partner_ids) {
      window._linkedin_partner_id = cfg.linkedinPartnerId;
      window._linkedin_data_partner_ids = [cfg.linkedinPartnerId];
      loadScript('https://snap.licdn.com/li.lms-analytics/insight.min.js');
    }
    if (cfg.metaPixelId && !window.fbq) {
      var n = window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
      loadScript('https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', cfg.metaPixelId); window.fbq('track', 'PageView');
    }
  }

  function track(name, props) {
    props = props || {};
    try { if (window.plausible) window.plausible(name, { props: props }); } catch (e) {}
    if (consent === 'all') {
      try {
        if (window.fbq) {
          var map = { lead: 'Lead', test_complete: 'CompleteRegistration', test_start: 'StartTrial', booking_click: 'Schedule' };
          window.fbq(map[name] ? 'track' : 'trackCustom', map[name] || name, props);
        }
      } catch (e) {}
    }
    if (window.DINETO_DEBUG) console.info('[dineto] evento', name, props);
  }

  /* ---------- Envío de datos al CRM ---------- */
  function send(endpoint, payload) {
    if (!endpoint) return Promise.resolve({ ok: false, skipped: true });
    return fetch(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), keepalive: true, mode: 'cors'
    }).then(function (r) { return { ok: r.ok, status: r.status }; });
  }

  function waLink(text) {
    return 'https://wa.me/' + cfg.whatsapp + '?text=' + encodeURIComponent(text);
  }

  function calUrl(prefill) {
    if (!cfg.calLink) return '';
    var u = new URL(cfg.calOrigin.replace(/\/$/, '') + '/' + cfg.calLink);
    u.searchParams.set('embed', 'true'); u.searchParams.set('theme', 'light'); u.searchParams.set('layout', 'month_view');
    Object.keys(prefill || {}).forEach(function (k) { if (prefill[k]) u.searchParams.set(k, prefill[k]); });
    return u.toString();
  }

  /* ---------- Banner de consentimiento (solo si hay píxeles) ---------- */
  function consentBanner() {
    if (!hasPixels) return;
    if (consent === 'all') { loadPixels(); return; }
    if (consent === 'necessary') return;
    var box = document.createElement('div');
    box.className = 'consent'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Cookies');
    box.innerHTML = '<p>Usamos cookies de LinkedIn y Meta para medir nuestros anuncios. Solo se activan si aceptas. <a href="' +
      (document.documentElement.dataset.root || '') + 'legal/#cookies">Más información</a>.</p>' +
      '<div class="consent__actions"><button class="btn btn--deep" data-c="all">Aceptar</button>' +
      '<button class="btn btn--ghost" data-c="necessary">Solo necesarias</button></div>';
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-c]'); if (!b) return;
      consent = b.getAttribute('data-c'); store.set('dineto_consent', consent);
      if (consent === 'all') loadPixels();
      box.remove();
    });
    document.body.appendChild(box);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', consentBanner); else consentBanner();

  window.Dineto = { cfg: cfg, utm: utm, store: store, track: track, send: send, waLink: waLink, calUrl: calUrl };
})();
