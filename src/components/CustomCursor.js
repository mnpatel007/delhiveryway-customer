import { useEffect, useRef } from 'react';
import './CustomCursor.css';

/**
 * Premium custom glowing cursor.
 * Two-layer: inner dot (instant) + outer ring (lagged).
 * Only renders on non-touch devices.
 * Expands on interactive elements. Shrinks on click.
 */
export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    // Only on pointer-fine devices (not touch)
    const isPointerFine = window.matchMedia('(pointer: fine)').matches;
    if (!isPointerFine) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    document.body.classList.add('cursor-active');

    let mouseX = -100, mouseY = -100;
    let ringX = -100, ringY = -100;
    let lastX = 0, lastY = 0;
    let velocity = 0;
    let rafId;

    const onMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate3d(${mouseX - 4}px, ${mouseY - 4}px, 0)`;
    };

    const lerp = (a, b, t) => a + (b - a) * t;

    const tick = () => {
      try {
        if (!dot || !ring || !dot.parentNode || !ring.parentNode) {
          cancelAnimationFrame(rafId);
          return;
        }

        const dx = mouseX - ringX;
        const dy = mouseY - ringY;
        
        // Calculate velocity for stretching effect
        const deltaX = mouseX - lastX;
        const deltaY = mouseY - lastY;
        const vel = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        velocity = lerp(velocity, vel, 0.1);
        
        // Update ring position with inertia
        ringX = lerp(ringX, mouseX, 0.16);
        ringY = lerp(ringY, mouseY, 0.16);
        
        // Calculate rotation for direction
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        
        // Dynamic scaling and rotation based on speed
        const v = isFinite(velocity) ? velocity : 0;
        const scaleX = 1 + v * 0.008;
        const scaleY = 1 - v * 0.004;
        const rot = isFinite(angle) ? angle : 0;

        ring.style.transform = `translate3d(${ringX - 15}px, ${ringY - 15}px, 0) rotate(${rot}deg) scale(${scaleX}, ${scaleY})`;
        
        lastX = mouseX;
        lastY = mouseY;
        rafId = requestAnimationFrame(tick);
      } catch (err) {
        // Silent recovery - avoid crashing the whole app for cursor issues
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);

    // Hover on interactive elements
    const onEnter = (e) => {
      const target = e.target;
      if (
        target.matches('a, button, [data-magnetic], input, textarea, select, label, [role="button"]')
      ) {
        ring.classList.add('cursor-ring--hover');
        dot.classList.add('cursor-dot--hover');
      }
    };

    const onLeave = () => {
      ring.classList.remove('cursor-ring--hover');
      dot.classList.remove('cursor-dot--hover');
    };

    const onDown = () => {
      dot.classList.add('cursor-dot--click');
      ring.classList.add('cursor-ring--click');
    };

    const onUp = () => {
      dot.classList.remove('cursor-dot--click');
      ring.classList.remove('cursor-ring--click');
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onEnter);
    document.addEventListener('mouseout', onLeave);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('mouseup', onUp);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onEnter);
      document.removeEventListener('mouseout', onLeave);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('mouseup', onUp);
      document.body.classList.remove('cursor-active');
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  );
}
