/* ===== Consultor dos Milhões · app.js ===== */
(() => {
  'use strict';

  /* A DATA DA EDIÇÃO fica em edicao.js (o único arquivo que muda todo mês). */
  const ME = window.MP_EDICAO;
  const CONFIG = {
    DURACAO_MIN: ME.DURACAO_MIN,
    TITULO_AGENDA: ME.TITULO,

    /* Formulário ActiveCampaign. Enquanto formId = null, a página
       roda em MODO PRÉVIA: mostra a confirmação, mas não envia o lead. */
    AC: {
      action: 'https://mpinvestimentos.activehosted.com/proc.php',
      formId: 47,
      or: '38aee529-78e7-496f-8a6b-d8dac2ec1ea9'
    }
  };

  const TZ = 'America/Sao_Paulo';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- Data da edição ---------- */
  const ED = ME.proxima();

  const fmt = (opts) => new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, ...opts }).format(ED);
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const weekdayShort = cap(fmt({ weekday: 'long' }).replace('-feira', ''));
  const ddmm = fmt({ day: '2-digit', month: '2-digit' });
  const diaMes = fmt({ day: 'numeric', month: 'long' });
  const horaNum = Number(fmt({ hour: 'numeric', hour12: false }));
  const minNum = Number(fmt({ minute: 'numeric' }));
  const hora = minNum ? `${horaNum}h${String(minNum).padStart(2, '0')}` : `${horaNum}h`;

  const DATES = {
    short: `${weekdayShort}, ${ddmm} · ${hora}`,
    kicker: `${weekdayShort}, ${ddmm} · ${hora}`,
    long: `${weekdayShort}, ${diaMes}, às ${hora}`,
    weekday: weekdayShort,
    ddmm,
    hour: `${hora} · Brasília`
  };
  $$('[data-date]').forEach(el => { const v = DATES[el.dataset.date]; if (v) el.textContent = v; });

  /* ---------- Contagem regressiva ---------- */
  const cd = $('.countdown');
  const cdEls = { d: $('[data-cd="d"]'), h: $('[data-cd="h"]'), m: $('[data-cd="m"]'), s: $('[data-cd="s"]') };
  function tickCountdown() {
    const diff = ED.getTime() - Date.now();
    if (diff <= 0) {
      cd.classList.add('is-live');
      $('.cd-label', cd).textContent = 'Ao vivo agora';
      return;
    }
    const t = Math.floor(diff / 1000);
    const vals = { d: Math.floor(t / 86400), h: Math.floor(t % 86400 / 3600), m: Math.floor(t % 3600 / 60), s: t % 60 };
    for (const k in vals) {
      const v = String(vals[k]).padStart(2, '0');
      const el = cdEls[k];
      if (el.textContent !== v) {
        el.textContent = v;
        if (!reduce) { el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); }
      }
    }
  }
  tickCountdown();
  setInterval(tickCountdown, 1000);

  /* ---------- Headline: palavra por palavra ---------- */
  let wi = 0;
  $$('.hero-title .split').forEach(line => {
    const words = line.textContent.trim().split(/\s+/);
    line.innerHTML = words.map(w => `<span class="w"><span style="--i:${wi++}">${w}</span></span>`).join(' ');
  });
  const ready = () => requestAnimationFrame(() => document.body.classList.add('is-loaded'));
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 900))]).then(ready);
  } else ready();

  /* ---------- Scroll: progresso, header, CTAs fixos ---------- */
  const header = $('.header');
  const bar = $('.progress span');
  const sticky = $('.sticky-cta');
  const formBox = $('#inscricao');
  const closing = $('#fecho');
  let formVisible = true, closingVisible = false;

  new IntersectionObserver(([e]) => { formVisible = e.isIntersecting; updateCtas(); }, { threshold: .15 }).observe(formBox);
  new IntersectionObserver(([e]) => { closingVisible = e.isIntersecting; updateCtas(); }, { threshold: .25 }).observe(closing);
  function updateCtas() {
    const show = !formVisible;
    header.classList.toggle('show-cta', show);
    sticky.classList.toggle('show', show && !closingVisible);
  }

  /* ---------- Reveal ao entrar na tela ---------- */
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      revealIO.unobserve(e.target);
    });
  }, { threshold: .14, rootMargin: '0px 0px -6% 0px' });
  $$('[data-reveal]').forEach(el => {
    // escalonamento entre irmãos (cards, depoimentos)
    const sibs = $$(':scope > [data-reveal]', el.parentElement);
    if (sibs.length > 1) el.style.setProperty('--d', `${sibs.indexOf(el) * 0.1}s`);
    revealIO.observe(el);
  });
  // classes "in" para elementos com animação própria
  $$('.pain, .host-photo').forEach(el => revealIO.observe(el));

  /* ---------- Contadores ---------- */
  const nf = new Intl.NumberFormat('pt-BR');
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      countIO.unobserve(e.target);
      const el = e.target, end = Number(el.dataset.count), dur = 2000;
      if (reduce) { el.textContent = nf.format(end); return; }
      const t0 = performance.now();
      const step = now => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = nf.format(Math.round(end * eased));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: .6 });
  $$('[data-count]').forEach(el => { el.textContent = '0'; countIO.observe(el); });

  /* ---------- Texto que acende com a rolagem ---------- */
  const scrub = $('[data-scrub]');
  let scrubWords = [];
  if (scrub && !reduce) {
    scrub.innerHTML = scrub.textContent.trim().split(/\s+/).map(w => `<span class="sw">${w}</span>`).join(' ');
    scrubWords = $$('.sw', scrub);
  }

  /* ---------- Ciclo (anel + passos) ---------- */
  const steps = $$('.step');
  const stepsList = $('.steps');
  const ringProg = $('.ring-progress');
  const nodes = $$('.ring-nodes circle');
  const center = $('.ring-center');
  const rNum = $('.ring-num'), rName = $('.ring-name'), rQ = $('.ring-q');
  let current = -1;
  function setStep(i) {
    if (i === current) return;
    current = i;
    steps.forEach((s, k) => s.classList.toggle('active', k <= i && k === i || (window.innerWidth <= 880 && k <= i)));
    nodes.forEach((n, k) => { n.classList.toggle('on', k <= i); n.classList.toggle('cur', k === i); });
    if (i < 0) return;
    const s = steps[i];
    center.classList.add('swap');
    setTimeout(() => {
      rNum.textContent = $('.step-num', s).textContent;
      rName.textContent = $('h3', s).textContent;
      rQ.textContent = s.dataset.q;
      center.classList.remove('swap');
    }, reduce ? 0 : 220);
  }

  /* ---------- Loop de rolagem único ---------- */
  let ticking = false;
  function onScroll() {
    const y = window.scrollY, vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    header.classList.toggle('is-scrolled', y > 24);

    if (scrubWords.length) {
      const r = scrub.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh * .82 - r.top) / (r.height + vh * .35)));
      const n = Math.round(p * scrubWords.length);
      scrubWords.forEach((w, k) => w.classList.toggle('on', k < n));
    }

    if (stepsList) {
      const mid = vh * .55;
      let idx = -1;
      steps.forEach((s, k) => { if (s.getBoundingClientRect().top < mid) idx = k; });
      setStep(Math.max(0, idx));
      const r = stepsList.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (mid - r.top) / r.height));
      if (ringProg) ringProg.style.strokeDashoffset = String(100 - p * 100);
      stepsList.style.setProperty('--fill', p.toFixed(3));
    }
    ticking = false;
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Holofote nos cards ---------- */
  $$('[data-spot]').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* ---------- Luz da porta acompanha o cursor (desktop) ---------- */
  const heroEl = $('.hero'), door = $('.door');
  if (door && !reduce && window.matchMedia('(hover: hover)').matches) {
    heroEl.addEventListener('pointermove', e => {
      door.style.setProperty('--px', `${(e.clientX / window.innerWidth - .5) * 40}px`);
    });
  }

  /* ---------- Inclinação 3D da imagem ao vivo ---------- */
  const tilt = $('[data-tilt]');
  if (tilt && !reduce && window.matchMedia('(hover: hover)').matches) {
    tilt.addEventListener('pointermove', e => {
      const r = tilt.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      tilt.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
    });
    tilt.addEventListener('pointerleave', () => { tilt.style.transform = ''; });
  }

  /* ---------- Botões magnéticos (desktop) ---------- */
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    $$('.btn-lg, .center-cta .btn').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .15}px, ${(e.clientY - r.top - r.height / 2) * .25 - 2}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  /* ---------- Depoimentos em vídeo (carrega o YouTube só no clique) ---------- */
  $$('.yt').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.yt, start = btn.dataset.start ? `&start=${btn.dataset.start}` : '';
      btn.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0${start}" title="${btn.getAttribute('aria-label')}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
      btn.style.cursor = 'default';
    }, { once: true });
  });

  /* ---------- FAQ ---------- */
  $$('.qa').forEach(qa => {
    const q = $('.qa-q', qa);
    q.addEventListener('click', () => {
      const open = !qa.classList.contains('open');
      qa.classList.toggle('open', open);
      q.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---------- CTAs: rolam até o formulário e focam o nome ---------- */
  $$('a[href="#inscricao"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      window.dataLayer && window.dataLayer.push({ event: 'cta_click', cta_local: a.dataset.cta || '' });
      formBox.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      const nome = $('#f-nome');
      if (nome && !$('#lead-form').hidden) setTimeout(() => nome.focus({ preventScroll: true }), reduce ? 0 : 650);
    });
  });

  /* ---------- Formulário ---------- */
  const form = $('#lead-form');
  const card = $('#form-card');
  const status = $('.form-status', form);
  const whats = $('#f-whats');

  // UTMs da URL para os campos ocultos
  const qs = new URLSearchParams(location.search);
  $$('input[data-utm]', form).forEach(el => { const v = qs.get(el.dataset.utm); if (v) el.value = v; });

  // máscara de WhatsApp: (27) 99999-9999
  whats.addEventListener('input', () => {
    let d = whats.value.replace(/\D/g, '').slice(0, 11);
    let out = d;
    if (d.length > 2) out = `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length > 7) out = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
    whats.value = out;
  });

  const rules = {
    fullname: v => v.trim().split(/\s+/).length >= 2 || 'Digite nome e sobrenome.',
    phone: v => v.replace(/\D/g, '').length >= 10 || 'Digite o WhatsApp com DDD.',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Digite um e-mail válido.'
  };
  rules['field[37]'] = () => !!form.querySelector('input[name="field[37]"]:checked') || 'Escolha uma opção.';
  function validate(input) {
    const res = rules[input.name](input.value);
    const field = input.closest('.field');
    const err = $('.field-error', field);
    const ok = res === true;
    field.classList.toggle('has-error', !ok);
    err.textContent = ok ? '' : res;
    input.setAttribute('aria-invalid', String(!ok));
    return ok;
  }
  $$('input[required]', form).forEach(i => {
    if (i.type === 'radio') {
      $$('input[type="radio"]', form).filter(r => r.name === i.name).forEach(r => r.addEventListener('change', () => validate(i)));
      return;
    }
    i.addEventListener('blur', () => { if (i.value) validate(i); });
    i.addEventListener('input', () => { if (i.closest('.field').classList.contains('has-error')) validate(i); });
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    status.textContent = '';
    const inputs = $$('input[required]', form);
    const bad = inputs.filter(i => !validate(i));
    if (bad.length) { bad[0].focus(); return; }

    form.classList.add('is-sending');
    const btn = $('button[type="submit"]', form); btn.disabled = true;

    try {
      if (CONFIG.AC.formId) {
        await sendToAC();
      } else {
        console.warn('[Consultor dos Milhões] MODO PRÉVIA: defina CONFIG.AC.formId em app.js para enviar os leads.');
        await new Promise(r => setTimeout(r, 700));
      }
      window.dataLayer && window.dataLayer.push({ event: 'generate_lead', form_name: 'consultor_dos_milhoes', edicao: ED.toISOString().slice(0, 7) });
      showSuccess();
    } catch (err) {
      status.textContent = (err && err.userMessage) || 'Não foi possível enviar agora. Confira sua conexão e tente de novo.';
      btn.disabled = false;
    } finally {
      form.classList.remove('is-sending');
    }
  });

  /* Envio igual ao embed oficial da ActiveCampaign (JSONP via <script>):
     o servidor responde chamando _show_thank_you ou _show_error. */
  function acPhone(v) {
    const d = v.replace(/\D/g, '');
    return d.startsWith('55') && d.length > 11 ? '+' + d : '+55' + d;
  }
  function sendToAC() {
    return new Promise((resolve, reject) => {
      const id = String(CONFIG.AC.formId);
      const p = new URLSearchParams();
      [['u', id], ['f', id], ['s', ''], ['c', '0'], ['m', '0'], ['act', 'sub'], ['v', '2'], ['or', CONFIG.AC.or]]
        .forEach(([k, v]) => p.append(k, v));
      p.append('fullname', form.elements.fullname.value.trim());
      p.append('phone', acPhone(form.elements.phone.value));
      p.append('email', form.elements.email.value.trim());
      const atua = form.querySelector('input[name="field[37]"]:checked');
      p.append('field[37]', atua ? atua.value : '');
      $$('input[data-utm]', form).forEach(el => p.append(el.name, el.value));
      p.append('jsonp', 'true');

      let done = false, timer;
      const finish = (fn, arg) => { if (done) return; done = true; clearTimeout(timer); fn(arg); };
      const fail = msg => { const e = new Error(msg); e.userMessage = msg; return e; };
      window._show_thank_you = () => finish(resolve);
      window._show_unsubscribe = () => finish(resolve);
      window._show_error = (fid, message) => {
        const tmp = document.createElement('div'); tmp.innerHTML = message || '';
        finish(reject, fail(tmp.textContent.trim() || 'Não foi possível concluir sua inscrição. Tente de novo.'));
      };
      window._show_field_error = (fid, field, message) => finish(reject, fail(message || 'Confira os dados e tente de novo.'));
      window._load_script = src => { const sc = document.createElement('script'); sc.src = src; document.head.appendChild(sc); };
      window._form_callback = window._form_callback || function () {};

      const sc = document.createElement('script');
      sc.src = CONFIG.AC.action + '?' + p.toString();
      sc.onerror = () => finish(reject, fail('Não foi possível enviar agora. Confira sua conexão e tente de novo.'));
      timer = setTimeout(() => finish(reject, fail('O envio demorou demais. Tente de novo.')), 15000);
      document.head.appendChild(sc);
    });
  }

  function showSuccess() {
    const ok = $('.form-success', card);
    card.style.minHeight = `${card.offsetHeight}px`;
    form.hidden = true;
    card.classList.add('is-done');
    ok.hidden = false;
    ok.focus({ preventScroll: true });
    setTimeout(() => { card.style.minHeight = ''; }, 600);
  }

  /* ---------- Links de agenda ---------- */
  const fim = new Date(ED.getTime() + CONFIG.DURACAO_MIN * 60000);
  const z = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const desc = 'Aula ao vivo e gratuita com Gabriel Liberato. O link da sala chega por e-mail e WhatsApp no dia do encontro.';
  $('[data-cal="google"]').href = ME.googleUrl(ED);
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Meu Patrimonio//Consultor dos Milhoes//PT', 'BEGIN:VEVENT',
    `UID:consultor-dos-milhoes-${z(ED)}@meupatrimonio.com`, `DTSTAMP:${z(new Date())}`, `DTSTART:${z(ED)}`, `DTEND:${z(fim)}`,
    `SUMMARY:${CONFIG.TITULO_AGENDA}`, `DESCRIPTION:${desc}`,
    'BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', 'DESCRIPTION:O encontro começa em 30 minutos', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  $('[data-cal="ics"]').href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
})();
