import React, { useEffect } from 'react';

export default function PerformanceOptimizer() {
  useEffect(() => {
    // Enable performance monitoring
    if ('PerformanceObserver' in window) {
      const perfObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 3000) {
            console.warn(`Slow operation detected: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
          }
        }
      });
      perfObserver.observe({ entryTypes: ['measure', 'navigation'] });
    }

    // Optimize images with IntersectionObserver
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    }, { rootMargin: '50px' });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });

    // Cleanup on unmount
    return () => {
      imageObserver.disconnect();
    };
  }, []);

  return null;
}