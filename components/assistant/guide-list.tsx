"use client";

import { Guide, categoryLabels, categoryOrder } from "@/lib/assistant-guides";
import { cn } from "@/lib/utils";
import {
  Rocket,
  UserCheck,
  Target,
  Megaphone,
  MessageSquare,
  CheckSquare,
  Building2,
  CalendarRange,
  AlertCircle,
  MailWarning,
  Zap,
  Keyboard,
  Award,
  BookOpen,
  ChevronRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { useMemo } from "react";

// Map des icônes par nom
const iconMap: Record<string, React.ElementType> = {
  Rocket,
  UserCheck,
  Target,
  Megaphone,
  MessageSquare,
  CheckSquare,
  Building2,
  CalendarRange,
  AlertCircle,
  MailWarning,
  Zap,
  Keyboard,
  Award,
  BookOpen,
};

interface GuideListProps {
  guides: Guide[];
  contextualGuideIds?: string[];
  onSelectGuide: (guide: Guide) => void;
  searchQuery?: string;
}

export function GuideList({
  guides,
  contextualGuideIds = [],
  onSelectGuide,
  searchQuery,
}: GuideListProps) {
  // Groupe les guides par catégorie
  const groupedGuides = useMemo(() => {
    const groups: Record<Guide["category"], Guide[]> = {
      "getting-started": [],
      features: [],
      troubleshooting: [],
    };

    guides.forEach((guide) => {
      groups[guide.category].push(guide);
    });

    return groups;
  }, [guides]);

  // Vérifie si un guide est contextuel (pertinent pour la page actuelle)
  const isContextual = (guideId: string) => contextualGuideIds.includes(guideId);

  const renderGuideCard = (guide: Guide) => {
    const Icon = guide.icon ? iconMap[guide.icon] : BookOpen;
    const contextual = isContextual(guide.id);

    return (
      <button
        key={guide.id}
        onClick={() => onSelectGuide(guide)}
        className={cn(
          "w-full text-left p-4 rounded-xl border transition-all duration-200",
          "hover:shadow-md hover:border-emerald-200 hover:-translate-y-0.5",
          "focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
          "group relative overflow-hidden",
          contextual
            ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200"
            : "bg-white border-gray-100"
        )}
      >
        {/* Contextual Badge */}
        {contextual && (
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
              <Sparkles className="w-3 h-3" />
              Suggéré
            </span>
          </div>
        )}

        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
              contextual
                ? "bg-emerald-100 text-emerald-600"
                : "bg-gray-100 text-gray-500 group-hover:bg-emerald-100 group-hover:text-emerald-600"
            )}
          >
            <Icon className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-6">
            <h4 className="font-semibold text-gray-900 text-sm mb-1 truncate">
              {guide.title}
            </h4>
            <p className="text-xs text-gray-500 line-clamp-2">
              {guide.description}
            </p>

            {/* Meta */}
            <div className="flex items-center gap-3 mt-2">
              {guide.estimatedTime && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {guide.estimatedTime}
                </span>
              )}
              <span className="text-xs text-gray-400">
                {guide.steps.length} étapes
              </span>
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
        </div>
      </button>
    );
  };

  // Si recherche active, afficher les résultats à plat
  if (searchQuery) {
    if (guides.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">
            Aucun guide trouvé pour "{searchQuery}"
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Essayez avec d'autres mots-clés
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <p className="text-xs text-gray-500 px-1">
          {guides.length} résultat{guides.length > 1 ? "s" : ""} pour "{searchQuery}"
        </p>
        {guides.map(renderGuideCard)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {categoryOrder.map((category) => {
        const categoryGuides = groupedGuides[category];
        if (categoryGuides.length === 0) return null;

        return (
          <div key={category}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
              {categoryLabels[category]}
            </h3>
            <div className="space-y-2">
              {categoryGuides.map(renderGuideCard)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

