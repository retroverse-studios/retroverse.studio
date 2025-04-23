# RetroVerse Studios Website

A responsive website for RetroVerse Studios, a fictional indie game studio that creates retro-styled games with modern gameplay mechanics.

## Features

- Responsive design that works on mobile, tablet, and desktop
- Retro-styled visuals with modern UI elements
- Newsletter subscription system with secure email processing
- Lazy loading images for better performance
- Mobile-friendly navigation

## Structure

- `/img/` - Contains all website images
- `/scripts/` - JavaScript and PHP scripts
  - `main.js` - Main JavaScript for the site
  - `process-email.php` - Handles newsletter subscriptions
- `/styles/` - CSS stylesheets
  - `style.css` - Main stylesheet

## Setup

1. Clone the repository
2. Upload to a web server with PHP support
3. Ensure the `/data/` directory is created with appropriate permissions for newsletter signup storage

## Newsletter System

The newsletter system includes:

- Client-side email validation
- Anti-bot measures (honeypot field and timing checks)
- Secure storage of email addresses
- Admin notifications for new subscribers
- Duplicate prevention

## Credits

- Fonts: Press Start 2P (Google Fonts) and Roboto
- Images: Placeholder images via [Picsum Photos](https://picsum.photos/)

## License

All rights reserved.