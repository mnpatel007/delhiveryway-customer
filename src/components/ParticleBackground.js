import { useEffect, useRef } from 'react';

/**
 * Particle constellation background.
 * Canvas-based. 60fps. Zero DOM reflow.
 * Auto-disables on mobile and reduced-motion.
 */

const PARTICLE_COUNT_DESKTOP = 75;
const CONNECTION_DISTANCE = 130;
const MOUSE_ATTRACTION_RADIUS = 160;
const MOUSE_ATTRACTION_FORCE = 0.04;
const MAX_SPEED = 0.55;

class Particle {
  constructor(w, h) {
    this.reset(w, h);
  }

  reset(w, h) {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.radius = Math.random() * 1.5 + 0.5;
    this.opacity = Math.random() * 0.4 + 0.15;
    this.pulseOffset = Math.random() * Math.PI * 2;
  }

  update(w, h, mouseX, mouseY, time) {
    // Mouse attraction
    if (mouseX !== null && mouseY !== null) {
      const dx = mouseX - this.x;
      const dy = mouseY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_ATTRACTION_RADIUS && dist > 0) {
        const force = MOUSE_ATTRACTION_FORCE * (1 - dist / MOUSE_ATTRACTION_RADIUS);
        this.vx += (dx / dist) * force;
        this.vy += (dy / dist) * force;
      }
    }

    // Speed cap
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > MAX_SPEED) {
      this.vx = (this.vx / speed) * MAX_SPEED;
      this.vy = (this.vy / speed) * MAX_SPEED;
    }

    this.x += this.vx;
    this.y += this.vy;

    // Boundary wrap
    if (this.x < -10) this.x = w + 10;
    if (this.x > w + 10) this.x = -10;
    if (this.y < -10) this.y = h + 10;
    if (this.y > h + 10) this.y = -10;

    // Pulse opacity
    this.currentOpacity =
      this.opacity + Math.sin(time * 0.001 + this.pulseOffset) * 0.08;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 212, 255, ${this.currentOpacity})`;
    ctx.fill();
  }
}

export default function ParticleBackground({ style = {} }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    particles: [],
    mouseX: null,
    mouseY: null,
    rafId: null,
    running: true,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Skip on mobile or reduced motion
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isMobile || prefersReduced) return;

    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    // Resize handler
    const resize = () => {
      const parent = canvas.parentElement;
      canvas.width = parent ? parent.offsetWidth : window.innerWidth;
      canvas.height = parent ? parent.offsetHeight : window.innerHeight;

      // Reinit particles on resize
      state.particles = Array.from(
        { length: PARTICLE_COUNT_DESKTOP },
        () => new Particle(canvas.width, canvas.height)
      );
    };

    resize();

    // Mouse tracking
    const onMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      state.mouseX = e.clientX - rect.left;
      state.mouseY = e.clientY - rect.top;
    };

    const onMouseLeave = () => {
      state.mouseX = null;
      state.mouseY = null;
    };

    window.addEventListener('mousemove', onMouse, { passive: true });
    canvas.parentElement?.addEventListener('mouseleave', onMouseLeave);

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    // Render loop
    const render = (time) => {
      if (!state.running) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const { particles, mouseX, mouseY } = state;

      // Update particles
      particles.forEach((p) => p.update(canvas.width, canvas.height, mouseX, mouseY, time));

      // Draw connections
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DISTANCE) {
            const opacity = ((1 - dist / CONNECTION_DISTANCE) * 0.25).toFixed(3);
            ctx.strokeStyle = `rgba(0, 212, 255, ${opacity})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach((p) => p.draw(ctx));

      state.rafId = requestAnimationFrame(render);
    };

    state.rafId = requestAnimationFrame(render);

    return () => {
      state.running = false;
      if (state.rafId) cancelAnimationFrame(state.rafId);
      window.removeEventListener('mousemove', onMouse);
      canvas.parentElement?.removeEventListener('mouseleave', onMouseLeave);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}
