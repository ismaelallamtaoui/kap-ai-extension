document.addEventListener('DOMContentLoaded', () => {
  // Lorsque l'utilisateur sélectionne l'option "Recherche / Définition", ouvrir un moteur de recherche écoresponsable dans un nouvel onglet
  const optionA = document.getElementById('optionA');
  if (optionA) {
    optionA.addEventListener('click', () => {
      window.open('https://www.ecosia.org', '_blank');
    });
  }

  // Lorsque l'utilisateur sélectionne l'option "Générer / Créer", on lui propose le constructeur de prompt de l'extension
  const optionB = document.getElementById('optionB');
  if (optionB) {
    optionB.addEventListener('click', () => {
      window.location.href = '../constructor/index.html';
    });
  }

  // Bouton retour pour revenir à l'écran d'accueil
  const backBtn = document.getElementById('backToEntry');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (window.history && window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '../entry/index.html';
      }
    });
  }
});
