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

// DOM Elements
const elements = {
    container: document.getElementById('crt-container'),
    image: document.getElementById('crt-image'),
    screen: document.getElementById('terminal-screen'),
    output: document.getElementById('output'),
    inputLine: document.getElementById('input-line'),
    inputDisplay: document.getElementById('input-display'),
    cmdInput: document.getElementById('cmd-input')
};

// State
const state = {
    commandHistory: [],
    historyIndex: -1,
    isLoaded: false
};

// ============ INITIALIZATION ============

function init() {
    const startApp = () => {
        if (state.isLoaded) return;
        state.isLoaded = true;
        elements.container.style.opacity = '1';
        runBootSequence();
    };

    const handleImageError = () => {
        document.body.innerHTML = `
            <div style="
                height:100vh;
                display:flex;
                flex-direction:column;
                justify-content:center;
                align-items:center;
                background:#000;
                color:#ff3333;
                font-family:monospace;
                text-align:center;
            ">
                <h1 style="font-size:48px;margin-bottom:16px;">FATAL ERROR</h1>
                <div>MISSING ASSET: CRT.png</div>
                <div style="opacity:0.6;margin-top:8px;">SYSTEM HALTED</div>
            </div>
        `;
    };

    // Check if image is already loaded
    if (elements.image.complete && elements.image.naturalHeight !== 0) {
        startApp();
    } else {
        elements.image.onload = startApp;
        elements.image.onerror = handleImageError;
    }

    setupEventListeners();
}

function setupEventListeners() {
    // Focus input when clicking terminal
    elements.screen.addEventListener('click', () => elements.cmdInput.focus());

    // Update display on ANY change
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

// ============ INPUT HANDLING ============

function handleKeyDown(e) {
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
    }
}

function handleEnter() {
    const cmd = elements.cmdInput.value.trim();
    if (!cmd) return;

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
    const val = elements.cmdInput.value;
    const pos = elements.cmdInput.selectionStart;

    const before = escapeHtml(val.substring(0, pos));
    const after = escapeHtml(val.substring(pos));

    elements.inputDisplay.innerHTML =
        before + '<span class="cursor">█</span>' + after;
}

// ============ BOOT SEQUENCE ============

async function runBootSequence() {
    const sequence = [
        { text: '[boot] Initializing system...', delay: 500 },
        { text: '[boot] Loading modules...', delay: 500 },
        { text: '[boot] Ready.', delay: 500 },
        { text: "Type 'help' for available commands.", delay: 0 }
    ];

    for (const line of sequence) {
        await sleep(line.delay);
        printLine(line.text, 'dim');
    }

    updateInputDisplay();
    elements.inputLine.style.display = 'flex';
    elements.cmdInput.focus();
}

// ============ OUTPUT ============

function printLine(html, className = '') {
    const div = document.createElement('div');
    div.className = `line ${className}`;
    div.innerHTML = html;
    elements.output.appendChild(div);
    elements.output.scrollTop = elements.output.scrollHeight;
}

// ============ COMMAND EXECUTION ============

async function executeCommand(rawCmd) {
    printLine(`> ${escapeHtml(rawCmd)}`);
    state.commandHistory.push(rawCmd);

    const [cmd, ...args] = rawCmd.trim().split(/\s+/);
    const cmdLower = cmd.toLowerCase();

    const commands = {
        help: () => printLine(
            'projects  cp      kaggle   research\n' +
            'resume    contact stats    experience\n' +
            'theme     clear'
        ),

        clear: () => elements.output.innerHTML = '',

        theme: () => handleThemeCommand(args),

        contact: () => {
            printLine(`Email: <a href="mailto:${USER.email}">${USER.email}</a>`);
            printLine(`GitHub: <a href="https://github.com/${USER.github}" target="_blank">github.com/${USER.github}</a>`);
            printLine(`LinkedIn: <a href="https://linkedin.com/in/${USER.linkedin}" target="_blank">linkedin.com/in/${USER.linkedin}</a>`);
            printLine(`Kaggle: <a href="https://kaggle.com/${USER.kaggle}" target="_blank">kaggle.com/${USER.kaggle}</a>`);
        },

        resume: () => printLine(
            `<a href="https://linkedin.com/in/${USER.linkedin}" target="_blank">View Resume (LinkedIn)</a>`
        ),

        experience: () => printLine(
            `<a href="https://linkedin.com/in/${USER.linkedin}/details/experience/" target="_blank">View Experience</a>`
        ),

        kaggle: () => printLine(
            `<a href="https://kaggle.com/${USER.kaggle}" target="_blank">kaggle.com/${USER.kaggle}</a>`
        ),

        research: () => printLine(
            `<a href="https://arxiv.org/search/?query=${USER.arxivName}&searchtype=author" target="_blank">View arXiv Publications</a>`
        ),

        projects: () => fetchGitHubProjects(),
        cp: () => fetchCodeforcesStats(),
        stats: () => fetchGitHubStats()
    };

    const commandFn = commands[cmdLower];

    if (commandFn) {
        await commandFn();
    } else {
        printLine(`Command not found: ${cmd}. Type 'help' for available commands.`);
    }
}

// ============ THEME HANDLING ============

function handleThemeCommand(args) {
    const themeName = args[0]?.toLowerCase();

    if (!themeName) {
        printLine(`Available themes: ${Object.keys(THEMES).join(', ')}`);
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

// ============ API COMMANDS ============

async function fetchGitHubProjects() {
    await executeApiCommand(
        async () => {
            const res = await fetch(
                `https://api.github.com/users/${USER.github}/repos?sort=updated&per_page=4`
            );
            if (!res.ok) throw new Error('API request failed');

            const repos = await res.json();
            return repos.map(repo => `
                <div><span class="accent">${escapeHtml(repo.name)}</span> ★${repo.stargazers_count}</div>
                <div class="dim">${escapeHtml(repo.description || 'No description')}</div>
            `).join('');
        },
        `curl https://api.github.com/users/${USER.github}/repos`,
        `https://github.com/${USER.github}`
    );
}

async function fetchCodeforcesStats() {
    await executeApiCommand(
        async () => {
            const res = await fetch(
                `https://codeforces.com/api/user.info?handles=${USER.codeforces}`
            );
            const data = await res.json();

            if (data.status !== 'OK') throw new Error('API returned error status');

            const user = data.result[0];
            return `
                <div>Handle: <span class="accent">${user.handle}</span></div>
                <div>Rank: ${user.rank || 'Unrated'}</div>
                <div>Rating: ${user.rating || 'N/A'} (Max: ${user.maxRating || 'N/A'})</div>
            `;
        },
        `curl https://codeforces.com/api/user.info?handles=${USER.codeforces}`,
        `https://codeforces.com/profile/${USER.codeforces}`
    );
}

async function fetchGitHubStats() {
    await executeApiCommand(
        async () => {
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

            return sorted
                .map(([lang, count]) => `<div><span class="accent">${lang}</span>: ${count} repos</div>`)
                .join('');
        },
        `curl https://api.github.com/users/${USER.github}/repos`,
        `https://github.com/${USER.github}`
    );
}

async function executeApiCommand(apiFn, curlCmd, webUrl) {
    try {
        const html = await apiFn();
        printLine(html);
    } catch (error) {
        printLine(`
            <div class="error-box">
                API unavailable.<br>
                <span class="dim">${escapeHtml(curlCmd)}</span><br>
                <a href="${webUrl}" target="_blank">Open in browser →</a>
            </div>
        `);
    }
}

// ============ UTILITIES ============

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

// ============ START ============

init();