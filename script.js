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

const crtContainer = document.getElementById('crt-container');
const crtImage = document.getElementById('crt-image');
const terminalScreen = document.getElementById('terminal-screen');
const outputDiv = document.getElementById('output');
const inputLine = document.getElementById('input-line');
const inputDisplay = document.getElementById('input-display');
const cmdInput = document.getElementById('cmd-input');

let commandHistory = [];
let historyIndex = -1;
let isLoaded = false;

function init() {
    const startApp = () => {
        if (isLoaded) return;
        isLoaded = true;
        crtContainer.style.opacity = '1';
        runBootSequence();
    };

    const failLoudly = () => {
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

    if (crtImage.complete && crtImage.naturalHeight !== 0) {
        startApp();
    } else {
        crtImage.onload = startApp;
        crtImage.onerror = failLoudly;
    }

    terminalScreen.addEventListener('click', () => cmdInput.focus());
    cmdInput.addEventListener('input', updateInputDisplay);

    cmdInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            const cmd = cmdInput.value;
            handleCommand(cmd);
            cmdInput.value = '';
            updateInputDisplay();
            historyIndex = -1;
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length) {
                historyIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
                cmdInput.value =
                    commandHistory[commandHistory.length - 1 - historyIndex];
                updateInputDisplay();
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                cmdInput.value =
                    commandHistory[commandHistory.length - 1 - historyIndex];
            } else {
                historyIndex = -1;
                cmdInput.value = '';
            }
            updateInputDisplay();
        }
    });
}


function updateInputDisplay() {
    inputDisplay.innerHTML =
        escapeHtml(cmdInput.value) + '<span class="cursor">█</span>';
}

async function runBootSequence() {
    const sequence = [
        { text: '[boot] Initializing system...', delay: 500 },
        { text: '[boot] Loading modules...', delay: 500 },
        { text: '[boot] Ready.', delay: 500 },
        { text: "Type 'help' for available commands.", delay: 0 }
    ];

    for (const line of sequence) {
        await new Promise(r => setTimeout(r, line.delay));
        printLine(line.text, 'dim');
    }

    inputLine.style.display = 'flex';
    cmdInput.focus();
}

function printLine(html, className = '') {
    const div = document.createElement('div');
    div.className = 'line ' + className;
    div.innerHTML = html;
    outputDiv.appendChild(div);
    outputDiv.scrollTop = outputDiv.scrollHeight;
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function handleCommand(rawCmd) {
    const cmdTrimmed = rawCmd.trim();
    if (!cmdTrimmed) return;

    printLine(`> ${escapeHtml(rawCmd)}`);
    commandHistory.push(rawCmd);

    const parts = cmdTrimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
        case 'help':
            printLine(
                'projects  cp      kaggle   research\n' +
                'resume    contact stats    experience\n' +
                'theme     clear'
            );
            break;

        case 'clear':
            outputDiv.innerHTML = '';
            break;

        case 'theme': {
            const themeName = args[0] && args[0].toLowerCase();
            if (THEMES[themeName]) {
                applyTheme(themeName);
                printLine(`Theme set to ${themeName}.`);
            } else {
                printLine(`Available themes: ${Object.keys(THEMES).join(', ')}`);
            }
            break;
        }

        case 'contact':
            printLine(`Email: <a href="mailto:${USER.email}">${USER.email}</a>`);
            printLine(`<a href="https://github.com/${USER.github}" target="_blank">GitHub</a>`);
            printLine(`<a href="https://linkedin.com/in/${USER.linkedin}" target="_blank">LinkedIn</a>`);
            printLine(`<a href="https://kaggle.com/${USER.kaggle}" target="_blank">Kaggle</a>`);
            break;

        case 'resume':
            printLine(`<a href="https://linkedin.com/in/${USER.linkedin}" target="_blank">Resume (LinkedIn)</a>`);
            break;

        case 'experience':
            printLine(`<a href="https://linkedin.com/in/${USER.linkedin}/details/experience/" target="_blank">Experience</a>`);
            break;

        case 'kaggle':
            printLine(`<a href="https://kaggle.com/${USER.kaggle}" target="_blank">kaggle.com/${USER.kaggle}</a>`);
            break;

        case 'projects':
            await executeApiCommand(
                async () => {
                    const res = await fetch(`https://api.github.com/users/${USER.github}/repos?sort=updated&per_page=4`);
                    if (!res.ok) throw new Error();
                    const data = await res.json();
                    return data.map(repo =>
                        `<div><span class="accent">${escapeHtml(repo.name)}</span> ★${repo.stargazers_count}</div>
             <div class="dim">${escapeHtml(repo.description || 'No description')}</div>`
                    ).join('');
                },
                `curl https://api.github.com/users/${USER.github}/repos`,
                `https://github.com/${USER.github}`
            );
            break;

        case 'cp':
            await executeApiCommand(
                async () => {
                    const res = await fetch(`https://codeforces.com/api/user.info?handles=${USER.codeforces}`);
                    const data = await res.json();
                    if (data.status !== 'OK') throw new Error();
                    const u = data.result[0];
                    return `
            <div>Handle: ${u.handle}</div>
            <div>Rank: ${u.rank || 'Unrated'}</div>
            <div>Rating: ${u.rating || 'N/A'} (Max ${u.maxRating || 'N/A'})</div>
          `;
                },
                `curl https://codeforces.com/api/user.info?handles=${USER.codeforces}`,
                `https://codeforces.com/profile/${USER.codeforces}`
            );
            break;

        case 'stats':
            await executeApiCommand(
                async () => {
                    const res = await fetch(`https://api.github.com/users/${USER.github}/repos?per_page=100`);
                    if (!res.ok) throw new Error();
                    const repos = await res.json();
                    const counts = {};
                    repos.forEach(r => r.language && (counts[r.language] = (counts[r.language] || 0) + 1));
                    return Object.entries(counts)
                        .slice(0, 5)
                        .map(([k, v]) => `<div>${k}: ${v}</div>`)
                        .join('');
                },
                `curl https://api.github.com/users/${USER.github}/repos`,
                `https://github.com/${USER.github}`
            );
            break;

        case 'research':
            printLine(`<a href="https://arxiv.org/search/?query=${USER.arxivName}&searchtype=author" target="_blank">arXiv</a>`);
            break;

        default:
            printLine(`Command not found: ${cmd}. Type 'help'.`);
    }
}

async function executeApiCommand(apiFn, curlCmd, webUrl) {
    try {
        const html = await apiFn();
        printLine(html);
    } catch {
        printLine(
            `<div class="error-box">
        API unavailable.<br>
        <span class="dim">${escapeHtml(curlCmd)}</span><br>
        <a href="${webUrl}" target="_blank">Open in browser</a>
      </div>`
        );
    }
}

function applyTheme(name) {
    const t = THEMES[name];
    if (!t) return;
    const root = document.documentElement;
    root.style.setProperty('--bg', t.bg);
    root.style.setProperty('--fg', t.fg);
    root.style.setProperty('--cursor', t.cursor);
    root.style.setProperty('--accent', t.accent);
    root.style.setProperty('--dim', t.dim);
}

init();
