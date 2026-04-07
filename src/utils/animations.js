/**
 * DelhiveryWay — Extraordinary Animation Library
 * Pure vanilla JS. GPU-accelerated. Zero lag.
 * Uses only transform + opacity for composited animations.
 */

/* ── Magnetic Buttons ─────────────────────────────────────── */
export function initMagneticButtons(container = document) {
  const els = container.querySelectorAll('[data-magnetic]');
  const MAX = 14;

  const handlers = [];

  els.forEach((el) => {
    el.style.willChange = 'transform';
    
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const threshold = Math.max(rect.width, rect.height) * 1.5;

      if (dist < threshold) {
        // Advanced elastic strength curve
        const strength = Math.pow(1 - dist / threshold, 2) * MAX;
        const targetX = (dx / (dist || 1)) * strength;
        const targetY = (dy / (dist || 1)) * strength;
        
        el.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) scale(1.02)`;
        el.style.transition = 'transform 0.25s cubic-bezier(0.23, 1, 0.32, 1)';
      } else {
        el.style.transform = 'translate3d(0,0,0) scale(1)';
        el.style.transition = 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      }
    };

    const onLeave = () => {
      el.style.transform = 'translate3d(0,0,0)';
      el.style.transition = 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    };

    window.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    handlers.push({ el, onMove, onLeave });
  });

  return () => {
    handlers.forEach(({ el, onMove, onLeave }) => {
      window.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    });
  };
}

/* ── Ripple Effect ────────────────────────────────────────── */
export function initRipple(container = document) {
  const els = container.querySelectorAll('[data-ripple]');

  const handlers = [];

  els.forEach((el) => {
    // Ensure relative position
    const pos = getComputedStyle(el).position;
    if (pos === 'static') el.style.position = 'relative';
    el.style.overflow = 'hidden';

    const onDown = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const size = Math.max(rect.width, rect.height) * 2.5;

      const wave = document.createElement('span');
      wave.className = 'ripple-wave';
      wave.style.cssText = `
        position: absolute;
        border-radius: 50%;
        width: ${size}px;
        height: ${size}px;
        left: ${x - size / 2}px;
        top: ${y - size / 2}px;
        background: rgba(255,255,255,0.15);
        transform: scale(0);
        animation: rippleAnim 0.65s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        pointer-events: none;
        z-index: 0;
      `;

      el.appendChild(wave);
      setTimeout(() => wave.remove(), 700);
    };

    el.addEventListener('mousedown', onDown);
    handlers.push({ el, onDown });
  });

  // Inject keyframe if not already there
  if (!document.getElementById('ripple-style')) {
    const style = document.createElement('style');
    style.id = 'ripple-style';
    style.textContent = `
      @keyframes rippleAnim {
        to { transform: scale(1); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  return () => {
    handlers.forEach(({ el, onDown }) => {
      el.removeEventListener('mousedown', onDown);
    });
  };
}

/* ── 3D Tilt Effect ───────────────────────────────────────── */
export function init3DTilt(container = document, selector = '[data-tilt]') {
  let els;
  if (typeof selector === 'string') {
    els = (container === document ? document : container).querySelectorAll(selector);
  } else {
    els = [container];
  }

  const MAX_TILT = 8;
  const PERSPECTIVE = 900;
  const handlers = [];

  els.forEach((el) => {
    el.style.willChange = 'transform';
    // Inject shine element
    const shine = document.createElement('div');
    shine.className = 'card-shine';
    shine.style.cssText = `
      position: absolute; inset: 0; border-radius: inherit;
      background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0%, transparent 70%);
      opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
      z-index: 1;
    `;

    const pos = getComputedStyle(el).position;
    if (pos === 'static') el.style.position = 'relative';
    el.appendChild(shine);

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const tiltX = (y - 0.5) * MAX_TILT * -1;
      const tiltY = (x - 0.5) * MAX_TILT;

      el.style.transform = `perspective(${PERSPECTIVE}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(10px) scale(1.02)`;
      el.style.transition = 'transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      shine.style.opacity = '1';
      shine.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.12) 0%, transparent 65%)`;
    };

    const onLeave = () => {
      el.style.transform = `perspective(${PERSPECTIVE}px) rotateX(0deg) rotateY(0deg) translateZ(0) scale(1)`;
      el.style.transition = 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      shine.style.opacity = '0';
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    handlers.push({ el, onMove, onLeave });
  });

  return () => {
    handlers.forEach(({ el, onMove, onLeave }) => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    });
  };
}

/* ── Counter Animation ────────────────────────────────────── */
export function animateCounter(el, target, duration = 1800) {
  if (!el) return;
  const start = performance.now();
  const isFloat = String(target).includes('.');
  const decimals = isFloat ? String(target).split('.')[1].length : 0;

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  const tick = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const value = easeOut(progress) * target;
    el.textContent = isFloat
      ? value.toFixed(decimals)
      : Math.floor(value).toLocaleString();
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = isFloat ? target.toFixed(decimals) : Number(target).toLocaleString();
  };

  requestAnimationFrame(tick);
}

/* ── Observe and animate counters when visible ────────────── */
export function initCounters(containerEl) {
  const counters = containerEl ? containerEl.querySelectorAll('[data-counter]') : [];

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseFloat(el.dataset.counter);
          const duration = parseInt(el.dataset.duration || '1800');
          animateCounter(el, target, duration);
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.3 }
  );

  counters.forEach((el) => observer.observe(el));
  return () => observer.disconnect();
}

/* ── Parallax on scroll ───────────────────────────────────── */
export function initParallax() {
  const layers = document.querySelectorAll('[data-parallax]');
  if (!layers.length) return () => {};

  // Check reduced motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return () => {};

  let ticking = false;

  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        layers.forEach((el) => {
          const speed = parseFloat(el.dataset.parallax || '0.3');
          el.style.transform = `translate3d(0, ${scrollY * speed}px, 0)`;
        });
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}

/* ── Text Split for Letter Animations ────────────────────── */
export function splitTextForAnimation(el, className = 'reveal-letter') {
  if (!el || el.dataset.split) return;
  el.dataset.split = 'true';
  const text = el.textContent;
  el.textContent = '';
  el.style.display = 'block';

  text.split('').forEach((char, i) => {
    const span = document.createElement('span');
    span.className = className;
    span.style.animationDelay = `${i * 0.04}s`;
    span.textContent = char === ' ' ? '\u00A0' : char;
    el.appendChild(span);
  });
}

/* ── Stagger child animations ────────────────────────────── */
export function staggerChildren(containerEl, delay = 0.08) {
  if (!containerEl) return;
  const children = containerEl.children;
  Array.from(children).forEach((child, i) => {
    child.style.setProperty('--stagger-delay', `${i * delay}s`);
    child.classList.add('stagger-child');
  });
}
