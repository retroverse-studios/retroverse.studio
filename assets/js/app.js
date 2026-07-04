/* ═══════════════════════════════════════
   RetroVerse Studios — Multi-Mode Engine
   Boot, mode switching, terminal, BBS,
   side-scroll, matrix rain, doom HUD,
   idle hints, easter eggs
   ═══════════════════════════════════════ */

(function () {
    'use strict';

    var REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // No mailing list yet — flip to true (and re-enable the section + nav link
    // in index.html, pointing the form at a real endpoint) to bring it back
    var NEWSLETTER_ENABLED = false;

    // ═══ STATE ═══
    var state = {
        mode: 'boot',
        xp: 0,
        explored: new Set(),
        commandHistory: [],
        historyIndex: -1,
        panelsVisible: true,
        idleTimer: null,
        idleCount: 0,
        matrixAnim: null,
        matrixResize: null,
        hackerAnim: null,
        statsAnim: null,
        autoScrollTimer: null,
        autoScrollActive: false,
        currentSection: 0,
        konamiProgress: 0,
        visitorNumber: 0
    };

    // ═══ CONTENT DATA ═══
    var GAMES = [
        { id: 'swipeverse', name: 'SwipeVerse', status: 'FLAGSHIP', desc: 'Card-based survival strategy game powered by AI-generated narratives. Swipe to shape the fate of entire realities.', platforms: 'Web, Android, Windows, macOS', url: 'https://swipeverse.app', features: ['Swipe-based decisions', 'AI-generated storylines', 'Create your own realities', 'Works offline (PWA)'] },
        { id: 'stellas-evolution', name: "Stella's Evolution", status: 'GAME 1 OUT NOW', desc: 'Four-game puzzle-platformer series for real Atari 2600 hardware. From a bare 4K cartridge to an ARM coprocessor.', platforms: 'Atari 2600, Emulator', url: 'https://stellasevolution.retroverse.studio', features: ['Four games, one console', 'Real 2600 hardware', 'Game 1: Stella Was Alone (RC)'] },
        { id: 'glomph-maze', name: 'Glomph Maze', status: 'ACTIVE', desc: 'Text-based Pac-Man clone for the terminal. Navigate mazes, collect dots, avoid ghosts. Revived from a 1998 classic.', platforms: 'Linux, macOS, Windows', url: 'https://github.com/retroverse-studios/glomph-maze', features: ['Ghost AI', 'Custom mazes', 'Terminal-native'] },
        { id: 'incident-zero', name: 'Incident Zero', status: 'TABLETOP+DIGITAL', desc: 'Cooperative cybersecurity strategy game. One attacks, the rest defend. Powered by the MITRE ATT&CK framework.', platforms: 'Multiplayer, Tabletop, Web', url: 'https://incidentzero.retroverse.studio', features: ['2-7 players', 'AI threat scenarios', '6 modules', '171 cards'] }
    ];

    var TOOLS = [
        { id: 'karaoke-stage', name: 'Karaoke Stage', desc: 'Themed karaoke player supporting CDG+MP3 and LRC formats.', tech: 'Electron, React, TypeScript', url: 'https://karaokestage.retroverse.studio' },
        { id: 'visual-cataloguer', name: 'Visual Cataloguer', desc: 'Batch-catalogue physical collections using QR-code dividers and AI identification.', tech: 'Python, Docker, AI', url: 'https://visualcataloguer.retroverse.studio' },
        { id: 'virtual-lanes', name: 'Virtual Lanes', desc: 'Phone-first bowling companion. Bowl real frames against simulated rivals, journal every shot, track your stats — all offline, no accounts.', tech: 'PWA, Offline-first', url: 'https://virtuallanes.retroverse.studio' }
    ];

    var SECTIONS = [
        { id: 'hero', world: '1-1', name: 'START' },
        { id: 'games', world: '1-2', name: 'GAME CATALOG' },
        { id: 'tools', world: '1-3', name: 'TOOLS & APPS' },
        { id: 'about', world: '1-4', name: 'ABOUT' },
        { id: 'newsletter', world: '2-1', name: 'NEWSLETTER' }
    ];

    if (!NEWSLETTER_ENABLED) {
        SECTIONS = SECTIONS.filter(function (s) { return s.id !== 'newsletter'; });
    }

    var IDLE_HINTS = [
        '[SYSTEM] Try typing "help" for available commands.',
        '[SYSTEM] Type "games" to see our game catalog.',
        '[SYSTEM] Curious about a game? Try "play 1" through "play 4".',
        '[SYSTEM] Type "about" to learn about the studio.',
        '[SYSTEM] Press TAB to toggle the side panels.',
        '[SYSTEM] Press ESC to switch display modes.',
        '[SYSTEM] Type "tools" to see our development tools.',
        '[SYSTEM] Type "ascii" for a surprise.',
        '[SYSTEM] Try "matrix" to toggle the matrix rain.',
        '[SYSTEM] Type "mode bbs" or "mode retro" to switch views.',
        '[SYSTEM] All our games are open source and free!',
        '[SYSTEM] Type "subscribe" to join the newsletter.',
        '[SYSTEM] Try the Konami code... up up down down left right left right b a',
        '[SYSTEM] You are visitor #{visitor} to this reality.'
    ];

    if (!NEWSLETTER_ENABLED) {
        IDLE_HINTS = IDLE_HINTS.filter(function (h) { return h.indexOf('subscribe') === -1; });
    }

    var HACKER_LINES = [
        '[OK] Establishing secure connection...',
        '[OK] Connected to retroverse.studio:443',
        '> SELECT * FROM realities WHERE active=1',
        '  4 rows returned',
        '[OK] Decrypting payload: ████████████',
        '> ping multiverse.local',
        '  Reply from 10.0.0.1: time=2ms',
        '[WARN] Anomaly detected in sector 7G',
        '[OK] Reality engine v2.0 loaded',
        '> nmap -sV retroverse.studio',
        '  PORT    STATE  SERVICE',
        '  443/tcp open   https',
        '  8080/tcp open  games-api',
        '[OK] Compiling shader: pixel_nostalgia.glsl',
        '[OK] Loading universe: cyberpunk_dystopia',
        '> git log --oneline -3',
        '  a7a61b8 Cache-bust CSS',
        '  ca0239b Create CNAME',
        '  3bd1f64 Update Incident Zero link',
        '[WARN] Quantum fluctuation in timeline B',
        '[OK] Syncing save states across realities...',
        '> cat /etc/motd',
        '  Welcome to RetroVerse OS v2.0',
        '[OK] Ghost AI pathfinding initialized',
        '[OK] Loading MITRE ATT&CK framework...',
        '[WARN] Swipe detected in reality #42',
        '> df -h /dev/reality',
        '  Filesystem  Size  Used  Avail',
        '  /dev/rvs0   inf   42G   inf',
        '[OK] All systems nominal'
    ];

    var BOOT_TIPS = [
        'TIP: All RetroVerse games are open source!',
        'TIP: Try the Konami code in any mode...',
        'TIP: This site has 4 display modes. Hit the reboot button to randomise!',
        'TIP: In terminal mode, type "ascii" for ASCII art.',
        'TIP: SwipeVerse works offline as a PWA.',
        'TIP: Incident Zero has 171 unique cards.',
        'TIP: In retro mode, use arrow keys to side-scroll.',
        'DID YOU KNOW: Glomph Maze was originally written in 1998.',
        'DID YOU KNOW: RetroVerse Studios is based in Perth, Australia.',
        'DID YOU KNOW: Stella\'s Evolution is inspired by the Atari 2600.',
        'FUN FACT: The terminal mode has a Doom-style HUD.',
        'FUN FACT: You are visitor #{visitor} to this reality.'
    ];

    var DOOM_FACES = {
        normal: ' >_< ',
        happy: ' ^_^ ',
        wow:   ' O_O ',
        cool:  ' B-) ',
        angry: ' >:( ',
        dead:  ' X_X '
    };

    // ═══ DOM REFS ═══
    var $ = function (sel) { return document.querySelector(sel); };

    // ═══ VISITOR COUNTER ═══
    function initVisitorCounter() {
        var count = parseInt(localStorage.getItem('rv_visits') || '0', 10) + 1;
        localStorage.setItem('rv_visits', count.toString());
        state.visitorNumber = 41999 + count; // start from a fun number
    }

    // ═══ BOOT SEQUENCE ═══
    function boot() {
        var bootEl = $('#boot-text');
        var fillEl = $('#boot-fill');
        var modes = ['terminal', 'bbs', 'retro', 'forum'];

        // Terminal/BBS are keyboard-driven — on touch devices pick a touch-friendly reality
        var isTouch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        var pool = isTouch ? ['retro', 'forum'] : modes;
        var chosenMode = pool[Math.floor(Math.random() * pool.length)];

        // Check URL hash for forced mode
        var hash = window.location.hash.replace('#mode-', '');
        if (modes.indexOf(hash) !== -1) chosenMode = hash;

        // Random boot tip
        var tip = BOOT_TIPS[Math.floor(Math.random() * BOOT_TIPS.length)]
            .replace('{visitor}', state.visitorNumber);

        // Rare glitch (1 in 8 chance)
        var glitchLine = '';
        if (Math.random() < 0.125) {
            var glitches = [
                'ERROR: Reality buffer overflow... correcting...',
                'WARNING: Timeline divergence detected. Merging...',
                'ALERT: Visitor from parallel universe identified.',
                'NOTICE: Pixel degradation in sector 4. Repairing...',
                'WARNING: Ghost AI escaped containment. Recapturing...'
            ];
            glitchLine = glitches[Math.floor(Math.random() * glitches.length)];
        }

        var lines = [
            'RETROVERSE BIOS v1.0',
            'Copyright (C) 2026 RetroVerse Studios',
            '',
            'Checking memory.......... 640K OK',
            'Detecting peripherals:',
            '  Keyboard .............. OK',
            '  CRT Display ........... OK',
            '  Modem ................. 2400 baud',
            ''
        ];

        if (glitchLine) {
            lines.push(glitchLine);
            lines.push('');
        }

        lines = lines.concat([
            'Loading RETROVERSE.SYS...',
            '',
            'RetroVerse OS v2.0 loaded.',
            'Perth, Australia | Node 1 of 4',
            'Visitor #' + state.visitorNumber,
            '',
            tip,
            '',
            'Initializing random reality...',
            'Reality selected: ' + chosenMode.toUpperCase(),
            '',
            'Booting into ' + chosenMode.toUpperCase() + ' mode...'
        ]);

        var currentLine = 0;
        var text = '';
        var bootTimer = null;
        var finished = false;

        function finishBoot() {
            if (finished) return;
            finished = true;
            removeSkipListeners();
            fillEl.style.width = '100%';
            setTimeout(function () {
                $('#boot-screen').classList.add('done');
                setTimeout(function () {
                    // Keep the URL hash-free on a random boot so reloads stay random;
                    // only deliberate mode switches pin the reality in the URL
                    switchMode(chosenMode, hash === chosenMode);
                }, 500);
            }, 400);
        }

        function skipBoot() {
            clearTimeout(bootTimer);
            bootEl.textContent = lines.join('\n');
            finishBoot();
        }

        function removeSkipListeners() {
            document.removeEventListener('keydown', skipBoot);
            document.removeEventListener('pointerdown', skipBoot);
        }

        function nextLine() {
            if (finished) return;
            if (currentLine >= lines.length) {
                finishBoot();
                return;
            }

            text += lines[currentLine] + '\n';
            bootEl.textContent = text;
            fillEl.style.width = Math.round((currentLine / lines.length) * 100) + '%';
            currentLine++;

            var delay = 60;
            var prevLine = lines[currentLine - 1] || '';
            if (prevLine === '') delay = 30;
            if (prevLine.indexOf('...') !== -1) delay = 300;
            if (prevLine.indexOf('OK') !== -1) delay = 120;
            if (prevLine.indexOf('ERROR') !== -1 || prevLine.indexOf('WARNING') !== -1 || prevLine.indexOf('ALERT') !== -1) delay = 600;
            if (prevLine.indexOf('TIP') === 0 || prevLine.indexOf('DID') === 0 || prevLine.indexOf('FUN') === 0) delay = 800;
            if (REDUCED_MOTION) delay = 15;

            bootTimer = setTimeout(nextLine, delay);
        }

        document.addEventListener('keydown', skipBoot);
        document.addEventListener('pointerdown', skipBoot);
        bootTimer = setTimeout(nextLine, 500);
    }

    // ═══ REBOOT ═══
    function reboot() {
        // Clear any #mode-x hash so the reboot genuinely randomises
        if (window.history && history.replaceState) {
            history.replaceState(null, '', window.location.pathname + window.location.search);
        }

        // Reset boot screen
        var bootScreen = $('#boot-screen');
        bootScreen.classList.remove('done');
        $('#boot-text').textContent = '';
        $('#boot-fill').style.width = '0%';

        // Stop everything
        stopAnimations();
        state.mode = 'boot';
        document.documentElement.setAttribute('data-mode', 'boot');
        $('#mode-switcher').classList.remove('visible');

        // Run boot again
        setTimeout(boot, 300);
    }

    // ═══ MODE SWITCHING ═══
    function switchMode(mode, updateHash) {
        stopAnimations();

        state.mode = mode;
        document.documentElement.setAttribute('data-mode', mode);

        // Reflect mode in the URL so the current reality is shareable
        if (updateHash !== false && window.history && history.replaceState) {
            history.replaceState(null, '', '#mode-' + mode);
        }

        // Load mode-specific stylesheet
        $('#mode-stylesheet').href = 'assets/css/' + mode + '.css';

        // Update mode switcher buttons
        document.querySelectorAll('.mode-btn[data-mode]').forEach(function (btn) {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        $('#mode-switcher').classList.add('visible');

        if (mode === 'terminal') initTerminal();
        if (mode === 'bbs') initBBS();
        if (mode === 'retro') initRetro();
        if (mode === 'forum') initForum();

        setFace('cool');
        setTimeout(function () { setFace('normal'); }, 2000);
    }

    // ═══════════════════════════════════════
    // TERMINAL MODE
    // ═══════════════════════════════════════

    var termOutput = null;

    function initTerminal() {
        termOutput = $('#term-output');
        termOutput.innerHTML = '';

        $('#term-input-bar').style.display = 'flex';
        $('#doom-hud').style.display = 'flex';

        termPrint('+------------------------------------------+', 'accent');
        termPrint('|   RETROVERSE STUDIOS TERMINAL v2.0       |', 'accent');
        termPrint('|   Independent Game Studio | Perth, AU    |', 'accent');
        termPrint('+------------------------------------------+', 'accent');
        termPrint('');
        termPrint('Where Classic Pixels Meet Next-Gen Choices', 'secondary');
        termPrint('Visitor #' + state.visitorNumber, 'muted');
        termPrint('');
        termPrint('Type "help" for commands, or just explore.', 'muted');
        termPrint('All games are open source and free.', 'muted');
        termPrint('');

        var input = $('#term-input');
        input.value = '';
        setTimeout(function () { input.focus(); }, 100);

        input.onkeydown = handleTermKey;
        document.addEventListener('click', focusTermInput);

        if (REDUCED_MOTION) {
            $('#matrix-canvas').style.display = 'none'; // opt back in with the "matrix" command
        } else {
            startMatrix();
        }
        startHacker();
        startStats();
        startIdle();
        setFace('normal');
        updateHUD();
    }

    function focusTermInput() {
        if (state.mode === 'terminal') {
            var input = $('#term-input');
            if (input) input.focus();
        }
    }

    function handleTermKey(e) {
        var input = $('#term-input');
        if (e.key === 'Enter') {
            var cmd = input.value.trim();
            input.value = '';
            if (cmd) {
                state.commandHistory.push(cmd);
                state.historyIndex = state.commandHistory.length;
                processCommand(cmd);
                addXP(1);
            }
            resetIdle();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (state.historyIndex > 0) {
                state.historyIndex--;
                input.value = state.commandHistory[state.historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (state.historyIndex < state.commandHistory.length - 1) {
                state.historyIndex++;
                input.value = state.commandHistory[state.historyIndex];
            } else {
                state.historyIndex = state.commandHistory.length;
                input.value = '';
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            togglePanels();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cycleMode();
        } else {
            resetIdle();
        }
        handleKonami(e);
    }

    function termPrint(text, color) {
        if (!termOutput) return;
        var line = document.createElement('div');
        line.className = 'term-line' + (color ? ' term-line--' + color : '');
        line.textContent = text;
        termOutput.appendChild(line);
        termOutput.scrollTop = termOutput.scrollHeight;
    }

    function processCommand(cmd) {
        termPrint('> ' + cmd, 'accent');
        var parts = cmd.toLowerCase().split(/\s+/);
        var action = parts[0];
        var arg = parts.slice(1).join(' ');

        switch (action) {
            case 'help': case '?':
                explore('help');
                termPrint('');
                termPrint('AVAILABLE COMMANDS:', 'accent');
                termPrint('  help          Show this help');
                termPrint('  games         List all games');
                termPrint('  play <1-4>    View game details');
                termPrint('  tools         List development tools');
                termPrint('  about         About the studio');
                if (NEWSLETTER_ENABLED) termPrint('  subscribe     Newsletter signup');
                termPrint('  open <1-7>    Open game/tool link');
                termPrint('  clear         Clear terminal');
                termPrint('  panels        Toggle side panels');
                termPrint('  matrix        Toggle matrix rain');
                termPrint('  ascii         Show ASCII art');
                termPrint('  mode <name>   Switch mode (bbs/retro/terminal/forum)');
                termPrint('  reboot        Reboot into random mode');
                termPrint('');
                termPrint('KEYBOARD:', 'muted');
                termPrint('  TAB           Toggle panels', 'muted');
                termPrint('  ESC           Cycle modes', 'muted');
                termPrint('  UP/DOWN       Command history', 'muted');
                break;

            case 'games': case 'ls':
                explore('games');
                termPrint('');
                termPrint('+--+----------------------+-------------------+', 'accent');
                termPrint('| #| TITLE                | STATUS            |', 'accent');
                termPrint('+--+----------------------+-------------------+', 'accent');
                GAMES.forEach(function (g, i) {
                    termPrint('| ' + (i+1) + '| ' + pad(g.name, 20) + ' | ' + pad(g.status, 17) + ' |');
                });
                termPrint('+--+----------------------+-------------------+', 'accent');
                termPrint('');
                termPrint('Type "play 1" through "play 4" for details.', 'muted');
                break;

            case 'play': case 'game': case 'info':
                var idx = parseInt(arg) - 1;
                if (idx >= 0 && idx < GAMES.length) {
                    var g = GAMES[idx];
                    explore('games');
                    termPrint('');
                    termPrint('--- ' + g.name.toUpperCase() + ' ---', 'accent');
                    termPrint('Status: ' + g.status, 'warn');
                    termPrint('');
                    termPrint(g.desc);
                    termPrint('');
                    termPrint('Platforms: ' + g.platforms, 'secondary');
                    if (g.features.length) {
                        termPrint('');
                        g.features.forEach(function (f) { termPrint('  > ' + f, 'muted'); });
                    }
                    if (g.url) {
                        termPrint('');
                        termPrint('Link: ' + g.url, 'accent');
                        termPrint('Type "open ' + (idx+1) + '" to visit.', 'muted');
                    }
                    setFace('happy');
                    setTimeout(function () { setFace('normal'); }, 3000);
                } else {
                    termPrint('Usage: play <1-4>', 'danger');
                    setFace('angry');
                    setTimeout(function () { setFace('normal'); }, 2000);
                }
                break;

            case 'tools':
                explore('tools');
                termPrint('');
                termPrint('═══ TOOLS & APPS ---', 'accent');
                termPrint('');
                TOOLS.forEach(function (t, i) {
                    termPrint((i+1) + '. ' + t.name, 'secondary');
                    termPrint('   ' + t.desc, 'muted');
                    termPrint('   Tech: ' + t.tech);
                    termPrint('   ' + t.url, 'accent');
                    termPrint('');
                });
                break;

            case 'about':
                explore('about');
                termPrint('');
                termPrint('═══ ABOUT RETROVERSE STUDIOS ---', 'accent');
                termPrint('');
                termPrint('Independent game studio, Perth, Australia.');
                termPrint('Retro-pixel aesthetics + cutting-edge AI.');
                termPrint('');
                termPrint('RETRO:', 'warn');
                termPrint('  Pixel art, CRT aesthetics, hardware-era');
                termPrint('  design constraints as creative fuel.');
                termPrint('');
                termPrint('VERSE:', 'warn');
                termPrint('  Multiple realities, branching narratives,');
                termPrint('  player-created worlds.');
                termPrint('');
                termPrint('All games open source. All games free.', 'accent');
                termPrint('GitHub: github.com/retroverse-studios', 'secondary');
                break;

            case 'subscribe': case 'newsletter':
                if (!NEWSLETTER_ENABLED) {
                    termPrint('');
                    termPrint('No newsletter just yet — maybe in a future reality.', 'muted');
                    termPrint('Follow along instead: github.com/retroverse-studios', 'secondary');
                    break;
                }
                explore('newsletter');
                termPrint('');
                termPrint('═══ NEWSLETTER ---', 'accent');
                termPrint('Dev updates, pixel art reveals, early access.');
                termPrint('No spam, just signal.');
                termPrint('');
                termPrint('Visit: retroverse.studio/#newsletter', 'secondary');
                termPrint('(Or type "mode retro" to use the form)', 'muted');
                break;

            case 'open':
                var oidx = parseInt(arg) - 1;
                var items = GAMES.concat(TOOLS);
                if (oidx >= 0 && oidx < items.length && items[oidx].url) {
                    termPrint('Opening ' + items[oidx].url + '...', 'accent');
                    window.open(items[oidx].url, '_blank');
                } else {
                    termPrint('Usage: open <number>', 'danger');
                }
                break;

            case 'clear': case 'cls':
                if (termOutput) termOutput.innerHTML = '';
                break;

            case 'panels':
                togglePanels();
                break;

            case 'matrix':
                var canvas = $('#matrix-canvas');
                if (canvas) {
                    var vis = canvas.style.display !== 'none';
                    if (vis) {
                        canvas.style.display = 'none';
                        stopMatrix();
                        termPrint('Matrix rain: OFF', 'muted');
                    } else {
                        canvas.style.display = 'block';
                        startMatrix();
                        termPrint('Matrix rain: ON', 'accent');
                    }
                }
                break;

            case 'ascii':
                explore('easter');
                addXP(10);
                termPrint('');
                termPrint('  ____      _             __     __                  ', 'accent');
                termPrint(' |  _ \\ ___| |_ _ __ ___  \\ \\   / /__ _ __ ___  ___ ', 'accent');
                termPrint(' | |_) / _ \\ __| \'__/ _ \\  \\ \\ / / _ \\ \'__/ __|/ _ \\', 'accent');
                termPrint(' |  _ <  __/ |_| | | (_) |  \\ V /  __/ |  \\__ \\  __/', 'accent');
                termPrint(' |_| \\_\\___|\\__|_|  \\___/    \\_/ \\___|_|  |___/\\___|', 'accent');
                termPrint('');
                termPrint('                  S T U D I O S', 'secondary');
                termPrint('        Where Classic Pixels Meet Next-Gen', 'muted');
                setFace('wow');
                setTimeout(function () { setFace('normal'); }, 4000);
                break;

            case 'mode':
                if (['bbs', 'retro', 'terminal', 'forum'].indexOf(arg) !== -1) {
                    termPrint('Switching to ' + arg.toUpperCase() + '...', 'warn');
                    setTimeout(function () { switchMode(arg); }, 500);
                } else {
                    termPrint('Modes: terminal, bbs, retro, forum', 'muted');
                }
                break;

            case 'reboot':
                termPrint('Rebooting...', 'warn');
                setTimeout(reboot, 500);
                break;

            case 'whoami':
                termPrint('visitor #' + state.visitorNumber + ' — Level ' + Math.floor(state.xp / 10) + ' RetroVerser', 'accent');
                break;

            case 'date':
                termPrint(new Date().toString(), 'muted');
                break;

            case 'uptime':
                var s = Math.floor((Date.now() - window._bootTime) / 1000);
                termPrint('Uptime: ' + Math.floor(s/60) + 'm ' + (s%60) + 's', 'muted');
                break;

            case 'visitors': case 'counter':
                termPrint('You are visitor #' + state.visitorNumber + ' to this reality.', 'accent');
                termPrint('Total visits from this browser: ' + (localStorage.getItem('rv_visits') || '1'), 'muted');
                break;

            case 'sudo':
                termPrint('Nice try. This incident will be reported.', 'danger');
                setFace('angry');
                setTimeout(function () { setFace('normal'); }, 3000);
                break;

            case 'exit': case 'quit': case 'logout':
                termPrint('There is no escape from the RetroVerse.', 'warn');
                setFace('wow');
                setTimeout(function () { setFace('normal'); }, 3000);
                break;

            case 'rm':
                if (arg.indexOf('-rf') !== -1) {
                    termPrint('NICE TRY. Reality preserved.', 'danger');
                    setFace('angry');
                    setTimeout(function () { setFace('normal'); }, 3000);
                } else {
                    termPrint(action + ': command not found.', 'danger');
                }
                break;

            case 'konami':
                triggerKonami();
                break;

            default:
                termPrint(action + ': command not found. Type "help".', 'danger');
                setFace('angry');
                setTimeout(function () { setFace('normal'); }, 1500);
        }

        termPrint('');
        updateHUD();
    }

    // ═══════════════════════════════════════
    // MATRIX RAIN
    // ═══════════════════════════════════════

    function startMatrix() {
        var canvas = $('#matrix-canvas');
        if (!canvas || canvas.style.display === 'none') return;

        stopMatrix(); // never stack intervals or resize listeners

        var ctx = canvas.getContext('2d');
        var chars = 'アイウエオカキクケコサシスセソタチツテト0123456789RETROVERSE';
        var fontSize = 10;
        var drops = [];

        function resize() {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
            var columns = Math.floor(canvas.width / fontSize);
            while (drops.length < columns) drops.push(Math.random() * -100);
            drops.length = columns;
        }
        resize();

        function draw() {
            ctx.fillStyle = 'rgba(0,0,0,0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#00ff99';
            ctx.font = fontSize + 'px monospace';
            for (var i = 0; i < drops.length; i++) {
                ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            }
        }

        window.addEventListener('resize', resize);
        state.matrixResize = resize;
        state.matrixAnim = setInterval(draw, 50);
    }

    function stopMatrix() {
        if (state.matrixAnim) { clearInterval(state.matrixAnim); state.matrixAnim = null; }
        if (state.matrixResize) { window.removeEventListener('resize', state.matrixResize); state.matrixResize = null; }
    }

    // ═══════════════════════════════════════
    // HACKER FEED
    // ═══════════════════════════════════════

    function startHacker() {
        var el = $('#hacker-log');
        if (!el) return;
        var idx = 0;
        function add() {
            el.textContent += HACKER_LINES[idx % HACKER_LINES.length] + '\n';
            var lines = el.textContent.split('\n');
            if (lines.length > 8) el.textContent = lines.slice(-8).join('\n');
            idx++;
        }
        add();
        state.hackerAnim = setInterval(add, 2500);
    }

    // ═══════════════════════════════════════
    // STATS PANEL
    // ═══════════════════════════════════════

    function startStats() {
        var el = $('#stats-log');
        if (!el) return;
        function update() {
            var cpu = 40 + Math.floor(Math.random() * 50);
            var mem = 55 + Math.floor(Math.random() * 30);
            var net = 10 + Math.floor(Math.random() * 60);
            var disk = 87 + Math.floor(Math.random() * 8);
            var s = Math.floor((Date.now() - window._bootTime) / 1000);
            el.textContent =
                '+-- SYSTEM -----+\n|               |\n' +
                '| CPU:  ' + bar(cpu,6) + '  |\n|       ' + pad(cpu+'%',8) + '|\n|               |\n' +
                '| MEM:  ' + bar(mem,6) + '  |\n|       ' + pad(mem+'%',8) + '|\n|               |\n' +
                '| NET:  ' + bar(net,6) + '  |\n|       ' + pad(net+'%',8) + '|\n|               |\n' +
                '| DISK: ' + bar(disk,6) + '  |\n|       ' + pad(disk+'%',8) + '|\n|               |\n' +
                '+---------------+\n' +
                '| UP: ' + pad(pad2(Math.floor(s/60)) + ':' + pad2(s%60), 9) + ' |\n' +
                '| USERS: 1      |\n| MODE: TERM    |\n| NODE: Perth   |\n' +
                '+---------------+';
        }
        update();
        state.statsAnim = setInterval(update, 3000);
    }

    // ═══════════════════════════════════════
    // DOOM HUD
    // ═══════════════════════════════════════

    function setFace(mood) {
        var el = $('#hud-face-art');
        if (el) el.textContent = DOOM_FACES[mood] || DOOM_FACES.normal;
    }

    function addXP(n) { state.xp += n; updateHUD(); }

    function explore(section) { state.explored.add(section); updateHUD(); }

    function updateHUD() {
        var xpEl = $('#hud-xp');
        var expEl = $('#hud-explored');
        var powEl = $('#hud-power');
        if (xpEl) xpEl.textContent = String(state.xp).padStart(3, '0');
        var explorable = NEWSLETTER_ENABLED ? 7 : 6; // help, games, tools, about, easter, konami (+newsletter)
        if (expEl) expEl.style.width = Math.min(100, Math.round((state.explored.size / explorable) * 100)) + '%';
        if (powEl) powEl.style.width = Math.min(100, 50 + state.xp * 2) + '%';
    }

    // ═══════════════════════════════════════
    // IDLE DETECTION
    // ═══════════════════════════════════════

    function startIdle() { resetIdle(); }

    function resetIdle() {
        clearTimeout(state.idleTimer);
        if (state.mode !== 'terminal') return;
        state.idleTimer = setTimeout(function hint() {
            if (state.mode !== 'terminal') return;
            termPrint(IDLE_HINTS[state.idleCount % IDLE_HINTS.length].replace('{visitor}', state.visitorNumber), 'system');
            state.idleCount++;
            state.idleTimer = setTimeout(hint, 12000);
        }, 10000);
    }

    function togglePanels() {
        state.panelsVisible = !state.panelsVisible;
        document.body.classList.toggle('panels-hidden', !state.panelsVisible);
        if (state.mode === 'terminal') termPrint('Panels: ' + (state.panelsVisible ? 'ON' : 'OFF'), 'muted');
    }

    function cycleMode() {
        var modes = ['terminal', 'bbs', 'retro', 'forum'];
        switchMode(modes[(modes.indexOf(state.mode) + 1) % modes.length]);
    }

    // ═══════════════════════════════════════
    // KONAMI CODE
    // ═══════════════════════════════════════

    var KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];

    function handleKonami(e) {
        if (e.key === KONAMI[state.konamiProgress]) {
            state.konamiProgress++;
            if (state.konamiProgress === KONAMI.length) {
                state.konamiProgress = 0;
                triggerKonami();
            }
        } else {
            state.konamiProgress = 0;
        }
    }

    function triggerKonami() {
        addXP(30);
        explore('konami');
        if (state.mode === 'terminal') {
            termPrint('');
            termPrint('★ ★ ★  KONAMI CODE ACTIVATED  ★ ★ ★', 'warn');
            termPrint('');
            termPrint('+30 XP!  You found the secret!', 'accent');
            termPrint('');
            termPrint('   [UP] [UP] [DN] [DN]', 'warn');
            termPrint('   [LT] [RT] [LT] [RT] [B] [A]', 'warn');
            termPrint('');
        }
        setFace('wow');
        setTimeout(function () { setFace('happy'); }, 3000);
        setTimeout(function () { setFace('normal'); }, 6000);

        // Visual flash
        if (!REDUCED_MOTION) {
            document.body.style.transition = 'filter 0.2s';
            document.body.style.filter = 'brightness(2) hue-rotate(90deg)';
            setTimeout(function () {
                document.body.style.filter = '';
            }, 300);
        }
    }

    // ═══════════════════════════════════════
    // BBS MODE
    // ═══════════════════════════════════════

    var bbsOutput = null;
    var bbsPage = 'main';

    function initBBS() {
        bbsOutput = $('#bbs-output');
        bbsOutput.innerHTML = '';

        $('#bbs-input-bar').style.display = 'flex';

        bbsPage = 'main';
        showBBSPage('main');

        var input = $('#bbs-input');
        input.value = '';
        setTimeout(function () { input.focus(); }, 100);

        input.onkeydown = function (e) {
            if (e.key === 'Enter') {
                handleBBSInput(input.value.trim().toLowerCase());
                input.value = '';
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cycleMode();
            }
            handleKonami(e);
        };

        document.addEventListener('click', focusBBSInput);
    }

    function focusBBSInput() {
        if (state.mode === 'bbs') {
            var inp = $('#bbs-input');
            if (inp) inp.focus();
        }
    }

    function bbsPrint(text, cls) {
        if (!bbsOutput) return;
        var line = document.createElement('div');
        line.className = 'bbs-line' + (cls ? ' bbs-' + cls : '');
        line.textContent = text;
        bbsOutput.appendChild(line);
    }

    function bbsClear() { if (bbsOutput) bbsOutput.innerHTML = ''; }

    function showBBSPage(page) {
        bbsClear();
        bbsPage = page;

        switch (page) {
            case 'main':
                bbsPrint('', 'cyan');
                bbsPrint(' ###  #### ##### ###   ##', 'green');
                bbsPrint(' #  # #      #   #  # #  #', 'green');
                bbsPrint(' #  # #      #   #  # #  #', 'green');
                bbsPrint(' ###  ###    #   ###  #  #', 'green');
                bbsPrint(' # #  #      #   # #  #  #', 'green');
                bbsPrint(' #  # #      #   #  # #  #', 'green');
                bbsPrint(' #  # ####   #   #  #  ##', 'green');
                bbsPrint('', 'cyan');
                bbsPrint('      V E R S E   B B S', 'cyan');
                bbsPrint('', 'cyan');
                bbsPrint('========================================', 'cyan');
                bbsPrint('  SysOp: Michael  |  Perth, Australia', 'yellow');
                bbsPrint('  2400 baud       |  ANSI Graphics: ON', 'yellow');
                bbsPrint('  Node 1 of 4     |  Visitor #' + state.visitorNumber, 'yellow');
                bbsPrint('========================================', 'cyan');
                bbsPrint('');
                bbsPrint('--- MESSAGE OF THE DAY ---', 'yellow');
                bbsPrint('');
                bbsPrint('  Welcome to the RetroVerse BBS!');
                bbsPrint('  All games are open source and free.');
                bbsPrint('  New: Incident Zero now has 171 cards!');
                bbsPrint('');
                bbsPrint('----------------------------------------', 'cyan');
                bbsPrint('');
                bbsPrint('  [G]  Game Catalog', 'white');
                bbsPrint('  [T]  Tools & Apps', 'white');
                bbsPrint('  [A]  About the SysOp', 'white');
                if (NEWSLETTER_ENABLED) bbsPrint('  [N]  Newsletter Signup', 'white');
                bbsPrint('  [M]  Switch Display Mode', 'white');
                bbsPrint('  [R]  Reboot System', 'white');
                bbsPrint('');
                bbsPrint('  Press a letter key to navigate.', 'gray');
                break;

            case 'games':
                bbsPrint('========================================', 'cyan');
                bbsPrint('         GAME CATALOG', 'cyan');
                bbsPrint('========================================', 'cyan');
                bbsPrint('');
                GAMES.forEach(function (g, i) {
                    bbsPrint('  [' + (i+1) + ']  ' + g.name, 'yellow');
                    bbsPrint('       Status: ' + g.status, 'gray');
                    bbsPrint('       ' + g.desc.substring(0, 70) + '...', 'white');
                    bbsPrint('       Platforms: ' + g.platforms, 'green');
                    if (g.url) bbsPrint('       URL: ' + g.url, 'cyan');
                    bbsPrint('');
                });
                bbsPrint('  [B]  Back to Main Menu', 'gray');
                break;

            case 'tools':
                bbsPrint('========================================', 'cyan');
                bbsPrint('         TOOLS & APPS', 'cyan');
                bbsPrint('========================================', 'cyan');
                bbsPrint('');
                TOOLS.forEach(function (t, i) {
                    bbsPrint('  [' + (i+1) + ']  ' + t.name, 'yellow');
                    bbsPrint('       ' + t.desc, 'white');
                    bbsPrint('       Tech: ' + t.tech, 'green');
                    bbsPrint('       URL: ' + t.url, 'cyan');
                    bbsPrint('');
                });
                bbsPrint('  [B]  Back to Main Menu', 'gray');
                break;

            case 'about':
                bbsPrint('========================================', 'cyan');
                bbsPrint('         ABOUT THE SYSOP', 'cyan');
                bbsPrint('========================================', 'cyan');
                bbsPrint('');
                bbsPrint('  RetroVerse Studios', 'yellow');
                bbsPrint('  Independent Game Studio', 'white');
                bbsPrint('  Perth, Australia', 'white');
                bbsPrint('');
                bbsPrint('  We fuse retro-pixel aesthetics with', 'white');
                bbsPrint('  cutting-edge decision algorithms.', 'white');
                bbsPrint('');
                bbsPrint('  RETRO: Pixel art, CRT aesthetics, and', 'green');
                bbsPrint('  hardware-era constraints as creative fuel.', 'green');
                bbsPrint('');
                bbsPrint('  VERSE: Multiple realities, branching', 'magenta');
                bbsPrint('  narratives, player-created worlds.', 'magenta');
                bbsPrint('');
                bbsPrint('  GitHub: github.com/retroverse-studios', 'cyan');
                bbsPrint('');
                bbsPrint('  [B]  Back to Main Menu', 'gray');
                break;

            case 'newsletter':
                bbsPrint('========================================', 'cyan');
                bbsPrint('         NEWSLETTER', 'cyan');
                bbsPrint('========================================', 'cyan');
                bbsPrint('');
                bbsPrint('  Dev updates, pixel art reveals, and', 'white');
                bbsPrint('  early-access opportunities.', 'white');
                bbsPrint('  No spam - just signal.', 'white');
                bbsPrint('');
                bbsPrint('  Visit retroverse.studio for the signup form.', 'yellow');
                bbsPrint('');
                bbsPrint('  [B]  Back to Main Menu', 'gray');
                break;

            case 'mode':
                bbsPrint('========================================', 'cyan');
                bbsPrint('         DISPLAY MODE', 'cyan');
                bbsPrint('========================================', 'cyan');
                bbsPrint('');
                bbsPrint('  [1]  Terminal Mode  (hacker aesthetic)', 'yellow');
                bbsPrint('  [2]  BBS Mode  (you are here)', 'yellow');
                bbsPrint('  [3]  Retro Mode  (side-scrolling 8-bit)', 'yellow');
                bbsPrint('  [4]  Forum Mode  (message board)', 'yellow');
                bbsPrint('');
                bbsPrint('  [B]  Back to Main Menu', 'gray');
                break;
        }

        if (bbsOutput) bbsOutput.scrollTop = 0;
    }

    function handleBBSInput(val) {
        if (bbsPage === 'main') {
            switch (val) {
                case 'g': showBBSPage('games'); break;
                case 't': showBBSPage('tools'); break;
                case 'a': showBBSPage('about'); break;
                case 'n':
                    if (NEWSLETTER_ENABLED) showBBSPage('newsletter');
                    else bbsPrint('  No newsletter on this node yet. Check back later!', 'yellow');
                    break;
                case 'm': showBBSPage('mode'); break;
                case 'r': reboot(); break;
                default: bbsPrint('  Unknown selection. Try G, T, A, ' + (NEWSLETTER_ENABLED ? 'N, ' : '') + 'M, or R.', 'red');
            }
        } else if (bbsPage === 'mode') {
            switch (val) {
                case '1': switchMode('terminal'); break;
                case '2': showBBSPage('main'); break;
                case '3': switchMode('retro'); break;
                case '4': switchMode('forum'); break;
                case 'b': showBBSPage('main'); break;
                default: bbsPrint('  Unknown selection.', 'red');
            }
        } else if (bbsPage === 'games') {
            var n = parseInt(val);
            if (n >= 1 && n <= GAMES.length && GAMES[n-1].url) window.open(GAMES[n-1].url, '_blank');
            else if (val === 'b') showBBSPage('main');
            else bbsPrint('  Unknown selection.', 'red');
        } else if (bbsPage === 'tools') {
            var tn = parseInt(val);
            if (tn >= 1 && tn <= TOOLS.length && TOOLS[tn-1].url) window.open(TOOLS[tn-1].url, '_blank');
            else if (val === 'b') showBBSPage('main');
        } else {
            if (val === 'b') showBBSPage('main');
        }
    }

    // ═══════════════════════════════════════
    // RETRO MODE (Side-scrolling)
    // ═══════════════════════════════════════

    function initRetro() {
        $('#term-input-bar').style.display = 'none';
        $('#bbs-input-bar').style.display = 'none';
        $('#doom-hud').style.display = 'none';

        // Build scroll dots
        var dotsEl = $('#scroll-dots');
        dotsEl.innerHTML = '';
        SECTIONS.forEach(function (sec, i) {
            var dot = document.createElement('div');
            dot.className = 'scroll-dot' + (i === 0 ? ' active' : '');
            dot.title = sec.name;
            dot.dataset.index = i;
            dot.addEventListener('click', function () { scrollToSection(i); });
            dotsEl.appendChild(dot);
        });

        // Scroll to first section
        state.currentSection = 0;
        updateLevelBar(0);

        var mainEl = $('main');

        // Listen for scroll to update indicators
        mainEl.addEventListener('scroll', onRetroScroll);

        // Arrow buttons with wrapping
        $('#scroll-left').onclick = function () {
            if (state.currentSection === 0) {
                scrollToSection(SECTIONS.length - 1, true); // wrap to last
            } else {
                scrollToSection(state.currentSection - 1);
            }
        };
        $('#scroll-right').onclick = function () {
            if (state.currentSection === SECTIONS.length - 1) {
                scrollToSection(0, true); // wrap to first
            } else {
                scrollToSection(state.currentSection + 1);
            }
        };

        // Auto-scroll button
        var autoBtn = $('#scroll-auto');
        autoBtn.onclick = function () {
            state.autoScrollActive = !state.autoScrollActive;
            autoBtn.classList.toggle('active', state.autoScrollActive);
            if (state.autoScrollActive) {
                startAutoScroll();
            } else {
                clearInterval(state.autoScrollTimer);
                state.autoScrollTimer = null;
            }
        };

        // Keyboard arrows
        document.addEventListener('keydown', handleRetroKeys);

        // Mobile nav
        var toggle = $('.nav-toggle');
        var navList = $('.nav-list');
        if (toggle && navList) {
            toggle.onclick = function () { navList.classList.toggle('active'); };
            navList.querySelectorAll('a').forEach(function (a) {
                a.addEventListener('click', function (e) {
                    navList.classList.remove('active');
                    // Navigate to section by data-section
                    var sec = a.dataset.section;
                    if (sec) {
                        e.preventDefault();
                        var idx = SECTIONS.findIndex(function (s) { return s.id === sec; });
                        if (idx !== -1) scrollToSection(idx);
                    }
                });
            });
        }

        // Lazy load images
        var imgs = document.querySelectorAll('.card-img[style], .about-img[style]');
        if ('IntersectionObserver' in window) {
            var obs = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
                });
            }, { threshold: 0.1 });
            imgs.forEach(function (el) { obs.observe(el); });
        } else {
            imgs.forEach(function (el) { el.classList.add('visible'); });
        }

        // Newsletter form
        var form = $('#newsletter-form');
        if (form && NEWSLETTER_ENABLED) {
            form.onsubmit = function (e) {
                e.preventDefault();
                var email = form.querySelector('input[type="email"]').value.trim();
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
                var ft = document.createElement('input');
                ft.type = 'hidden'; ft.name = 'form_time'; ft.value = Math.floor(Date.now() / 1000);
                form.appendChild(ft);
                var hp = document.createElement('input');
                hp.type = 'text'; hp.name = 'website'; hp.style.display = 'none';
                form.appendChild(hp);
                form.action = 'api/process-email.php';
                form.method = 'post';
                form.submit();
            };
        }

        // Scroll to start
        setTimeout(function () {
            mainEl.scrollLeft = 0;
        }, 50);
    }

    function onRetroScroll() {
        var mainEl = $('main');
        if (!mainEl) return;
        var scrollPos = mainEl.scrollLeft;
        var sectionWidth = mainEl.clientWidth;
        var idx = Math.round(scrollPos / sectionWidth);
        idx = Math.max(0, Math.min(idx, SECTIONS.length - 1));

        if (idx !== state.currentSection) {
            state.currentSection = idx;
            updateLevelBar(idx);
            updateScrollDots(idx);
            updateNavHighlight(idx);
        }
    }

    function scrollToSection(idx, wrap) {
        var mainEl = $('main');
        if (!mainEl) return;

        // Wrapping with screen transition effect
        if (wrap) {
            mainEl.classList.add('warp-out');
            setTimeout(function () {
                state.currentSection = idx;
                mainEl.scrollTo({ left: idx * mainEl.clientWidth, behavior: 'instant' });
                updateLevelBar(idx);
                updateScrollDots(idx);
                updateNavHighlight(idx);
                mainEl.classList.remove('warp-out');
                mainEl.classList.add('warp-in');
                setTimeout(function () {
                    mainEl.classList.remove('warp-in');
                }, 250);
            }, 250);
            return;
        }

        state.currentSection = idx;
        mainEl.scrollTo({ left: idx * mainEl.clientWidth, behavior: REDUCED_MOTION ? 'instant' : 'smooth' });
        updateLevelBar(idx);
        updateScrollDots(idx);
        updateNavHighlight(idx);
    }

    function updateLevelBar(idx) {
        var sec = SECTIONS[idx];
        if (!sec) return;
        var label = $('#level-label');
        var name = $('#level-name');
        if (label) label.textContent = 'WORLD ' + sec.world;
        if (name) name.textContent = sec.name;
    }

    function updateScrollDots(idx) {
        document.querySelectorAll('.scroll-dot').forEach(function (dot, i) {
            dot.classList.toggle('active', i === idx);
        });
    }

    function updateNavHighlight(idx) {
        var sectionId = SECTIONS[idx] ? SECTIONS[idx].id : '';
        document.querySelectorAll('.nav-list a').forEach(function (a) {
            a.classList.toggle('nav-active', a.dataset.section === sectionId);
        });
    }

    function startAutoScroll() {
        state.autoScrollTimer = setInterval(function () {
            if (state.mode !== 'retro' || !state.autoScrollActive) {
                clearInterval(state.autoScrollTimer);
                return;
            }
            var isLast = state.currentSection === SECTIONS.length - 1;
            var next = (state.currentSection + 1) % SECTIONS.length;
            scrollToSection(next, isLast); // wrap with transition on last→first
        }, 4000);
    }

    function handleRetroKeys(e) {
        if (state.mode !== 'retro') return;
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (state.currentSection === 0) {
                scrollToSection(SECTIONS.length - 1, true);
            } else {
                scrollToSection(state.currentSection - 1);
            }
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            if (state.currentSection === SECTIONS.length - 1) {
                scrollToSection(0, true);
            } else {
                scrollToSection(state.currentSection + 1);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cycleMode();
        }
        handleKonami(e);
    }

    // ═══════════════════════════════════════
    // FORUM MODE
    // ═══════════════════════════════════════

    var FORUM_USERS = [
        { name: 'SysOp',       role: 'Admin',     posts: 847, avatar: '[>>]', color: '#00ff99' },
        { name: 'RetroFan42',  role: 'Regular',   posts: 312, avatar: '(^^)', color: '#ccccff' },
        { name: 'PixelDave',   role: 'Regular',   posts: 189, avatar: '{**}', color: '#ccccff' },
        { name: 'GhostAI_99',  role: 'Moderator', posts: 523, avatar: '[@@]', color: '#cc44cc' },
        { name: 'NeonRunner',  role: 'Regular',   posts: 95,  avatar: '(<>)', color: '#ccccff' },
        { name: 'ByteMe',      role: 'Regular',   posts: 41,  avatar: '(!!)', color: '#ccccff' },
        { name: 'ArcadePunk',  role: 'Regular',   posts: 267, avatar: '[##]', color: '#ccccff' },
        { name: 'CRTjunkie',   role: 'Regular',   posts: 158, avatar: '{~~}', color: '#ccccff' }
    ];

    var FORUM_REPLIES = {
        'swipeverse': [
            { user: 1, text: 'The AI storylines are genuinely surprising. Every playthrough feels different.', date: 'Mar 15, 2026' },
            { user: 2, text: 'Works great offline on my commute. The PWA support is solid.', date: 'Mar 16, 2026' },
            { user: 3, text: 'Anyone tried creating a custom universe yet? The editor is deep.', date: 'Mar 17, 2026' },
            { user: 4, text: 'Cyberpunk dystopia is my favourite reality so far. The moral dilemmas are intense.', date: 'Mar 18, 2026' },
            { user: 5, text: 'Downloaded on Android, runs smooth. Swipe controls feel natural.', date: 'Mar 19, 2026' }
        ],
        'stellas-evolution': [
            { user: 6, text: 'As an Atari collector, I cannot wait for this. The concept is brilliant.', date: 'Mar 12, 2026' },
            { user: 3, text: 'Thomas Was Alone meets hardware history? Take my money.', date: 'Mar 14, 2026' },
            { user: 7, text: 'Will there be actual 2600 ROMs to play at each arc?', date: 'Mar 16, 2026' }
        ],
        'glomph-maze': [
            { user: 7, text: 'Installed via pip, works perfectly in my terminal. Ghost AI is legit smart.', date: 'Mar 10, 2026' },
            { user: 1, text: 'Just added three new community mazes! Check the GitHub for layouts.', date: 'Mar 11, 2026' },
            { user: 4, text: 'The curses rendering is surprisingly smooth. Nostalgic feels.', date: 'Mar 13, 2026' },
            { user: 2, text: 'Can confirm it works great over SSH too. Perfect for my home server.', date: 'Mar 15, 2026' }
        ],
        'incident-zero': [
            { user: 3, text: 'Played this at a meetup with 5 people. The attacker role is incredibly fun.', date: 'Mar 08, 2026' },
            { user: 6, text: '171 cards is impressive. How long is a typical session?', date: 'Mar 09, 2026' },
            { user: 0, text: 'Typical game runs 45-90 min depending on the module. The MITRE mapping adds real educational value.', date: 'Mar 09, 2026' },
            { user: 5, text: 'Printed the tabletop version at work. Security team loved it for training.', date: 'Mar 14, 2026' }
        ],
        'karaoke-stage': [
            { user: 2, text: 'Finally a karaoke app that handles CDG properly. Bulk import saved me hours.', date: 'Mar 06, 2026' },
            { user: 7, text: 'The theming options are fun. Made a neon 80s theme for a party.', date: 'Mar 12, 2026' }
        ],
        'visual-cataloguer': [
            { user: 4, text: 'Used this for my retro game collection. AI identification is surprisingly accurate.', date: 'Mar 05, 2026' },
            { user: 1, text: 'QR divider system is genius. Scanned 200 books in an afternoon.', date: 'Mar 08, 2026' },
            { user: 6, text: 'Docker setup was painless. Any plans for a web UI?', date: 'Mar 11, 2026' }
        ],
        'virtual-lanes': [
            { user: 5, text: 'Been journalling my league nights for a month. The simulated rivals are weirdly motivating.', date: 'Jun 21, 2026' },
            { user: 2, text: 'Installed as a PWA, works perfectly offline at the alley. No signal, no problem.', date: 'Jun 28, 2026' }
        ]
    };

    var forumOutput = null;

    function initForum() {
        forumOutput = $('#forum-output');
        forumOutput.innerHTML = '';

        // Hide other mode chrome
        $('#term-input-bar').style.display = 'none';
        $('#bbs-input-bar').style.display = 'none';
        $('#doom-hud').style.display = 'none';

        renderForum();
    }

    function renderForum() {
        var html = '';

        // Header
        html += '<div class="forum-header">';
        html += '  <div class="forum-header-left">';
        html += '    <h1>RetroVerse Forums</h1>';
        html += '    <p>Where pixels meet discussion  |  Est. 2026  |  Perth, AU</p>';
        html += '  </div>';
        html += '  <div class="forum-header-right">';
        html += '    Welcome, <span>visitor</span><br>';
        html += '    Users online: <span>1</span><br>';
        html += '    Visitor #<span>' + state.visitorNumber + '</span>';
        html += '  </div>';
        html += '</div>';

        // Nav bar
        html += '<div class="forum-nav">';
        html += '  <a class="active">Board Index</a>';
        html += '  <a href="https://github.com/retroverse-studios" target="_blank" rel="noopener">GitHub</a>';
        html += '</div>';

        // Games category
        html += renderCategory('Games', GAMES.map(function (g, i) {
            var replies = FORUM_REPLIES[g.id] || [];
            var lastReply = replies.length > 0 ? replies[replies.length - 1] : null;
            var lastUser = lastReply ? FORUM_USERS[lastReply.user] : FORUM_USERS[0];
            return {
                id: g.id,
                title: g.name,
                sticky: i === 0,
                author: 'SysOp',
                preview: g.desc.substring(0, 60) + '...',
                replies: replies.length,
                views: 200 + Math.floor(Math.random() * 800),
                lastAuthor: lastUser.name,
                lastDate: lastReply ? lastReply.date : 'Mar 2026',
                game: g,
                replyData: replies
            };
        }));

        // Tools category
        html += renderCategory('Tools & Apps', TOOLS.map(function (t) {
            var replies = FORUM_REPLIES[t.id] || [];
            var lastReply = replies.length > 0 ? replies[replies.length - 1] : null;
            var lastUser = lastReply ? FORUM_USERS[lastReply.user] : FORUM_USERS[0];
            return {
                id: t.id,
                title: t.name,
                sticky: false,
                author: 'SysOp',
                preview: t.desc.substring(0, 60) + '...',
                replies: replies.length,
                views: 100 + Math.floor(Math.random() * 400),
                lastAuthor: lastUser.name,
                lastDate: lastReply ? lastReply.date : 'Mar 2026',
                tool: t,
                replyData: replies
            };
        }));

        // About (as a sticky meta thread)
        var metaThreads = [{
            id: 'about',
            title: 'About RetroVerse Studios',
            sticky: true,
            author: 'SysOp',
            preview: 'Independent game studio from Perth, Australia...',
            replies: 0,
            views: state.visitorNumber - 41999,
            lastAuthor: 'SysOp',
            lastDate: 'Mar 2026',
            aboutThread: true,
            replyData: []
        }];
        if (NEWSLETTER_ENABLED) {
            metaThreads.push({
                id: 'newsletter',
                title: 'Subscribe to Updates',
                sticky: true,
                author: 'SysOp',
                preview: 'Dev updates, pixel art reveals, and early access...',
                replies: 0,
                views: Math.floor((state.visitorNumber - 41999) * 0.4),
                lastAuthor: 'SysOp',
                lastDate: 'Mar 2026',
                newsletterThread: true,
                replyData: []
            });
        }
        html += renderCategory('Meta', metaThreads);

        // Board stats
        var totalReplies = 0;
        Object.keys(FORUM_REPLIES).forEach(function (k) { totalReplies += FORUM_REPLIES[k].length; });
        html += '<div class="forum-stats">';
        html += '  <strong>' + (GAMES.length + TOOLS.length + metaThreads.length) + '</strong> threads | ';
        html += '  <strong>' + totalReplies + '</strong> replies | ';
        html += '  <strong>1</strong> user online | ';
        html += '  Newest member: <strong>visitor</strong><br>';
        html += '  All games are open source and free. ';
        html += '  Board powered by RetroVerse OS v2.0';
        html += '</div>';

        forumOutput.innerHTML = html;

        // Wire up thread clicks
        forumOutput.querySelectorAll('.forum-thread').forEach(function (el) {
            el.addEventListener('click', function () {
                var threadId = el.dataset.threadId;
                var body = forumOutput.querySelector('.forum-thread-body[data-thread-id="' + threadId + '"]');
                if (body) {
                    var isVisible = body.classList.contains('visible');
                    // Collapse all
                    forumOutput.querySelectorAll('.forum-thread-body').forEach(function (b) { b.classList.remove('visible'); });
                    forumOutput.querySelectorAll('.forum-thread').forEach(function (t) { t.classList.remove('expanded'); });
                    // Toggle this one
                    if (!isVisible) {
                        body.classList.add('visible');
                        el.classList.add('expanded');
                        setTimeout(function () { body.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 100);
                    }
                }
            });
        });
    }

    function renderCategory(title, threads) {
        var html = '<div class="forum-category">';
        html += '<div class="forum-cat-header">';
        html += '  <span class="forum-cat-title">' + title + '</span>';
        html += '  <span class="forum-cat-col">Replies</span>';
        html += '  <span class="forum-cat-col">Views</span>';
        html += '  <span class="forum-cat-col">Last Post</span>';
        html += '</div>';

        threads.forEach(function (t) {
            // Thread row
            html += '<div class="forum-thread' + (t.sticky ? ' forum-sticky' : '') + '" data-thread-id="' + t.id + '">';
            html += '  <div class="forum-thread-info">';
            html += '    <div class="forum-thread-title">';
            html += '      <span class="thread-icon">' + (t.sticky ? '[*]' : '[ ]') + '</span>';
            html += '      ' + esc(t.title);
            html += '    </div>';
            html += '    <div class="forum-thread-meta">by <span class="author">' + esc(t.author) + '</span> - "' + esc(t.preview) + '"</div>';
            html += '  </div>';
            html += '  <div class="forum-stat">' + t.replies + '</div>';
            html += '  <div class="forum-stat">' + t.views + '</div>';
            html += '  <div class="forum-last-post">';
            html += '    <span class="last-author">' + esc(t.lastAuthor) + '</span><br>';
            html += '    ' + esc(t.lastDate);
            html += '  </div>';
            html += '</div>';

            // Thread body (hidden until clicked)
            html += '<div class="forum-thread-body" data-thread-id="' + t.id + '">';
            html += renderOP(t);
            t.replyData.forEach(function (reply) {
                html += renderReply(reply);
            });
            html += '</div>';
        });

        html += '</div>';
        return html;
    }

    function renderOP(thread) {
        var sysop = FORUM_USERS[0];
        var html = '<div class="forum-post">';
        html += '  <div class="forum-post-author">';
        html += '    <div class="forum-post-avatar" style="color:' + sysop.color + '">' + sysop.avatar + '</div>';
        html += '    <div class="forum-post-name" style="color:' + sysop.color + '">' + sysop.name + '</div>';
        html += '    <div class="forum-post-role">' + sysop.role + '</div>';
        html += '    <div class="forum-post-count">Posts: ' + sysop.posts + '</div>';
        html += '  </div>';
        html += '  <div class="forum-post-content">';
        html += '    <div class="forum-post-date">Posted: Mar 2026</div>';

        if (thread.game) {
            var g = thread.game;
            html += '    <div class="forum-post-text">' + esc(g.desc) + '</div>';
            if (g.features.length) {
                html += '    <div class="forum-post-text highlight">';
                g.features.forEach(function (f) { html += '> ' + esc(f) + '<br>'; });
                html += '    </div>';
            }
            html += '    <div class="forum-post-tags">';
            g.platforms.split(', ').forEach(function (p) {
                html += '<span class="forum-post-tag">' + esc(p) + '</span>';
            });
            html += '    </div>';
            if (g.url) {
                html += '    <a href="' + g.url + '" class="forum-post-link" target="_blank" rel="noopener">' + (g.status === 'FLAGSHIP' ? 'Play Now' : 'View') + '</a>';
            }
        } else if (thread.tool) {
            var tool = thread.tool;
            html += '    <div class="forum-post-text">' + esc(tool.desc) + '</div>';
            html += '    <div class="forum-post-text">Tech: <span class="highlight">' + esc(tool.tech) + '</span></div>';
            if (tool.url) {
                html += '    <a href="' + tool.url + '" class="forum-post-link" target="_blank" rel="noopener">View on GitHub</a>';
            }
        } else if (thread.aboutThread) {
            html += '    <div class="forum-post-text">RetroVerse Studios is an independent game studio based in Perth, Australia. We fuse retro-pixel aesthetics with cutting-edge decision algorithms.</div>';
            html += '    <div class="forum-post-text"><span class="highlight">RETRO:</span> Pixel art, CRT aesthetics, and hardware-era design constraints as creative fuel.</div>';
            html += '    <div class="forum-post-text"><span class="highlight">VERSE:</span> Multiple realities, branching narratives, and player-created worlds.</div>';
            html += '    <div class="forum-post-text">All games are open source and free.</div>';
        } else if (thread.newsletterThread) {
            html += '    <div class="forum-post-text">Dev updates, pixel art reveals, and early-access opportunities. No spam - just signal.</div>';
            html += '    <div class="forum-post-text">Visit <span class="highlight">retroverse.studio</span> in retro mode to use the signup form.</div>';
        }

        html += '  </div>';
        html += '</div>';
        return html;
    }

    function renderReply(reply) {
        var user = FORUM_USERS[reply.user];
        var html = '<div class="forum-post forum-post--reply">';
        html += '  <div class="forum-post-author">';
        html += '    <div class="forum-post-avatar" style="color:' + user.color + '">' + user.avatar + '</div>';
        html += '    <div class="forum-post-name" style="color:' + user.color + '">' + user.name + '</div>';
        html += '    <div class="forum-post-role">' + user.role + '</div>';
        html += '    <div class="forum-post-count">Posts: ' + user.posts + '</div>';
        html += '  </div>';
        html += '  <div class="forum-post-content">';
        html += '    <div class="forum-post-date">' + esc(reply.date) + '</div>';
        html += '    <div class="forum-post-text">' + esc(reply.text) + '</div>';
        html += '  </div>';
        html += '</div>';
        return html;
    }

    function esc(str) {
        var d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    // ═══════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════

    function stopAnimations() {
        stopMatrix();
        if (state.hackerAnim) { clearInterval(state.hackerAnim); state.hackerAnim = null; }
        if (state.statsAnim) { clearInterval(state.statsAnim); state.statsAnim = null; }
        if (state.autoScrollTimer) { clearInterval(state.autoScrollTimer); state.autoScrollTimer = null; }
        state.autoScrollActive = false;
        clearTimeout(state.idleTimer);

        // Reset auto button
        var autoBtn = $('#scroll-auto');
        if (autoBtn) autoBtn.classList.remove('active');

        // Hide all mode chrome
        ['#term-input-bar', '#bbs-input-bar', '#doom-hud'].forEach(function (sel) {
            var el = $(sel);
            if (el) el.style.display = 'none';
        });

        // Reset panel displays to CSS default
        ['#matrix-canvas', '#hacker-feed', '#stats-panel'].forEach(function (sel) {
            var el = $(sel);
            if (el) el.style.display = '';
        });

        // Remove event listeners
        document.removeEventListener('click', focusTermInput);
        document.removeEventListener('click', focusBBSInput);
        document.removeEventListener('keydown', handleRetroKeys);

        var mainEl = $('main');
        if (mainEl) mainEl.removeEventListener('scroll', onRetroScroll);
    }

    // ═══════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════

    function pad(str, len) {
        str = String(str);
        while (str.length < len) str += ' ';
        return str.substring(0, len);
    }

    function pad2(n) { return n < 10 ? '0' + n : '' + n; }

    function bar(pct, w) {
        var f = Math.round((pct / 100) * w);
        return '#'.repeat(f) + '.'.repeat(w - f);
    }

    // ═══════════════════════════════════════
    // INIT
    // ═══════════════════════════════════════

    function initModeSwitcher() {
        document.querySelectorAll('.mode-btn[data-mode]').forEach(function (btn) {
            btn.addEventListener('click', function () { switchMode(btn.dataset.mode); });
        });
        $('#reboot-btn').addEventListener('click', reboot);
    }

    // Global konami listener for modes whose own handlers don't cover it
    document.addEventListener('keydown', function (e) {
        if (state.mode === 'bbs') return; // handled in BBS input
        if (state.mode === 'terminal') return; // handled in term input
        if (state.mode === 'retro') return; // handled in handleRetroKeys
        handleKonami(e);
    });

    window._bootTime = Date.now();

    document.addEventListener('DOMContentLoaded', function () {
        initVisitorCounter();
        initModeSwitcher();
        boot();
    });

})();
