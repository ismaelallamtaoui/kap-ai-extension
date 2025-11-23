// constructor.js – Nouveau constructeur de prompt inspiré du design moderne

/*
 * Ce script gère l'interface du nouvel onglet « Mieux Prompter ». Il prend en
 * charge les modes rapide et expert, permet d'ajouter dynamiquement des
 * styles ou des langues, assemble le prompt final et gère la copie vers le
 * presse‑papiers. Les recommandations d'IA sont mises à jour en fonction
 * de l'IA sélectionnée précédemment dans l'extension (si disponible).
 */

document.addEventListener('DOMContentLoaded', () => {
  const expertToggle = document.getElementById('expertModeToggle');
  const modeLabel = document.getElementById('modeLabel');
  const quickSection = document.getElementById('quick-mode');
  const expertSection = document.getElementById('expert-mode');

  // Basculer entre les sections lorsque le commutateur change
  expertToggle.addEventListener('change', () => {
    const isExpert = expertToggle.checked;
    modeLabel.textContent = isExpert ? 'Mode expert' : 'Mode rapide';
    quickSection.style.display = isExpert ? 'none' : 'block';
    expertSection.style.display = isExpert ? 'block' : 'none';
  });

  // Fonction pour ajouter dynamiquement des options dans les listes déroulantes
  function enableAddOption(selectEl) {
    selectEl.addEventListener('change', () => {
      const selected = selectEl.options[selectEl.selectedIndex];
      if (selected && selected.getAttribute('data-add') === 'true') {
        const newValue = prompt('Ajouter une nouvelle option :');
        if (newValue) {
          const newOpt = document.createElement('option');
          newOpt.value = newValue.toLowerCase();
          newOpt.textContent = newValue;
          // Insère avant la dernière option (qui est l'option d'ajout)
          selectEl.insertBefore(newOpt, selected);
          selectEl.value = newOpt.value;
        } else {
          // Si annulation, revient à la première option
          selectEl.selectedIndex = 0;
        }
      }
    });
  }

  // Initialise les listes déroulantes pour l'ajout d'options
  const toneSelect = document.getElementById('toneSelect');
  const langSelect = document.getElementById('langSelect');
  const toneSelectExpert = document.getElementById('toneSelectExpert');
  const langSelectExpert = document.getElementById('langSelectExpert');
  [toneSelect, langSelect, toneSelectExpert, langSelectExpert].forEach((sel) => {
    if (sel) enableAddOption(sel);
  });

  // Assemble le prompt en fonction du mode
  function assemblePrompt() {
    const isExpert = expertToggle.checked;
    if (!isExpert) {
      // Mode rapide : description libre et préférences simples
      const desc = document.getElementById('freeInput').value.trim();
      const tone = toneSelect.value;
      const format = document.getElementById('detailSelect').value;
      const lang = langSelect.value;
      let prompt = '';
      if (desc) prompt += `Description : ${desc}\n`;
      prompt += `Ton : ${tone}\n`;
      prompt += `Format : ${format}\n`;
      prompt += `Langue : ${lang}`;
      return prompt;
    } else {
      // Mode expert : champs multiples
      const contexte = document.getElementById('contexte').value.trim();
      const demande = document.getElementById('demande').value.trim();
      const contraintes = document.getElementById('contraintes').value.trim();
      const example = document.getElementById('example').value.trim();
      const objective = document.getElementById('objective').value.trim();
      const toneE = toneSelectExpert.value;
      const langE = langSelectExpert.value;
      let prompt = '';
      if (contexte) prompt += `Rôle/Contexte : ${contexte}\n`;
      if (demande) prompt += `Tâche : ${demande}\n`;
      if (contraintes) prompt += `Contrainte/Format : ${contraintes}\n`;
      if (example) prompt += `Exemple/Pièce jointe : ${example}\n`;
      if (objective) prompt += `Objectif/KPI : ${objective}\n`;
      prompt += `Ton : ${toneE}\n`;
      prompt += `Langue : ${langE}`;
      return prompt;
    }
  }

  // Met à jour les recommandations d'IA dans l'interface
  function updateRecommendations() {
    const defaultAI = { name: 'Perplexity', url: 'https://www.perplexity.ai/', note: 'A' };
    function applyAI(ai) {
      document.getElementById('sobriete-name').textContent = ai.name;
      document.getElementById('equilibre-name').textContent = ai.name;
      document.getElementById('performance-name').textContent = ai.name;
      document.getElementById('sobriete-rating').textContent = `Sobriété ${ai.note || 'A'}`;
      document.getElementById('equilibre-rating').textContent = `Équilibre ${ai.note || 'A'}`;
      document.getElementById('performance-rating').textContent = `Performance ${ai.note || 'A'}`;
      // Stocke l'URL dans l'attribut data-url des boutons
      ['sobriete-open','equilibre-open','performance-open'].forEach((id) => {
        const btn = document.getElementById(id);
        if (btn) btn.dataset.url = ai.url;
      });
    }
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['selectedAI'], (res) => {
        const ai = res.selectedAI || defaultAI;
        applyAI(ai);
      });
    } else {
      applyAI(defaultAI);
    }
  }

  // Attacher les boutons d'ouverture pour ouvrir l'IA dans un nouvel onglet
  ['sobriete-open', 'equilibre-open', 'performance-open'].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => {
        const url = btn.dataset.url;
        if (url) {
          if (typeof chrome !== 'undefined') {
            chrome.tabs ? chrome.tabs.create({ url }) : window.open(url, '_blank');
          } else {
            window.open(url, '_blank');
          }
        }
      });
    }
  });

  // Boutons d'analyse
  const analyzeQuick = document.getElementById('analyzeBtn');
  const analyzeExpert = document.getElementById('analyzeBtnExpert');
  if (analyzeQuick) analyzeQuick.addEventListener('click', updateRecommendations);
  if (analyzeExpert) analyzeExpert.addEventListener('click', updateRecommendations);

  // Boutons de copie
  function attachCopy(buttonId) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    btn.addEventListener('click', () => {
      const promptText = assemblePrompt();
      navigator.clipboard.writeText(promptText).then(() => {
        // Optionnel : enregistre le prompt dans l'historique des récents
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get({ recentPrompts: [], waterConsumed: 0 }, (res) => {
            let recents = Array.isArray(res.recentPrompts) ? res.recentPrompts : [];
            recents.push(promptText);
            if (recents.length > 20) recents = recents.slice(recents.length - 20);
            const newAmount = (res.waterConsumed || 0) + 500;
            chrome.storage.local.set({ recentPrompts: recents, waterConsumed: newAmount }, () => {
              // Met à jour la jauge après mise à jour du stockage
              updateWaterGauge();
            });
          });
        }
      });
    });
  }
  attachCopy('copyBtn');
  attachCopy('copyBtnExpert');

  // Met à jour la jauge et la quantité d'eau affichée
  function updateWaterGauge() {
    const fillEl = document.getElementById('waterFill');
    const countEl = document.getElementById('waterConsumedLiters');
    if (!fillEl || !countEl) return;
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get({ waterConsumed: 0 }, (res) => {
        const water = typeof res.waterConsumed === 'number' ? res.waterConsumed : 0;
        // 1000 unités = 1L, jauge pleine à 10L (10000 unités)
        const liters = Math.round(water / 1000);
        countEl.textContent = `${liters}L`;
        const ratio = Math.min(water / 10000, 1) * 100;
        fillEl.style.width = `${ratio}%`;
      });
    } else {
      // Valeurs par défaut
      countEl.textContent = '10L';
      fillEl.style.width = '50%';
    }
  }

  // Rafraîchit la jauge au chargement
  updateWaterGauge();

  // Gestion du bouton favori pour ajouter/retirer le prompt des favoris
  const favBtn = document.getElementById('favoriteToggle');
  if (favBtn) {
    favBtn.addEventListener('click', () => {
      const currentPrompt = assemblePrompt();
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get({ favorites: [] }, (res) => {
          let favs = Array.isArray(res.favorites) ? res.favorites : [];
          const idx = favs.indexOf(currentPrompt);
          if (idx > -1) {
            // Retirer des favoris
            favs.splice(idx, 1);
            favBtn.classList.remove('favorited');
          } else {
            // Ajouter aux favoris
            favs.push(currentPrompt);
            favBtn.classList.add('favorited');
          }
          chrome.storage.local.set({ favorites: favs });
        });
      } else {
        // Mode hors extension : alterne simplement l'état CSS
        favBtn.classList.toggle('favorited');
      }
    });
  }

  // Initialisation : met à jour les recommandations et définit l'icône du favori
  updateRecommendations();
});