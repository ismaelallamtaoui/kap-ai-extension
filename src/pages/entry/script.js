document.addEventListener('DOMContentLoaded', () => {
  // Met à jour la jauge d'eau en fonction de la consommation stockée
  const gaugeFill = document.getElementById('gaugeFill');
  const waterGauge = document.getElementById('waterGauge');
  if (gaugeFill && waterGauge && chrome && chrome.storage) {
    // Récupère la quantité d'eau consommée (en mL) depuis le stockage local
    chrome.storage.local.get({ waterConsumed: 0 }, (res) => {
      const consumedMl = res.waterConsumed || 0;
      const liters = consumedMl / 1000;
      // Définir le maximum de la jauge à 160 L (banane) pour maintenir des repères visibles
      const gaugeMaxLiters = 160;
      const percent = Math.min((liters / gaugeMaxLiters) * 100, 100);
      gaugeFill.style.width = percent + '%';
      // Calcule l'équivalent en bouteilles de 500 mL (0,5 L)
      const bottles = Math.round(liters / 0.5);
      waterGauge.title = `Votre consommation : ${liters.toFixed(2)} L (~${bottles} bouteille${bottles > 1 ? 's' : ''} de 0,5 L)`;
    });
  }
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
  if (ecosiaBtn) {
    ecosiaBtn.addEventListener('click', () => {
      window.open('https://www.ecosia.org', '_blank');
    });
  }
  if (wikiBtn) {
    wikiBtn.addEventListener('click', () => {
      window.open('https://fr.wikipedia.org/wiki/Wikip%C3%A9dia:Accueil_principal', '_blank');
    });
  }
});
