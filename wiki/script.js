(function () {
  "use strict";

  // 1. "Did You Know?" Canon Facts Pool
  const DYK_FACTS = [
    "...that Ark's nickname evolved from his legal name (<em>Prakhar</em>) into an Organization XIII Nobody anagram (<em>Xaarkph</em>), then a stealth gamer tag (<em>xarkph</em>), and finally the world-travelling lifeboat from <em>Kingdom Hearts Union χ</em> (<em>Ark</em>)?",
    "...that Ark's favourite Pokémon is <strong>Charizard</strong>—a choice he openly admits is basic and refuses to apologize for?",
    "...that Ark once read the entire <em>Steel Ball Run</em> manga in <strong>three days</strong> while procrastinating on watching an anime because reading was supposedly 'the more efficient option'?",
    "...that if Ark could freely transform into an animal and back into a human whenever he wanted, he would choose to be a <strong>husky</strong>?",
    "...that while Ark genuinely enjoys <strong>cooking</strong>, he has a strong personal objection to the part where he has to wash everything afterwards?",
    "...that in K-pop idol profile terminology, Ark's official representative colour is <strong>Black</strong> and his representative emoji is <strong>😭</strong>?",
    "...that Ark once interned at a <strong>defence firm</strong> where so much of the work was confidential that he could barely put any of it on his CV afterwards?",
    "...that Ark routinely invents <strong>bizarre business ideas</strong> and analyses their customer and employee incentives just to see if they could be profitable?",
    "...that Ark prefers quiet, understated brands like <strong>The North Face</strong>, <strong>New Balance</strong>, and <strong>Apple</strong> over loud, showy luxury logos?",
    "...that a great bowl of <strong>butter chicken with naan</strong> is canonically listed alongside competitive games and the shock of an ice bath as one of Ark's peak life experiences?",
    "...that if Ark were in Hogwarts he would probably be a <strong>Slytherin</strong>, and if he were a bender he would probably be an <strong>airbender</strong>?"
  ];

  let lastDykIndex = 0;
  const dykText = document.getElementById("dyk-text");
  const dykShuffleBtn = document.getElementById("dyk-shuffle");
  const randomFactJumpBtn = document.getElementById("random-fact-jump");

  function pickRandomFact() {
    if (!dykText) return;
    let idx = Math.floor(Math.random() * DYK_FACTS.length);
    if (idx === lastDykIndex) {
      idx = (idx + 1) % DYK_FACTS.length;
    }
    lastDykIndex = idx;
    dykText.innerHTML = DYK_FACTS[idx];
  }

  // Randomize on initial load
  pickRandomFact();

  dykShuffleBtn?.addEventListener("click", pickRandomFact);
  randomFactJumpBtn?.addEventListener("click", () => {
    pickRandomFact();
    document.getElementById("dyk-box")?.scrollIntoView({ behavior: "smooth" });
  });

  // 2. Collapsible Table of Contents ([hide] / [show])
  const tocToggle = document.getElementById("toc-toggle");
  const tocList = document.getElementById("toc-list");

  tocToggle?.addEventListener("click", () => {
    if (!tocList) return;
    const isHidden = tocList.hasAttribute("hidden");
    if (isHidden) {
      tocList.removeAttribute("hidden");
      tocToggle.textContent = "[hide]";
      tocToggle.setAttribute("aria-expanded", "true");
    } else {
      tocList.setAttribute("hidden", "");
      tocToggle.textContent = "[show]";
      tocToggle.setAttribute("aria-expanded", "false");
    }
  });

  // 3. Dark / Light Mode Toggle
  const themeToggle = document.getElementById("theme-toggle");
  const themeLabel = document.getElementById("theme-toggle-label");

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    if (themeLabel) {
      themeLabel.textContent = theme === "dark" ? "Light" : "Dark";
    }
  }

  const savedTheme = localStorage.getItem("ark_wiki_skin") || "dark";
  applyTheme(savedTheme);

  themeToggle?.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem("ark_wiki_skin", next);
  });

  // 5. In-Page Section Search
  const searchInput = document.getElementById("wiki-search");
  const searchResults = document.getElementById("search-results");

  function buildSectionIndex() {
    const headings = document.querySelectorAll(".wiki-h2, .wiki-h3");
    const sections = [];

    headings.forEach((h) => {
      const id = h.id;
      const title = h.innerText.replace(/🗝️ Kingdom Hearts Canon/g, "").trim();
      let text = "";
      let sibling = h.nextElementSibling;
      while (sibling && !sibling.classList.contains("wiki-h2") && !sibling.classList.contains("wiki-h3")) {
        text += " " + (sibling.innerText || "");
        sibling = sibling.nextElementSibling;
      }
      sections.push({
        id,
        title,
        snippet: text.trim().slice(0, 110) + (text.trim().length > 110 ? "..." : ""),
        haystack: (title + " " + text).toLowerCase()
      });
    });

    return sections;
  }

  const sectionIndex = buildSectionIndex();

  if (searchInput && searchResults) {
    const updateSearch = () => {
      const q = searchInput.value.trim().toLowerCase();
      if (!q) {
        searchResults.setAttribute("hidden", "");
        searchResults.innerHTML = "";
        return;
      }

      const matches = sectionIndex.filter((s) => s.haystack.includes(q));
      searchResults.removeAttribute("hidden");

      if (matches.length === 0) {
        searchResults.innerHTML = `<div class="search-hit"><div class="search-hit__snippet">No matching sections found.</div></div>`;
        return;
      }

      searchResults.innerHTML = matches
        .map(
          (m) => `
            <a class="search-hit" href="#${m.id}">
              <div class="search-hit__title">${m.title}</div>
              <div class="search-hit__snippet">${m.snippet}</div>
            </a>
          `
        )
        .join("");

      searchResults.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          searchResults.setAttribute("hidden", "");
          searchInput.value = "";
        });
      });
    };

    searchInput.addEventListener("input", updateSearch);
    searchInput.addEventListener("focus", updateSearch);

    document.addEventListener("click", (e) => {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.setAttribute("hidden", "");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (
        e.key === "/" &&
        document.activeElement !== searchInput &&
        !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName || "")
      ) {
        e.preventDefault();
        searchInput.focus();
      } else if (e.key === "Escape") {
        searchResults.setAttribute("hidden", "");
      }
    });
  }
})();

