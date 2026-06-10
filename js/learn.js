/**
 * H3AD-LEARN — Core JavaScript
 * Covers: hub index + module index pages + all chapter pages
 * Progress key: learn_progress_v2 (localStorage)
 */

'use strict';

/* ---------------------------------------------------------
   CONSTANTS
   --------------------------------------------------------- */
const STORAGE_KEY      = 'learn_progress_v2';
const THEME_KEY        = 'h3ad-theme';
const TOTAL_CHAPTERS   = 8;           // kept for backward compat
const LOGO_DARK        = 'https://raw.githubusercontent.com/h3ad-sec/h3ad-sec.github.io/main/logo-dark.png';
const LOGO_LIGHT       = 'https://raw.githubusercontent.com/h3ad-sec/h3ad-sec.github.io/main/logo-light.png';

const CHAPTER_IDS = ['01', '02', '03', '04', '05', '06', '07', '08', '09'];

/**
 * Multi-module config. Add new modules here when content is ready.
 */
const MODULES = {
  'threat-hunting': { chapters: ['01','02','03','04','05','06','07','08','09'], totalHours: 13 },
  'lolbas':         { chapters: ['01','02','03','04','05','06','07','08'], totalHours: 10 }
};

/* ---------------------------------------------------------
   MODULE DETECTION
   --------------------------------------------------------- */

/**
 * Detect which module the current page belongs to from the URL.
 * Falls back to 'threat-hunting' for legacy chapter pages.
 */
function detectModuleId() {
  const path = window.location.pathname;
  for (const id of Object.keys(MODULES)) {
    if (path.includes('/' + id + '/')) return id;
  }
  return 'threat-hunting'; // fallback — legacy chapter pages live under threat-hunting
}

/* ---------------------------------------------------------
   PROGRESS SYSTEM
   --------------------------------------------------------- */

/**
 * Returns the default multi-module progress schema.
 */
function defaultProgress() {
  const modules = {};
  for (const [moduleId, config] of Object.entries(MODULES)) {
    const chapters = {};
    config.chapters.forEach(id => {
      chapters[id] = { status: 'unread', pct: 0, sections_seen: [] };
    });
    modules[moduleId] = { chapters };
  }
  return { modules };
}

/**
 * Load progress from localStorage. Initialise if missing or corrupted.
 * Migrates old `learn_progress` schema if found.
 */
function initProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Check for old schema and migrate
      const oldRaw = localStorage.getItem('learn_progress');
      if (oldRaw) {
        const oldParsed = JSON.parse(oldRaw);
        const migrated  = defaultProgress();
        if (oldParsed.chapters) {
          CHAPTER_IDS.forEach(id => {
            if (oldParsed.chapters[id]) {
              migrated.modules['threat-hunting'].chapters[id] = oldParsed.chapters[id];
            }
          });
        }
        saveProgress(migrated);
        return migrated;
      }
      return defaultProgress();
    }

    const parsed = JSON.parse(raw);

    // Ensure all module/chapter keys exist
    if (!parsed.modules) return defaultProgress();
    for (const [moduleId, config] of Object.entries(MODULES)) {
      if (!parsed.modules[moduleId]) {
        parsed.modules[moduleId] = { chapters: {} };
      }
      config.chapters.forEach(id => {
        if (!parsed.modules[moduleId].chapters[id]) {
          parsed.modules[moduleId].chapters[id] = { status: 'unread', pct: 0, sections_seen: [] };
        }
      });
    }
    return parsed;
  } catch (_) {
    return defaultProgress();
  }
}

/**
 * Persist progress to localStorage.
 */
function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (_) {
    // Quota or private browsing — silently ignore
  }
}

/**
 * Mark a chapter as 'reading' when its page is opened.
 * @param {string} id        — e.g. '01'
 * @param {string} [moduleId] — auto-detected from URL if omitted
 */
function markChapterReading(id, moduleId) {
  const mod      = moduleId || detectModuleId();
  const progress = initProgress();
  const ch       = progress.modules[mod]?.chapters[id];
  if (!ch) return;
  if (ch.status === 'unread') ch.status = 'reading';
  saveProgress(progress);
}

/**
 * Mark a specific section as seen within a chapter.
 * @param {string} chapterId
 * @param {string} sectionId
 * @param {string} [moduleId]
 */
function markSectionSeen(chapterId, sectionId, moduleId) {
  const mod      = moduleId || detectModuleId();
  const progress = initProgress();
  const ch       = progress.modules[mod]?.chapters[chapterId];
  if (!ch) return;
  if (!ch.sections_seen.includes(sectionId)) {
    ch.sections_seen.push(sectionId);
  }
  saveProgress(progress);
}

/**
 * Mark a chapter as complete.
 * @param {string} id
 * @param {string} [moduleId]
 */
function markChapterComplete(id, moduleId) {
  const mod      = moduleId || detectModuleId();
  const progress = initProgress();
  const ch       = progress.modules[mod]?.chapters[id];
  if (!ch) return;
  ch.status = 'complete';
  ch.pct    = 100;
  saveProgress(progress);
}

/**
 * Compute overall progress (0–100) across ALL active modules.
 * Counts completed chapters out of total chapters defined in MODULES.
 */
function getOverallProgress() {
  const progress = initProgress();
  let completed  = 0;
  let reading    = 0;
  let unread     = 0;
  let total      = 0;

  for (const [moduleId, config] of Object.entries(MODULES)) {
    const modChapters = progress.modules[moduleId]?.chapters || {};
    config.chapters.forEach(id => {
      total++;
      const s = modChapters[id]?.status || 'unread';
      if (s === 'complete')     completed++;
      else if (s === 'reading') reading++;
      else                       unread++;
    });
  }

  return {
    pct:       total > 0 ? Math.round((completed / total) * 100) : 0,
    completed,
    reading,
    unread,
    total,
  };
}

/**
 * Compute progress for a specific module (0–100).
 * @param {string} moduleId — e.g. 'threat-hunting'
 */
function getModuleProgress(moduleId) {
  const config   = MODULES[moduleId];
  if (!config) return 0;
  const progress = initProgress();
  const chapters = progress.modules[moduleId]?.chapters || {};
  let completed  = 0;
  config.chapters.forEach(id => {
    if (chapters[id]?.status === 'complete') completed++;
  });
  return config.chapters.length > 0 ? Math.round((completed / config.chapters.length) * 100) : 0;
}

/**
 * Reset all progress (used by the reset button on index).
 */
function resetProgress() {
  saveProgress(defaultProgress());
}

/* ---------------------------------------------------------
   INDEX PAGE — UI UPDATES
   --------------------------------------------------------- */

/**
 * Update all module card progress indicators on the index page.
 * Supports both legacy single-module cards (data-chapter) and
 * new multi-module cards (data-module-id).
 */
function renderModuleProgress() {
  const progress = initProgress();

  // Legacy: chapter cards with data-chapter (threat-hunting module index)
  document.querySelectorAll('.module-card[data-chapter]').forEach(card => {
    const id  = card.dataset.chapter;
    const mod = 'threat-hunting';
    const ch  = progress.modules[mod]?.chapters[id];
    if (!ch) return;

    const indicator = card.querySelector('.progress-indicator');
    const fill      = card.querySelector('.progress-bar-fill');

    if (!indicator || !fill) return;

    fill.style.width = ch.pct + '%';

    indicator.className = 'progress-indicator mono';
    if (ch.status === 'complete') {
      indicator.classList.add('pi--complete');
      indicator.textContent = 'COMPLETED';
      fill.style.width = '100%';
    } else if (ch.status === 'reading') {
      indicator.classList.add('pi--reading');
      indicator.textContent = 'IN PROGRESS';
    } else {
      indicator.classList.add('pi--unread');
      indicator.textContent = 'UNREAD';
    }
  });

  // Update path nodes (legacy)
  document.querySelectorAll('.path-node[data-chapter]').forEach(node => {
    const id = node.dataset.chapter;
    const ch = progress.modules['threat-hunting']?.chapters[id];
    if (!ch) return;
    node.classList.remove('is-complete', 'is-reading');
    if (ch.status === 'complete') node.classList.add('is-complete');
    else if (ch.status === 'reading') node.classList.add('is-reading');
  });
}

/**
 * Update the hero/overview progress ring and counters.
 */
function renderOverallProgress() {
  const { pct, completed, reading, unread } = getOverallProgress();

  // Ring
  const ring = document.getElementById('progressRingFill');
  if (ring) {
    const circumference = 2 * Math.PI * 50; // r=50
    const offset = circumference - (pct / 100) * circumference;
    ring.style.strokeDasharray  = circumference;
    ring.style.strokeDashoffset = offset;
  }

  // Percentage text
  const pctEl = document.getElementById('overallPct');
  if (pctEl) pctEl.textContent = pct + '%';

  // Hero stat
  const heroCount = document.getElementById('hero-complete-count');
  if (heroCount) heroCount.textContent = completed;

  // Summary counters
  const completeEl = document.getElementById('completeCount');
  const readingEl  = document.getElementById('readingCount');
  const unreadEl   = document.getElementById('unreadCount');
  if (completeEl) completeEl.textContent = completed;
  if (readingEl)  readingEl.textContent  = reading;
  if (unreadEl)   unreadEl.textContent   = unread;
}

/* ---------------------------------------------------------
   MODULE CARD CLICK NAVIGATION
   --------------------------------------------------------- */
function initModuleCards() {
  document.querySelectorAll('.module-card[data-href]').forEach(card => {
    const href = card.dataset.href;

    card.addEventListener('click', () => {
      window.location.href = href;
    });

    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.location.href = href;
      }
    });
  });
}

/* ---------------------------------------------------------
   RESET PROGRESS BUTTON
   --------------------------------------------------------- */
function initResetButton() {
  const btn = document.getElementById('resetProgressBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (confirm('Reset all learning progress? This cannot be undone.')) {
      resetProgress();
      renderModuleProgress();
      renderOverallProgress();
    }
  });
}

/* ---------------------------------------------------------
   CHAPTER PAGE — TOC
   --------------------------------------------------------- */

/**
 * Build sidebar TOC from all <h2> elements in .chapter-body.
 * Injects anchors into headings and builds .toc-nav links.
 */
function initTOC() {
  const body    = document.querySelector('.chapter-body');
  const tocNav  = document.querySelector('.toc-nav');
  if (!body || !tocNav) return;

  const headings = body.querySelectorAll('.content-section h2');
  if (!headings.length) return;

  headings.forEach((h, i) => {
    if (!h.id) {
      h.id = 'section-' + (i + 1);
    }

    const link = document.createElement('a');
    link.className      = 'toc-link';
    link.href           = '#' + h.id;
    link.textContent    = h.textContent;
    link.dataset.target = h.id;

    link.addEventListener('click', e => {
      e.preventDefault();
      document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' });
    });

    tocNav.appendChild(link);
  });
}

/* ---------------------------------------------------------
   CHAPTER PAGE — READING PROGRESS BAR
   --------------------------------------------------------- */
function initReadingProgress() {
  const bar = document.querySelector('.reading-progress');
  if (!bar) return;

  const update = () => {
    const scrollTop  = window.scrollY;
    const docHeight  = document.documentElement.scrollHeight;
    const viewportH  = window.innerHeight;
    const scrollable = docHeight - viewportH;
    const pct        = scrollable > 0 ? (scrollTop / scrollable) * 100 : 0;
    bar.style.width  = Math.min(pct, 100) + '%';
  };

  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ---------------------------------------------------------
   CHAPTER PAGE — SECTION OBSERVER
   Highlights active TOC link, marks sections seen, updates progress.
   --------------------------------------------------------- */
function initSectionObserver(chapterId, moduleId) {
  const sections = document.querySelectorAll('.chapter-body .content-section');
  if (!sections.length) return;

  const mod      = moduleId || detectModuleId();
  const tocLinks = document.querySelectorAll('.toc-link[data-target]');
  const seenSet  = new Set();

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const heading = entry.target.querySelector('h2');
        if (!heading) return;
        const id = heading.id;

        tocLinks.forEach(link => {
          link.classList.toggle('toc-link--active', link.dataset.target === id);
        });

        if (chapterId && !seenSet.has(id)) {
          seenSet.add(id);
          markSectionSeen(chapterId, id, mod);

          const progress = initProgress();
          const ch       = progress.modules[mod]?.chapters[chapterId];
          if (ch && ch.status !== 'complete') {
            ch.pct = Math.round((seenSet.size / sections.length) * 90); // cap at 90 until explicit complete
            saveProgress(progress);
          }
        }
      }
    });
  }, {
    root:       null,
    rootMargin: '-20% 0px -60% 0px',
    threshold:  0,
  });

  sections.forEach(sec => observer.observe(sec));
}

/* ---------------------------------------------------------
   CHAPTER PAGE — COPY BUTTONS
   --------------------------------------------------------- */
function initCopyButtons() {
  document.querySelectorAll('.code-block').forEach(block => {
    if (block.querySelector('.copy-btn')) return;

    const code = block.querySelector('code');
    if (!code) return;

    const btn = document.createElement('button');
    btn.className   = 'copy-btn';
    btn.textContent = 'COPY';
    btn.setAttribute('aria-label', 'Copy code to clipboard');

    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.innerText);
        btn.textContent = '✓ COPIED';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'COPY';
          btn.classList.remove('copied');
        }, 1600);
      } catch (_) {
        const sel   = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(code);
        sel.removeAllRanges();
        sel.addRange(range);
        btn.textContent = '✓ COPIED';
        setTimeout(() => { btn.textContent = 'COPY'; }, 1600);
      }
    });

    block.appendChild(btn);
  });
}

/* ---------------------------------------------------------
   CHAPTER PAGE — KNOWLEDGE CHECK
   --------------------------------------------------------- */
function initKnowledgeCheck() {
  document.querySelectorAll('.kc-option').forEach(option => {
    option.addEventListener('click', () => {
      const questionBlock = option.closest('.kc-question');
      if (!questionBlock) return;

      if (questionBlock.dataset.revealed === 'true') return;
      questionBlock.dataset.revealed = 'true';

      const isCorrect = option.dataset.correct === 'true';
      const answer    = questionBlock.querySelector('.kc-answer');

      questionBlock.querySelectorAll('.kc-option').forEach(opt => {
        opt.classList.add('kc-option--revealed');
        opt.setAttribute('aria-disabled', 'true');
      });

      if (isCorrect) {
        option.classList.add('kc-option--correct');
      } else {
        option.classList.add('kc-option--incorrect');
        questionBlock.querySelector('.kc-option[data-correct="true"]')
          ?.classList.add('kc-option--correct');
      }

      if (answer) {
        answer.classList.add('is-visible');
      }
    });
  });
}

/* ---------------------------------------------------------
   CHAPTER PAGE — MARK COMPLETE BUTTON
   --------------------------------------------------------- */
function initMarkCompleteButton(chapterId, moduleId) {
  const btn = document.getElementById('markCompleteBtn');
  if (!btn || !chapterId) return;
  const mod = moduleId || detectModuleId();

  btn.addEventListener('click', () => {
    markChapterComplete(chapterId, mod);
    btn.textContent = '✓ COMPLETED';
    btn.disabled    = true;
    btn.style.borderColor = 'var(--accent)';
    btn.style.color       = 'var(--accent)';
  });

  // Reflect existing state
  const progress = initProgress();
  if (progress.modules[mod]?.chapters[chapterId]?.status === 'complete') {
    btn.textContent = '✓ COMPLETED';
    btn.disabled    = true;
    btn.style.borderColor = 'var(--accent)';
    btn.style.color       = 'var(--accent)';
  }
}

/* ---------------------------------------------------------
   MOBILE SIDEBAR TOGGLE (chapter pages)
   --------------------------------------------------------- */
function initMobileSidebar() {
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  const sidebar   = document.querySelector('.toc-sidebar');
  const overlay   = document.querySelector('.toc-overlay');
  if (!toggleBtn || !sidebar) return;

  const open  = () => { sidebar.classList.add('is-open'); overlay?.classList.add('is-open'); document.body.style.overflow = 'hidden'; };
  const close = () => { sidebar.classList.remove('is-open'); overlay?.classList.remove('is-open'); document.body.style.overflow = ''; };

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.contains('is-open') ? close() : open();
  });

  overlay?.addEventListener('click', close);

  sidebar.querySelectorAll('.toc-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) close();
    });
  });
}

/* ---------------------------------------------------------
   THEME TOGGLE
   --------------------------------------------------------- */
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light') {
    document.body.classList.add('light');
    updateThemeIcons(true);
    updateLogoSrc(true);
  }
}

function updateThemeIcons(isLight) {
  const moonIcon = document.querySelector('.theme-toggle .icon-moon');
  const sunIcon  = document.querySelector('.theme-toggle .icon-sun');
  if (!moonIcon || !sunIcon) return;
  moonIcon.style.display = isLight ? 'none' : '';
  sunIcon.style.display  = isLight ? ''     : 'none';
}

function updateLogoSrc(isLight) {
  ['site-logo', 'footer-logo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.src = isLight ? LOGO_LIGHT : LOGO_DARK;
  });
}

function initThemeToggle() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const isNowLight = document.body.classList.toggle('light');
    localStorage.setItem(THEME_KEY, isNowLight ? 'light' : 'dark');
    updateThemeIcons(isNowLight);
    updateLogoSrc(isNowLight);
  });
}

/* ---------------------------------------------------------
   PAGE DETECTION — determine which page we're on
   --------------------------------------------------------- */
function isIndexPage() {
  // Hub index has modulesGrid or catalog section; module index has chaptersGrid
  return !!document.getElementById('modulesGrid') || !!document.getElementById('chaptersGrid') || !!document.getElementById('catalog');
}

function getChapterIdFromPage() {
  const meta = document.querySelector('meta[name="chapter-id"]');
  if (meta) return meta.content;

  const match = window.location.pathname.match(/(\d{2})-/);
  return match ? match[1] : null;
}

/* ---------------------------------------------------------
   INIT — INDEX (hub or module index)
   --------------------------------------------------------- */
function initIndexPage() {
  renderModuleProgress();
  renderOverallProgress();
  initModuleCards();
  initResetButton();
}

/* ---------------------------------------------------------
   INIT — CHAPTER
   --------------------------------------------------------- */
function initChapterPage() {
  const chapterId = getChapterIdFromPage();
  const moduleId  = detectModuleId();

  if (chapterId) {
    markChapterReading(chapterId, moduleId);
  }

  initTOC();
  initReadingProgress();
  initSectionObserver(chapterId, moduleId);
  initCopyButtons();
  initKnowledgeCheck();
  initMarkCompleteButton(chapterId, moduleId);
  initMobileSidebar();
}

/* ---------------------------------------------------------
   BOOT
   --------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initThemeToggle();

  if (isIndexPage()) {
    initIndexPage();
  } else {
    initChapterPage();
  }
});
