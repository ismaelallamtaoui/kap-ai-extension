document.addEventListener('DOMContentLoaded', () => {
  const FULL_CAPACITY_ML = 50_000;
  const TOOLTIP_DELAY_MS = 1000;
  let hoverTimeout;

  const progressFill = document.getElementById('sobrietyProgressFill');
  const detailFill = document.getElementById('sobrietyDetailFill');
  const tooltip = document.getElementById('sobrietyTooltip');
  const toggleBtn = document.getElementById('sobrietyToggle');
  const detailsPanel = document.getElementById('sobrietyDetails');
  const detailAmount = document.getElementById('sobrietyDetailAmount');
  const bar = document.getElementById('sobrietyBar');

  const getWeekStart = (date = new Date()) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // Start on Monday
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + diff);
    return d.getTime();
  };

  const getStorage = (keys) =>
    new Promise((resolve) => {
      if (chrome?.storage?.local) {
        chrome.storage.local.get(keys, (res) => resolve(res || {}));
      } else {
        resolve({});
      }
    });

  const setStorage = (values) =>
    new Promise((resolve) => {
      if (chrome?.storage?.local) {
        chrome.storage.local.set(values, resolve);
      } else {
        resolve();
      }
    });

  const ensureWeeklyReset = async () => {
    const { weeklyResetAt = 0, weeklyWaterMl = 0 } = await getStorage({ weeklyResetAt: 0, weeklyWaterMl: 0 });
    const now = Date.now();
    const currentWeekStart = getWeekStart();
    const needsReset = !weeklyResetAt || now - weeklyResetAt >= 7 * 24 * 60 * 60 * 1000 || weeklyResetAt < currentWeekStart;
    if (needsReset) {
      await setStorage({ weeklyResetAt: currentWeekStart, weeklyWaterMl: 0 });
      localStorage.setItem('weeklyWaterMl', '0');
      localStorage.setItem('weeklyResetAt', String(currentWeekStart));
      return { weeklyResetAt: currentWeekStart, weeklyWaterMl: 0 };
    }
    localStorage.setItem('weeklyResetAt', String(weeklyResetAt));
    localStorage.setItem('weeklyWaterMl', String(weeklyWaterMl));
    return { weeklyResetAt, weeklyWaterMl };
  };

  const updateUI = (waterMl) => {
    const liters = waterMl / 1000;
    const percent = Math.min(waterMl / FULL_CAPACITY_ML, 1) * 100;
    if (progressFill) progressFill.style.width = `${percent}%`;
    if (detailFill) detailFill.style.width = `${percent}%`;
    if (detailAmount) detailAmount.textContent = `${liters.toFixed(1)}L`;
    if (tooltip) tooltip.textContent = `${liters.toFixed(1)} L d’eau consommés cette semaine`;
  };

  const syncFromStorage = async () => {
    const { weeklyWaterMl = 0 } = await ensureWeeklyReset();
    updateUI(weeklyWaterMl);
  };

  if (chrome?.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      if (changes.weeklyWaterMl) {
        const value = changes.weeklyWaterMl.newValue ?? 0;
        localStorage.setItem('weeklyWaterMl', String(value));
        updateUI(value);
      }
      if (changes.weeklyResetAt) {
        const value = changes.weeklyResetAt.newValue ?? getWeekStart();
        localStorage.setItem('weeklyResetAt', String(value));
      }
    });
  }

  const showTooltipWithDelay = () => {
    if (!tooltip) return;
    hoverTimeout = window.setTimeout(() => {
      tooltip.classList.add('visible');
    }, TOOLTIP_DELAY_MS);
  };

  const hideTooltip = () => {
    if (!tooltip) return;
    window.clearTimeout(hoverTimeout);
    tooltip.classList.remove('visible');
  };

  if (bar) {
    bar.addEventListener('mouseenter', showTooltipWithDelay);
    bar.addEventListener('mouseleave', hideTooltip);
    bar.addEventListener('focusin', showTooltipWithDelay);
    bar.addEventListener('focusout', hideTooltip);
  }

  if (toggleBtn && detailsPanel) {
    toggleBtn.addEventListener('click', () => {
      const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      toggleBtn.setAttribute('aria-expanded', String(!isExpanded));
      detailsPanel.hidden = isExpanded;
      bar?.classList.toggle('expanded', !isExpanded);
    });
  }

  syncFromStorage();
  const chooseBtn = document.getElementById('chooseAiBtn');
  const promptBtn = document.getElementById('promptBtn');
  const favBtn = document.getElementById('favoritesBtn');
  const aboutBtn = document.getElementById('aboutBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const ecosiaBtn = document.getElementById('ecosiaBtn');
  const wikiBtn = document.getElementById('wikiBtn');

  // Ouvre le quiz complet afin de choisir l'IA la plus adaptée
  if (chooseBtn) {
    chooseBtn.addEventListener('click', () => {
      window.location.href = '../triage/index.html';
    });
  }

  // Ouvre directement l'interface de génération de prompt
  if (promptBtn) {
    promptBtn.addEventListener('click', () => {
      // Supprime les champs persistés afin d'ouvrir un constructeur vierge
      if (chrome && chrome.storage) {
        chrome.storage.local.remove('lastPromptFields', () => {
          window.location.href = '../constructor/index.html';
        });
      } else {
        window.location.href = '../constructor/index.html';
      }
    });
  }

  // Ouvre la page des prompts favoris
  if (favBtn) {
    favBtn.addEventListener('click', () => {
      window.location.href = '../favorites/index.html';
    });
  }

  // Ouvre la page « Qui sommes nous ? »
  if (aboutBtn) {
    aboutBtn.addEventListener('click', () => {
      window.location.href = '../about/index.html';
    });
  }

  // Ouvre la page de modification de profil
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      window.location.href = '../profile/index.html';
    });
  }

  // Boutons Ecosia et Wikipédia ouvrent les sites respectifs dans un nouvel onglet
  if (ecosiaBtn && ecosiaBtn.tagName === 'BUTTON') {
    ecosiaBtn.addEventListener('click', () => {
      window.open('https://www.ecosia.org', '_blank');
    });
  }
  if (wikiBtn && wikiBtn.tagName === 'BUTTON') {
    wikiBtn.addEventListener('click', () => {
      window.open('https://fr.wikipedia.org/wiki/Wikip%C3%A9dia:Accueil_principal', '_blank');
    });
  }
});
