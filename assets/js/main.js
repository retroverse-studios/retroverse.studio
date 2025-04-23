// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }
    
    // Close menu when clicking on a link
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.classList.remove('active');
        });
    });
    
    // Implement lazy loading for background images
    const lazyBackgrounds = [].slice.call(document.querySelectorAll('.game-image, .about-image'));

    if ('IntersectionObserver' in window) {
        let lazyBackgroundObserver = new IntersectionObserver(function(entries, observer) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    const style = window.getComputedStyle(entry.target);
                    const backgroundImage = style.backgroundImage;
                    if (backgroundImage !== 'none') {
                        entry.target.classList.add('visible');
                    }
                    lazyBackgroundObserver.unobserve(entry.target);
                }
            });
        });

        lazyBackgrounds.forEach(function(lazyBackground) {
            lazyBackgroundObserver.observe(lazyBackground);
        });
    }

    // Handle newsletter form submission
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        // Check for URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status');
        const email = urlParams.get('email');
        
        // Display feedback messages if returning from form submission
        if (status) {
            const messageContainer = document.querySelector('.newsletter-message') || document.createElement('div');
            messageContainer.className = 'newsletter-message';
            
            switch(status) {
                case 'success':
                    messageContainer.textContent = `Thanks for subscribing! We've sent a confirmation email to ${email || 'your address'}.`;
                    messageContainer.className = 'newsletter-message success';
                    break;
                case 'duplicate':
                    messageContainer.textContent = `It looks like ${email || 'this email'} is already subscribed.`;
                    messageContainer.className = 'newsletter-message info';
                    break;
                case 'invalid':
                    messageContainer.textContent = 'Please enter a valid email address.';
                    messageContainer.className = 'newsletter-message error';
                    break;
                case 'partial':
                    messageContainer.textContent = `You've been added to our list, but we couldn't send a confirmation email to ${email || 'your address'}.`;
                    messageContainer.className = 'newsletter-message warning';
                    break;
                default:
                    messageContainer.textContent = 'Something went wrong. Please try again.';
                    messageContainer.className = 'newsletter-message error';
            }
            
            // Add message to DOM
            const formContainer = document.querySelector('.newsletter .container');
            if (formContainer && !document.querySelector('.newsletter-message')) {
                formContainer.insertBefore(messageContainer, newsletterForm);
            }
        }
        
        // Form submission handler
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate email
            const emailInput = this.querySelector('input[type="email"]');
            const email = emailInput.value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (!emailRegex.test(email)) {
                const messageContainer = document.querySelector('.newsletter-message') || document.createElement('div');
                messageContainer.className = 'newsletter-message error';
                messageContainer.textContent = 'Please enter a valid email address.';
                
                // Add message to DOM
                const formContainer = document.querySelector('.newsletter .container');
                if (formContainer && !document.querySelector('.newsletter-message')) {
                    formContainer.insertBefore(messageContainer, newsletterForm);
                }
                
                return;
            }
            
            // Add a timestamp to track form duration (anti-bot measure)
            const formTime = document.createElement('input');
            formTime.type = 'hidden';
            formTime.name = 'form_time';
            formTime.value = Math.floor(Date.now() / 1000);
            this.appendChild(formTime);
            
            // Add a honeypot field (anti-bot measure)
            const honeypot = document.createElement('input');
            honeypot.type = 'text';
            honeypot.name = 'website';
            honeypot.style.display = 'none';
            this.appendChild(honeypot);
            
            // Show loading indicator
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Subscribing...';
            submitButton.disabled = true;
            
            // Submit the form to process-email.php
            this.action = 'api/process-email.php';
            this.method = 'post';
            this.submit();
        });
    }
});