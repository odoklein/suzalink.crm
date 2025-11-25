"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateAction extends Omit<ButtonProps, 'children'> {
  label: string;
  icon?: LucideIcon;
}

interface EmptyStateProps {
  /** Path to the illustration image (SVG preferred) */
  illustration?: string;
  /** Fallback icon if no illustration is provided */
  icon?: LucideIcon;
  /** Main title for the empty state */
  title: string;
  /** Description text explaining the empty state */
  description?: string;
  /** Primary action button */
  action?: EmptyStateAction;
  /** Secondary action button */
  secondaryAction?: EmptyStateAction;
  /** Additional content to render below the actions */
  children?: React.ReactNode;
  /** Custom className for the container */
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: {
    container: "py-6",
    illustration: { width: 120, height: 120 },
    iconWrapper: "h-12 w-12",
    icon: "h-6 w-6",
    title: "text-base font-medium",
    description: "text-sm",
  },
  md: {
    container: "py-10",
    illustration: { width: 180, height: 180 },
    iconWrapper: "h-16 w-16",
    icon: "h-8 w-8",
    title: "text-lg font-semibold",
    description: "text-sm",
  },
  lg: {
    container: "py-16",
    illustration: { width: 240, height: 240 },
    iconWrapper: "h-20 w-20",
    icon: "h-10 w-10",
    title: "text-xl font-semibold",
    description: "text-base",
  },
};

export function EmptyState({
  illustration,
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  children,
  className,
  size = "md",
}: EmptyStateProps) {
  const styles = sizeStyles[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        styles.container,
        className
      )}
    >
      {/* Illustration or Icon */}
      {illustration ? (
        <div className="mb-6 relative animate-in fade-in-50 duration-500">
          <Image
            src={illustration}
            alt=""
            width={styles.illustration.width}
            height={styles.illustration.height}
            className="object-contain opacity-90"
            priority={false}
          />
        </div>
      ) : Icon ? (
        <div
          className={cn(
            "mb-6 rounded-full bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center animate-in fade-in-50 zoom-in-95 duration-500",
            styles.iconWrapper
          )}
        >
          <Icon
            className={cn(styles.icon, "text-primary-500 opacity-70")}
          />
        </div>
      ) : null}

      {/* Title */}
      <h3
        className={cn(
          "text-text-main mb-2 animate-in fade-in-50 slide-in-from-bottom-2 duration-300 delay-100",
          styles.title
        )}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={cn(
            "text-text-body max-w-md mx-auto mb-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300 delay-150",
            styles.description
          )}
        >
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 animate-in fade-in-50 slide-in-from-bottom-2 duration-300 delay-200">
          {action && (
            <Button {...action}>
              {action.icon && <action.icon className="mr-2 h-4 w-4" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" {...secondaryAction}>
              {secondaryAction.icon && (
                <secondaryAction.icon className="mr-2 h-4 w-4" />
              )}
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}

      {/* Additional Content */}
      {children && (
        <div className="mt-6 animate-in fade-in-50 duration-300 delay-300">
          {children}
        </div>
      )}
    </div>
  );
}

// Preset empty states for common use cases
export function EmptyLeadsState({
  onStartSession,
}: {
  onStartSession?: () => void;
}) {
  return (
    <EmptyState
      illustration="/illustrations/empty-session.svg"
      title="Démarrez votre session de prospection"
      description="Sélectionnez une campagne et obtenez votre prochain lead pour commencer à travailler."
      action={
        onStartSession
          ? { label: "Commencer", onClick: onStartSession }
          : undefined
      }
      size="lg"
    />
  );
}

export function EmptyTasksState({
  onCreateTask,
}: {
  onCreateTask?: () => void;
}) {
  return (
    <EmptyState
      illustration="/illustrations/empty-tasks.svg"
      title="Aucune tâche pour le moment"
      description="Vous êtes à jour ! Créez une nouvelle tâche ou attendez les suggestions automatiques."
      action={
        onCreateTask
          ? { label: "Créer une tâche", onClick: onCreateTask }
          : undefined
      }
    />
  );
}

export function EmptyDealsState() {
  return (
    <EmptyState
      illustration="/illustrations/empty-deals.svg"
      title="Aucun lead récent"
      description="Les leads que vous traitez apparaîtront ici."
      size="sm"
    />
  );
}

export function EmptySuggestionsState() {
  return (
    <EmptyState
      illustration="/illustrations/empty-suggestions.svg"
      title="Tout est à jour !"
      description="Aucun suivi urgent nécessaire pour le moment."
      size="sm"
    />
  );
}

export function EmptyActivitiesState() {
  return (
    <EmptyState
      illustration="/illustrations/empty-activities.svg"
      title="Aucune activité"
      description="Commencez par passer un appel ou envoyer un email."
      size="sm"
    />
  );
}

