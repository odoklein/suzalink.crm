"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Guide,
  guides as allGuides,
  getGuidesForRole,
  UserRole,
} from "@/lib/assistant-guides";
import {
  getContextualSuggestions,
  searchGuides,
  getContextualHelpMessage,
} from "@/lib/assistant-context";
import { GuideStep } from "./guide-step";
import { GuideList } from "./guide-list";
import { GuideSearch } from "./guide-search";
import {
  ArrowLeft,
  ArrowRight,
  X,
  Sparkles,
  HelpCircle,
  Home,
} from "lucide-react";

// Context pour gérer l'état du modal
interface AssistantContextType {
  isOpen: boolean;
  openAssistant: () => void;
  closeAssistant: () => void;
  toggleAssistant: () => void;
}

const AssistantContext = createContext<AssistantContextType | undefined>(
  undefined
);

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error("useAssistant must be used within AssistantProvider");
  }
  return context;
}

// Provider pour l'assistant
export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openAssistant = useCallback(() => setIsOpen(true), []);
  const closeAssistant = useCallback(() => setIsOpen(false), []);
  const toggleAssistant = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <AssistantContext.Provider
      value={{ isOpen, openAssistant, closeAssistant, toggleAssistant }}
    >
      {children}
      <AssistantModal />
    </AssistantContext.Provider>
  );
}

// Trigger button pour ouvrir l'assistant
interface AssistantTriggerProps {
  children?: React.ReactNode;
  className?: string;
  variant?: "default" | "icon";
}

export function AssistantTrigger({
  children,
  className,
  variant = "default",
}: AssistantTriggerProps) {
  const { openAssistant } = useAssistant();

  if (variant === "icon") {
    return (
      <button
        onClick={openAssistant}
        className={cn(
          "flex items-center justify-center",
          "w-9 h-9 rounded-lg",
          "bg-gradient-to-br from-orange-500 to-amber-500",
          "text-white shadow-lg shadow-orange-200",
          "hover:shadow-xl hover:shadow-orange-300 hover:scale-105",
          "transition-all duration-200",
          className
        )}
        aria-label="Ouvrir l'assistant"
      >
        <Sparkles className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      onClick={openAssistant}
      className={cn(
        "flex items-center justify-center gap-2",
        "w-full px-4 py-2.5 rounded-xl",
        "bg-gradient-to-r from-orange-500 to-amber-500",
        "text-white font-medium text-sm",
        "shadow-lg shadow-orange-200",
        "hover:shadow-xl hover:shadow-orange-300 hover:from-orange-600 hover:to-amber-600",
        "transition-all duration-200",
        className
      )}
    >
      <Sparkles className="w-4 h-4" />
      {children || "Besoin d'aide ?"}
    </button>
  );
}

// Modal principal de l'assistant
function AssistantModal() {
  const { isOpen, closeAssistant } = useAssistant();
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user?.role as UserRole) || "BD";

  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Guides disponibles pour le rôle
  const availableGuides = getGuidesForRole(userRole);

  // Guides contextuels
  const contextualGuides = getContextualSuggestions(pathname, userRole, 5);
  const contextualGuideIds = contextualGuides.map((g) => g.id);

  // Guides filtrés par recherche
  const filteredGuides = searchQuery
    ? searchGuides(searchQuery, userRole)
    : availableGuides;

  // Message d'aide contextuel
  const helpMessage = getContextualHelpMessage(pathname);

  // Reset quand le modal ferme
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSelectedGuide(null);
        setCurrentStep(0);
        setSearchQuery("");
        setCompletedSteps([]);
      }, 300);
    }
  }, [isOpen]);

  // Gestion navigation steps
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNextStep = () => {
    if (selectedGuide && currentStep < selectedGuide.steps.length - 1) {
      setCompletedSteps((prev) => [...prev, currentStep]);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSelectGuide = (guide: Guide) => {
    setSelectedGuide(guide);
    setCurrentStep(0);
    setCompletedSteps([]);
    setSearchQuery("");
  };

  const handleBackToList = () => {
    setSelectedGuide(null);
    setCurrentStep(0);
    setCompletedSteps([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeAssistant()}>
      <DialogContent
        className={cn(
          "sm:max-w-[520px] max-h-[85vh] p-0 gap-0 overflow-hidden",
          "bg-white rounded-2xl border-0 shadow-2xl"
        )}
      >
        {/* Header */}
        <DialogHeader className="p-5 pb-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedGuide ? (
                <button
                  onClick={handleBackToList}
                  className="p-1.5 rounded-lg hover:bg-white/60 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                  <HelpCircle className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  {selectedGuide ? selectedGuide.title : "Centre d'aide"}
                </DialogTitle>
                {!selectedGuide && (
                  <p className="text-sm text-gray-500 mt-0.5">{helpMessage}</p>
                )}
              </div>
            </div>
            <button
              onClick={closeAssistant}
              className="p-1.5 rounded-lg hover:bg-white/60 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 min-h-[300px] max-h-[calc(85vh-180px)]">
          {selectedGuide ? (
            // Vue détaillée du guide
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">
                    Étape {currentStep + 1} sur {selectedGuide.steps.length}
                  </span>
                  <span className="text-sm text-emerald-600 font-medium">
                    {Math.round(
                      ((completedSteps.length + 1) / selectedGuide.steps.length) * 100
                    )}
                    %
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                    style={{
                      width: `${
                        ((completedSteps.length + 1) / selectedGuide.steps.length) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Current Step */}
              <GuideStep
                step={selectedGuide.steps[currentStep]}
                stepNumber={currentStep + 1}
                totalSteps={selectedGuide.steps.length}
                isActive={true}
                isCompleted={completedSteps.includes(currentStep)}
              />

              {/* Steps Overview (mini) */}
              <div className="flex items-center justify-center gap-1.5 pt-4">
                {selectedGuide.steps.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentStep(idx)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      idx === currentStep
                        ? "bg-emerald-500 w-6"
                        : completedSteps.includes(idx)
                        ? "bg-emerald-300"
                        : "bg-gray-200 hover:bg-gray-300"
                    )}
                    aria-label={`Aller à l'étape ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            // Liste des guides
            <div className="space-y-4">
              <GuideSearch
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Rechercher un guide..."
              />
              <GuideList
                guides={filteredGuides}
                contextualGuideIds={contextualGuideIds}
                onSelectGuide={handleSelectGuide}
                searchQuery={searchQuery || undefined}
              />
            </div>
          )}
        </div>

        {/* Footer avec navigation */}
        {selectedGuide && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 0}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Précédent
              </Button>

              {currentStep === selectedGuide.steps.length - 1 ? (
                <Button
                  onClick={handleBackToList}
                  className="gap-2 bg-emerald-500 hover:bg-emerald-600"
                >
                  <Home className="w-4 h-4" />
                  Retour aux guides
                </Button>
              ) : (
                <Button
                  onClick={handleNextStep}
                  className="gap-2 bg-emerald-500 hover:bg-emerald-600"
                >
                  Suivant
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AssistantModal;




