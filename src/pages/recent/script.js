// recent.js – affiche la liste des derniers prompts et permet de les ajouter aux favoris

document.addEventListener('DOMContentLoaded', () => {
  const listEl = document.getElementById('recentList');
  const backBtn = document.getElementById('backFromRecent');

  // Charge les derniers prompts et les favoris pour afficher l'état des cœurs
  function loadRecent() {
    const hasChrome = typeof chrome !== 'undefined' && chrome.storage;
    if (!hasChrome) {
      listEl.innerHTML = '<p>Fonctionnalité indisponible dans ce contexte.</p>';
      return;
    }
    chrome.storage.local.get({ recentPrompts: [], favorites: [] }, (res) => {
      const recent = Array.isArray(res.recentPrompts) ? res.recentPrompts : [];
      const favorites = Array.isArray(res.favorites) ? res.favorites : [];
      renderRecent(recent, favorites);
    });
  }

  // Extrait un nom pour le prompt (utilisé dans favorites.js également)
  function extractName(promptText, index) {
    const subjectMatch = /Sujet\s*:\s*(.+)/i.exec(promptText);
    if (subjectMatch && subjectMatch[1]) {
      const raw = subjectMatch[1].trim();
      return raw.length > 40 ? raw.substring(0, 40) + '…' : raw;
    }
    const trimmed = promptText.trim();
    if (trimmed.length > 0) {
      const words = trimmed.split(/\s+/).slice(0, 8).join(' ');
      return words.length < trimmed.length ? words + '…' : words;
    }
    return 'Prompt ' + (index + 1);
  }

  // Met à jour l'affichage des prompts récents
  function renderRecent(list, favList) {
    listEl.innerHTML = '';
    if (!list || list.length === 0) {
      const p = document.createElement('p');
      p.textContent = "Aucun prompt récent n'a été généré pour le moment.";
      listEl.appendChild(p);
      return;
    }
    list.forEach((prompt, idx) => {
      const card = document.createElement('div');
      card.className = 'fav-card';

      // Numéro
      const indexEl = document.createElement('div');
      indexEl.className = 'fav-index';
      indexEl.textContent = idx + 1;

      // Nom du prompt
      const nameEl = document.createElement('div');
      nameEl.className = 'fav-name';
      nameEl.textContent = extractName(prompt, idx);

      // Contenu complet
      const contentEl = document.createElement('div');
      contentEl.className = 'fav-content';
      contentEl.textContent = prompt;

      // Conteneur info
      const infoWrapper = document.createElement('div');
      infoWrapper.className = 'fav-info';
      infoWrapper.appendChild(nameEl);
      infoWrapper.appendChild(contentEl);

      // Actions : cœur pour ajouter/retirer des favoris
      const actionsEl = document.createElement('div');
      actionsEl.className = 'fav-actions';
      const favBtn = document.createElement('button');
      favBtn.className = 'favorite-toggle-btn';
      // Vérifie si ce prompt est déjà en favori
      const isFav = favList.includes(prompt);
      favBtn.textContent = isFav ? '💖' : '♡';
      favBtn.setAttribute('title', isFav ? 'Retirer des favoris' : 'Ajouter aux favoris');
      favBtn.addEventListener('click', () => {
        toggleFavorite(prompt);
      });
      actionsEl.appendChild(favBtn);

      card.appendChild(indexEl);
      card.appendChild(infoWrapper);
      card.appendChild(actionsEl);
      listEl.appendChild(card);
    });
  }

  // Ajoute ou retire un prompt des favoris
  function toggleFavorite(prompt) {
    chrome.storage.local.get({ favorites: [] }, (res) => {
      let favs = Array.isArray(res.favorites) ? res.favorites : [];
      const idx = favs.indexOf(prompt);
      if (idx === -1) {
        favs.push(prompt);
      } else {
        favs.splice(idx, 1);
      }
      chrome.storage.local.set({ favorites: favs }, () => {
        loadRecent();
      });
    });
  }

  // Bouton retour
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (window.history && window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '../favorites/index.html';
      }
    });
  }

  // Initialisation
  loadRecent();
});