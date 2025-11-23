// Gère l'affichage des recommandations à partir des réponses du quiz.

/**
 * Renvoie des informations d'impact écologique et de performance pour des offres
 * payantes d'IA courantes. Ces valeurs sont basées sur des sources publiques
 * indiquant que les plans payants offrent des performances accrues au prix
 * d'une consommation énergétique plus élevée. Par exemple, l'article sur
 * le pricing de ChatGPT en 2025 indique que le plan Plus apporte un accès
 * prioritaire et une meilleure qualité, tandis que le plan Pro offre
 * un raisonnement plus profond et un accès illimité【104811896665494†L272-L299】.
 * Les correspondances ci‑dessous reflètent ces tendances (plus de performance →
 * davantage d'impact écologique).
 * @param {string} name Nom de l'abonnement (ex : "ChatGPT Pro")
 * @returns {{eco: string, perf: string, note: string, url?: string}}
 */
function getPaidInfo(name) {
  const lower = name.toLowerCase();
  // Définitions simplifiées d'éco-score et de performance pour les plans payants
  if (lower.includes('plus') && lower.includes('chat')) {
    return {
      eco: '⚡️⚡️',
      perf: '⭐️⭐️⭐️⭐️',
      note: 'Plan ChatGPT Plus offrant un accès prioritaire et une meilleure qualité',
      url: 'https://chat.openai.com'
    };
  }
  if (lower.includes('pro') && lower.includes('chat')) {
    return {
      eco: '⚡️⚡️⚡️⚡️',
      perf: '⭐️⭐️⭐️⭐️⭐️',
      note: 'Plan ChatGPT Pro offrant une puissance de calcul premium',
      url: 'https://chat.openai.com'
    };
  }
  if (lower.includes('team') && lower.includes('chat')) {
    return {
      eco: '⚡️⚡️',
      perf: '⭐️⭐️⭐️⭐️',
      note: 'Plan ChatGPT Team avec collaboration et performances accrues',
      url: 'https://chat.openai.com'
    };
  }
  if (lower.includes('enterprise') && lower.includes('chat')) {
    return {
      eco: '⚡️⚡️⚡️⚡️',
      perf: '⭐️⭐️⭐️⭐️⭐️',
      note: 'Plan ChatGPT Enterprise réservé aux grandes organisations',
      url: 'https://chat.openai.com'
    };
  }
  if (lower.includes('pro') && lower.includes('claude')) {
    return {
      eco: '⚡️⚡️',
      perf: '⭐️⭐️⭐️⭐️',
      note: 'Plan Claude Pro permettant environ 5× plus d\'usage',
      url: 'https://claude.ai'
    };
  }
  if (lower.includes('max') && lower.includes('claude')) {
    return {
      eco: '⚡️⚡️⚡️⚡️',
      perf: '⭐️⭐️⭐️⭐️⭐️',
      note: 'Plan Claude Max offrant des performances maximales',
      url: 'https://claude.ai'
    };
  }
  if (lower.includes('team') && lower.includes('claude')) {
    return {
      eco: '⚡️⚡️',
      perf: '⭐️⭐️⭐️⭐️',
      note: 'Plan Claude Team avec collaboration avancée',
      url: 'https://claude.ai'
    };
  }
  if (lower.includes('enterprise') && lower.includes('claude')) {
    return {
      eco: '⚡️⚡️⚡️⚡️',
      perf: '⭐️⭐️⭐️⭐️⭐️',
      note: 'Plan Claude Enterprise réservé aux grandes structures',
      url: 'https://claude.ai'
    };
  }
  // Valeur par défaut si inconnue
  return {
    eco: '⚡️⚡️⚡️',
    perf: '⭐️⭐️⭐️⭐️',
    note: 'Outil d\'IA auquel vous êtes abonné',
    url: '#'
  };
}
// Ce script est chargé par recommendation.html et dépend de ai_database.js.

document.addEventListener('DOMContentLoaded', () => {
  const criteriaElem = document.getElementById('criteria');
  const recContainer = document.getElementById('recommendations');
  const backBtn = document.getElementById('backFromRecommendations');
  // Récupère les réponses du quiz
  // Charge à la fois les réponses du quiz et le profil utilisateur
  chrome.storage.local.get(['quizAnswers', 'profile'], (res) => {
    const answers = res.quizAnswers;
    if (!answers) {
      // Si aucune réponse n'est enregistrée, retourne au quiz complet
      window.location.href = '../triage/index.html';
      return;
    }
    const { task, priority } = answers;
    // Affiche les critères sélectionnés
    criteriaElem.textContent = `Pour « ${task} » avec la priorité « ${priority} » :`;
    // Récupère la liste d'outils depuis la base de données
    let tools = (window.aiDatabase && window.aiDatabase[task] && window.aiDatabase[task][priority]) ? [...window.aiDatabase[task][priority]] : [];
    // Intègre les abonnements de l'utilisateur uniquement lorsque c'est pertinent :
    // si un outil gratuit (ex : GPT‑4o) est recommandé et que l'utilisateur possède
    // une version supérieure payante du même groupe, celle‑ci est ajoutée.
    const profile = res.profile || {};
    const subList = profile.aiSubscription ? profile.aiSubscription.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
    const extraTools = [];
    if (subList.length > 0) {
      tools.forEach((base) => {
        const lowerName = base.name.toLowerCase();
        subList.forEach((sub) => {
          const subLower = sub.toLowerCase();
          // Détermine le groupe (chatgpt/gpt vs claude)
          if (subLower.includes('chatgpt') || subLower.includes('gpt')) {
            // Groupe GPT : si le base est un modèle GPT (contient gpt ou chatgpt)
            if ((/gpt|chatgpt/i).test(lowerName)) {
              // Ajoute cette souscription comme version supérieure
              if (!tools.some(t => t.name.toLowerCase() === subLower) && !extraTools.some(t => t.name.toLowerCase() === subLower)) {
                const info = getPaidInfo(sub);
                extraTools.push({
                  name: sub,
                  url: info.url || '#',
                  eco: info.eco,
                  perf: info.perf,
                  note: info.note
                });
              }
            }
          } else if (subLower.includes('claude')) {
            if (/claude/i.test(lowerName)) {
              if (!tools.some(t => t.name.toLowerCase() === subLower) && !extraTools.some(t => t.name.toLowerCase() === subLower)) {
                const info = getPaidInfo(sub);
                extraTools.push({
                  name: sub,
                  url: info.url || '#',
                  eco: info.eco,
                  perf: info.perf,
                  note: info.note
                });
              }
            }
          }
        });
      });
    }
    tools = tools.concat(extraTools);
    // Réordonne les outils : met l'IA préférée en premier si elle est recommandée, et place
    // les versions payantes avant les gratuites pour un même modèle. On détermine la
    // base (ChatGPT, Claude, Gemini...) et si l'entrée est payante en se basant sur
    // certains mots‑clés (plus, pro, max, team, enterprise). Les abonnements de
    // l'utilisateur sont déjà intégrés dans tools via extraTools.
    const preferred = (profile.preferredModel || '').toLowerCase();
    function baseName(n) {
      if (!n) return '';
      const parts = n.toLowerCase().split(/\s+/);
      // le premier mot (avant un chiffre) représente le modèle de base
      return parts[0].replace(/[0-9]/g, '');
    }
    function isPaidVersion(n) {
      const lower = n.toLowerCase();
      return /plus|pro|max|team|enterprise|\bpaid\b/.test(lower);
    }
    // Renomme les versions payantes de ChatGPT afin de refléter la version supérieure (ChatGPT 5)
    tools.forEach((item) => {
      const lowerName = item.name.toLowerCase();
      if (/chatgpt|gpt/.test(lowerName) && isPaidVersion(lowerName)) {
        if (lowerName.includes('plus')) item.name = 'ChatGPT 5';
        else if (lowerName.includes('pro')) item.name = 'ChatGPT 5 Pro';
        else if (lowerName.includes('team')) item.name = 'ChatGPT 5 Team';
        else if (lowerName.includes('enterprise')) item.name = 'ChatGPT 5 Enterprise';
        else item.name = 'ChatGPT 5';
      }
    });
    // Tri personnalisé
    tools.sort((a, b) => {
      const aBase = baseName(a.name);
      const bBase = baseName(b.name);
      const aPaid = isPaidVersion(a.name);
      const bPaid = isPaidVersion(b.name);
      // Si l'un des deux correspond au modèle préféré
      if (preferred) {
        const aIsPref = aBase === preferred;
        const bIsPref = bBase === preferred;
        if (aIsPref && !bIsPref) return -1;
        if (!aIsPref && bIsPref) return 1;
      }
      // Si les deux appartiennent au même groupe, on place la version payante devant
      if (aBase === bBase) {
        if (aPaid && !bPaid) return -1;
        if (!aPaid && bPaid) return 1;
      }
      return 0;
    });
    // Affiche chaque outil dans une carte
    recContainer.innerHTML = '';
    tools.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'card';
      const title = document.createElement('h2');
      title.textContent = item.name;
      const eco = document.createElement('div');
      eco.className = 'eco';
      eco.textContent = `Éco : ${item.eco}`;
      const perf = document.createElement('div');
      perf.className = 'perf';
      perf.textContent = `Perf : ${item.perf}`;
      const note = document.createElement('p');
      note.className = 'note';
      note.textContent = item.note;
      const link = document.createElement('a');
      link.href = item.url;
      link.target = '_blank';
      link.textContent = 'Ouvrir';
      // Applique un style de bouton en contour (blanc, bord gris, texte noir)
      link.className = 'outline-btn';
      // Bouton pour personnaliser le prompt avant d'ouvrir
      const promptBtn = document.createElement('button');
      promptBtn.className = 'action-btn';
      promptBtn.textContent = 'Personnaliser mon prompt avant d\'ouvrir';
      promptBtn.addEventListener('click', () => {
        chrome.storage.local.set({ selectedAI: { name: item.name, url: item.url }, selectedPriority: priority }, () => {
          window.location.href = '../constructor/index.html';
        });
      });
      card.appendChild(title);
      card.appendChild(eco);
      card.appendChild(perf);
      card.appendChild(note);
      card.appendChild(link);
      card.appendChild(promptBtn);
      recContainer.appendChild(card);
    });
  });

  // Gère le bouton de retour
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (window.history && window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '../triage/index.html';
      }
    });
  }
});