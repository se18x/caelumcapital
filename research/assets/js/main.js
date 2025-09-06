// ===== SIMPLIFIED JAVASCRIPT =====
// Research data and complex functionality removed for simplified page

// ===== DOM ELEMENTS =====
const accordionButtons = document.querySelectorAll('.accordion__button');

// ===== ACCORDION FUNCTIONALITY =====
accordionButtons.forEach(button => {
    button.addEventListener('click', () => {
        const isExpanded = button.getAttribute('aria-expanded') === 'true';
        const content = document.getElementById(button.getAttribute('aria-controls'));
        
        // Close all other accordions
        accordionButtons.forEach(otherButton => {
            if (otherButton !== button) {
                otherButton.setAttribute('aria-expanded', 'false');
                const otherContent = document.getElementById(otherButton.getAttribute('aria-controls'));
                otherContent.classList.remove('open');
            }
        });
        
        // Toggle current accordion
        button.setAttribute('aria-expanded', !isExpanded);
        if (!isExpanded) {
            content.classList.add('open');
        } else {
            content.classList.remove('open');
        }
    });
});


// ===== INTERSECTION OBSERVER FOR ANIMATIONS =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe elements for reveal animations
document.addEventListener('DOMContentLoaded', () => {
    const revealElements = document.querySelectorAll('.hero, .featured, .pmnote, .methodology, .disclosures, .subscribe');
    revealElements.forEach(el => {
        el.classList.add('reveal-in');
        observer.observe(el);
    });
});

// ===== SMOOTH SCROLLING FOR NAVIGATION LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerHeight = document.querySelector('.header--slim').offsetHeight;
            const targetPosition = target.offsetTop - headerHeight - 20;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Initial render
    filterData();
    
    // Add loading state
    document.body.classList.add('loaded');
});

// ===== ACCESSIBILITY ENHANCEMENTS =====

// Escape key to close accordions
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        accordionButtons.forEach(button => {
            button.setAttribute('aria-expanded', 'false');
            const content = document.getElementById(button.getAttribute('aria-controls'));
            content.classList.remove('open');
        });
    }
});

// ===== ERROR HANDLING =====
window.addEventListener('error', (e) => {
    console.error('JavaScript error:', e.error);
});
