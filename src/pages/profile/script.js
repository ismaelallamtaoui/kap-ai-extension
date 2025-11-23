// Gestion de la modification du profil utilisateur
document.addEventListener('DOMContentLoaded', () => {
  const prenomInput = document.getElementById('prenom');
  const nomInput = document.getElementById('nom');
  const ecoleInput = document.getElementById('ecole');
  const specialiteInput = document.getElementById('specialite');
  const niveauInput = document.getElementById('niveau');
  const preferredModelSelect = document.getElementById('preferredModel');
  const aiSubInput = document.getElementById('aiSubscription');
  const saveBtn = document.getElementById('saveProfile');
  const backBtn = document.getElementById('backHomeFromProfile');

  // === Élément et logique pour la section « Mieux prompter » ===
  // Récupère les éléments du DOM pour le mode de génération de prompt
  const promptModeRadios = Array.from(document.getElementsByName('promptMode'));
  const quickSettingsEl = document.getElementById('quickSettings');
  const advancedSettingsEl = document.getElementById('advancedSettings');
  const quickInputEl = document.getElementById('quickInput');
  const quickGenerateBtn = document.getElementById('quickGenerateBtn');
  const quickPromptContainer = document.getElementById('quickPromptContainer');
  const quickGeneratedEl = document.getElementById('quickGenerated');
  const advContextEl = document.getElementById('advContext');
  const autoCorrectToggleEl = document.getElementById('autoCorrectToggle');
  const chipContainerEl = document.getElementById('chipContainer');
  const advGenerateBtn = document.getElementById('advGenerateBtn');
  const advPromptContainer = document.getElementById('advPromptContainer');
  const advGeneratedEl = document.getElementById('advGenerated');
  const modelRecSection = document.getElementById('modelRecommendation');
  const modelRecContent = document.getElementById('modelRecommendationContent');

  // Liste des chips sélectionnées par l'utilisateur
  let selectedChips = [];

  /**
   * Met à jour l'affichage en fonction du mode sélectionné (rapide ou avancé).
   */
  function updateMode() {
    // Identifie le mode coché (default = quick)
    const checked = promptModeRadios.find(r => r.checked);
    const mode = checked ? checked.value : 'quick';
    if (mode === 'quick') {
      if (quickSettingsEl) quickSettingsEl.style.display = 'block';
      if (advancedSettingsEl) advancedSettingsEl.style.display = 'none';
    } else {
      if (quickSettingsEl) quickSettingsEl.style.display = 'none';
      if (advancedSettingsEl) advancedSettingsEl.style.display = 'block';
    }
  }

  // Attache des écouteurs de changement pour basculer entre les modes
  promptModeRadios.forEach((radio) => {
    radio.addEventListener('change', updateMode);
  });

  /**
   * Génère un prompt simple à partir de la description en mode rapide.
   */
  function generateQuickPrompt() {
    if (!quickInputEl) return;
    const desc = quickInputEl.value.trim();
    if (!desc) {
      if (quickPromptContainer) quickPromptContainer.style.display = 'none';
      if (quickGeneratedEl) quickGeneratedEl.value = '';
      return;
    }
    // Modèle de prompt rapide : formule une demande claire mais succincte
    const promptText = `Agis comme un assistant expert et aide-moi avec cette demande : ${desc}`;
    if (quickGeneratedEl) quickGeneratedEl.value = promptText;
    if (quickPromptContainer) quickPromptContainer.style.display = 'block';
    // Mémorise la demande pour les suggestions futures
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get({ promptHistory: [] }, (res) => {
        let hist = Array.isArray(res.promptHistory) ? res.promptHistory : [];
        // Ajoute la description si elle n'est pas déjà présente
        if (desc) {
          hist.push(desc);
          if (hist.length > 20) hist = hist.slice(hist.length - 20);
        }
        chrome.storage.local.set({ promptHistory: hist });
      });
    }
  }

  /**
   * Génère un prompt complet en mode avancé en combinant contexte, chips et correction.
   */
  function generateAdvancedPrompt() {
    let ctx = advContextEl ? advContextEl.value.trim() : '';
    const auto = autoCorrectToggleEl ? autoCorrectToggleEl.checked : false;
    let lines = [];
    if (ctx) lines.push(`Contexte : ${ctx}`);
    if (selectedChips && selectedChips.length > 0) {
      lines.push(`Clarifications : ${selectedChips.join(' ; ')}`);
    }
    if (auto) {
      lines.push(`Veuillez corriger automatiquement la grammaire et l'orthographe de ma demande.`);
    }
    if (lines.length === 0) {
      lines.push('Décris ton besoin pour générer un prompt.');
    }
    const assembled = lines.join('\n');
    if (advGeneratedEl) advGeneratedEl.value = assembled;
    if (advPromptContainer) advPromptContainer.style.display = 'block';
    // Met à jour la recommandation de modèle en fonction du profil
    updateModelRecommendation();
    if (modelRecSection) modelRecSection.style.display = 'block';
    // Mémorise le contexte dans l'historique des demandes
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get({ promptHistory: [] }, (res) => {
        let hist = Array.isArray(res.promptHistory) ? res.promptHistory : [];
        if (ctx) {
          hist.push(ctx);
          if (hist.length > 20) hist = hist.slice(hist.length - 20);
        }
        chrome.storage.local.set({ promptHistory: hist });
      });
    }
  }

  /**
   * Met à jour l'affichage du bloc « Modèle recommandé » en fonction du profil enregistré.
   */
  function updateModelRecommendation() {
    if (!modelRecContent) return;
    // Récupère le modèle préféré de l'utilisateur
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get({ profile: {} }, (res) => {
        const prof = res.profile || {};
        const pref = prof.preferredModel || '';
        if (pref) {
          modelRecContent.innerHTML = `Votre modèle préféré est <strong>${pref}</strong>. Utilisez‑le pour de meilleurs résultats.`;
        } else {
          modelRecContent.textContent = `Aucun modèle préféré défini. Sélectionnez-en un plus haut pour obtenir une recommandation.`;
        }
      });
    } else {
      modelRecContent.textContent = 'Choisissez un modèle préféré pour afficher une recommandation.';
    }
  }

  // Charge les suggestions à partir du fichier suggestions.json et crée des chips interactifs
  (function loadSuggestions() {
    const url = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) ? chrome.runtime.getURL('src/data/suggestions.json') : '../../data/suggestions.json';
    fetch(url).then((response) => response.json()).then((data) => {
      const all = [];
      Object.values(data).forEach((arr) => {
        if (Array.isArray(arr)) all.push(...arr);
      });
      all.forEach((txt) => {
        if (!chipContainerEl) return;
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = txt;
        chip.addEventListener('click', () => {
          if (selectedChips.includes(txt)) {
            // Retire la chip
            selectedChips = selectedChips.filter(c => c !== txt);
            chip.classList.remove('selected');
          } else {
            selectedChips.push(txt);
            chip.classList.add('selected');
          }
        });
        chipContainerEl.appendChild(chip);
      });
      // Applique les chips sauvegardées après chargement
      if (window.__savedSelectedChips && Array.isArray(window.__savedSelectedChips)) {
        window.__savedSelectedChips.forEach((txt) => {
          const el = Array.from(chipContainerEl.children).find((child) => child.textContent === txt);
          if (el) {
            selectedChips.push(txt);
            el.classList.add('selected');
          }
        });
        window.__savedSelectedChips = null;
      }
    }).catch(() => {
      // En cas d'échec du chargement, ne rien faire
    });
  })();

  // Exécute updateMode au chargement pour afficher la bonne section
  updateMode();

  // Branche les boutons de génération si présents
  if (quickGenerateBtn) quickGenerateBtn.addEventListener('click', generateQuickPrompt);
  if (advGenerateBtn) advGenerateBtn.addEventListener('click', generateAdvancedPrompt);

  // Restaure les préférences de prompt enregistrées
  chrome.storage.local.get({ profile: {} }, (res) => {
    const prof = res.profile || {};
    if (prof.promptPrefs) {
      const prefs = prof.promptPrefs;
      // Mode
      if (prefs.mode) {
        const r = promptModeRadios.find((rr) => rr.value === prefs.mode);
        if (r) {
          r.checked = true;
          updateMode();
        }
      }
      // Autocorrection
      if (typeof prefs.autoCorrect === 'boolean' && autoCorrectToggleEl) {
        autoCorrectToggleEl.checked = prefs.autoCorrect;
      }
      // Contexte avancé
      if (prefs.context && advContextEl) {
        advContextEl.value = prefs.context;
      }
      // Chips sélectionnées
      if (Array.isArray(prefs.selectedChips)) {
        // Stocke temporairement pour sélection ultérieure après chargement des chips
        window.__savedSelectedChips = prefs.selectedChips;
      }
    }
  });

  // Charge les valeurs existantes du profil et les renseigne dans le formulaire
  chrome.storage.local.get({ profile: {} }, (res) => {
    const profile = res.profile || {};
    if (profile.prenom) prenomInput.value = profile.prenom;
    if (profile.nom) nomInput.value = profile.nom;
    if (profile.ecole) ecoleInput.value = profile.ecole;
    if (profile.specialite) specialiteInput.value = profile.specialite;
    if (profile.niveau) niveauInput.value = profile.niveau;
    // Remplit le sélecteur "Mon IA préférée" avec les modèles disponibles
    populatePreferredModels(() => {
      // Après avoir peuplé les options, sélectionne la valeur enregistrée
      if (profile.preferredModel) {
        preferredModelSelect.value = profile.preferredModel;
      }
    });
    // Sélectionne les abonnements enregistrés dans la liste multi‑sélection
    if (profile.aiSubscription) {
      const savedSubs = profile.aiSubscription.split(',').map(s => s.trim());
      Array.from(aiSubInput.options).forEach(opt => {
        opt.selected = savedSubs.includes(opt.value);
      });
    }
  });

  // Enregistre les modifications du profil, y compris les préférences de prompt
  saveBtn.addEventListener('click', () => {
    // Construit l'objet de profil à partir des champs classiques
    const newProfile = {
      prenom: prenomInput.value.trim(),
      nom: nomInput.value.trim(),
      ecole: ecoleInput.value.trim(),
      specialite: specialiteInput.value.trim(),
      niveau: niveauInput.value.trim(),
      // Chaîne des abonnements sélectionnés
      aiSubscription: Array.from(aiSubInput.selectedOptions)
        .map((opt) => opt.value)
        .filter((v) => v !== '')
        .join(', '),
      preferredModel: preferredModelSelect.value
    };
    // Ajoute les préférences de prompt à l'objet de profil
    const prefModeRadio = promptModeRadios.find((r) => r.checked);
    const prefMode = prefModeRadio ? prefModeRadio.value : 'quick';
    const prefs = {
      mode: prefMode,
      autoCorrect: autoCorrectToggleEl ? autoCorrectToggleEl.checked : false,
      context: advContextEl ? advContextEl.value.trim() : '',
      selectedChips: Array.isArray(selectedChips) ? selectedChips.slice() : []
    };
    newProfile.promptPrefs = prefs;
    chrome.storage.local.set({ profile: newProfile }, () => {
      // Retour contextuel vers la page précédente après sauvegarde
      if (window.history && window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '../entry/index.html';
      }
    });
  });

  // Bouton de retour sans sauvegarde
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      // Retour contextuel vers la page précédente sans enregistrer
      if (window.history && window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '../entry/index.html';
      }
    });
  }
});

/**
 * Remplit le sélecteur des modèles préférés avec les noms des IA de base
 * (ChatGPT, Claude, Gemini, Mistral, DALL‑E, etc.). Ce sélecteur ne
 * contient volontairement pas de références à des versions spécifiques.
 * On rassemble les noms depuis la base de données globale (aiDatabase) si
 * elle est disponible, sinon on utilise une liste statique de secours.
 *
 * @param {Function} [callback] Fonction appelée après le remplissage.
 */
function populatePreferredModels(callback) {
  const select = document.getElementById('preferredModel');
  if (!select) {
    if (typeof callback === 'function') callback();
    return;
  }
  // Construit un ensemble de noms de modèles de base
  const namesSet = new Set();
  // Tente d'extraire les noms depuis la base de données fournie par ai_database.js
  try {
    if (window.aiDatabase) {
      Object.values(window.aiDatabase).forEach((prioMap) => {
        Object.values(prioMap).forEach((tools) => {
          tools.forEach((tool) => {
            // Le nom de base est la première partie avant l'espace ou la version (ex: "ChatGPT 4o" -> "ChatGPT")
            const parts = tool.name.split(/\s+/);
            const base = parts[0];
            if (base) namesSet.add(base);
          });
        });
      });
    }
  } catch (e) {
    // Ignore et utilise la liste statique
  }
  // Liste de secours pour s'assurer que quelques modèles soient disponibles
  const fallback = ['ChatGPT', 'Claude', 'Gemini', 'Mistral', 'DALL-E', 'StableDiffusion'];
  fallback.forEach((n) => namesSet.add(n));
  // Trie et insère les options dans le select
  const optionsHtml = ['<option value="">-- Sélectionner --</option>'];
  Array.from(namesSet).sort().forEach((name) => {
    optionsHtml.push(`<option value="${name}">${name}</option>`);
  });
  select.innerHTML = optionsHtml.join('');
  if (typeof callback === 'function') callback();
}