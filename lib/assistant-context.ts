import { guides, Guide, UserRole, getGuidesForRole } from "./assistant-guides";

/**
 * Vérifie si un pattern de route correspond au pathname actuel
 */
function matchRoutePattern(pattern: string, pathname: string): boolean {
  // Gère les wildcards simples (*)
  const regexPattern = pattern
    .replace(/\*/g, "[^/]+") // * correspond à un segment
    .replace(/\//g, "\\/"); // Échappe les slashes

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(pathname);
}

/**
 * Trouve tous les guides pertinents pour une route donnée
 */
export function getGuidesForRoute(pathname: string, userRole?: UserRole): Guide[] {
  // Filtre d'abord par rôle si spécifié
  const availableGuides = userRole ? getGuidesForRole(userRole) : guides;

  // Puis filtre par route
  const matchingGuides = availableGuides.filter((guide) =>
    guide.routePatterns.some((pattern) => matchRoutePattern(pattern, pathname))
  );

  return matchingGuides;
}

/**
 * Trouve le guide le plus pertinent pour une route (le plus spécifique)
 */
export function getMostRelevantGuide(
  pathname: string,
  userRole?: UserRole
): Guide | null {
  const matchingGuides = getGuidesForRoute(pathname, userRole);

  if (matchingGuides.length === 0) return null;

  // Trie par spécificité du pattern (plus de segments = plus spécifique)
  return matchingGuides.sort((a, b) => {
    const aMaxSpecificity = Math.max(
      ...a.routePatterns.map((p) => p.split("/").length)
    );
    const bMaxSpecificity = Math.max(
      ...b.routePatterns.map((p) => p.split("/").length)
    );
    return bMaxSpecificity - aMaxSpecificity;
  })[0];
}

/**
 * Obtient des suggestions de guides contextuelles
 */
export function getContextualSuggestions(
  pathname: string,
  userRole?: UserRole,
  limit: number = 3
): Guide[] {
  const matchingGuides = getGuidesForRoute(pathname, userRole);

  // Si des guides correspondent à la route, les retourner
  if (matchingGuides.length > 0) {
    return matchingGuides.slice(0, limit);
  }

  // Sinon, retourner des guides de démarrage généraux
  const availableGuides = userRole ? getGuidesForRole(userRole) : guides;
  return availableGuides
    .filter((guide) => guide.category === "getting-started")
    .slice(0, limit);
}

/**
 * Recherche dans les guides par texte
 */
export function searchGuides(
  query: string,
  userRole?: UserRole
): Guide[] {
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) return [];

  const availableGuides = userRole ? getGuidesForRole(userRole) : guides;

  return availableGuides.filter((guide) => {
    // Recherche dans le titre
    if (guide.title.toLowerCase().includes(normalizedQuery)) return true;

    // Recherche dans la description
    if (guide.description.toLowerCase().includes(normalizedQuery)) return true;

    // Recherche dans les titres des étapes
    if (
      guide.steps.some((step) =>
        step.title.toLowerCase().includes(normalizedQuery)
      )
    )
      return true;

    // Recherche dans les descriptions des étapes
    if (
      guide.steps.some((step) =>
        step.description.toLowerCase().includes(normalizedQuery)
      )
    )
      return true;

    return false;
  });
}

/**
 * Détermine le contexte de la page actuelle
 */
export function getPageContext(pathname: string): {
  section: string;
  feature: string | null;
  entityId: string | null;
} {
  const segments = pathname.split("/").filter(Boolean);

  let section = segments[0] || "dashboard";
  let feature: string | null = null;
  let entityId: string | null = null;

  // Détection des patterns courants
  if (segments.length >= 2) {
    // Pattern: /campaigns/[id]/leads
    if (segments[0] === "campaigns" && segments.length >= 3) {
      entityId = segments[1];
      feature = segments[2];
    }
    // Pattern: /accounts/[id]
    else if (segments[0] === "accounts" && segments.length >= 2) {
      entityId = segments[1];
    }
    // Pattern: /admin/users
    else if (segments[0] === "admin") {
      section = "admin";
      feature = segments[1] || null;
    }
  }

  return { section, feature, entityId };
}

/**
 * Génère un message d'aide contextuel
 */
export function getContextualHelpMessage(pathname: string): string {
  const context = getPageContext(pathname);

  const helpMessages: Record<string, string> = {
    dashboard: "Bienvenue sur votre tableau de bord ! Consultez vos statistiques et tâches du jour.",
    campaigns: "Gérez vos campagnes de prospection et suivez les performances.",
    accounts: "Consultez et gérez vos comptes clients.",
    tasks: "Organisez vos tâches et ne manquez aucune échéance.",
    communication: "Gérez tous vos messages et emails.",
    inbox: "Consultez votre boîte de réception.",
    planning: "Visualisez et gérez votre calendrier de rendez-vous.",
    projects: "Gérez vos projets et leur avancement.",
    settings: "Configurez vos préférences et paramètres.",
    admin: "Administrez les utilisateurs et les paramètres système.",
  };

  // Message spécifique pour l'espace de travail leads
  if (context.feature === "leads") {
    return "Vous êtes dans l'espace de travail leads. Traitez vos prospects et enregistrez vos activités.";
  }

  return helpMessages[context.section] || "Comment puis-je vous aider ?";
}


