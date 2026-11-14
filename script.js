(() => {
  'use strict';

  const body = document.body;
  const header = document.querySelector('[data-header]');
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const menuLabel = document.querySelector('[data-menu-label]');
  const mobileMenu = document.querySelector('#mobile-menu');
  const menuLinks = document.querySelectorAll('[data-menu-link]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  if (mobileMenu) mobileMenu.inert = true;

  const closeMenu = () => {
    if (!menuToggle || !mobileMenu) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
    if (menuLabel) menuLabel.textContent = 'Menu';
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    mobileMenu.inert = true;
    body.classList.remove('menu-open');
  };

  const openMenu = () => {
    if (!menuToggle || !mobileMenu) return;
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close menu');
    if (menuLabel) menuLabel.textContent = 'Close';
    mobileMenu.classList.add('is-open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    mobileMenu.inert = false;
    body.classList.add('menu-open');
  };

  menuToggle?.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    expanded ? closeMenu() : openMenu();
  });
  menuLinks.forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  const revealItems = document.querySelectorAll('.reveal');
  if (reduceMotion.matches) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const delay = entry.target.dataset.delay || '0';
        entry.target.style.setProperty('--delay', `${delay}ms`);
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  const tagline = document.querySelector('[data-word-reveal]');
  if (tagline) {
    const words = [];
    tagline.querySelectorAll('.line').forEach((line) => {
      const lineWords = line.textContent.trim().split(/\s+/);
      line.textContent = '';
      lineWords.forEach((text, index) => {
        const word = document.createElement('span');
        word.className = 'word';
        word.textContent = text;
        line.appendChild(word);
        if (index < lineWords.length - 1) line.appendChild(document.createTextNode(' '));
        words.push(word);
      });
    });
    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      words.forEach((word) => word.classList.add('is-visible'));
    } else {
      const wordObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          words.forEach((word, index) => window.setTimeout(() => word.classList.add('is-visible'), index * 75));
          observer.disconnect();
        });
      }, { threshold: 0.35 });
      wordObserver.observe(tagline);
    }
  }

  const parallaxItems = document.querySelectorAll('[data-parallax]');
  let ticking = false;
  const updateParallax = () => {
    if (!reduceMotion.matches && parallaxItems.length) {
      parallaxItems.forEach((item) => {
        const rect = item.getBoundingClientRect();
        const progress = (window.innerHeight / 2 - (rect.top + rect.height / 2)) / window.innerHeight;
        const shift = Math.max(-24, Math.min(24, progress * 22));
        item.style.transform = `translate3d(0, ${shift}px, 0)`;
      });
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 24);
  }, { passive: true });
  updateParallax();

  if (finePointer.matches) {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let cursorFrame;
    const renderCursor = () => {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      if (dot) dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      if (ring) ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      cursorFrame = window.requestAnimationFrame(renderCursor);
    };
    window.addEventListener('mousemove', (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      if (dot) dot.style.opacity = '1';
      if (ring) ring.style.opacity = '1';
    }, { passive: true });
    document.querySelectorAll('[data-cursor]').forEach((target) => {
      target.addEventListener('mouseenter', () => ring?.classList.add('is-hovering'));
      target.addEventListener('mouseleave', () => ring?.classList.remove('is-hovering'));
    });
    renderCursor();
    window.addEventListener('pagehide', () => window.cancelAnimationFrame(cursorFrame));
  }

  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.desktop-nav .nav-link');
  if ('IntersectionObserver' in window && navLinks.length) {
    const activeObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
    sections.forEach((section) => activeObserver.observe(section));
  }
})();
