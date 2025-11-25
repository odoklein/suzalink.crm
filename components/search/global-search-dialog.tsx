"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Megaphone,
  Building2,
  ListTodo,
  Mail,
  Loader2,
  ArrowRight,
  Clock,
  Search,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResultItem {
  id: string;
  type: "lead" | "campaign" | "account" | "task";
  title: string;
  subtitle?: string;
  status?: string;
  href: string;
}

const typeIcons = {
  lead: Users,
  campaign: Megaphone,
  account: Building2,
  task: ListTodo,
};

const typeColors = {
  lead: "bg-blue-100 text-blue-700",
  campaign: "bg-purple-100 text-purple-700",
  account: "bg-green-100 text-green-700",
  task: "bg-orange-100 text-orange-700",
};

const typeLabels = {
  lead: "Lead",
  campaign: "Campagne",
  account: "Compte",
  task: "Tâche",
};

export function GlobalSearchDialog({ open, onOpenChange }: GlobalSearchDialogProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);

  // Load recent searches from localStorage
  React.useEffect(() => {
    const stored = localStorage.getItem("crm-recent-searches");
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }, []);

  // Global search query
  const { data: searchResults, isLoading } = useQuery<SearchResultItem[]>({
    queryKey: ["global-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      
      const res = await fetch("/api/search/global", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!res.ok) {
        throw new Error("Search failed");
      }

      return res.json();
    },
    enabled: searchQuery.length >= 2,
    staleTime: 30000,
  });

  const handleSelect = (item: SearchResultItem) => {
    // Save to recent searches
    const newRecent = [item.title, ...recentSearches.filter(s => s !== item.title)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem("crm-recent-searches", JSON.stringify(newRecent));
    
    // Navigate
    router.push(item.href);
    onOpenChange(false);
    setSearchQuery("");
  };

  const handleQuickAction = (href: string) => {
    router.push(href);
    onOpenChange(false);
    setSearchQuery("");
  };

  // Group results by type
  const groupedResults = React.useMemo(() => {
    if (!searchResults) return {};
    return searchResults.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item);
      return acc;
    }, {} as Record<string, SearchResultItem[]>);
  }, [searchResults]);

  const hasResults = searchResults && searchResults.length > 0;
  const showQuickActions = !searchQuery || searchQuery.length < 2;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Rechercher leads, campagnes, comptes, tâches..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        {isLoading && searchQuery.length >= 2 && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && searchQuery.length >= 2 && !hasResults && (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2">
              <Search className="h-8 w-8 text-muted-foreground opacity-50" />
              <p>Aucun résultat trouvé pour "{searchQuery}"</p>
              <p className="text-xs text-muted-foreground">
                Essayez avec des termes différents
              </p>
            </div>
          </CommandEmpty>
        )}

        {showQuickActions && (
          <>
            {recentSearches.length > 0 && (
              <CommandGroup heading="Recherches récentes">
                {recentSearches.map((search) => (
                  <CommandItem
                    key={search}
                    value={search}
                    onSelect={() => setSearchQuery(search)}
                    className="gap-2"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{search}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandSeparator />

            <CommandGroup heading="Actions rapides">
              <CommandItem
                onSelect={() => handleQuickAction("/leads/workspace")}
                className="gap-2"
              >
                <Users className="h-4 w-4 text-primary-500" />
                <span>Espace de travail leads</span>
                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </CommandItem>
              <CommandItem
                onSelect={() => handleQuickAction("/campaigns")}
                className="gap-2"
              >
                <Megaphone className="h-4 w-4 text-purple-500" />
                <span>Voir les campagnes</span>
                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </CommandItem>
              <CommandItem
                onSelect={() => handleQuickAction("/accounts")}
                className="gap-2"
              >
                <Building2 className="h-4 w-4 text-green-500" />
                <span>Voir les comptes</span>
                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </CommandItem>
              <CommandItem
                onSelect={() => handleQuickAction("/tasks")}
                className="gap-2"
              >
                <ListTodo className="h-4 w-4 text-orange-500" />
                <span>Voir les tâches</span>
                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </CommandItem>
              <CommandItem
                onSelect={() => handleQuickAction("/inbox/compose")}
                className="gap-2"
              >
                <Mail className="h-4 w-4 text-blue-500" />
                <span>Composer un email</span>
                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Navigation">
              <CommandItem
                onSelect={() => handleQuickAction("/dashboard")}
                className="gap-2"
              >
                <span className="text-muted-foreground">Aller au</span>
                <span className="font-medium">Tableau de bord</span>
              </CommandItem>
              <CommandItem
                onSelect={() => handleQuickAction("/inbox")}
                className="gap-2"
              >
                <span className="text-muted-foreground">Aller à la</span>
                <span className="font-medium">Boîte de réception</span>
              </CommandItem>
              <CommandItem
                onSelect={() => handleQuickAction("/calendar")}
                className="gap-2"
              >
                <span className="text-muted-foreground">Aller au</span>
                <span className="font-medium">Calendrier</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {hasResults && (
          <>
            {Object.entries(groupedResults).map(([type, items]) => {
              const Icon = typeIcons[type as keyof typeof typeIcons];
              return (
                <CommandGroup 
                  key={type} 
                  heading={`${typeLabels[type as keyof typeof typeLabels]}s (${items.length})`}
                >
                  {items.slice(0, 5).map((item) => (
                    <CommandItem
                      key={`${item.type}-${item.id}`}
                      value={`${item.type}-${item.id}-${item.title}`}
                      onSelect={() => handleSelect(item)}
                      className="gap-3 py-3"
                    >
                      <div className={`p-1.5 rounded-md ${typeColors[item.type]}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.title}</p>
                        {item.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                      {item.status && (
                        <Badge variant="outline" className="text-xs">
                          {item.status}
                        </Badge>
                      )}
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </CommandItem>
                  ))}
                  {items.length > 5 && (
                    <CommandItem
                      onSelect={() => {
                        // Could navigate to filtered search page or show more
                        setSearchQuery(searchQuery);
                      }}
                      className="justify-center text-xs text-muted-foreground"
                    >
                      +{items.length - 5} autres résultats
                    </CommandItem>
                  )}
                </CommandGroup>
              );
            })}
          </>
        )}
      </CommandList>

      <div className="border-t px-3 py-2 text-xs text-muted-foreground flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
              ↑↓
            </kbd>
            <span>Naviguer</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
              ↵
            </kbd>
            <span>Sélectionner</span>
          </span>
        </div>
        <span className="flex items-center gap-1">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
            Esc
          </kbd>
          <span>Fermer</span>
        </span>
      </div>
    </CommandDialog>
  );
}

