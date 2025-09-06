// Reveal on scroll
const revealEls = document.querySelectorAll('.reveal-in');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('visible'));
}

// Accordion (Disclosures)
const accordionBtns = document.querySelectorAll('.accordion__button');
accordionBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    accordionBtns.forEach(b => b.setAttribute('aria-expanded', 'false'));
    document.querySelectorAll('.accordion__content').forEach(c => { c.hidden = true; c.classList.remove('open'); });
    if (!expanded) {
      btn.setAttribute('aria-expanded', 'true');
      const content = document.getElementById(btn.getAttribute('aria-controls'));
      content.hidden = false;
      setTimeout(() => content.classList.add('open'), 10);
    }
  });
  btn.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = btn.parentElement.nextElementSibling?.querySelector('.accordion__button');
      if (next) next.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = btn.parentElement.previousElementSibling?.querySelector('.accordion__button');
      if (prev) prev.focus();
    }
  });
});

// Chip tooltips
const chips = document.querySelectorAll('.chip');
chips.forEach(chip => {
  let tooltip;
  chip.addEventListener('mouseenter', showTip);
  chip.addEventListener('focus', showTip);
  chip.addEventListener('mouseleave', hideTip);
  chip.addEventListener('blur', hideTip);
  function showTip() {
    if (tooltip) return;
    tooltip = document.createElement('div');
    tooltip.className = 'chip-tooltip';
    tooltip.textContent = chip.title;
    document.body.appendChild(tooltip);
    const rect = chip.getBoundingClientRect();
    tooltip.style.left = rect.left + rect.width/2 - tooltip.offsetWidth/2 + 'px';
    tooltip.style.top = (rect.top - 36) + window.scrollY + 'px';
    setTimeout(() => tooltip.classList.add('visible'), 10);
  }
  function hideTip() {
    if (!tooltip) return;
    tooltip.classList.remove('visible');
    setTimeout(() => { if (tooltip) { tooltip.remove(); tooltip = null; } }, 180);
  }
});

// Pitch Decks Interactive Effects
(function() {
  'use strict';

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (prefersReducedMotion) {
    return; // Exit early if user prefers reduced motion
  }

  // Get all pitch deck cards
  const cards = document.querySelectorAll('.pd-card');
  
  // Add tilt effect to cards
  cards.forEach(card => {
    card.classList.add('tilt-enabled');
    
    let isHovering = false;
    let animationId = null;

    // Mouse move handler for tilt effect
    function handleMouseMove(e) {
      if (!isHovering) return;

      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;
      
      const maxTilt = 6; // Maximum tilt in degrees
      const tiltX = (mouseY / (rect.height / 2)) * maxTilt;
      const tiltY = (mouseX / (rect.width / 2)) * maxTilt;
      
      // Use requestAnimationFrame for smooth animation
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      
      animationId = requestAnimationFrame(() => {
        card.style.setProperty('--tilt-x', `${-tiltX}deg`);
        card.style.setProperty('--tilt-y', `${tiltY}deg`);
      });
    }

    // Mouse enter handler
    function handleMouseEnter() {
      isHovering = true;
    }

    // Mouse leave handler
    function handleMouseLeave() {
      isHovering = false;
      
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      
      // Reset tilt
      requestAnimationFrame(() => {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      });
    }

    // Touch device detection
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (!isTouchDevice) {
      card.addEventListener('mouseenter', handleMouseEnter);
      card.addEventListener('mouseleave', handleMouseLeave);
      card.addEventListener('mousemove', handleMouseMove);
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    });
  });

  // Add keyboard navigation support
  cards.forEach(card => {
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        // Cards are now display-only, no action needed
      }
    });
  });

  // Add focus management for better accessibility
  cards.forEach(card => {
    card.addEventListener('focus', () => {
      card.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    });
  });

})();
