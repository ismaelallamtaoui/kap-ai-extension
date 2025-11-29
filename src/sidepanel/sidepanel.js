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
   * la génération des prompts via l'API OpenAI (ou un fallback local),
   * la mémoire locale (localStorage) et l'affichage des modèles choisis.
   */

  // Constantes et helpers de stockage
  const STORAGE_KEY = 'kapai_mieux_prompter_history';
  const MAX_HISTORY = 30;
  const CHIP_LIBRARY = [
    {
      id: 'context',
      label: '+ Ajouter du contexte',
      hint: "Ajoute des éléments de contexte métier, la cible et l'objectif final."
    },
    {
      id: 'format',
      label: '+ Préciser le format de sortie',
      hint: 'Demande un format structuré : plan, tableau, bullet points ou JSON.'
    },
    {
      id: 'constraints',
      label: '+ Durcir les contraintes',
      hint: 'Ajoute des contraintes mesurables (longueur, ton, sources à citer).'
    },
    {
      id: 'qa',
      label: '+ Vérification / QA',
      hint: 'Demande une checklist de vérification ou des tests rapides.'
    }
  ];

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
  const mpStatus = document.getElementById('mpStatus');
  const mpModelBadge = document.getElementById('mpModelBadge');
  const mpHistoryList = document.getElementById('mpHistoryList');
  const mpInsights = document.getElementById('mpInsights');

  // Liste des chips sélectionnées en mode avancé
  let selectedChips = [];

  /**
   * Normalise un texte utilisateur (espaces, sauts de ligne).
   * @param {string} text
   * @returns {string}
   */
  function normalizeText(text) {
    if (!text) return '';
    return text
      .replace(/\s+$/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Lecture de l'historique structuré depuis localStorage.
   * @returns {Array}
   */
  function readHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Écrit l'historique structuré dans localStorage.
   * @param {Array} entries
   */
  function writeHistory(entries) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      // Ignore les erreurs de quota
    }
  }

  /**
   * Ajoute une entrée structurée à l'historique avec un plafond FIFO.
   * @param {Object} entry
   */
  function appendHistory(entry) {
    if (!entry || !entry.input) return;
    const hist = readHistory();
    hist.push({ ...entry, timestamp: Date.now() });
    const sliceStart = Math.max(hist.length - MAX_HISTORY, 0);
    writeHistory(hist.slice(sliceStart));
  }

  /**
   * Retourne les dernières entrées uniques pour alimenter les suggestions.
   * @param {number} limit
   */
  function getRecentInputs(limit = 3) {
    const hist = readHistory();
    const unique = [];
    for (let i = hist.length - 1; i >= 0 && unique.length < limit; i--) {
      const val = hist[i]?.input;
      if (val && !unique.includes(val)) unique.push(val);
    }
    return unique;
  }

  /**
   * Identifie les tags fréquents dans l'historique pour nourrir le bloc
   * "Suggestions récentes / fréquentes".
   */
  function getFrequentTags(limit = 4) {
    const hist = readHistory();
    const counts = {};
    hist.forEach((item) => {
      (item.tags || []).forEach((tag) => {
        const key = tag.toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag]) => tag);
  }

  /**
   * Bascule entre les modes rapide et avancé.
   * @param {string} mode 'quick' ou 'advanced'
   */
  function setPromptMode(mode) {
    if (!mpQuickSection || !mpAdvancedSection) return;
    if (mpQuickBtn) mpQuickBtn.classList.toggle('active', mode === 'quick');
    if (mpAdvancedBtn) mpAdvancedBtn.classList.toggle('active', mode === 'advanced');
    mpQuickSection.style.display = mode === 'quick' ? 'block' : 'none';
    mpAdvancedSection.style.display = mode === 'advanced' ? 'block' : 'none';
  }

  // Écouteurs de bascule de mode
  if (mpQuickBtn) mpQuickBtn.addEventListener('click', () => setPromptMode('quick'));
  if (mpAdvancedBtn) mpAdvancedBtn.addEventListener('click', () => setPromptMode('advanced'));

  /**
   * Met à jour l'état visuel (chargement/idle) et désactive les boutons.
   * @param {boolean} isLoading
   */
  function setLoadingState(isLoading) {
    if (mpGenerateBtn) {
      mpGenerateBtn.disabled = isLoading;
      mpGenerateBtn.textContent = isLoading ? 'Génération en cours…' : 'Générer un meilleur prompt';
    }
    if (mpAdvGenerateBtn) {
      mpAdvGenerateBtn.disabled = isLoading;
      mpAdvGenerateBtn.textContent = isLoading ? 'Génération en cours…' : 'Générer un meilleur prompt';
    }
    if (mpStatus) {
      mpStatus.className = 'mp-status mp-status-info';
      mpStatus.textContent = isLoading ? 'Optimisation en cours, patiente quelques secondes…' : '';
    }
  }

  /**
   * Affiche un message d'état (info/erreur/succès) dans la bannière.
   */
  function showStatus(message, type = 'info') {
    if (!mpStatus) return;
    mpStatus.className = `mp-status mp-status-${type}`;
    mpStatus.textContent = message;
  }

  /**
   * Rend un badge de modèle sélectionné et l'affiche dans le footer.
   */
  function renderModelBadge(modelChoice) {
    if (!mpModelBadge) return;
    const text = modelChoice
      ? `${modelChoice.modelId} – ${modelChoice.reasoning}`
      : 'Modèle non défini';
    mpModelBadge.textContent = text;
  }

  /**
   * Rend les suggestions rapides/avancées et le bloc de mémoire.
   */
  function renderSuggestions() {
    const recent = getRecentInputs(4);
    const frequentTags = getFrequentTags(4);
    const renderList = (container, items, targetInput) => {
      if (!container) return;
      container.innerHTML = '';
      items.forEach((txt) => {
        const span = document.createElement('span');
        span.className = 'mp-suggestion';
        span.textContent = txt;
        span.addEventListener('click', () => {
          if (targetInput) targetInput.value = txt;
        });
        container.appendChild(span);
      });
      if (items.length === 0) {
        const empty = document.createElement('span');
        empty.className = 'mp-suggestion muted';
        empty.textContent = 'Aucune suggestion pour le moment';
        container.appendChild(empty);
      }
    };
    renderList(mpQuickSuggestions, recent, mpQuickInput);
    renderList(mpAdvSuggestions, recent, mpAdvContext);
    if (mpHistoryList) {
      mpHistoryList.innerHTML = '';
      const merged = [...recent, ...frequentTags.map((t) => `Tag fréquent : ${t}`)];
      merged.forEach((txt) => {
        const span = document.createElement('span');
        span.className = 'mp-suggestion';
        span.textContent = txt;
        mpHistoryList.appendChild(span);
      });
      if (merged.length === 0) {
        const empty = document.createElement('span');
        empty.className = 'mp-suggestion muted';
        empty.textContent = 'Commence par générer un prompt pour voir des suggestions.';
        mpHistoryList.appendChild(empty);
      }
    }
  }

  /**
   * Rend les chips intelligentes, y compris les tags fréquents.
   */
  function loadChips() {
    if (!mpChipsContainer) return;
    mpChipsContainer.innerHTML = '';
    const dynamicTags = getFrequentTags(2).map((tag) => ({
      id: `tag-${tag}`,
      label: `+ ${tag}`,
      hint: `Inclure le tag récurrent « ${tag} » pour rester cohérent.`
    }));
    const chips = [...CHIP_LIBRARY, ...dynamicTags];
    chips.forEach((chipDef) => {
      const chip = document.createElement('span');
      chip.className = 'mp-chip';
      chip.textContent = chipDef.label;
      chip.title = chipDef.hint;
      chip.dataset.id = chipDef.id;
      chip.addEventListener('click', () => {
        const exists = selectedChips.find((c) => c.id === chipDef.id);
        if (exists) {
          selectedChips = selectedChips.filter((c) => c.id !== chipDef.id);
          chip.classList.remove('selected');
          if (mpAdvContext) {
            removeChipHintFromInput(chipDef);
          }
        } else {
          selectedChips.push(chipDef);
          chip.classList.add('selected');
          if (mpAdvContext) {
            appendChipHintToInput(chipDef);
          }
        }
      });
      mpChipsContainer.appendChild(chip);
    });
  }

  /**
   * Ajoute un rappel de chip dans la zone de texte avancée avec un marqueur
   * identifiable, afin de pouvoir le retirer proprement en cas de désélection.
   * @param {{id: string, hint?: string, label?: string}} chip
   */
  function appendChipHintToInput(chip) {
    if (!mpAdvContext) return;
    const marker = `[chip:${chip.id}]`;
    const hintText = chip.hint || chip.label || '';
    const existingLines = mpAdvContext.value.split('\n');
    // Nettoie toute ancienne mention du même chip pour éviter les doublons
    const filtered = existingLines.filter((line) => !line.startsWith(marker));
    filtered.push(`${marker} ${hintText}`);
    mpAdvContext.value = filtered.join('\n').trim();
  }

  /**
   * Retire le rappel d'un chip de la zone de texte avancée.
   * @param {{id: string}} chip
   */
  function removeChipHintFromInput(chip) {
    if (!mpAdvContext) return;
    const marker = `[chip:${chip.id}]`;
    const lines = mpAdvContext.value.split('\n');
    const filtered = lines.filter((line) => !line.startsWith(marker));
    mpAdvContext.value = filtered.join('\n').trim();
  }

  /**
   * Heuristique de sélection du meilleur modèle selon la longueur, le mode
   * et le type de tâche.
   */
  function selectBestModel({ length = 0, taskType = '', mode = 'rapide' }) {
    const normalizedMode = mode === 'avance' ? 'avance' : 'rapide';
    let modelId = 'gpt-4o-mini';
    let reasoning = 'Prompt court et réponse rapide privilégiée.';
    const longPrompt = length > 600;
    const complexTask = /plan|analyse|code|audit|strategie/i.test(taskType || '');
    if (normalizedMode === 'avance' || longPrompt || complexTask) {
      modelId = 'gpt-4.1';
      reasoning = 'Mode avancé ou tâche complexe → modèle plus robuste.';
    }
    return { modelId, reasoning };
  }

  /**
   * Post-traitement local pour structurer le prompt lorsque la correction
   * automatique est active.
   */
  function applyAutoCorrection(prompt, tags = []) {
    if (!prompt) return '';
    const header = 'Structure conseillée :';
    const sections = [
      '- Objectif : clarifie le but final et le livrable attendu.',
      '- Contexte : rappelle les contraintes clés (ton, format, public).',
      '- Étapes : détaille les actions à suivre.',
      '- Vérification : liste les points de contrôle avant de livrer.'
    ];
    const tagsLine = tags.length ? `\nMots-clés : ${tags.join(', ')}` : '';
    return `${prompt}\n\n${header}\n${sections.join('\n')}${tagsLine}`;
  }

  /**
   * Essayez de parser une chaîne JSON, même si elle est entourée de balises
   * ou de code fences. Retourne null en cas d'échec.
   */
  function safeParseJson(str) {
    if (!str) return null;
    const cleaned = str.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      return null;
    }
  }

  /**
   * Devine des tags simples en analysant le texte et les chips.
   */
  function deriveTags(text, chips = []) {
    const tags = [];
    const lower = (text || '').toLowerCase();
    if (/code|script|api|fonction/i.test(lower)) tags.push('tech');
    if (/plan|strategie|roadmap/i.test(lower)) tags.push('planification');
    if (/email|message|communication/i.test(lower)) tags.push('communication');
    if (chips.length) tags.push('assisté');
    return tags.length ? tags : ['general'];
  }

  /**
   * Appel à l'API OpenAI. L'API key doit être renseignée via localStorage
   * (clé "kapai_openai_api_key") ou un autre mécanisme sécurisé.
   */
  async function callOpenAI(modelId, messages) {
    const apiKey = (typeof localStorage !== 'undefined' && localStorage.getItem('kapai_openai_api_key')) || '';
    if (!apiKey) {
      throw new Error('Aucune clé API OpenAI configurée (localStorage.kapai_openai_api_key).');
    }
    const payload = {
      model: modelId,
      messages,
      temperature: 0.4,
      response_format: { type: 'json_object' }
    };
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Erreur API (${resp.status}): ${errText}`);
    }
    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content || '';
    return safeParseJson(content) || { optimized_prompt: content };
  }

  /**
   * Fonction centrale pour optimiser un prompt utilisateur.
   */
  async function generateOptimizedPrompt(userInput, options = {}) {
    const mode = options.mode === 'advanced' ? 'advanced' : 'quick';
    const normalized = normalizeText(userInput);
    const chipHints = (options.chips || []).map((c) => c.hint || c.label).join(' | ');
    const modelChoice = selectBestModel({
      length: normalized.length,
      taskType: chipHints || options.taskType || '',
      mode: mode === 'advanced' ? 'avance' : 'rapide'
    });

    const systemPrompt = [
      'Tu es un optimiseur de prompts. Retourne UNIQUEMENT un JSON.',
      '{"optimized_prompt": "...", "tags": [], "suggestions": []}',
      "Le prompt optimisé doit être clair, structuré et concis (max 8 lignes).",
      'Nettoie les espaces et évite les répétitions. Les tags décrivent le type de tâche, le ton et le niveau de détail.'
    ].join(' ');

    const userPrompt = `Texte utilisateur : ${normalized || 'N/A'}\n` +
      `Mode : ${mode}\n` +
      `Chips : ${chipHints || 'aucune'}\n` +
      `Correction auto : ${options.autoCorrect ? 'oui' : 'non'}\n` +
      'Produis le JSON demandé. Utilise le français.';

    let parsed;
    try {
      parsed = await callOpenAI(modelChoice.modelId, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);
    } catch (e) {
      // Fallback local : message explicite + prompt épuré
      const cleaned = normalized || 'Décris ton besoin pour générer un prompt.';
      const chipContext = chipHints ? `\nChips actives : ${chipHints}` : '';
      parsed = {
        optimized_prompt: `Optimisation locale (clé API manquante ou erreur) : ${cleaned}${chipContext}`,
        tags: deriveTags(cleaned, options.chips),
        suggestions: [
          'Ajoute des exemples précis pour affiner la génération.',
          'Indique le format souhaité (liste, plan, tableau, JSON).'
        ],
        error: e.message
      };
    }

    let optimized = parsed?.optimized_prompt || normalized || '';
    const tags = parsed?.tags || deriveTags(normalized, options.chips);
    const suggestions = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];

    if (options.autoCorrect) {
      optimized = applyAutoCorrection(optimized, tags);
    }

    return {
      optimizedPrompt: optimized,
      tags,
      suggestions,
      model: modelChoice,
      raw: parsed
    };
  }

  /**
   * Affiche les insights (tags + suggestions) sous le prompt généré.
   */
  function renderInsights(data) {
    if (!mpInsights) return;
    mpInsights.innerHTML = '';
    const { tags = [], suggestions = [] } = data || {};
    if (tags.length) {
      const tagTitle = document.createElement('div');
      tagTitle.className = 'mp-insight-title';
      tagTitle.textContent = 'Tags détectés';
      mpInsights.appendChild(tagTitle);
      const list = document.createElement('div');
      list.className = 'mp-suggestions';
      tags.forEach((tag) => {
        const span = document.createElement('span');
        span.className = 'mp-suggestion';
        span.textContent = tag;
        list.appendChild(span);
      });
      mpInsights.appendChild(list);
    }
    if (suggestions.length) {
      const sugTitle = document.createElement('div');
      sugTitle.className = 'mp-insight-title';
      sugTitle.textContent = 'Suggestions de variations';
      mpInsights.appendChild(sugTitle);
      const list = document.createElement('ul');
      list.className = 'mp-suggestion-list';
      suggestions.forEach((s) => {
        const li = document.createElement('li');
        li.textContent = s;
        list.appendChild(li);
      });
      mpInsights.appendChild(list);
    }
  }

  /**
   * Gestion des clics sur le bouton Rapide.
   */
  async function generateQuick() {
    if (!mpQuickInput) return;
    const desc = normalizeText(mpQuickInput.value);
    if (!desc) {
      showStatus('Ajoute une demande pour générer un prompt optimisé.', 'warning');
      return;
    }
    setLoadingState(true);
    try {
      const result = await generateOptimizedPrompt(desc, { mode: 'quick', chips: [] });
      if (mpQuickGenerated) mpQuickGenerated.value = result.optimizedPrompt;
      if (mpQuickResult) mpQuickResult.style.display = 'block';
      renderModelBadge(result.model);
      renderInsights(result);
      appendHistory({
        input: desc,
        optimizedPrompt: result.optimizedPrompt,
        tags: result.tags,
        modelId: result.model?.modelId,
        mode: 'quick'
      });
      renderSuggestions();
      showStatus('Prompt optimisé avec succès (mode Rapide).', 'success');
    } catch (e) {
      showStatus(`Erreur lors de la génération : ${e.message}`, 'error');
    } finally {
      setLoadingState(false);
    }
  }

  /**
   * Gestion du bouton Avancé (avec chips & correction auto).
   */
  async function generateAdvanced() {
    if (!mpAdvContext) return;
    const ctx = normalizeText(mpAdvContext.value);
    if (!ctx) {
      showStatus('Décris ton contexte pour générer un prompt avancé.', 'warning');
      return;
    }
    const auto = mpAutoCorrect ? mpAutoCorrect.checked : false;
    setLoadingState(true);
    try {
      const result = await generateOptimizedPrompt(ctx, {
        mode: 'advanced',
        autoCorrect: auto,
        chips: selectedChips
      });
      if (mpAdvGenerated) mpAdvGenerated.value = result.optimizedPrompt;
      if (mpAdvResult) mpAdvResult.style.display = 'block';
      if (mpModelRecommendation) mpModelRecommendation.style.display = 'block';
      mpModelRecText.textContent = `${result.model.modelId} – ${result.model.reasoning}`;
      renderModelBadge(result.model);
      renderInsights(result);
      appendHistory({
        input: ctx,
        optimizedPrompt: result.optimizedPrompt,
        tags: result.tags,
        modelId: result.model?.modelId,
        mode: 'advanced'
      });
      renderSuggestions();
      const correctionMsg = auto ? ' (correction auto activée)' : '';
      showStatus(`Prompt avancé généré${correctionMsg}.`, 'success');
    } catch (e) {
      showStatus(`Erreur lors de la génération : ${e.message}`, 'error');
    } finally {
      setLoadingState(false);
    }
  }

  // Branche les actions des boutons
  if (mpGenerateBtn) mpGenerateBtn.addEventListener('click', generateQuick);
  if (mpAdvGenerateBtn) mpAdvGenerateBtn.addEventListener('click', generateAdvanced);

  // Charge initialement les suggestions et les chips
  renderSuggestions();
  loadChips();
})();