// Nav: rand bij scrollen (hooguit één keer per frame, via requestAnimationFrame)
const nav = document.querySelector('.nav');
let scrollTick = false;
window.addEventListener('scroll', () => {
  if (scrollTick) return;
  scrollTick = true;
  requestAnimationFrame(() => {
    nav.classList.toggle('scrolled', window.scrollY > 8);
    scrollTick = false;
  });
}, { passive: true });

// Mobiel menu
const toggle = document.querySelector('.nav-toggle');
const menu = document.querySelector('.mobile-menu');
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!open));
  menu.hidden = open;
});
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  toggle.setAttribute('aria-expanded', 'false');
  menu.hidden = true;
}));
// Escape sluit het menu en zet de focus terug op de menuknop, zoals een toetsenbordgebruiker verwacht.
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || menu.hidden) return;
  menu.hidden = true;
  toggle.setAttribute('aria-expanded', 'false');
  toggle.focus();
});
// Een tik naast het menu sluit het ook; de knop en het menu zelf zitten in header.nav en houden hun eigen gedrag.
document.addEventListener('click', e => {
  if (menu.hidden || nav.contains(e.target)) return;
  menu.hidden = true;
  toggle.setAttribute('aria-expanded', 'false');
});

// Het menu laat zien in welk onderdeel je bent (aria-current), zodat je weet waar je op de pagina staat; het mobiele menu doet mee.
const navAnkers = [...document.querySelectorAll('.nav-links a, .mobile-menu a:not(.btn)')];
const sectieIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    navAnkers.forEach(a => { if (a.getAttribute('href') === `#${e.target.id}`) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  });
}, { rootMargin: '-40% 0px -55% 0px' });
document.querySelectorAll('main section[id]').forEach(s => sectieIO.observe(s));

// Reveal bij scrollen: trapsgewijs alleen op een breed scherm, waar kaarten naast elkaar staan; op telefoon direct.
const stagger = matchMedia('(min-width: 900px)').matches;
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      io.unobserve(e.target);
    }
  });
}, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = stagger ? `${(i % 4) * 70}ms` : '0ms';
  io.observe(el);
});

// Tellers in de stats-balk
const counters = document.querySelectorAll('[data-count]');
const countIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const start = performance.now();
    const step = now => {
      const p = Math.min((now - start) / 1200, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    countIO.unobserve(el);
  });
}, { threshold: 0.5 });
counters.forEach(c => countIO.observe(c));

// Jaartal in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Contactformulier: opent e-mailprogramma (vervang later door echte backend, bv. Formspree)
// openMail staat op window zodat tests hem kunnen vervangen
window.openMail = window.openMail || (url => { window.location.href = url; });

// Een fout wordt in gewone taal uitgelegd bij het formulier zelf (role=alert) en het veld wordt gemarkeerd; een robot die het verborgen veld invult wordt genegeerd.
function toonFormulierFout(f, veld, tekst) {
  const fout = f.querySelector('.form-fout');
  [f.naam, f.email].forEach(v => v.removeAttribute('aria-invalid'));
  fout.textContent = tekst;
  fout.hidden = !tekst;
  if (veld) { veld.setAttribute('aria-invalid', 'true'); veld.focus(); }
}

function handleSubmit(e) {
  e.preventDefault();
  const f = e.target;
  if (f.website && f.website.value) return false;
  const naam = f.naam.value.trim();
  const email = f.email.value.trim();
  if (!naam) { toonFormulierFout(f, f.naam, 'Vul je naam in, dan weet ik wie ik terugmail.'); return false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { toonFormulierFout(f, f.email, 'Vul een geldig e-mailadres in: met een apenstaartje en een punt erna.'); return false; }
  toonFormulierFout(f, null, '');
  const subject = encodeURIComponent(`Kennismaking aanvraag — ${f.naam.value}`);
  const body = encodeURIComponent(`Naam: ${f.naam.value}\nE-mail: ${f.email.value}\n\n${f.bericht.value}`);
  window.openMail(`mailto:info@pathconsultancy.nl?subject=${subject}&body=${body}`);
  f.querySelector('.form-note').hidden = false;
  return false;
}
