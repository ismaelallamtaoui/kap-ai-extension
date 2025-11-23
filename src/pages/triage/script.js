// Gestion du quiz de triage. Ce script est chargé par popup.html.

document.addEventListener('DOMContentLoaded', () => {
  const quizForm = document.getElementById('quizForm');
  // Lors de la soumission du quiz : on enregistre les réponses et on navigue vers la page de recommandations
  quizForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(quizForm);
    const task = formData.get('task');
    const priority = formData.get('priority');
    // Stocke les réponses du quiz dans le stockage local de l'extension
    chrome.storage.local.set({ quizAnswers: { task, priority } }, () => {
      // Navigue vers la page de recommandations dans la même fenêtre
      window.location.href = '../recommendation/index.html';
    });
  });

  // Gestion du retour sur la page précédente depuis le quiz complet
  const backBtn = document.getElementById('backFromTriage');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (window.history && window.history.length > 1) {
        window.history.back();
      } else {
        // Par défaut, revenir à l'entrée si aucun historique
        window.location.href = '../entry/index.html';
      }
    });
  }
});