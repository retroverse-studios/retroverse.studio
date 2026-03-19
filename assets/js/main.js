document.addEventListener('DOMContentLoaded', function () {
    // Mobile menu toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', function () {
            navLinks.classList.toggle('active');
        });

        document.querySelectorAll('.nav-links a').forEach(function (link) {
            link.addEventListener('click', function () {
                navLinks.classList.remove('active');
            });
        });
    }

    // Intersection Observer for fade-in elements
    var lazyElements = document.querySelectorAll(
        '.game-featured-image, .game-card-wide-image, .about-image'
    );

    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1 }
        );

        lazyElements.forEach(function (el) {
            observer.observe(el);
        });
    } else {
        // Fallback: show everything immediately
        lazyElements.forEach(function (el) {
            el.classList.add('visible');
        });
    }

    // Newsletter form
    var newsletterForm = document.querySelector('.newsletter-form');
    if (!newsletterForm) return;

    // Check for return status from form submission
    var urlParams = new URLSearchParams(window.location.search);
    var status = urlParams.get('status');
    var email = urlParams.get('email');

    if (status) {
        var msg = document.createElement('div');
        msg.className = 'newsletter-message';

        switch (status) {
            case 'success':
                msg.textContent = 'Thanks for subscribing! We\'ll be in touch at ' + (email || 'your address') + '.';
                msg.className += ' success';
                break;
            case 'duplicate':
                msg.textContent = (email || 'This email') + ' is already subscribed.';
                msg.className += ' info';
                break;
            case 'invalid':
                msg.textContent = 'Please enter a valid email address.';
                msg.className += ' error';
                break;
            case 'partial':
                msg.textContent = 'You\'re on the list, but we couldn\'t send a confirmation to ' + (email || 'your address') + '.';
                msg.className += ' warning';
                break;
            default:
                msg.textContent = 'Something went wrong. Please try again.';
                msg.className += ' error';
        }

        var formContainer = document.querySelector('.newsletter .container');
        if (formContainer) {
            formContainer.insertBefore(msg, newsletterForm);
        }
    }

    // Form submission
    newsletterForm.addEventListener('submit', function (e) {
        e.preventDefault();

        var emailInput = this.querySelector('input[type="email"]');
        var emailValue = emailInput.value.trim();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
            var existing = document.querySelector('.newsletter-message');
            if (existing) existing.remove();

            var errorMsg = document.createElement('div');
            errorMsg.className = 'newsletter-message error';
            errorMsg.textContent = 'Please enter a valid email address.';
            var container = document.querySelector('.newsletter .container');
            if (container) container.insertBefore(errorMsg, newsletterForm);
            return;
        }

        // Anti-bot: timing + honeypot
        var formTime = document.createElement('input');
        formTime.type = 'hidden';
        formTime.name = 'form_time';
        formTime.value = Math.floor(Date.now() / 1000);
        this.appendChild(formTime);

        var honeypot = document.createElement('input');
        honeypot.type = 'text';
        honeypot.name = 'website';
        honeypot.style.display = 'none';
        this.appendChild(honeypot);

        var submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Subscribing...';
        submitBtn.disabled = true;

        this.action = 'api/process-email.php';
        this.method = 'post';
        this.submit();
    });
});
