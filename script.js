const USER = {
    github: 'Prakharprasun',
    codeforces: 'Prakharprasun',
    kaggle: 'Prakharprasun',
    linkedin: 'prakhar-prasun',
    email: 'prakhar.prasun@proton.me',
    arxivName: 'Prakhar_Prasun'
};

const THEMES = {
    dracula: {
        bg: '#282a36',
        fg: '#f8f8f2',
        cursor: '#ff79c6',
        accent: '#bd93f9',
        dim: '#6272a4'
    },
    catppuccin: {
        bg: '#1e1e2e',
        fg: '#cdd6f4',
        cursor: '#f5e0dc',
        accent: '#cba6f7',
        dim: '#6c7086'
    },
    solarized: {
        bg: '#002b36',
        fg: '#839496',
        cursor: '#d33682',
        accent: '#268bd2',
        dim: '#586e75'
    }
};

// DOM Elements - cached once, never re-queried
const elements = {
    container: document.getElementById('crt-container'),
    image: document.getElementById('crt-image'),
    screen: document.getElementById('terminal-screen'),
    terminalContainer: document.getElementById('terminal-container'),
    musicContainer: document.getElementById('music-container'),
    musicIframe: document.getElementById('music-iframe'),
    output: document.getElementById('output'),
    inputLine: document.getElementById('input-line'),
    inputDisplay: document.getElementById('input-display'),
    cmdInput: document.getElementById('cmd-input')
};

// State
const state = {
    commandHistory: JSON.parse(localStorage.getItem('cmd_history') || '[]'),
    historyIndex: -1,
    isLoaded: false
};

// Mobile detection and IME flags
const IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
let IS_COMPOSING = false;
let ACTIVE_MODE = 'terminal'; // 'terminal' | 'music'

// API Cache (localStorage + TTL)
const API_CACHE = {
    get(key) {
        try {
            const item = JSON.parse(localStorage.getItem(`api_cache_${key}`));
            if (item && Date.now() < item.expiry) {
                return item.data;
            }
            localStorage.removeItem(`api_cache_${key}`);
        } catch (e) { /* ignore */ }
        return null;
    },
    set(key, data, ttlMs = 5 * 60 * 1000) { // 5 min default
        try {
            localStorage.setItem(`api_cache_${key}`, JSON.stringify({
                data,
                expiry: Date.now() + ttlMs
            }));
        } catch (e) { /* ignore quota errors */ }
    }
};

// Debounce helper
function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

// Command Registry
const commands = new Map([
    ['help', { fn: helpCommand, desc: 'Show available commands' }],
    ['whoami', { fn: whoamiCommand, desc: 'Display user info' }],
    ['ls', { fn: lsCommand, desc: 'List portfolio sections' }],
    ['cat', { fn: catCommand, desc: 'Display file contents' }],
    ['neofetch', { fn: neofetchCommand, desc: 'System information' }],
    ['clear', { fn: clearCommand, desc: 'Clear terminal' }],
    ['theme', { fn: themeCommand, desc: 'Change color theme' }],
    ['music', { fn: musicCommand, desc: 'Mount music cartridge' }],
    ['eject', { fn: ejectCartridge, desc: 'Eject cartridge' }],
    ['contact', { fn: contactCommand, desc: 'Contact information' }],
    ['resume', { fn: resumeCommand, desc: 'View resume' }],
    ['experience', { fn: experienceCommand, desc: 'View experience' }],
    ['kaggle', { fn: kaggleCommand, desc: 'Kaggle profile' }],
    ['research', { fn: researchCommand, desc: 'arXiv publications' }],
    ['projects', { fn: fetchGitHubProjects, desc: 'GitHub projects' }],
    ['cp', { fn: fetchCodeforcesStats, desc: 'Codeforces stats' }],
    ['stats', { fn: fetchGitHubStats, desc: 'GitHub language stats' }],
    ['sudo', { fn: sudoCommand, desc: 'Superuser command' }]
]);

function init() {
    const startApp = () => {
        if (state.isLoaded) return;
        state.isLoaded = true;
        elements.container.style.opacity = '1';
        positionTerminal();
        runBootSequence();
    };

    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    if (isMobile) {
        startApp();
    } else if (elements.image.complete && elements.image.naturalHeight !== 0) {
        startApp();
    } else {
        elements.image.onload = startApp;
        elements.image.onerror = () => {
            console.warn('CRT image failed, continuing anyway');
            startApp();
        };
    }

    setupEventListeners();

    // Debounced resize handler
    window.addEventListener('resize', debounce(() => {
        if (state.isLoaded) positionTerminal();
    }, 100));
}

function positionTerminal() {
    const terminal = elements.screen;

    // mobile: full-screen terminal
    if (window.matchMedia('(max-width: 768px)').matches) {
        terminal.style.position = 'relative';
        terminal.style.inset = '0';
        terminal.style.width = '100%';
        terminal.style.height = '100vh';
        terminal.style.left = '';
        terminal.style.top = '';
        terminal.style.transform = 'none';
        return;
    }

    // PC img-based positioning
    const img = elements.image;
    const wrapper = img.parentElement;

    const imgRect = img.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();

    const imgWidth = imgRect.width;
    const imgHeight = imgRect.height;

    const offsetLeft = imgRect.left - wrapperRect.left;
    const offsetTop = imgRect.top - wrapperRect.top;

    const terminalWidth = imgWidth * 0.33;
    const terminalHeight = imgHeight * 0.54;

    const terminalLeft = offsetLeft + (imgWidth - terminalWidth) / 2;
    const terminalTop = offsetTop + (imgHeight - terminalHeight) / 2;

    terminal.style.width = terminalWidth + 'px';
    terminal.style.height = terminalHeight + 'px';
    terminal.style.left = terminalLeft + 'px';
    terminal.style.top = terminalTop + 'px';
    terminal.style.transform = 'none';

    const padding = Math.max(10, terminalWidth * 0.02);
    const fontSize = Math.max(10, Math.min(13, terminalWidth * 0.022));

    terminal.style.padding = padding + 'px';
    terminal.style.fontSize = fontSize + 'px';
}

function setupEventListeners() {
    // Global ESC handler for music mode
    document.addEventListener('keydown', (e) => {
        if (ACTIVE_MODE === 'music' && e.key === 'Escape') {
            e.preventDefault();
            ejectCartridge();
        }
    });

    elements.screen.addEventListener('click', () => elements.cmdInput.focus());

    // IME composition guards (Android fix)
    elements.cmdInput.addEventListener('compositionstart', () => {
        IS_COMPOSING = true;
    });

    elements.cmdInput.addEventListener('compositionend', () => {
        IS_COMPOSING = false;
        requestAnimationFrame(updateInputDisplay);
    });

    // Input handlers - attached once, never re-attached
    elements.cmdInput.addEventListener('input', () => {
        requestAnimationFrame(updateInputDisplay);
    });

    elements.cmdInput.addEventListener('click', () => {
        requestAnimationFrame(updateInputDisplay);
    });

    elements.cmdInput.addEventListener('keydown', handleKeyDown);

    elements.cmdInput.addEventListener('keyup', () => {
        requestAnimationFrame(updateInputDisplay);
    });

    elements.cmdInput.addEventListener('select', () => {
        requestAnimationFrame(updateInputDisplay);
    });
}

function handleKeyDown(e) {
    // ESC ejects cartridge if in music mode
    if (e.key === 'Escape' && ACTIVE_MODE === 'music') {
        e.preventDefault();
        ejectCartridge();
        return;
    }

    switch (e.key) {
        case 'Enter':
            handleEnter();
            break;
        case 'ArrowUp':
            e.preventDefault();
            navigateHistory(1);
            break;
        case 'ArrowDown':
            e.preventDefault();
            navigateHistory(-1);
            break;
        case 'Tab':
            e.preventDefault();
            handleTabComplete();
            break;
    }
}

function handleTabComplete() {
    const partial = elements.cmdInput.value.trim().toLowerCase();
    if (!partial) return;

    const matches = [...commands.keys()].filter(cmd => cmd.startsWith(partial));

    if (matches.length === 1) {
        elements.cmdInput.value = matches[0];
        updateInputDisplay();
    } else if (matches.length > 1) {
        printLine(matches.join('  '), 'dim');
    }
}

function handleEnter() {
    const cmd = elements.cmdInput.value.trim();
    if (!cmd) return;
    if (ACTIVE_MODE === 'music') return;

    executeCommand(cmd);
    elements.cmdInput.value = '';
    updateInputDisplay();
    state.historyIndex = -1;
}

function navigateHistory(direction) {
    const { commandHistory, historyIndex } = state;

    if (!commandHistory.length) return;

    const newIndex = Math.max(
        -1,
        Math.min(historyIndex + direction, commandHistory.length - 1)
    );

    state.historyIndex = newIndex;

    if (newIndex === -1) {
        elements.cmdInput.value = '';
    } else {
        elements.cmdInput.value = commandHistory[commandHistory.length - 1 - newIndex];
    }

    // Move cursor to end
    requestAnimationFrame(() => {
        const len = elements.cmdInput.value.length;
        elements.cmdInput.setSelectionRange(len, len);
        updateInputDisplay();
    });
}

function updateInputDisplay() {
    // Don't update during IME composition (Android keyboard)
    if (IS_COMPOSING) return;

    const val = elements.cmdInput.value;

    if (IS_MOBILE) {
        // Mobile: cursor always at end (NO selection logic)
        elements.inputDisplay.innerHTML =
            escapeHtml(val) + '<span class="cursor">█</span>';
        return;
    }

    // Desktop: full caret tracking
    const pos = elements.cmdInput.selectionStart ?? val.length;

    const before = escapeHtml(val.substring(0, pos));
    const after = escapeHtml(val.substring(pos));

    elements.inputDisplay.innerHTML =
        before + '<span class="cursor">█</span>' + after;
}

async function runBootSequence() {
    const sequence = [
        { text: '[boot] Initializing system...', delay: 500 },
        { text: '[boot] Loading modules...', delay: 500 },
        { text: '[boot] Ready.', delay: 500 },
        { text: "Type 'help' for available commands.", delay: 0 }
    ];

    for (const line of sequence) {
        await sleep(line.delay);
        await typeLine(line.text, 'dim');
    }

    updateInputDisplay();
    elements.inputLine.style.display = 'block';
    elements.cmdInput.focus();
}

function printLine(html, className = '') {
    const div = document.createElement('div');
    div.className = `line ${className}`;
    div.innerHTML = html;
    elements.output.appendChild(div);
    elements.output.scrollTop = elements.output.scrollHeight;
    return div;
}

// Typing animation for retro effect
async function typeLine(text, className = '', speed = 15) {
    const div = document.createElement('div');
    div.className = `line ${className}`;
    elements.output.appendChild(div);

    for (const char of text) {
        div.textContent += char;
        await sleep(speed);
        elements.output.scrollTop = elements.output.scrollHeight;
    }
    return div;
}

// CARTRIDGE SYSTEM - Now uses visibility toggling (no listener re-attachment)

function mountMusicCartridge() {
    if (ACTIVE_MODE === 'music') return;

    ACTIVE_MODE = 'music';

    // KatsEye - Gameboy (works when hosted on a server, may error on file:// protocol)
    // Video ID: -bC4iak3kxg
    elements.musicIframe.src = 'https://www.youtube.com/embed/-bC4iak3kxg?autoplay=0&rel=0&modestbranding=1&playsinline=1';

    // Toggle visibility
    elements.terminalContainer.style.display = 'none';
    elements.musicContainer.style.display = 'flex';

    elements.cmdInput.blur();
}

function ejectCartridge() {
    if (ACTIVE_MODE !== 'music') return;

    ACTIVE_MODE = 'terminal';

    // Clear iframe to stop playback
    elements.musicIframe.src = '';

    // Toggle visibility back
    elements.musicContainer.style.display = 'none';
    elements.terminalContainer.style.display = 'flex';

    // Restore focus
    requestAnimationFrame(() => {
        elements.cmdInput.focus({ preventScroll: true });
        const len = elements.cmdInput.value.length;
        elements.cmdInput.setSelectionRange(len, len);
        updateInputDisplay();
    });
}

// COMMAND EXECUTION

async function executeCommand(rawCmd) {
    printLine(`> ${escapeHtml(rawCmd)}`);
    state.commandHistory.push(rawCmd);

    // Persist to localStorage (limit to 50 entries)
    localStorage.setItem('cmd_history', JSON.stringify(state.commandHistory.slice(-50)));

    const [cmd, ...args] = rawCmd.trim().split(/\s+/);
    const cmdLower = cmd.toLowerCase();

    const handler = commands.get(cmdLower);

    if (handler) {
        await handler.fn(args);
    } else {
        printLine(`Command not found: ${cmd}. Type 'help' for available commands.`);
    }
}

// COMMAND HANDLERS

function helpCommand() {
    printLine(
        'Commands:\n' +
        '  whoami     ls        cat       neofetch\n' +
        '  projects   cp        stats     research\n' +
        '  resume     contact   kaggle    experience\n\n' +
        'System:\n' +
        '  theme      clear     music     help'
    );
}

function whoamiCommand() {
    printLine(`<span class="accent">visitor</span>@prakhar.portfolio`);
    printLine('<span class="dim">Running in guest mode. Some features are read-only.</span>');
}

function lsCommand() {
    printLine(
        '<span class="accent">resume/</span>  ' +
        '<span class="accent">projects/</span>  ' +
        '<span class="accent">research/</span>  ' +
        '<span class="accent">contact/</span>  ' +
        '<span class="accent">experience/</span>'
    );
}

function catCommand(args) {
    const file = args[0]?.toLowerCase();

    const files = {
        resume: () => {
            printLine('<span class="accent">═══ RESUME ═══</span>');
            printLine('Software Engineer | Researcher | Competitive Programmer');
            printLine(`\n<a href="https://linkedin.com/in/${USER.linkedin}" target="_blank" rel="noopener noreferrer">→ Full resume on LinkedIn</a>`);
        },
        research: () => {
            printLine('<span class="accent">═══ RESEARCH ═══</span>');
            printLine('Focus: Machine Learning, Computer Vision, NLP');
            printLine(`\n<a href="https://arxiv.org/search/?query=${USER.arxivName}&searchtype=author" target="_blank" rel="noopener noreferrer">→ View arXiv publications</a>`);
        },
        projects: () => {
            printLine('Use <span class="accent">projects</span> command to fetch from GitHub.');
        },
        contact: () => {
            printLine('Use <span class="accent">contact</span> command for contact info.');
        }
    };

    if (!file) {
        printLine('Usage: cat <file>');
        printLine('Available: resume, research, projects, contact');
        return;
    }

    const handler = files[file];
    if (handler) {
        handler();
    } else {
        printLine(`cat: ${file}: No such file or directory`);
    }
}

function neofetchCommand() {
    const ascii = `
<span class="accent">       ▄▄▄▄▄▄▄</span>      <span class="accent">visitor</span>@prakhar.portfolio
<span class="accent">     ▄█████████▄</span>    ───────────────────────────
<span class="accent">    ██▀     ▀██</span>    <span class="dim">OS:</span> TerminalOS v1.0
<span class="accent">    ██  ▄▄▄  ██</span>    <span class="dim">Host:</span> CRT-PORTFOLIO
<span class="accent">    ██ █████ ██</span>    <span class="dim">Shell:</span> prakhar-sh
<span class="accent">    ██  ▀▀▀  ██</span>    <span class="dim">Theme:</span> ${getCurrentTheme()}
<span class="accent">    ██▄     ▄██</span>    <span class="dim">Terminal:</span> 80x24
<span class="accent">     ▀█████████▀</span>    <span class="dim">Memory:</span> ∞
<span class="accent">       ▀▀▀▀▀▀▀</span>`;
    printLine(ascii);
}

function getCurrentTheme() {
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    for (const [name, theme] of Object.entries(THEMES)) {
        if (theme.bg === bg) return name;
    }
    return 'gameboy';
}

function clearCommand(args) {
    if (args[0] === '--history') {
        localStorage.removeItem('cmd_history');
        state.commandHistory = [];
        printLine('Command history cleared.');
    } else {
        elements.output.innerHTML = '';
    }
}

function themeCommand(args) {
    const themeName = args[0]?.toLowerCase();

    if (!themeName) {
        printLine(`Available themes: ${Object.keys(THEMES).join(', ')}`);
        printLine(`Current theme: ${getCurrentTheme()}`);
        return;
    }

    if (THEMES[themeName]) {
        applyTheme(themeName);
        printLine(`Theme set to ${themeName}.`);
    } else {
        printLine(`Unknown theme: ${themeName}. Available: ${Object.keys(THEMES).join(', ')}`);
    }
}

function applyTheme(name) {
    const theme = THEMES[name];
    if (!theme) return;

    const root = document.documentElement;
    Object.entries(theme).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value);
    });
}

function musicCommand() {
    if (ACTIVE_MODE === 'music') {
        printLine('[media] cartridge already mounted.', 'dim');
        return;
    }
    printLine('[media] mounting cartridge...');
    mountMusicCartridge();
}

function contactCommand() {
    printLine(`Email: <a href="mailto:${USER.email}" rel="noopener noreferrer">${USER.email}</a>`);
    printLine(`GitHub: <a href="https://github.com/${USER.github}" target="_blank" rel="noopener noreferrer">github.com/${USER.github}</a>`);
    printLine(`LinkedIn: <a href="https://linkedin.com/in/${USER.linkedin}" target="_blank" rel="noopener noreferrer">linkedin.com/in/${USER.linkedin}</a>`);
    printLine(`Kaggle: <a href="https://kaggle.com/${USER.kaggle}" target="_blank" rel="noopener noreferrer">kaggle.com/${USER.kaggle}</a>`);
}

function resumeCommand() {
    printLine(
        `<a href="https://linkedin.com/in/${USER.linkedin}" target="_blank" rel="noopener noreferrer">View Resume (LinkedIn)</a>`
    );
}

function experienceCommand() {
    printLine(
        `<a href="https://linkedin.com/in/${USER.linkedin}/details/experience/" target="_blank" rel="noopener noreferrer">View Experience</a>`
    );
}

function kaggleCommand() {
    printLine(
        `<a href="https://kaggle.com/${USER.kaggle}" target="_blank" rel="noopener noreferrer">kaggle.com/${USER.kaggle}</a>`
    );
}

function researchCommand() {
    printLine(
        `<a href="https://arxiv.org/search/?query=${USER.arxivName}&searchtype=author" target="_blank" rel="noopener noreferrer">View arXiv Publications</a>`
    );
}

function sudoCommand(args) {
    const sub = args.join(' ').toLowerCase();

    if (sub.startsWith('rm -rf')) {
        printLine(
            '<span class="accent">nice try.</span><br>' +
            '<span class="dim">Filesystem is mounted read-only.</span><br>' +
            '<span class="dim">Besides, this is a portfolio. What did you expect?</span>'
        );
    } else {
        printLine(
            `<span class="dim">sudo:</span> ${escapeHtml(sub || '[no command]')}<br>` +
            '<span class="dim">Permission denied: \'visitor\' is not in the sudoers file.</span><br>' +
            '<span class="dim">This incident will be reported.</span>'
        );
    }
}

// API COMMANDS WITH LOADING INDICATORS AND CACHING

async function fetchGitHubProjects() {
    const cacheKey = 'github_projects';
    const cached = API_CACHE.get(cacheKey);

    if (cached) {
        printLine(cached);
        return;
    }

    const loadingDiv = printLine('[github] Fetching projects...', 'dim');

    try {
        const res = await fetch(
            `https://api.github.com/users/${USER.github}/repos?sort=updated&per_page=4`
        );
        if (!res.ok) throw new Error('API request failed');

        const repos = await res.json();
        const html = repos.map(repo => `
            <div><span class="accent">${escapeHtml(repo.name)}</span> ★${repo.stargazers_count}</div>
            <div class="dim">${escapeHtml(repo.description || 'No description')}</div>
        `).join('');

        loadingDiv.remove();
        printLine(html);
        API_CACHE.set(cacheKey, html);
    } catch (error) {
        loadingDiv.remove();
        printLine(`
            <div class="error-box">
                API unavailable.<br>
                <span class="dim">curl https://api.github.com/users/${USER.github}/repos</span><br>
                <a href="https://github.com/${USER.github}" target="_blank" rel="noopener noreferrer">Open in browser →</a>
            </div>
        `);
    }
}

async function fetchCodeforcesStats() {
    const cacheKey = 'codeforces_stats';
    const cached = API_CACHE.get(cacheKey);

    if (cached) {
        printLine(cached);
        return;
    }

    const loadingDiv = printLine('[codeforces] Fetching stats...', 'dim');

    try {
        const res = await fetch(
            `https://codeforces.com/api/user.info?handles=${USER.codeforces}`
        );
        const data = await res.json();

        if (data.status !== 'OK') throw new Error('API returned error status');

        const user = data.result[0];
        const html = `
            <div>Handle: <span class="accent">${user.handle}</span></div>
            <div>Rank: ${user.rank || 'Unrated'}</div>
            <div>Rating: ${user.rating || 'N/A'} (Max: ${user.maxRating || 'N/A'})</div>
        `;

        loadingDiv.remove();
        printLine(html);
        API_CACHE.set(cacheKey, html);
    } catch (error) {
        loadingDiv.remove();
        printLine(`
            <div class="error-box">
                API unavailable.<br>
                <span class="dim">curl https://codeforces.com/api/user.info?handles=${USER.codeforces}</span><br>
                <a href="https://codeforces.com/profile/${USER.codeforces}" target="_blank" rel="noopener noreferrer">Open in browser →</a>
            </div>
        `);
    }
}

async function fetchGitHubStats() {
    const cacheKey = 'github_stats';
    const cached = API_CACHE.get(cacheKey);

    if (cached) {
        printLine(cached);
        return;
    }

    const loadingDiv = printLine('[github] Fetching language stats...', 'dim');

    try {
        const res = await fetch(
            `https://api.github.com/users/${USER.github}/repos?per_page=100`
        );
        if (!res.ok) throw new Error('API request failed');

        const repos = await res.json();
        const langCounts = {};

        repos.forEach(repo => {
            if (repo.language) {
                langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
            }
        });

        const sorted = Object.entries(langCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const html = sorted
            .map(([lang, count]) => `<div><span class="accent">${lang}</span>: ${count} repos</div>`)
            .join('');

        loadingDiv.remove();
        printLine(html);
        API_CACHE.set(cacheKey, html);
    } catch (error) {
        loadingDiv.remove();
        printLine(`
            <div class="error-box">
                API unavailable.<br>
                <span class="dim">curl https://api.github.com/users/${USER.github}/repos</span><br>
                <a href="https://github.com/${USER.github}" target="_blank" rel="noopener noreferrer">Open in browser →</a>
            </div>
        `);
    }
}

// UTILITIES

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

init();