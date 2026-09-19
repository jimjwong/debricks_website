const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');
const contactForm = document.querySelector('#contact-form');

const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 80);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
  mobileNav?.classList.toggle('is-open', !isOpen);
});

mobileNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Open navigation');
    mobileNav.classList.remove('is-open');
  });
});

contactForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(contactForm);
  const name = String(data.get('name') || '').trim();
  const email = String(data.get('email') || '').trim();
  const company = String(data.get('company') || '').trim();
  const message = String(data.get('message') || '').trim();
  const subject = encodeURIComponent(`Website enquiry from ${name}${company ? ` at ${company}` : ''}`);
  const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}${company ? `\nCompany: ${company}` : ''}\n\n${message}`);
  window.location.href = `mailto:hi@debricks.com?subject=${subject}&body=${body}`;
});

const year = document.querySelector('#year');
if (year) year.textContent = String(new Date().getFullYear());

/* ---- Pointer-reactive 3D tilt -------------------------------------------- */
const tiltables = document.querySelectorAll('.tilt');
const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (tiltables.length && !noMotion.matches) {
  tiltables.forEach((card) => {
    const strength = Number(card.dataset.tilt || 9);
    let rect = null;
    let tiltX = 0;
    let tiltY = 0;
    let raf = null;

    // The rect is cached on enter and refreshed on scroll/resize rather than
    // read per move, so pointermove never forces a synchronous layout.
    const measure = () => { rect = card.getBoundingClientRect(); };
    const invalidate = () => { if (rect) measure(); };

    const paint = () => {
      raf = null;
      card.style.transform =
        `perspective(1000px) rotateY(${tiltX}deg) rotateX(${tiltY}deg) translateY(-4px) scale(1.012)`;
    };

    card.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'touch') return;
      measure();
    });

    card.addEventListener('pointermove', (event) => {
      // Mouse and pen only — a finger dragging past a card should not tilt it.
      if (event.pointerType === 'touch') return;
      if (!rect) measure();

      // Normalise at event time; a deferred frame must not re-measure against
      // a layout that has since changed.
      tiltX = ((event.clientX - rect.left) / rect.width - 0.5) * strength;
      tiltY = -((event.clientY - rect.top) / rect.height - 0.5) * strength;

      card.classList.add('is-tilting');
      if (raf === null) raf = requestAnimationFrame(paint);
    }, { passive: true });

    const reset = () => {
      if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
      rect = null;
      card.classList.remove('is-tilting');
      card.style.transform = '';
    };

    card.addEventListener('pointerleave', reset);
    card.addEventListener('pointercancel', reset);
    window.addEventListener('scroll', invalidate, { passive: true });
    window.addEventListener('resize', invalidate);
  });
}
