/* Ferari Impianti — comportamento della pagina. Nessuna libreria, nessun tracciamento. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement, body = doc.body;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }

  /* ---------- titoli spezzati in parole (animazione di comparsa) ---------- */
  function spezza(el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = doc.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(' ')); return; }
            var w = doc.createElement('span'); w.className = 'w';
            var s = doc.createElement('span'); s.textContent = p; s.style.setProperty('--i', i++);
            w.appendChild(s); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) { walk(n); }
      });
    })(el);
  }
  if (!reduce) $$('[data-split]').forEach(spezza);

  /* ---------- caricamento ---------- */
  var loader = $('#loader');
  var visto = false;
  try { visto = sessionStorage.getItem('ferari_intro') === '1'; } catch (e) { /* niente */ }
  var finito = false;
  function pronto() {
    if (loader && !reduce) {
      setTimeout(function () {
        body.classList.remove('is-loading'); body.classList.add('is-ready'); finito = true;
        loader.classList.add('is-done'); setTimeout(function () { loader.setAttribute('hidden', ''); }, 1300);
      }, 0);
    } else {
      body.classList.remove('is-loading'); body.classList.add('is-ready'); finito = true;
      if (loader) loader.setAttribute('hidden', '');
    }
  }
  if (!loader || reduce) {
    if (loader) loader.setAttribute('hidden', '');
    pronto();
  } else {
    body.classList.add('is-loading');
    setTimeout(pronto, 1050);
  }

  /* ---------- cursore a mirino ---------- */
  var cur = $('#cur');
  if (cur && finePointer && !reduce) {
    root.classList.add('has-cur');
    var cx = -100, cy = -100, tx = -100, ty = -100;
    window.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY; cur.classList.remove('is-hide');
      cur.classList.toggle('is-link', !!(e.target.closest && e.target.closest('a, button, summary, [role="tab"]')));
    }, { passive: true });
    doc.addEventListener('pointerleave', function () { cur.classList.add('is-hide'); });
    (function loop() {
      cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
      cur.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      requestAnimationFrame(loop);
    })();
    /* pulsanti che seguono leggermente il puntatore */
    $$('.btn-lg, .btn-amber').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.12).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.22).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  /* ---------- testata, barra di chiamata ---------- */
  var header = $('#header'), dock = $('#dock');
  var mark = $('#heroMark');
  function onScroll() {
    var y = window.pageYOffset || root.scrollTop;
    if (header) header.classList.toggle('is-scrolled', y > 24);
    if (dock) dock.classList.toggle('is-on', y > 560);
    var tot = Math.max(1, root.scrollHeight - window.innerHeight); root.style.setProperty('--sp', Math.min(1, y / tot).toFixed(4));
    if (mark && !reduce && y < window.innerHeight * 1.4) mark.style.transform = 'translate3d(0,' + (y * 0.22).toFixed(1) + 'px,0)';
    rail();
    if (typeof aggiornaLab === 'function') aggiornaLab();
  }

  /* menu a schermo intero */
  var drawer = $('#drawer'), openBtn = $('#menuOpen'), closeBtn = $('#menuClose');
  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (openBtn) openBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    body.style.overflow = open ? 'hidden' : '';
    if (open && closeBtn) closeBtn.focus(); else if (!open && openBtn) openBtn.focus({ preventScroll: true });
  }
  if (openBtn) openBtn.addEventListener('click', function () { setDrawer(true); });
  if (closeBtn) closeBtn.addEventListener('click', function () { setDrawer(false); });
  $$('#drawer a').forEach(function (a) { a.addEventListener('click', function () { setDrawer(false); }); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') setDrawer(false); });

  /* ---------- comparsa allo scorrimento ---------- */
  var rv = $$('.rv, [data-split]');
  if (reduce || !('IntersectionObserver' in window)) {
    rv.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) en.target.classList.add('in'); else en.target.classList.remove('in'); });
    }, { rootMargin: '0px 0px -9% 0px', threshold: 0.08 });
    rv.forEach(function (el) { io.observe(el); });
  }

  /* ---------- numeri che salgono ---------- */
  function conta(el) {
    var target = parseInt(el.getAttribute('data-n'), 10) || 0;
    if (reduce) { el.textContent = String(target); return; }
    var start = null, dur = 1900, tok = (el._t = (el._t || 0) + 1);
    (function frame(now) {
      if (el._t !== tok) return;
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / dur);
      el.textContent = String(Math.round((1 - Math.pow(1 - t, 3)) * target));
      if (t < 1) requestAnimationFrame(frame); else el.textContent = String(target);
    })(performance.now());
  }
  var nums = $$('[data-n]');
  if (nums.length) {
    if (!('IntersectionObserver' in window)) { nums.forEach(conta); }
    else {
      var io2 = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) conta(en.target); else { en.target._t = (en.target._t || 0) + 1; en.target.textContent = '0'; } });
      }, { threshold: 0.5 });
      nums.forEach(function (el) { io2.observe(el); });
    }
  }

  /* ---------- l'eroe riparte ogni volta che ci si torna ---------- */
  var heroEl = $('.hero');
  if (heroEl && !reduce && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!finito) return;
        if (!en.isIntersecting) body.classList.remove('is-ready');
        else if (!body.classList.contains('is-ready')) setTimeout(function () { body.classList.add('is-ready'); }, 60);
      });
    }, { threshold: 0 }).observe(heroEl);
  }

  /* ---------- eroe: il disegno segue il puntatore ---------- */
  var hero = $('.hero'), grid = $('.hero-grid'), bp = $('#blueprint');
  if (hero && !reduce && finePointer) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      if (grid) grid.style.transform = 'translate3d(' + (x * -26).toFixed(1) + 'px,' + (y * -26).toFixed(1) + 'px,0)';
      if (bp) { bp.style.setProperty('--px', (x * 2).toFixed(3)); bp.style.setProperty('--py', (y * 2).toFixed(3)); }
    });
    hero.addEventListener('pointerleave', function () { if (bp) { bp.style.setProperty('--px', 0); bp.style.setProperty('--py', 0); } });
  }

  /* ---------- sezione dell'impianto ---------- */
  var SYS = {
    el: { t: 'Elettricista', p: 'Guasti, black-out, quadri e nuovi impianti.', wa: 'Buongiorno, mi serve un elettricista.' },
    id: { t: 'Idraulico', p: 'Perdite, scarichi, allagamenti.', wa: 'Buongiorno, mi serve un idraulico.' },
    cl: { t: 'Climatizzazione', p: 'Installazione e manutenzione.', wa: 'Buongiorno, vorrei informazioni sulla climatizzazione.' },
    ca: { t: 'Caldaie e riscaldamento', p: 'Caldaie, scaldabagni, radiatori.', wa: 'Buongiorno, vorrei informazioni su caldaie e riscaldamento.' },
    ci: { t: 'Civili e industriali', p: 'Per la casa, i condomini e le attività.', wa: 'Buongiorno, vorrei informazioni su un impianto civile o industriale.' },
    pi: { t: 'Pronto intervento 24/7', p: 'Di notte, nei weekend, nei festivi.', wa: 'Buongiorno, ho bisogno di un intervento urgente.' }
  };
  var ORDINE = ['el', 'id', 'cl', 'ca', 'ci', 'pi'];
  var lab = $('#lab'), tabs = $$('.sys-btn'), info = $('#sysInfo');
  var auto = null, manuale = false;
  function setSys(k, utente) {
    if (!lab || !SYS[k]) return;
    lab.setAttribute('data-active', k);
    tabs.forEach(function (b) { var on = b.getAttribute('data-sys') === k; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
    $('#sysTitle').textContent = SYS[k].t; $('#sysText').textContent = SYS[k].p;
    $('#sysWa').href = 'https://wa.me/393926322720?text=' + encodeURIComponent(SYS[k].wa);
    info.classList.remove('swap'); void info.offsetWidth; info.classList.add('swap');
    var lista = $('#sysList'), sel = $('#tab-' + k);
    if (lista && sel && lista.scrollWidth > lista.clientWidth + 4) lista.scrollTo({ left: sel.offsetLeft - 20, behavior: reduce ? 'auto' : 'smooth' });
    if (utente) { manuale = true; if (auto) { clearInterval(auto); auto = null; } }
  }
  tabs.forEach(function (b) {
    b.addEventListener('keydown', function (e) {
      var i = ORDINE.indexOf(b.getAttribute('data-sys')), n = -1;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (i + 1) % ORDINE.length;
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (i + ORDINE.length - 1) % ORDINE.length;
      if (n >= 0) { e.preventDefault(); vaiA(ORDINE[n]); $('#tab-' + ORDINE[n]).focus(); }
    });
  });
  /* lo scorrimento sceglie il servizio: la sezione resta ferma e cambia categoria e disegno */
  var track = $('#labTrack'), stick = $('.lab-stick');
  function posizione() {
    var hh = header ? header.offsetHeight : 76, r = track.getBoundingClientRect();
    return { hh: hh, top: r.top + (window.pageYOffset || root.scrollTop), range: Math.max(1, r.height - stick.offsetHeight) };
  }
  function aggiornaLab() {
    if (!track || !lab) return;
    var hh = header ? header.offsetHeight : 76, r = track.getBoundingClientRect();
    var range = Math.max(1, r.height - stick.offsetHeight);
    body.classList.toggle('lab-on', r.top < window.innerHeight * 0.9 && r.bottom > window.innerHeight * 0.2);
    var p = (hh - r.top) / range;
    if (p < -0.02 || p > 1.02) return;
    var i = Math.max(0, Math.min(ORDINE.length - 1, Math.floor(Math.max(0, Math.min(0.9999, p)) * ORDINE.length)));
    if (lab.getAttribute('data-active') !== ORDINE[i]) setSys(ORDINE[i], false);
  }
  function vaiA(k) {
    var i = ORDINE.indexOf(k), q = posizione();
    setSys(k, true);
    window.scrollTo({ top: q.top - q.hh + ((i + 0.5) / ORDINE.length) * q.range, behavior: reduce ? 'auto' : 'smooth' });
  }
  tabs.forEach(function (b) {
    var k = b.getAttribute('data-sys');
    b.onclick = null;
    b.addEventListener('click', function () { vaiA(k); });
  });

  /* ---------- linea dei passaggi ---------- */
  var railEl = $('#rail');
  function rail() {
    if (!railEl) return;
    var r = railEl.getBoundingClientRect(), vh = window.innerHeight;
    var p = (vh * 0.7 - r.top) / r.height;
    railEl.style.setProperty('--p', (Math.max(0, Math.min(1, p)) * 100).toFixed(1) + '%');
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', rail);
  onScroll();

  /* ---------- varie ---------- */
  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  $$('.faq details').forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) $$('.faq details').forEach(function (o) { if (o !== d) o.open = false; });
    });
  });
})();
