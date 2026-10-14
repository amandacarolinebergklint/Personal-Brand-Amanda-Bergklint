/**
 * Amanda Bergklint – Portfolio JavaScript
 * Funktioner för mörkt/ljust tema och interaktivitet
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initActiveNav();
});

/**
 * Hanterar mörkt och ljust läge med knappen #tema
 */
function initThemeToggle() {
  const temaKnapp = document.getElementById('tema');
  if (!temaKnapp) return;

  // Gör knappen synlig när JavaScript har laddats (Progressive Enhancement)
  temaKnapp.removeAttribute('hidden');
  temaKnapp.hidden = false;

  // Kontrollera om användaren sparat ett val tidigare eller har systeminställning
  const savedTheme = localStorage.getItem('ab-tema');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

  // Applicera initialt tema
  applyTheme(isDark);

  // Klickhändelse för att växla tema
  temaKnapp.addEventListener('click', () => {
    const currentlyDark = document.body.classList.contains('dark-mode');
    const newDarkState = !currentlyDark;

    applyTheme(newDarkState);
    localStorage.setItem('ab-tema', newDarkState ? 'dark' : 'light');
  });

  /**
   * Uppdaterar klasser, attribut och knapptext
   */
  function applyTheme(dark) {
    if (dark) {
      document.body.classList.add('dark-mode');
      document.documentElement.setAttribute('data-theme', 'dark');
      temaKnapp.textContent = '☀️ Byt till ljust läge';
      temaKnapp.setAttribute('aria-pressed', 'true');
      temaKnapp.setAttribute('aria-label', 'Växla till ljust läge');
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.removeAttribute('data-theme');
      temaKnapp.textContent = '🌙 Byt till mörkt läge';
      temaKnapp.setAttribute('aria-pressed', 'false');
      temaKnapp.setAttribute('aria-label', 'Växla till mörkt läge');
    }
  }

  // Lyssna på ändringar i operativsystemets färgläge om inget sparat val finns
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('ab-tema')) {
      applyTheme(e.matches);
    }
  });
}

/**
 * Markerar aktiv navigeringslänk vid skroll
 */
function initActiveNav() {
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.sidhuvud nav a');

  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach((link) => {
            const href = link.getAttribute('href');
            if (href === `#${id}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    },
    {
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    }
  );

  sections.forEach((sec) => observer.observe(sec));
}
