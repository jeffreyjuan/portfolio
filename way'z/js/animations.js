/* ============================================
   WAY'Z — GSAP ScrollTrigger Animations
   ============================================ */

function initGSAPAnimations() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  // --- Hero entrance (Plays immediately on load) ---
  const heroTL = gsap.timeline({ defaults: { ease: 'power3.out' } });
  heroTL
    .from('.wz-hero-badge', { y: 20, opacity: 0, duration: 0.8, delay: 0.3 })
    .from('.wz-hero h1 .line', { y: 60, opacity: 0, duration: 1, stagger: 0.15 }, '-=0.4')
    .from('.wz-hero p', { y: 20, opacity: 0, duration: 0.8 }, '-=0.5')
    .from('.wz-hero-actions', { y: 20, opacity: 0, duration: 0.6 }, '-=0.3')
    .from('.wz-hero-stat', { y: 30, opacity: 0, duration: 0.6, stagger: 0.1 }, '-=0.2')
    .from('.wz-floating-el', { scale: 0, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'back.out(2)' }, '-=0.6');

  // --- Section headers ---
  gsap.utils.toArray('.wz-section-header').forEach(header => {
    gsap.from(header.children, {
      y: 40, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out',
      scrollTrigger: { trigger: header, start: 'top 95%', toggleActions: 'play none none none' }
    });
  });

  // --- Steps ---
  gsap.utils.toArray('.wz-step').forEach((step, i) => {
    gsap.from(step, {
      y: 50, opacity: 0, duration: 0.8, delay: i * 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: step, start: 'top 95%', toggleActions: 'play none none none' }
    });
  });

  // --- Feature cards ---
  gsap.utils.toArray('.wz-feature-card').forEach((card, i) => {
    gsap.from(card, {
      y: 60, opacity: 0, duration: 0.8, delay: (i % 3) * 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: card, start: 'top 95%', toggleActions: 'play none none none' }
    });
  });

  // --- Driver CTA ---
  gsap.from('.wz-driver-cta-content', {
    x: -50, opacity: 0, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: '.wz-driver-cta', start: 'top 95%' }
  });
  gsap.from('.wz-driver-cta-visual', {
    x: 50, opacity: 0, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: '.wz-driver-cta', start: 'top 95%' }
  });

  // --- Earnings bars animate ---
  gsap.utils.toArray('.wz-earnings-bar').forEach((bar, i) => {
    const h = bar.dataset.height || (30 + Math.random() * 70) + '%';
    bar.style.height = '8px';
    gsap.to(bar, {
      height: h, duration: 1, delay: i * 0.08, ease: 'power3.out',
      scrollTrigger: { trigger: bar.closest('.wz-earnings-bars'), start: 'top 95%' }
    });
  });

  // --- Testimonials ---
  gsap.from('.wz-testimonial', {
    x: 80, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out',
    scrollTrigger: { trigger: '.wz-testimonials-track', start: 'top 95%' }
  });

  // --- Phone mockup ---
  gsap.from('.wz-phone-mockup', {
    y: 80, opacity: 0, rotateY: 15, duration: 1.2, ease: 'power3.out',
    scrollTrigger: { trigger: '.wz-app-section', start: 'top 95%' }
  });

  // --- Counter animation ---
  gsap.utils.toArray('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count);
    ScrollTrigger.create({
      trigger: el,
      start: 'top 95%',
      onEnter: () => WZ_APP.animateCounter(el, target),
      once: true
    });
  });

  // --- Parallax background orbs ---
  gsap.utils.toArray('.wz-bg-orb').forEach(orb => {
    gsap.to(orb, {
      y: -100,
      scrollTrigger: { trigger: orb.parentElement, start: 'top bottom', end: 'bottom top', scrub: 1 }
    });
  });
}

// Init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(initGSAPAnimations, 100));
} else {
  setTimeout(initGSAPAnimations, 100);
}