// Types pour le système de guides de l'assistant CRM

export type UserRole = "ADMIN" | "MANAGER" | "BD" | "DEVELOPER";

export interface GuideStep {
  title: string;
  description: string;
  action?: string; // Action à effectuer
  code?: string; // Exemple de code si nécessaire
  tip?: string; // Conseil pratique
  warning?: string; // Avertissement important
}

export interface Guide {
  id: string;
  title: string;
  description: string;
  routePatterns: string[]; // Routes où ce guide est pertinent
  steps: GuideStep[];
  category: "getting-started" | "features" | "troubleshooting";
  roleRestrictions?: UserRole[]; // Filtrage optionnel par rôle
  estimatedTime?: string; // Temps estimé (ex: "5 min")
  icon?: string; // Nom de l'icône lucide
}

// Collection de guides pour le CRM en français
export const guides: Guide[] = [
  // ==================== GUIDES DE DÉMARRAGE ====================
  {
    id: "welcome",
    title: "Bienvenue sur SuzaLink CRM",
    description: "Découvrez les bases de votre nouveau CRM et commencez à prospecter efficacement.",
    routePatterns: ["/dashboard"],
    category: "getting-started",
    estimatedTime: "3 min",
    icon: "Rocket",
    steps: [
      {
        title: "Votre tableau de bord",
        description: "Le tableau de bord vous offre une vue d'ensemble de votre activité. Vous y trouverez vos statistiques clés, vos tâches en cours et vos performances.",
        tip: "Consultez votre tableau de bord chaque matin pour planifier votre journée !",
      },
      {
        title: "Navigation dans le menu",
        description: "Utilisez le menu latéral pour accéder aux différentes sections : Prospection, Campagnes, Tâches, Messages et plus encore.",
        action: "Cliquez sur les icônes du menu pour explorer les différentes sections.",
      },
      {
        title: "Vos campagnes assignées",
        description: "En tant que BD, vous avez accès aux campagnes qui vous sont assignées. C'est ici que vous trouverez vos leads à contacter.",
        tip: "Commencez par la section 'Prospection' pour accéder rapidement à vos leads.",
      },
      {
        title: "Besoin d'aide ?",
        description: "Ce bouton d'assistance est toujours disponible. Cliquez dessus à tout moment pour obtenir de l'aide contextuelle sur la page où vous vous trouvez.",
        tip: "L'assistant s'adapte automatiquement à la page que vous consultez !",
      },
    ],
  },
  {
    id: "first-steps-bd",
    title: "Premiers pas en tant que BD",
    description: "Guide complet pour démarrer votre activité de prospection.",
    routePatterns: ["/dashboard", "/campaigns"],
    category: "getting-started",
    roleRestrictions: ["BD"],
    estimatedTime: "5 min",
    icon: "UserCheck",
    steps: [
      {
        title: "Comprendre votre rôle",
        description: "En tant que Business Developer, votre mission est de contacter les leads assignés, qualifier leur intérêt et planifier des rendez-vous.",
      },
      {
        title: "Accéder à vos campagnes",
        description: "Cliquez sur 'Prospection' dans le menu pour voir la liste de vos campagnes actives. Chaque campagne contient un ensemble de leads à traiter.",
        action: "Menu → Prospection → Sélectionnez une campagne",
      },
      {
        title: "Votre espace de travail",
        description: "L'espace de travail leads vous permet de traiter chaque lead efficacement avec toutes les informations nécessaires à portée de main.",
        tip: "Utilisez le raccourci 'Obtenir le prochain lead' pour passer automatiquement au lead suivant.",
      },
      {
        title: "Enregistrer vos activités",
        description: "Chaque appel, email ou note doit être enregistré. Cela permet de suivre l'historique et d'améliorer votre suivi.",
        warning: "N'oubliez jamais d'enregistrer vos activités - c'est essentiel pour le suivi !",
      },
    ],
  },

  // ==================== GUIDES FONCTIONNALITÉS ====================
  {
    id: "lead-workspace",
    title: "Espace de travail Leads",
    description: "Maîtrisez l'interface de prospection pour être plus efficace.",
    routePatterns: ["/campaigns/*/leads"],
    category: "features",
    estimatedTime: "4 min",
    icon: "Target",
    steps: [
      {
        title: "Vue d'ensemble du lead",
        description: "À gauche, vous trouvez les informations du lead actuel : nom, entreprise, coordonnées et historique des interactions.",
      },
      {
        title: "Obtenir le prochain lead",
        description: "Le bouton 'Obtenir le prochain lead' vous attribue automatiquement un nouveau lead de la campagne. Le lead vous est alors réservé.",
        action: "Cliquez sur le bouton vert 'Obtenir le prochain lead'",
        tip: "Le système sélectionne intelligemment le lead le plus pertinent à traiter.",
      },
      {
        title: "Passer un appel",
        description: "Cliquez sur le numéro de téléphone ou le bouton d'appel pour initier un appel. Une fenêtre s'ouvrira pour enregistrer le résultat.",
        action: "Cliquez sur 'Appeler' puis sélectionnez le résultat de l'appel",
      },
      {
        title: "Envoyer un email",
        description: "Utilisez le bouton email pour ouvrir le composeur. Vous pouvez utiliser des templates prédéfinis pour gagner du temps.",
        tip: "Les templates sont personnalisés automatiquement avec les informations du lead.",
      },
      {
        title: "Changer le statut",
        description: "Après chaque interaction, mettez à jour le statut du lead : Contacté, Qualifié, RDV planifié, etc.",
        warning: "Un statut à jour est crucial pour le suivi de la campagne.",
      },
      {
        title: "Ajouter des notes",
        description: "Ajoutez des notes pour documenter vos échanges. Ces notes seront visibles par toute l'équipe.",
      },
    ],
  },
  {
    id: "campaign-management",
    title: "Gestion des campagnes",
    description: "Apprenez à gérer et suivre vos campagnes de prospection.",
    routePatterns: ["/campaigns"],
    category: "features",
    roleRestrictions: ["ADMIN", "MANAGER"],
    estimatedTime: "5 min",
    icon: "Megaphone",
    steps: [
      {
        title: "Vue des campagnes",
        description: "La page campagnes liste toutes les campagnes actives, en pause ou terminées. Chaque carte affiche les statistiques clés.",
      },
      {
        title: "Créer une campagne",
        description: "Cliquez sur 'Nouvelle campagne' pour créer une campagne. Vous devrez choisir un compte client et définir les paramètres.",
        action: "Bouton '+ Nouvelle campagne' en haut à droite",
      },
      {
        title: "Importer des leads",
        description: "Une fois la campagne créée, importez vos leads via fichier CSV ou manuellement. Mappez les colonnes du fichier aux champs du CRM.",
        tip: "Utilisez le template de fichier CSV pour un import sans erreur.",
      },
      {
        title: "Assigner des BDs",
        description: "Assignez des Business Developers à la campagne. Ils pourront alors accéder aux leads et commencer la prospection.",
        action: "Onglet 'Équipe' → 'Assigner un BD'",
      },
      {
        title: "Suivre les performances",
        description: "L'onglet 'Statistiques' vous donne une vue détaillée : taux de contact, taux de qualification, productivité par BD.",
      },
    ],
  },
  {
    id: "communication",
    title: "Centre de communication",
    description: "Gérez tous vos emails et messages depuis un seul endroit.",
    routePatterns: ["/communication", "/inbox"],
    category: "features",
    estimatedTime: "3 min",
    icon: "MessageSquare",
    steps: [
      {
        title: "Boîte de réception unifiée",
        description: "Tous les emails reçus de vos leads apparaissent dans la boîte de réception. Répondez directement depuis l'interface.",
      },
      {
        title: "Filtrer les messages",
        description: "Utilisez les filtres pour trier par campagne, par statut (non lu, important) ou par date.",
        action: "Cliquez sur les filtres en haut de la liste",
      },
      {
        title: "Répondre à un email",
        description: "Cliquez sur un message pour l'ouvrir, puis utilisez 'Répondre' pour composer votre réponse. L'historique est conservé.",
        tip: "Les réponses sont automatiquement liées au lead correspondant.",
      },
      {
        title: "Templates de messages",
        description: "Accédez aux templates via le menu d'insertion pour utiliser des messages pré-rédigés et personnalisables.",
      },
    ],
  },
  {
    id: "task-management",
    title: "Gestion des tâches",
    description: "Organisez votre travail avec le système de tâches.",
    routePatterns: ["/tasks"],
    category: "features",
    estimatedTime: "3 min",
    icon: "CheckSquare",
    steps: [
      {
        title: "Vue des tâches",
        description: "La page tâches affiche toutes vos tâches à faire, en cours et terminées. Utilisez les filtres pour vous concentrer sur l'urgent.",
      },
      {
        title: "Créer une tâche",
        description: "Cliquez sur '+ Nouvelle tâche' pour créer une tâche. Définissez un titre, une description, une date d'échéance et une priorité.",
        action: "Bouton '+ Nouvelle tâche'",
      },
      {
        title: "Lier à un lead",
        description: "Associez une tâche à un lead spécifique pour retrouver facilement le contexte. Très utile pour les relances !",
        tip: "Créez des tâches de relance directement depuis la fiche lead.",
      },
      {
        title: "Notifications",
        description: "Vous recevrez des rappels pour les tâches à échéance proche. Configurez vos préférences dans les paramètres.",
      },
    ],
  },
  {
    id: "account-management",
    title: "Gestion des comptes clients",
    description: "Gérez les comptes clients et leurs campagnes associées.",
    routePatterns: ["/accounts"],
    category: "features",
    roleRestrictions: ["ADMIN", "MANAGER"],
    estimatedTime: "4 min",
    icon: "Building2",
    steps: [
      {
        title: "Liste des comptes",
        description: "La page comptes affiche tous vos clients avec leur statut, le nombre de campagnes actives et les performances globales.",
      },
      {
        title: "Créer un compte",
        description: "Cliquez sur '+ Nouveau compte' pour ajouter un client. Renseignez les informations de l'entreprise et les contacts.",
        action: "Bouton '+ Nouveau compte'",
      },
      {
        title: "Fiche compte",
        description: "Chaque compte a une fiche détaillée avec : informations, contacts, campagnes associées, historique et statistiques.",
      },
      {
        title: "Gérer les campagnes du compte",
        description: "Depuis la fiche compte, créez ou gérez les campagnes associées. Un compte peut avoir plusieurs campagnes actives.",
        tip: "Regroupez les campagnes par compte pour une meilleure organisation.",
      },
    ],
  },
  {
    id: "planning-calendar",
    title: "Planning et calendrier",
    description: "Planifiez vos rendez-vous et visualisez votre agenda.",
    routePatterns: ["/planning"],
    category: "features",
    roleRestrictions: ["ADMIN", "MANAGER"],
    estimatedTime: "3 min",
    icon: "CalendarRange",
    steps: [
      {
        title: "Vue calendrier",
        description: "Le planning affiche tous les rendez-vous planifiés par les BDs. Visualisez par jour, semaine ou mois.",
      },
      {
        title: "Créer un rendez-vous",
        description: "Cliquez sur une case horaire pour créer un nouveau rendez-vous. Sélectionnez le lead, la date et l'heure.",
        action: "Cliquez sur le calendrier à l'heure souhaitée",
      },
      {
        title: "Synchronisation",
        description: "Le calendrier peut être synchronisé avec Google Calendar ou Outlook pour éviter les doubles réservations.",
        tip: "Activez la synchronisation dans Paramètres → Intégrations.",
      },
    ],
  },

  // ==================== GUIDES DÉPANNAGE ====================
  {
    id: "troubleshoot-no-leads",
    title: "Aucun lead disponible ?",
    description: "Solutions quand vous ne trouvez plus de leads à traiter.",
    routePatterns: ["/campaigns/*/leads", "/campaigns"],
    category: "troubleshooting",
    estimatedTime: "2 min",
    icon: "AlertCircle",
    steps: [
      {
        title: "Vérifier la campagne",
        description: "Assurez-vous que la campagne est bien active et qu'il reste des leads non traités.",
        action: "Vérifiez le statut de la campagne dans la liste",
      },
      {
        title: "Leads verrouillés",
        description: "Certains leads peuvent être temporairement verrouillés par d'autres BDs. Attendez qu'ils soient libérés ou choisissez une autre campagne.",
        tip: "Les leads sont automatiquement déverrouillés après 30 minutes d'inactivité.",
      },
      {
        title: "Contacter votre manager",
        description: "Si le problème persiste, contactez votre manager pour vérifier vos assignations de campagne.",
      },
    ],
  },
  {
    id: "troubleshoot-email",
    title: "Problèmes d'envoi d'emails",
    description: "Résoudre les erreurs d'envoi de messages.",
    routePatterns: ["/communication", "/inbox", "/campaigns/*/leads"],
    category: "troubleshooting",
    estimatedTime: "2 min",
    icon: "MailWarning",
    steps: [
      {
        title: "Vérifier l'adresse email",
        description: "Assurez-vous que l'adresse email du lead est valide et correctement formatée.",
      },
      {
        title: "Quota d'envoi",
        description: "Il peut y avoir une limite quotidienne d'emails. Vérifiez votre quota dans les paramètres.",
        tip: "Le quota se réinitialise chaque jour à minuit.",
      },
      {
        title: "Configuration email",
        description: "Vérifiez que votre compte email est bien connecté dans Paramètres → Email.",
        action: "Menu → Paramètres → Configuration Email",
      },
    ],
  },
  {
    id: "troubleshoot-performance",
    title: "L'application est lente ?",
    description: "Optimiser les performances de votre navigation.",
    routePatterns: ["/"],
    category: "troubleshooting",
    estimatedTime: "2 min",
    icon: "Zap",
    steps: [
      {
        title: "Rafraîchir la page",
        description: "Un simple rafraîchissement (F5 ou Ctrl+R) peut résoudre beaucoup de problèmes de lenteur.",
        action: "Appuyez sur F5 ou cliquez sur le bouton rafraîchir",
      },
      {
        title: "Vider le cache",
        description: "Videz le cache de votre navigateur si les problèmes persistent.",
        tip: "Ctrl+Shift+Delete ouvre les paramètres de cache dans la plupart des navigateurs.",
      },
      {
        title: "Connexion internet",
        description: "Vérifiez votre connexion internet. Une connexion instable peut affecter les performances.",
      },
      {
        title: "Contacter le support",
        description: "Si le problème persiste, contactez le support technique avec une description du problème.",
      },
    ],
  },
  {
    id: "keyboard-shortcuts",
    title: "Raccourcis clavier",
    description: "Gagnez du temps avec les raccourcis clavier.",
    routePatterns: ["/"],
    category: "features",
    estimatedTime: "2 min",
    icon: "Keyboard",
    steps: [
      {
        title: "Navigation rapide",
        description: "Utilisez les raccourcis pour naviguer plus rapidement dans l'application.",
        code: "G + D → Dashboard\nG + T → Tâches\nG + C → Campagnes",
      },
      {
        title: "Actions sur les leads",
        description: "Dans l'espace de travail leads, utilisez ces raccourcis :",
        code: "N → Prochain lead\nA → Appeler\nE → Email\nS → Changer statut",
      },
      {
        title: "Actions générales",
        description: "Raccourcis disponibles partout :",
        code: "? → Afficher l'aide\nEsc → Fermer le modal\nCtrl+K → Recherche rapide",
      },
    ],
  },
  {
    id: "best-practices",
    title: "Bonnes pratiques de prospection",
    description: "Conseils pour maximiser vos résultats.",
    routePatterns: ["/dashboard", "/campaigns/*/leads"],
    category: "getting-started",
    roleRestrictions: ["BD"],
    estimatedTime: "4 min",
    icon: "Award",
    steps: [
      {
        title: "Préparez votre journée",
        description: "Commencez par consulter votre tableau de bord et vos tâches du jour. Identifiez vos priorités.",
        tip: "Les meilleures heures pour appeler sont généralement 9h-11h et 14h-16h.",
      },
      {
        title: "Qualité vs quantité",
        description: "Privilégiez des conversations de qualité plutôt qu'un grand nombre d'appels courts. Écoutez activement vos prospects.",
      },
      {
        title: "Documentez tout",
        description: "Prenez des notes détaillées après chaque appel. Ces informations sont précieuses pour le suivi et pour vos collègues.",
        warning: "Une note non enregistrée est une information perdue !",
      },
      {
        title: "Suivi régulier",
        description: "Planifiez des relances pour les leads intéressés. Un bon suivi fait souvent la différence.",
        tip: "Créez une tâche de relance immédiatement après un appel prometteur.",
      },
      {
        title: "Analysez vos performances",
        description: "Consultez régulièrement vos statistiques pour identifier vos points forts et axes d'amélioration.",
      },
    ],
  },
];

// Fonction pour obtenir les guides par catégorie
export function getGuidesByCategory(category: Guide["category"]): Guide[] {
  return guides.filter((guide) => guide.category === category);
}

// Fonction pour obtenir un guide par son ID
export function getGuideById(id: string): Guide | undefined {
  return guides.find((guide) => guide.id === id);
}

// Fonction pour filtrer les guides par rôle
export function getGuidesForRole(role: UserRole): Guide[] {
  return guides.filter(
    (guide) => !guide.roleRestrictions || guide.roleRestrictions.includes(role)
  );
}

// Labels de catégories en français
export const categoryLabels: Record<Guide["category"], string> = {
  "getting-started": "Démarrage",
  features: "Fonctionnalités",
  troubleshooting: "Dépannage",
};

// Ordre d'affichage des catégories
export const categoryOrder: Guide["category"][] = [
  "getting-started",
  "features",
  "troubleshooting",
];




