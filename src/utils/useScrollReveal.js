import { useEffect, useRef, useCallback } from 'react';

export default function useScrollReveal(options = {}) {
  const { threshold = 0.1, rootMargin = '0px 0px -50px 0px', once = true } = options;
  const elementsRef = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('scroll-reveal--visible');
            if (once) observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin }
    );

    const current = elementsRef.current;
    current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      current.forEach((el) => {
        if (el) observer.unobserve(el);
      });
    };
  }, [threshold, rootMargin, once]);

  const addRef = useCallback((el) => {
    if (el && !elementsRef.current.includes(el)) {
      elementsRef.current.push(el);
    }
  }, []);

  return addRef;
}
