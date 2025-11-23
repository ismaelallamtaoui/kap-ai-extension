// favorites.js – Gestion de la page des prompts favoris

/*
 * Cette version améliore l'interface de la page des favoris en adoptant
 * un design inspiré du modèle fourni : chaque favori est affiché avec un
 * numéro, un nom dérivé de son contenu, le texte complet du prompt, ainsi
 * que des boutons pour copier ou supprimer l'entrée. Un bouton « Ajouter » en
 * haut permet de créer un nouveau prompt via le constructeur, et un bouton
 * de confirmation en bas renvoie à la page d'accueil.
 */

document.addEventListener('DOMContentLoaded', () => {
  const favListEl = document.getElementById('favList');
  const backBtn = document.getElementById('backFromFavorites');
  const recentBtn = document.getElementById('viewRecent');
  const addBtn = document.getElementById('addFavorite');

  // Bouton « Retour » pour revenir à la page précédente
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (window.history && window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '../entry/index.html';
      }
    });
  }

  // Bouton pour accéder à la page des prompts récents
  if (recentBtn) {
    recentBtn.addEventListener('click', () => {
      window.location.href = '../recent/index.html';
    });
  }

  // Redirige vers le constructeur pour ajouter un nouveau prompt en mode "favori"
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      window.location.href = '../constructor/index.html?favorite=1';
    });
  }

  // Récupère la liste des favoris et affiche la vue
  function loadFavorites() {
    const hasChrome = typeof chrome !== 'undefined' && chrome.storage;
    if (!hasChrome) {
      favListEl.innerHTML = '<p>Fonctionnalité indisponible dans ce contexte.</p>';
      return;
    }
    chrome.storage.local.get({ favorites: [] }, (res) => {
      let favorites = Array.isArray(res.favorites) ? res.favorites : [];
      renderFavorites(favorites);
    });
  }

  // Extrait un nom pour le prompt en se basant sur la ligne « Sujet : » ou sur
  // les premiers mots. Si rien n'est trouvé, utilise un nom générique.
  function extractName(promptText, index) {
    const subjectMatch = /Sujet\s*:\s*(.+)/i.exec(promptText);
    if (subjectMatch && subjectMatch[1]) {
      // Tronque le sujet après 40 caractères pour éviter les débordements
      const raw = subjectMatch[1].trim();
      return raw.length > 40 ? raw.substring(0, 40) + '…' : raw;
    }
    // Fallback : utilise les premiers mots du prompt
    const trimmed = promptText.trim();
    if (trimmed.length > 0) {
      const words = trimmed.split(/\s+/).slice(0, 8).join(' ');
      return words.length < trimmed.length ? words + '…' : words;
    }
    return 'Prompt ' + (index + 1);
  }

  // Met à jour l'affichage des favoris
  function renderFavorites(list) {
    favListEl.innerHTML = '';
    if (!list || list.length === 0) {
      const p = document.createElement('p');
      p.textContent = "Vous n'avez pas encore enregistré de prompts.";
      favListEl.appendChild(p);
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

      // Conteneur informations (nom + texte)
      const infoWrapper = document.createElement('div');
      infoWrapper.className = 'fav-info';
      infoWrapper.appendChild(nameEl);
      infoWrapper.appendChild(contentEl);

      // Actions (copier, modifier, supprimer, monter/descendre)
      const actionsEl = document.createElement('div');
      actionsEl.className = 'fav-actions';
      // Bouton supprimer
      const delBtn = document.createElement('button');
      delBtn.className = 'delete-btn';
      delBtn.setAttribute('title', 'Supprimer');
      delBtn.textContent = '✖';
      delBtn.addEventListener('click', () => {
        deleteFavorite(idx);
      });
      // Bouton copier
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.setAttribute('title', 'Copier');
      copyBtn.textContent = '📋';
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(prompt);
      });
      // Bouton modifier
      const editBtn = document.createElement('button');
      editBtn.className = 'edit-btn';
      editBtn.setAttribute('title', 'Modifier');
      editBtn.textContent = '✎';
      editBtn.addEventListener('click', () => {
        // Navigue vers le constructeur avec un paramètre indiquant l'index à éditer
        window.location.href = '../constructor/index.html?edit=' + idx;
      });
      // Bouton monter
      const upBtn = document.createElement('button');
      upBtn.className = 'move-btn';
      upBtn.setAttribute('title', 'Monter');
      upBtn.textContent = '▲';
      upBtn.addEventListener('click', () => {
        moveFavorite(idx, -1);
      });
      // Bouton descendre
      const downBtn = document.createElement('button');
      downBtn.className = 'move-btn';
      downBtn.setAttribute('title', 'Descendre');
      downBtn.textContent = '▼';
      downBtn.addEventListener('click', () => {
        moveFavorite(idx, 1);
      });
      actionsEl.appendChild(delBtn);
      actionsEl.appendChild(copyBtn);
      actionsEl.appendChild(editBtn);
      actionsEl.appendChild(upBtn);
      actionsEl.appendChild(downBtn);

      card.appendChild(indexEl);
      card.appendChild(infoWrapper);
      card.appendChild(actionsEl);
      favListEl.appendChild(card);
    });
  }

  // Supprime un favori à un index donné puis re‑rend la liste
  function deleteFavorite(index) {
    const hasChrome = typeof chrome !== 'undefined' && chrome.storage;
    if (!hasChrome) return;
    chrome.storage.local.get({ favorites: [] }, (res) => {
      let favs = Array.isArray(res.favorites) ? res.favorites : [];
      if (index >= 0 && index < favs.length) {
        favs.splice(index, 1);
        chrome.storage.local.set({ favorites: favs }, () => {
          renderFavorites(favs);
        });
      }
    });
  }

  /**
   * Déplace un favori vers le haut ou le bas en fonction de la direction donnée.
   * @param {number} index Position actuelle du favori
   * @param {number} direction -1 pour monter, 1 pour descendre
   */
  function moveFavorite(index, direction) {
    const hasChrome = typeof chrome !== 'undefined' && chrome.storage;
    if (!hasChrome) return;
    chrome.storage.local.get({ favorites: [] }, (res) => {
      let favs = Array.isArray(res.favorites) ? res.favorites : [];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= favs.length) return;
      // Échange les deux éléments
      const temp = favs[index];
      favs[index] = favs[newIndex];
      favs[newIndex] = temp;
      chrome.storage.local.set({ favorites: favs }, () => {
        renderFavorites(favs);
      });
    });
  }

  // Initialisation
  loadFavorites();
});