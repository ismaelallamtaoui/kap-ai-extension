// sidepanel.js – gestion du panneau latéral et des onglets

/*
 * Ce script est chargé par sidepanel.html pour éviter l'utilisation de code
 * inline, interdit par la politique CSP par défaut des extensions MV3.
 * Il gère la navigation entre les onglets du panneau latéral en mettant
 * à jour la source de l'iframe et en appliquant la classe 'active' au
 * bouton sélectionné.
 */

(() => {
  // Associe chaque onglet (sauf "Mieux prompter") à la page qu'il doit charger.
  // L'onglet "promptTab" est géré séparément et n'a pas de page associée :
  // son contenu est intégré directement dans le sidepanel via le conteneur
  // #promptContainer. On n'inclut donc pas promptTab dans ce mapping.
  // Met à jour les chemins vers les pages après restructuration de l'arborescence.
  const tabMapping = {
    // Onglet pour choisir l'IA : charge la page de triage
    chooseTab: 'src/pages/triage/index.html',
    // Onglet des favoris : charge la liste des prompts favoris
    favoritesTab: 'src/pages/favorites/index.html',
    // Onglet paramètres : charge la page de profil/utilisateur
    settingsTab: 'src/pages/profile/index.html'
  };
  const iframe = document.getElementById('contentFrame');
  const promptContainer = document.getElementById('promptContainer');

  // Met à jour la classe active sur la barre d'onglets, y compris pour
  // l'onglet « Mieux Prompter ». On parcourt l'ensemble des identifiants
  // connus et applique la classe 'active' uniquement sur l'élément ciblé.
  function setActiveTab(id) {
    const allTabs = ['promptTab', ...Object.keys(tabMapping)];
    allTabs.forEach((key) => {
      const btn = document.getElementById(key);
      if (btn) {
        btn.classList.toggle('active', key === id);
      }
    });
  }

  // Bascule l'onglet vers une page externe dans l'iframe lorsque l'un des
  // onglets listés dans tabMapping est cliqué. À cette occasion, on
  // masque le conteneur "Mieux prompter" et on affiche l'iframe.
  Object.entries(tabMapping).forEach(([id, page]) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => {
        if (promptContainer) {
          promptContainer.style.display = 'none';
        }
        if (iframe) {
          iframe.style.display = 'block';
        }
        let target = page;
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
          try {
            target = chrome.runtime.getURL(page);
          } catch (e) {
            // Si getURL échoue (peu probable), on conserve le chemin relatif
          }
        }
        iframe.src = target;
        setActiveTab(id);
      });
    }
  });

  // Gestion spécifique de l'onglet « Mieux Prompter ». Lorsque cet onglet
  // est cliqué, on masque l'iframe et on affiche le conteneur dédié sans
  // charger de page externe.
  const promptTabBtn = document.getElementById('promptTab');
  if (promptTabBtn) {
    promptTabBtn.addEventListener('click', () => {
      // Affiche le conteneur et masque l'iframe
      if (promptContainer) {
        promptContainer.style.display = 'flex';
      }
      if (iframe) {
        iframe.style.display = 'none';
      }
      setActiveTab('promptTab');
    });
  }

  // Synchronise l'onglet actif avec la page actuellement affichée dans l'iframe.
  // On met à jour uniquement pour les pages externes listées dans tabMapping.
  if (iframe) {
    iframe.addEventListener('load', () => {
      try {
        const url = new URL(iframe.contentWindow.location.href);
        // Récupère le chemin complet (sans l'ID d'extension) pour comparaison
        const pathname = url.pathname;
        // Trouve l'entrée dont le chemin se termine par le même suffixe
        const entry = Object.entries(tabMapping).find(([, path]) => {
          return pathname.endsWith(path);
        });
        if (entry) {
          setActiveTab(entry[0]);
        }
      } catch (e) {
        // Ignore les problèmes de sécurité ou autres exceptions.
      }
    });
  }

  // Affiche le conteneur « Mieux Prompter » par défaut et masque l'iframe.
  function showPromptByDefault() {
    if (promptContainer) {
      promptContainer.style.display = 'flex';
    }
    if (iframe) {
      iframe.style.display = 'none';
    }
    setActiveTab('promptTab');
  }
  // Exécution immédiate du chargement initial
  showPromptByDefault();

  /* -------------------------------------------------------------------
   * Logique de l'interface "Mieux prompter".
   * Cette section gère les interactions du mode rapide et du mode avancé,
   * la génération des prompts, l'affichage des suggestions basées sur
   * la mémoire locale et la recommandation de modèle. La logique est
   * encapsulée ici afin d'être initialisée une seule fois à la création
   * du panneau latéral.
   */

  // Références des éléments du DOM pour la zone Mieux prompter
  const mpQuickBtn = document.getElementById('mpQuickBtn');
  const mpAdvancedBtn = document.getElementById('mpAdvancedBtn');
  const mpQuickSection = document.getElementById('mpQuickSection');
  const mpAdvancedSection = document.getElementById('mpAdvancedSection');
  const mpAutoCorrect = document.getElementById('mpAutoCorrect');
  const mpQuickInput = document.getElementById('mpQuickInput');
  const mpAdvContext = document.getElementById('mpAdvContext');
  const mpChipsContainer = document.getElementById('mpChips');
  const mpQuickResult = document.getElementById('mpQuickResult');
  const mpQuickGenerated = document.getElementById('mpQuickGenerated');
  const mpAdvResult = document.getElementById('mpAdvResult');
  const mpAdvGenerated = document.getElementById('mpAdvGenerated');
  const mpGenerateBtn = document.getElementById('mpGenerateBtn');
  const mpAdvGenerateBtn = document.getElementById('mpAdvGenerateBtn');
  const mpModelRecommendation = document.getElementById('mpModelRecommendation');
  const mpModelRecText = document.getElementById('mpModelRecText');
  const mpQuickSuggestions = document.getElementById('mpQuickSuggestions');
  const mpAdvSuggestions = document.getElementById('mpAdvSuggestions');

  // Liste des chips sélectionnées en mode avancé
  let selectedChips = [];

  /**
   * Bascule entre les modes rapide et avancé.
   * @param {string} mode 'quick' ou 'advanced'
   */
  function setPromptMode(mode) {
    if (!mpQuickSection || !mpAdvancedSection) return;
    // Définir l'état actif sur les boutons de mode
    if (mpQuickBtn) mpQuickBtn.classList.toggle('active', mode === 'quick');
    if (mpAdvancedBtn) mpAdvancedBtn.classList.toggle('active', mode === 'advanced');
    // Afficher/masquer les sections
    mpQuickSection.style.display = mode === 'quick' ? 'block' : 'none';
    mpAdvancedSection.style.display = mode === 'advanced' ? 'block' : 'none';
  }

  // Écouteurs de bascule de mode
  if (mpQuickBtn) mpQuickBtn.addEventListener('click', () => setPromptMode('quick'));
  if (mpAdvancedBtn) mpAdvancedBtn.addEventListener('click', () => setPromptMode('advanced'));

  /**
   * Sauvegarde une chaîne dans l'historique local des demandes.
   * On garde un maximum de 20 entrées et on n'ajoute que les valeurs non vides.
   * @param {string} str
   */
  function saveToHistory(str) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get({ promptHistory: [] }, (res) => {
        let hist = Array.isArray(res.promptHistory) ? res.promptHistory : [];
        if (str) {
          hist.push(str);
          if (hist.length > 20) hist = hist.slice(hist.length - 20);
        }
        chrome.storage.local.set({ promptHistory: hist });
      });
    }
  }

  /**
   * Charge les suggestions depuis l'historique local et les affiche dans
   * l'élément passé. Les suggestions sont affichées sous forme de puces
   * cliquables qui remplissent l'input correspondant quand on clique.
   * @param {HTMLElement} container conteneur où insérer les suggestions
   * @param {HTMLTextAreaElement} targetInput champ à préremplir quand
   *        l'utilisateur clique sur une suggestion
   */
  function loadSuggestions(container, targetInput) {
    if (!container) return;
    // Nettoie le conteneur
    container.innerHTML = '';
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get({ promptHistory: [] }, (res) => {
        const hist = Array.isArray(res.promptHistory) ? res.promptHistory : [];
        // On ne garde que les 3 dernières suggestions non vides
        const unique = [];
        for (let i = hist.length - 1; i >= 0 && unique.length < 3; i--) {
          const val = hist[i];
          if (val && !unique.includes(val)) {
            unique.push(val);
          }
        }
        unique.forEach((txt) => {
          const span = document.createElement('span');
          span.className = 'mp-suggestion';
          span.textContent = txt;
          span.addEventListener('click', () => {
            if (targetInput) targetInput.value = txt;
          });
          container.appendChild(span);
        });
      });
    }
  }

  /**
   * Charge des chips de clarification intelligentes à partir de l'historique
   * local. On sélectionne jusqu'à trois éléments récents et on les
   * transforme en puces interactives qui modifient selectedChips au clic.
   */
  function loadChips() {
    if (!mpChipsContainer) return;
    mpChipsContainer.innerHTML = '';
    const defaultChips = [
      'Contexte précis',
      'Contraintes & préférences',
      'Objectif final'
    ];
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get({ promptHistory: [] }, (res) => {
        const hist = Array.isArray(res.promptHistory) ? res.promptHistory : [];
        const unique = [];
        for (let i = hist.length - 1; i >= 0 && unique.length < 3; i--) {
          const val = hist[i];
          if (val && !unique.includes(val)) {
            unique.push(val);
          }
        }
        const chips = unique.length > 0 ? unique : defaultChips;
        chips.forEach((txt) => {
          const chip = document.createElement('span');
          chip.className = 'mp-chip';
          chip.textContent = txt;
          chip.addEventListener('click', () => {
            const idx = selectedChips.indexOf(txt);
            if (idx > -1) {
              // Retire la chip
              selectedChips.splice(idx, 1);
              chip.classList.remove('selected');
            } else {
              selectedChips.push(txt);
              chip.classList.add('selected');
            }
          });
          mpChipsContainer.appendChild(chip);
        });
      });
    } else {
      // Utilise les chips par défaut si le stockage n'est pas disponible
      defaultChips.forEach((txt) => {
        const chip = document.createElement('span');
        chip.className = 'mp-chip';
        chip.textContent = txt;
        chip.addEventListener('click', () => {
          const idx = selectedChips.indexOf(txt);
          if (idx > -1) {
            selectedChips.splice(idx, 1);
            chip.classList.remove('selected');
          } else {
            selectedChips.push(txt);
            chip.classList.add('selected');
          }
        });
        mpChipsContainer.appendChild(chip);
      });
    }
  }

  /**
   * Met à jour la recommandation de modèle en fonction des préférences
   * enregistrées dans le profil utilisateur. Si un modèle préféré est
   * défini, on l'affiche, sinon un message d'information est proposé.
   */
  function updateModelRecommendation() {
    if (!mpModelRecText || !mpModelRecommendation) return;
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get({ profile: {} }, (res) => {
        const prof = res.profile || {};
        const pref = prof.preferredModel || '';
        if (pref) {
          mpModelRecText.innerHTML = `Votre modèle préféré est <strong>${pref}</strong>. Utilisez‑le pour de meilleurs résultats.`;
        } else {
          mpModelRecText.textContent = `Aucun modèle préféré défini. Sélectionnez-en un dans votre profil pour obtenir une recommandation.`;
        }
      });
    }
  }

  /**
   * Fonction génératrice de prompt optimisé. Cette fonction assemble les
   * différentes informations saisies par l'utilisateur. Aucun appel à
   * l'IA n'est effectué ici : la logique d'intégration sera branchée
   * ultérieurement dans cette fonction.
   * @param {Object} opts
   * @param {string} opts.mode
   * @param {string} opts.input
   * @param {boolean} [opts.autoCorrect]
   * @param {Array<string>} [opts.chips]
   * @returns {string}
   */
  function generateOptimizedPrompt(opts) {
    const mode = opts.mode;
    const input = opts.input || '';
    const auto = opts.autoCorrect || false;
    const chips = Array.isArray(opts.chips) ? opts.chips : [];
    const lines = [];
    if (mode === 'quick') {
      if (input) {
        lines.push(`Agis comme un assistant expert et aide-moi avec cette demande : ${input}`);
      }
    } else {
      if (input) lines.push(`Contexte : ${input}`);
      if (chips.length > 0) {
        lines.push(`Clarifications : ${chips.join(' ; ')}`);
      }
      if (auto) {
        lines.push(`Veuillez corriger automatiquement la grammaire et l'orthographe de ma demande.`);
      }
    }
    if (lines.length === 0) {
      lines.push('Décris ton besoin pour générer un prompt.');
    }
    return lines.join('\n');
  }

  /**
   * Génère un prompt en mode rapide et l'affiche dans le panneau pliable.
   */
  function generateQuick() {
    if (!mpQuickInput) return;
    const desc = mpQuickInput.value.trim();
    if (!desc) {
      if (mpQuickResult) mpQuickResult.style.display = 'none';
      if (mpQuickGenerated) mpQuickGenerated.value = '';
      return;
    }
    const text = generateOptimizedPrompt({ mode: 'quick', input: desc });
    if (mpQuickGenerated) mpQuickGenerated.value = text;
    if (mpQuickResult) mpQuickResult.style.display = 'block';
    saveToHistory(desc);
    // Recharge suggestions et chips
    loadSuggestions(mpQuickSuggestions, mpQuickInput);
    loadSuggestions(mpAdvSuggestions, mpAdvContext);
    loadChips();
  }

  /**
   * Génère un prompt en mode avancé et l'affiche. Met également à jour
   * la recommandation de modèle.
   */
  function generateAdvanced() {
    if (!mpAdvContext) return;
    const ctx = mpAdvContext.value.trim();
    const auto = mpAutoCorrect ? mpAutoCorrect.checked : false;
    const text = generateOptimizedPrompt({ mode: 'advanced', input: ctx, autoCorrect: auto, chips: selectedChips });
    if (mpAdvGenerated) mpAdvGenerated.value = text;
    if (mpAdvResult) mpAdvResult.style.display = 'block';
    // Affiche la recommandation de modèle et met à jour son contenu
    if (mpModelRecommendation) mpModelRecommendation.style.display = 'block';
    updateModelRecommendation();
    // Sauvegarde le contexte dans l'historique
    saveToHistory(ctx);
    // Recharge suggestions et chips
    loadSuggestions(mpQuickSuggestions, mpQuickInput);
    loadSuggestions(mpAdvSuggestions, mpAdvContext);
    loadChips();
  }

  // Branche les actions des boutons
  if (mpGenerateBtn) mpGenerateBtn.addEventListener('click', generateQuick);
  if (mpAdvGenerateBtn) mpAdvGenerateBtn.addEventListener('click', generateAdvanced);

  // Charge initialement les suggestions et les chips
  loadSuggestions(mpQuickSuggestions, mpQuickInput);
  loadSuggestions(mpAdvSuggestions, mpAdvContext);
  loadChips();
})();