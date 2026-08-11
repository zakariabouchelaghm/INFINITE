/**
 * turbo-init.js
 * Shared initialization helpers for Hotwired Turbo compatibility.
 *
 * The Turbo framework intercepts link clicks and replaces page content
 * without doing a full browser reload. This means scripts that run once on
 * DOMContentLoaded will NOT re-run when navigating between pages.
 *
 * This file provides a reusable `initPage()` function that re-initialises
 * all common page-level behaviours on every Turbo navigation, as well as
 * the first hard load.
 */

(function () {
    'use strict';

    /** Initialize reveal-on-scroll IntersectionObserver. */
    function initRevealAnimations() {
        // Support both .visible (index/projects/approach) and .active (services) activation classes
        const revealEls = document.querySelectorAll('.reveal-on-scroll');
        if (!revealEls.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');   // used by most pages
                    entry.target.classList.add('active');    // used by services.html
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

        revealEls.forEach(el => observer.observe(el));
    }

    /** Initialize reveal-mask clip-path animations (used on project pages). */
    function initRevealMask() {
        const maskEls = document.querySelectorAll('.reveal-mask');
        if (!maskEls.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.1 });

        maskEls.forEach(el => observer.observe(el));
    }

    /** Initialize reveal-up animations (used on jumeirah page). */
    function initRevealUp() {
        const upEls = document.querySelectorAll('.reveal-up');
        if (!upEls.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.1 });

        upEls.forEach(el => observer.observe(el));
    }

    /** Initialize reveal-line text animations (used on farm page). */
    function initRevealLines() {
        const lineEls = document.querySelectorAll('.reveal-line');
        lineEls.forEach(line => line.classList.add('revealed'));
    }

    /** Initialize navbar scroll shrink effect. */
    function initNavScroll() {
        // Remove any previously-bound scroll listener to avoid duplicates
        if (window._navScrollHandler) {
            window.removeEventListener('scroll', window._navScrollHandler);
        }

        window._navScrollHandler = () => {
            const nav = document.querySelector('nav');
            if (!nav) return;
            if (window.scrollY > 50) {
                nav.classList.add('py-2', 'shadow-md', 'bg-surface');
                nav.classList.remove('py-4', 'bg-surface/90');
            } else {
                nav.classList.remove('py-2', 'shadow-md', 'bg-surface');
                nav.classList.add('py-4', 'bg-surface/90');
            }
        };

        window.addEventListener('scroll', window._navScrollHandler, { passive: true });
    }

    /** Initialize mobile hamburger menu. */
    function initMobileMenu() {
        var btn = document.getElementById('mobile-hamburger');
        var cls = document.getElementById('mobile-close');
        if (btn) {
            btn.onclick = function () {
                var m = document.getElementById('mobile-menu');
                if (m) { m.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
            };
        }
        if (cls) {
            cls.onclick = function () {
                var m = document.getElementById('mobile-menu');
                if (m) { m.style.display = 'none'; document.body.style.overflow = ''; }
            };
        }
    }

    /** Master init — call this on every page load / Turbo navigation. */
    function initPage() {
        initRevealAnimations();
        initRevealMask();
        initRevealUp();
        initRevealLines();
        initNavScroll();
        initMobileMenu();

        // Re-run gallery lightbox init if available
        if (typeof window.initGalleryLightbox === 'function') {
            window.initGalleryLightbox();
        }
    }

    // Expose globally so inline scripts can call it too
    window.turboInitPage = initPage;

    // Fire on first hard load (DOMContentLoaded fires before Turbo is ready)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPage);
    } else {
        initPage();
    }

    // Fire on every subsequent Turbo page visit
    document.addEventListener('turbo:load', initPage);

    // Also re-run on turbo:render (for cached page renders)
    document.addEventListener('turbo:render', function () {
        // Only re-init if elements aren't already visible (avoid double-animating)
        var unrevealedEls = document.querySelectorAll('.reveal-on-scroll:not(.visible):not(.active)');
        if (unrevealedEls.length) initRevealAnimations();
    });
})();
