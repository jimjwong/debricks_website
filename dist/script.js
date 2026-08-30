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
  window.location.href = `mailto:hi@bricksmarketing.com?subject=${subject}&body=${body}`;
});

const year = document.querySelector('#year');
if (year) year.textContent = String(new Date().getFullYear());
