// Base de données des outils d'intelligence artificielle recommandés.
// La structure mappe les catégories de tâches (issues du Quiz) et les
// priorités (Sobriété Maximale, Équilibre, Performance Maximale) à des
// listes d'outils. Chaque outil indique son nom, l'URL pour l'ouvrir, un
// indicateur de sobriété (eco), de performance (perf) et un court
// commentaire (note).

const aiDatabase = {
  "Recherche factuelle / Définition": {
    "Sobriété Maximale": [
      {
        name: "Ecosia / Qwant",
        url: "https://www.ecosia.org",
        eco: "🍃🍃🍃",
        perf: "⭐️⭐️",
        note: "Non‑IA. Le choix le plus sobre."
      },
      {
        name: "Perplexity AI",
        url: "https://www.perplexity.ai",
        eco: "🍃",
        perf: "⭐️⭐️⭐️⭐️",
        note: "Bon pour les faits sourcés."
      }
    ],
    "Équilibre": [
      {
        name: "ChatGPT 3.5",
        url: "https://chat.openai.com",
        eco: "🍃",
        perf: "⭐️⭐️⭐️",
        note: "Modèle généraliste économique."
      },
      {
        name: "Mistral Small",
        url: "https://chat.mistral.ai",
        eco: "🍃",
        perf: "⭐️⭐️⭐️",
        note: "Réponses rapides et concises."
      }
    ],
    "Performance Maximale": [
      {
        name: "GPT‑4o",
        url: "https://chat.openai.com",
        eco: "⚡️⚡️⚡️",
        perf: "⭐️⭐️⭐️⭐️⭐️",
        note: "Référence pour l'analyse complexe."
      },
      {
        name: "Claude 3 Opus",
        url: "https://claude.ai",
        eco: "⚡️⚡️⚡️",
        perf: "⭐️⭐️⭐️⭐️⭐️",
        note: "Très performant pour la recherche."
      }
    ]
  },
  "Explication / Synthèse de concept": {
    "Sobriété Maximale": [
      {
        name: "Mistral Small",
        url: "https://chat.mistral.ai",
        eco: "🍃🍃",
        perf: "⭐️⭐️⭐️",
        note: "Modèle frugal et rapide."
      },
      {
        name: "Claude 3 Haiku",
        url: "https://claude.ai",
        eco: "🍃🍃",
        perf: "⭐️⭐️⭐️",
        note: "Très rapide, bon en synthèse."
      }
    ],
    "Équilibre": [
      {
        name: "Mistral Large",
        url: "https://chat.mistral.ai",
        eco: "🍃",
        perf: "⭐️⭐️⭐️⭐️",
        note: "Excellent rapport qualité/prix."
      },
      {
        name: "GPT‑4o",
        url: "https://chat.openai.com",
        eco: "🍃",
        perf: "⭐️⭐️⭐️⭐️⭐️",
        note: "Extrêmement polyvalent."
      }
    ],
    "Performance Maximale": [
      {
        name: "Claude 3 Opus",
        url: "https://claude.ai",
        eco: "⚡️⚡️⚡️",
        perf: "⭐️⭐️⭐️⭐️⭐️",
        note: "Le meilleur pour l'analyse complexe."
      },
      {
        name: "GPT‑4 Turbo",
        url: "https://platform.openai.com",
        eco: "⚡️⚡️⚡️",
        perf: "⭐️⭐️⭐️⭐️⭐️",
        note: "Référence du marché."
      }
    ]
  },
  "Rédaction / Création de contenu": {
    "Sobriété Maximale": [
      {
        name: "ChatGPT 3.5",
        url: "https://chat.openai.com",
        eco: "🍃",
        perf: "⭐️⭐️⭐️",
        note: "Rédaction basique et économique."
      },
      {
        name: "Hemingway Editor",
        url: "https://hemingwayapp.com",
        eco: "🍃🍃🍃",
        perf: "⭐️",
        note: "Aide à la simplification du texte."
      }
    ],
    "Équilibre": [
      {
        name: "Claude 3 Sonnet",
        url: "https://claude.ai",
        eco: "🍃",
        perf: "⭐️⭐️⭐️⭐️",
        note: "Rédactions cohérentes et rapides."
      },
      {
        name: "Mistral Large",
        url: "https://chat.mistral.ai",
        eco: "🍃",
        perf: "⭐️⭐️⭐️⭐️",
        note: "Bon rapport qualité/prix."
      }
    ],
    "Performance Maximale": [
      {
        name: "GPT‑4 Turbo",
        url: "https://platform.openai.com",
        eco: "⚡️⚡️⚡️",
        perf: "⭐️⭐️⭐️⭐️⭐️",
        note: "Excellence en créativité et cohérence."
      },
      {
        name: "Claude 3 Opus",
        url: "https://claude.ai",
        eco: "⚡️⚡️⚡️",
        perf: "⭐️⭐️⭐️⭐️⭐️",
        note: "Précision et style naturel."
      }
    ]
  },
  "Génération / Debug de Code": {
    "Sobriété Maximale": [
      {
        name: "GitHub Copilot",
        url: "https://github.com/features/copilot",
        eco: "🍃",
        perf: "⭐️⭐️⭐️",
        note: "Propositions simples et rapides."
      },
      {
        name: "DeepSeek Coder (Small)",
        url: "https://deepseek.com/coder",
        eco: "🍃",
        perf: "⭐️⭐️⭐️",
        note: "Débogage rapide et frugal."
      }
    ],
    "Équilibre": [
      {
        name: "DeepSeek Coder (Large)",
        url: "https://deepseek.com/coder",
        eco: "🍃",
        perf: "⭐️⭐️⭐️⭐️",
        note: "Bon rapport qualité/coût."
      },
      {
        name: "Claude 3 Haiku",
        url: "https://claude.ai",
        eco: "🍃",
        perf: "⭐️⭐️⭐️⭐️",
        note: "Rapide, efficace pour le code."
      }
    ],
    "Performance Maximale": [
      {
        name: "GPT‑4o (Code Interpreter)",
        url: "https://chat.openai.com",
        eco: "⚡️⚡️⚡️",
        perf: "⭐️⭐️⭐️⭐️⭐️",
        note: "Analyse et correction avancées."
      },
      {
        name: "Phind (Large)",
        url: "https://phind.com",
        eco: "⚡️⚡️⚡️",
        perf: "⭐️⭐️⭐️⭐️",
        note: "Bon pour comprendre des erreurs complexes."
      }
    ]
  },
  "Génération d'Image / Design": {
    "Sobriété Maximale": [
      {
        name: "Canva Magic Design",
        url: "https://www.canva.com/magic-design",
        eco: "🍃",
        perf: "⭐️⭐️",
        note: "Génère des visuels simples."
      },
      {
        name: "Ideogram",
        url: "https://ideogram.ai",
        eco: "🍃",
        perf: "⭐️⭐️⭐️",
        note: "Idéation rapide et légère."
      }
    ],
    "Équilibre": [
      {
        name: "DALL‑E Mini (Craiyon)",
        url: "https://www.craiyon.com",
        eco: "🍃",
        perf: "⭐️⭐️⭐️",
        note: "Images décentes à faible coût."
      },
      {
        name: "Stable Diffusion (SDXL)",
        url: "https://stability.ai",
        eco: "🍃",
        perf: "⭐️⭐️⭐️⭐️",
        note: "Bon équilibre créativité / coût."
      }
    ],
    "Performance Maximale": [
      {
        name: "Midjourney V6",
        url: "https://www.midjourney.com",
        eco: "⚡️⚡️⚡️",
        perf: "⭐️⭐️⭐️⭐️⭐️",
        note: "Qualité d’image exceptionnelle."
      },
      {
        name: "DALL‑E 3",
        url: "https://openai.com/dall-e-3",
        eco: "⚡️⚡️⚡️",
        perf: "⭐️⭐️⭐️⭐️⭐️",
        note: "Très haute qualité et diversité."
      }
    ]
  }
};

// Expose la base de données pour les scripts HTML via la variable globale.
window.aiDatabase = aiDatabase;