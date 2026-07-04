# RetroVerse Studios Website

The website for RetroVerse Studios, an indie game studio in Perth, Australia — built as a multi-mode "CSS Zen Garden": one HTML document, four completely different visual realities. Each visit boots into a random mode.

Live at [retroverse.studio](https://retroverse.studio) (GitHub Pages).

## The four realities

| Mode | Hash | Description |
|------|------|-------------|
| Terminal | `#mode-terminal` | Interactive hacker terminal with commands, matrix rain, and a Doom-style HUD |
| BBS | `#mode-bbs` | 1990s dial-up bulletin board with keyboard menu navigation |
| 8-Bit | `#mode-retro` | Side-scrolling platformer-style layout with world/level indicators |
| Forum | `#mode-forum` | Early-2000s message board with threads and replies |

A boot sequence picks a mode at random on every load (press any key to skip). Use the URL hash to force a mode, the floating switcher (bottom-right) to change modes, or the reboot button to re-randomise. Touch devices boot into the touch-friendly modes (8-bit or forum).

## Structure

- `index.html` — single page; all content lives here and is restyled per mode
- `assets/css/base.css` — shared variables, boot screen, mode switcher, reduced-motion support
- `assets/css/{terminal,bbs,retro,forum}.css` — one stylesheet per mode, loaded on demand
- `assets/js/app.js` — boot sequence, mode engine, terminal commands, BBS menus, side-scroller, forum renderer, easter eggs
- `api/process-email.php` — legacy newsletter endpoint; **not functional on GitHub Pages** (requires a PHP host or replacement with a form service)

## Easter eggs

- Konami code (works in every mode)
- Terminal commands: `ascii`, `matrix`, `sudo`, `rm -rf`, `whoami`, and more — type `help`
- Rare boot glitch messages (1 in 8 boots)
- Persistent visitor counter and XP system

## Credits

- Font: Press Start 2P (Google Fonts)

## License

MIT — see LICENSE.
