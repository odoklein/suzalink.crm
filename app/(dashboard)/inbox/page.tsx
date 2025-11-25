"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { 
  Mail, 
  Search, 
  Filter,
  Star,
  Archive,
  Phone,
  Video,
  MoreVertical,
  Send,
  Paperclip,
  AtSign,
  Type,
  MapPin,
  User,
  Trash2,
  Settings,
  Loader2,
  RefreshCw,
  Inbox,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Tag,
  MailOpen,
  Plus,
  X,
  Check,
  Circle,
  MailCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { EmailConfigDialog } from "@/components/email/email-config-dialog";

// Types for the new email system
type Email = {
  id: string;
  threadId: string;
  subject: string;
  fromAddress: string;
  fromName?: string;
  toAddresses: Array<{ email: string; name?: string }>;
  snippet?: string;
  bodyPlain?: string;
  bodyHtml?: string;
  receivedAt: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  folder: string;
  attachments?: Array<{
    id: string;
    filename: string;
    contentType: string;
    size: number;
  }>;
  labels?: Array<{
    id: string;
    name: string;
    color?: string;
  }>;
  lead?: {
    id: string;
    standardData: any;
  } | null;
};

type EmailThread = {
  id: string;
  threadId: string;
  subject: string;
  fromAddress: string;
  fromName?: string;
  snippet?: string;
  receivedAt: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  messageCount: number;
  unreadCount: number;
};

type FolderInfo = {
  name: string;
  displayName: string;
  icon: string;
  count: number;
  unreadCount: number;
  isSystem: boolean;
};

type SyncStatus = {
  status: "idle" | "syncing" | "error";
  lastSyncAt: string | null;
  counts: {
    total: number;
    unread: number;
  };
};

type FilterTab = "all" | "unread" | "read" | "starred";

type DateGroup = {
  label: string;
  emails: Email[];
};

// Helper functions
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatRelativeTime(date: string): string {
  const now = new Date();
  const messageDate = new Date(date);
  const diffInMs = now.getTime() - messageDate.getTime();
  const diffInMins = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMs / 3600000);
  const diffInDays = Math.floor(diffInMs / 86400000);

  if (diffInMins < 1) return "À l'instant";
  if (diffInMins < 60) return `Il y a ${diffInMins}m`;
  if (diffInHours < 24) return `Il y a ${diffInHours}h`;
  if (diffInDays < 7) return `Il y a ${diffInDays}j`;
  return messageDate.toLocaleDateString('fr-FR');
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Group emails by date
function groupEmailsByDate(emails: Email[]): DateGroup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const thisWeekStart = new Date(today.getTime() - today.getDay() * 86400000);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const groups: Record<string, Email[]> = {
    "Aujourd'hui": [],
    "Hier": [],
    "Cette semaine": [],
    "Ce mois": [],
    "Plus ancien": [],
  };

  emails.forEach((email) => {
    const emailDate = new Date(email.receivedAt);
    const emailDay = new Date(emailDate.getFullYear(), emailDate.getMonth(), emailDate.getDate());

    if (emailDay.getTime() === today.getTime()) {
      groups["Aujourd'hui"].push(email);
    } else if (emailDay.getTime() === yesterday.getTime()) {
      groups["Hier"].push(email);
    } else if (emailDay >= thisWeekStart) {
      groups["Cette semaine"].push(email);
    } else if (emailDay >= thisMonthStart) {
      groups["Ce mois"].push(email);
    } else {
      groups["Plus ancien"].push(email);
    }
  });

  return Object.entries(groups)
    .filter(([_, emails]) => emails.length > 0)
    .map(([label, emails]) => ({ label, emails }));
}

const FOLDER_ICONS: Record<string, any> = {
  inbox: Inbox,
  star: Star,
  send: Send,
  file: FileText,
  "alert-triangle": AlertTriangle,
  trash: Trash2,
  mail: Mail,
  folder: FileText,
  tag: Tag,
};

const FILTER_TABS: { id: FilterTab; label: string; icon: any }[] = [
  { id: "all", label: "Tous", icon: Mail },
  { id: "unread", label: "Non lus", icon: Circle },
  { id: "read", label: "Lus", icon: MailCheck },
  { id: "starred", label: "Favoris", icon: Star },
];

export default function InboxPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("INBOX");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  
  // Compose form state
  const [composeTo, setComposeTo] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeBcc, setComposeBcc] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check email configuration status
  const { data: emailConfig, isLoading: isLoadingConfig } = useQuery<{
    isConfigured: boolean;
    email?: string;
  }>({
    queryKey: ["email-settings"],
    queryFn: async () => {
      const res = await fetch("/api/users/email-settings");
      if (!res.ok) throw new Error("Failed to check email settings");
      return res.json();
    },
  });

  // Show config dialog if email is not configured
  useEffect(() => {
    if (emailConfig && !emailConfig.isConfigured) {
      setConfigDialogOpen(true);
    }
  }, [emailConfig]);

  // Clear selection when folder changes
  useEffect(() => {
    setSelectedEmails(new Set());
  }, [selectedFolder, filterTab]);

  // Fetch folders with counts
  const { data: foldersData } = useQuery<{ 
    folders: FolderInfo[]; 
    labels: Array<FolderInfo & { id: string; color?: string; isLabel: boolean }>;
    summary: { total: number; unread: number };
  }>({
    queryKey: ["email-folders"],
    queryFn: async () => {
      const res = await fetch("/api/email/folders");
      if (!res.ok) throw new Error("Failed to fetch folders");
      return res.json();
    },
    enabled: emailConfig?.isConfigured === true,
  });

  // Fetch emails for selected folder
  const { data: emailsData, isLoading: isLoadingEmails } = useQuery<{
    emails: Email[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    meta: {
      unreadCount: number;
      folder: string;
    };
  }>({
    queryKey: ["emails", selectedFolder, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        folder: selectedFolder,
        limit: "50",
      });
      if (searchQuery) params.set("search", searchQuery);
      
      const res = await fetch(`/api/email?${params}`);
      if (!res.ok) throw new Error("Failed to fetch emails");
      return res.json();
    },
    enabled: emailConfig?.isConfigured === true,
  });

  // Fetch selected email details
  const { data: selectedEmail, isLoading: isLoadingEmail } = useQuery<{
    email: Email;
    thread: Array<{
      id: string;
      subject: string;
      fromAddress: string;
      fromName?: string;
      snippet?: string;
      receivedAt: string;
      isRead: boolean;
    }>;
  }>({
    queryKey: ["email", selectedEmailId],
    queryFn: async () => {
      if (!selectedEmailId) return null;
      const res = await fetch(`/api/email/${selectedEmailId}`);
      if (!res.ok) throw new Error("Failed to fetch email");
      return res.json();
    },
    enabled: !!selectedEmailId && emailConfig?.isConfigured === true,
  });

  // Fetch sync status
  const { data: syncStatus, refetch: refetchSyncStatus } = useQuery<SyncStatus>({
    queryKey: ["email-sync-status"],
    queryFn: async () => {
      const res = await fetch("/api/email/sync");
      if (!res.ok) throw new Error("Failed to fetch sync status");
      return res.json();
    },
    enabled: emailConfig?.isConfigured === true,
    refetchInterval: 30000,
  });

  // Trigger email sync
  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/email/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "full", immediate: true }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details || error.error || "Failed to trigger sync");
      }
      return res.json();
    },
    onSuccess: (data) => {
      const result = data.result;
      if (Array.isArray(result)) {
        const totalEmails = result.reduce((acc: number, r: any) => acc + (r.newEmails || 0), 0);
        toast({ 
          title: "Synchronisation terminée", 
          description: `${totalEmails} nouveaux emails synchronisés` 
        });
      } else if (result) {
        toast({ 
          title: "Synchronisation terminée", 
          description: result.newEmails > 0 
            ? `${result.newEmails} nouveaux emails synchronisés`
            : "Aucun nouvel email" 
        });
      } else {
        toast({ title: "Synchronisation terminée" });
      }
      refetchSyncStatus();
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["email-folders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de synchronisation",
        description: error.message || "Échec de la synchronisation",
        variant: "destructive",
      });
    },
  });

  // Update email flags (star, read, archive)
  const updateEmailMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Record<string, any> }) => {
      const res = await fetch(`/api/email/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.updates),
      });
      if (!res.ok) throw new Error("Failed to update email");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["email", selectedEmailId] });
      queryClient.invalidateQueries({ queryKey: ["email-folders"] });
    },
  });

  // Bulk update emails
  const bulkUpdateMutation = useMutation({
    mutationFn: async (data: { ids: string[]; updates: Record<string, any> }) => {
      const promises = data.ids.map((id) =>
        fetch(`/api/email/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data.updates),
        })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["email-folders"] });
      setSelectedEmails(new Set());
      toast({ title: "Emails mis à jour" });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Échec de la mise à jour des emails",
        variant: "destructive",
      });
    },
  });

  // Send reply
  const sendReplyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEmail?.email) throw new Error("No email selected");
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedEmail.email.fromAddress,
          subject: `Re: ${selectedEmail.email.subject}`,
          body: replyBody,
          leadId: selectedEmail.email.lead?.id,
          inReplyTo: selectedEmail.email.id,
        }),
      });
      if (!res.ok) throw new Error("Failed to send reply");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["email", selectedEmailId] });
      setReplyBody("");
      toast({ title: "Succès", description: "Réponse envoyée avec succès" });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec de l'envoi de la réponse",
        variant: "destructive",
      });
    },
  });

  // Send new email
  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: composeTo,
          cc: composeCc || undefined,
          bcc: composeBcc || undefined,
          subject: composeSubject,
          body: composeBody,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send email");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      setComposeOpen(false);
      resetComposeForm();
      toast({ title: "Succès", description: "Email envoyé avec succès" });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Échec de l'envoi de l'email",
        variant: "destructive",
      });
    },
  });

  const resetComposeForm = () => {
    setComposeTo("");
    setComposeCc("");
    setComposeBcc("");
    setComposeSubject("");
    setComposeBody("");
    setShowCcBcc(false);
  };

  const emails = emailsData?.emails || [];
  const folders = foldersData?.folders || [];
  const labels = foldersData?.labels || [];
  const email = selectedEmail?.email;
  const threadEmails = selectedEmail?.thread || [];

  // Filter emails based on active tab
  const filteredEmails = useMemo(() => {
    let filtered = emails;
    
    switch (filterTab) {
      case "unread":
        filtered = emails.filter((e) => !e.isRead);
        break;
      case "read":
        filtered = emails.filter((e) => e.isRead);
        break;
      case "starred":
        filtered = emails.filter((e) => e.isStarred);
        break;
    }
    
    return filtered;
  }, [emails, filterTab]);

  // Group filtered emails by date
  const groupedEmails = useMemo(() => {
    return groupEmailsByDate(filteredEmails);
  }, [filteredEmails]);

  // Count unread emails
  const unreadCount = useMemo(() => {
    return emails.filter((e) => !e.isRead).length;
  }, [emails]);

  const selectedLead = email?.lead;
  const leadName = selectedLead
    ? `${selectedLead.standardData?.firstName || ""} ${selectedLead.standardData?.lastName || ""}`.trim()
    : "";
  const leadEmail = selectedLead?.standardData?.email || "";
  const leadPhone = selectedLead?.standardData?.phone || "";
  const leadJobTitle = selectedLead?.standardData?.jobTitle || "";

  // Selection helpers
  const toggleEmailSelection = (emailId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelection = new Set(selectedEmails);
    if (newSelection.has(emailId)) {
      newSelection.delete(emailId);
    } else {
      newSelection.add(emailId);
    }
    setSelectedEmails(newSelection);
  };

  const selectAllEmails = () => {
    if (selectedEmails.size === filteredEmails.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(filteredEmails.map((e) => e.id)));
    }
  };

  const isAllSelected = filteredEmails.length > 0 && selectedEmails.size === filteredEmails.length;
  const isSomeSelected = selectedEmails.size > 0;

  // Loading state while checking config
  if (isLoadingConfig) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-500" />
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  // Not configured state - show setup prompt
  if (!emailConfig?.isConfigured && !configDialogOpen) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mb-6">
            <Mail className="h-10 w-10 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Configurez votre boîte de réception
          </h2>
          <p className="text-gray-500 mb-6">
            Pour accéder à votre boîte de réception et envoyer des emails, vous devez d'abord connecter votre compte email.
          </p>
          <Button
            onClick={() => setConfigDialogOpen(true)}
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/25 rounded-xl px-6"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurer maintenant
          </Button>
        </div>
        
        <EmailConfigDialog
          open={configDialogOpen}
          onOpenChange={setConfigDialogOpen}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["email-settings"] });
            queryClient.invalidateQueries({ queryKey: ["emails"] });
          }}
        />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Folders */}
        <div className="w-56 border-r border-gray-200 bg-white flex flex-col">
          {/* Nouveau button */}
          <div className="p-4 border-b border-gray-100 space-y-2">
            <Button
              onClick={() => setComposeOpen(true)}
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-xl shadow-lg shadow-primary-500/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau
            </Button>
            <Button
              variant="outline"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending || syncStatus?.status === "syncing"}
              className="w-full rounded-xl"
            >
              {syncMutation.isPending || syncStatus?.status === "syncing" ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Synchroniser
            </Button>
          </div>
          
          {/* Folders */}
          <div className="flex-1 overflow-y-auto py-2">
            <div className="px-3 mb-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Dossiers
              </span>
            </div>
            {folders.map((folder) => {
              const IconComponent = FOLDER_ICONS[folder.icon] || Mail;
              return (
                <button
                  key={folder.name}
                  onClick={() => {
                    setSelectedFolder(folder.name);
                    setSelectedEmailId(null);
                    setFilterTab("all");
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all",
                    selectedFolder === folder.name
                      ? "bg-primary-50 text-primary-700 border-r-2 border-primary-500"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="flex-1 text-left">{folder.displayName}</span>
                  {folder.unreadCount > 0 && (
                    <Badge variant="secondary" className="h-5 min-w-5 flex items-center justify-center text-xs bg-primary-100 text-primary-700">
                      {folder.unreadCount}
                    </Badge>
                  )}
                </button>
              );
            })}

            {/* Labels */}
            {labels.length > 0 && (
              <>
                <div className="px-3 mt-4 mb-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Labels
                  </span>
                </div>
                {labels.map((label) => (
                  <button
                    key={label.id}
                    onClick={() => setSelectedFolder(`label:${label.id}`)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2 text-sm transition-all",
                      "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: label.color || "#6B7280" }}
                    />
                    <span className="flex-1 text-left truncate">{label.name}</span>
                    {label.count > 0 && (
                      <span className="text-xs text-gray-400">{label.count}</span>
                    )}
                  </button>
                ))}
              </>
            )}
          </div>

          {/* Sync Status */}
          <div className="p-3 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {syncStatus?.status === "syncing" ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Synchronisation...</span>
                </>
              ) : syncStatus?.status === "error" ? (
                <>
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  <span className="text-amber-600">Erreur de sync</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  <span>
                    {syncStatus?.lastSyncAt
                      ? `Sync ${formatRelativeTime(syncStatus.lastSyncAt)}`
                      : "Non synchronisé"}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Email List */}
        <div className="w-96 border-r border-gray-200 bg-white flex flex-col">
          {/* Search Header */}
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                {folders.find(f => f.name === selectedFolder)?.displayName || selectedFolder}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setConfigDialogOpen(true)}
                className="h-8 w-8"
              >
                <Settings className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 rounded-xl"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-2 py-2 border-b border-gray-100 flex gap-1">
            {FILTER_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = filterTab === tab.id;
              const showBadge = tab.id === "unread" && unreadCount > 0;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all",
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", tab.id === "starred" && isActive && "fill-primary-500")} />
                  <span>{tab.label}</span>
                  {showBadge && (
                    <Badge className="h-4 min-w-4 px-1 text-[10px] bg-primary-500 text-white">
                      {unreadCount}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          {/* Select All Header */}
          {filteredEmails.length > 0 && (
            <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={selectAllEmails}
                className="h-4 w-4"
              />
              <span className="text-xs text-gray-500">
                {isSomeSelected 
                  ? `${selectedEmails.size} sélectionné(s)`
                  : `${filteredEmails.length} email(s)`
                }
              </span>
            </div>
          )}

          {/* Email List with Date Groups */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingEmails ? (
              <div className="p-4 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary-500" />
                <p className="text-sm text-gray-500">Chargement des emails...</p>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                <Mail className="mx-auto h-12 w-12 mb-3 opacity-30" />
                <p className="font-medium text-gray-600 mb-1">Aucun email</p>
                <p className="text-xs">
                  {filterTab === "all" 
                    ? "Votre boîte de réception est vide"
                    : filterTab === "unread"
                    ? "Aucun email non lu"
                    : filterTab === "read"
                    ? "Aucun email lu"
                    : "Aucun email favori"
                  }
                </p>
              </div>
            ) : (
              <div>
                {groupedEmails.map((group) => (
                  <div key={group.label}>
                    {/* Date Group Header */}
                    <div className="sticky top-0 z-10 px-4 py-2 bg-gray-50 border-b border-gray-100">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {group.label}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        ({group.emails.length})
                      </span>
                    </div>
                    
                    {/* Emails in group */}
                    <div className="divide-y divide-gray-100">
                      {group.emails.map((emailItem) => {
                        const displayName = emailItem.fromName || emailItem.fromAddress.split("@")[0];
                        const initials = getInitials(displayName);
                        const isSelected = selectedEmailId === emailItem.id;
                        const isChecked = selectedEmails.has(emailItem.id);

                        return (
                          <div
                            key={emailItem.id}
                            onClick={() => {
                              setSelectedEmailId(emailItem.id);
                              // Auto-mark as read when opened
                              if (!emailItem.isRead) {
                                updateEmailMutation.mutate({
                                  id: emailItem.id,
                                  updates: { isRead: true }
                                });
                              }
                            }}
                            className={cn(
                              "p-4 cursor-pointer transition-all group relative",
                              isSelected
                                ? "bg-primary-50 border-l-4 border-l-primary-500"
                                : "hover:bg-gray-50 border-l-4 border-l-transparent",
                              !emailItem.isRead && !isSelected && "bg-blue-50/40"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              {/* Checkbox */}
                              <div 
                                className="flex-shrink-0 pt-0.5"
                                onClick={(e) => toggleEmailSelection(emailItem.id, e)}
                              >
                                <Checkbox
                                  checked={isChecked}
                                  className="h-4 w-4"
                                />
                              </div>
                              
                              {/* Unread indicator */}
                              {!emailItem.isRead && (
                                <div className="flex-shrink-0 pt-2">
                                  <div className="h-2 w-2 rounded-full bg-primary-500" />
                                </div>
                              )}
                              
                              <Avatar className={cn(
                                "h-10 w-10 ring-2 ring-white shadow-sm flex-shrink-0",
                                emailItem.isRead && "ml-4"
                              )}>
                                <AvatarFallback className={cn(
                                  "text-sm font-medium",
                                  !emailItem.isRead 
                                    ? "bg-primary-100 text-primary-700" 
                                    : "bg-gray-100 text-gray-600"
                                )}>
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className={cn(
                                    "text-sm truncate",
                                    !emailItem.isRead ? "font-bold text-gray-900" : "font-medium text-gray-600"
                                  )}>
                                    {displayName}
                                  </p>
                                  <span className={cn(
                                    "text-xs ml-2 flex-shrink-0",
                                    !emailItem.isRead ? "text-gray-700 font-medium" : "text-gray-400"
                                  )}>
                                    {formatRelativeTime(emailItem.receivedAt)}
                                  </span>
                                </div>
                                <p className={cn(
                                  "text-sm truncate mb-1",
                                  !emailItem.isRead ? "font-semibold text-gray-800" : "text-gray-500"
                                )}>
                                  {emailItem.subject || "(Sans objet)"}
                                </p>
                                <p className={cn(
                                  "text-xs truncate",
                                  !emailItem.isRead ? "text-gray-600" : "text-gray-400"
                                )}>
                                  {emailItem.snippet}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  {emailItem.isStarred && (
                                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                  )}
                                  {emailItem.hasAttachments && (
                                    <Paperclip className="h-3.5 w-3.5 text-gray-400" />
                                  )}
                                  {emailItem.labels?.map((label) => (
                                    <span
                                      key={label.id}
                                      className="text-xs px-1.5 py-0.5 rounded"
                                      style={{ 
                                        backgroundColor: `${label.color}20`,
                                        color: label.color 
                                      }}
                                    >
                                      {label.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bulk Actions Bar */}
          {isSomeSelected && (
            <div className="absolute bottom-4 left-56 right-0 mx-auto w-fit z-50">
              <div className="bg-gray-900 text-white rounded-xl shadow-2xl px-4 py-3 flex items-center gap-3">
                <span className="text-sm font-medium">
                  {selectedEmails.size} sélectionné(s)
                </span>
                <div className="h-4 w-px bg-gray-600" />
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-gray-700 h-8"
                  onClick={() => bulkUpdateMutation.mutate({
                    ids: Array.from(selectedEmails),
                    updates: { isRead: true }
                  })}
                >
                  <Eye className="h-4 w-4 mr-1.5" />
                  Lu
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-gray-700 h-8"
                  onClick={() => bulkUpdateMutation.mutate({
                    ids: Array.from(selectedEmails),
                    updates: { isRead: false }
                  })}
                >
                  <EyeOff className="h-4 w-4 mr-1.5" />
                  Non lu
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-gray-700 h-8"
                  onClick={() => bulkUpdateMutation.mutate({
                    ids: Array.from(selectedEmails),
                    updates: { isStarred: true }
                  })}
                >
                  <Star className="h-4 w-4 mr-1.5" />
                  Favoris
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-gray-700 h-8"
                  onClick={() => bulkUpdateMutation.mutate({
                    ids: Array.from(selectedEmails),
                    updates: { isArchived: true }
                  })}
                >
                  <Archive className="h-4 w-4 mr-1.5" />
                  Archiver
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-gray-700 h-8 text-red-400 hover:text-red-300"
                  onClick={() => bulkUpdateMutation.mutate({
                    ids: Array.from(selectedEmails),
                    updates: { isTrash: true }
                  })}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Supprimer
                </Button>
                <div className="h-4 w-px bg-gray-600" />
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-white hover:bg-gray-700 h-8"
                  onClick={() => setSelectedEmails(new Set())}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Email Content */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedEmailId && email ? (
            <>
              {/* Email Header */}
              <div className="p-4 border-b border-gray-200 bg-white shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">
                      {email.subject || "(Sans objet)"}
                    </h2>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-gray-700">
                        {email.fromName || email.fromAddress}
                      </span>
                      {email.fromName && (
                        <span className="text-gray-500">&lt;{email.fromAddress}&gt;</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      À: {email.toAddresses?.map(a => a.email).join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-lg hover:bg-gray-100"
                      onClick={() => updateEmailMutation.mutate({
                        id: email.id,
                        updates: { isStarred: !email.isStarred }
                      })}
                    >
                      <Star className={cn(
                        "h-4 w-4",
                        email.isStarred && "fill-amber-400 text-amber-400"
                      )} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-gray-100">
                      <Archive className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-gray-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => updateEmailMutation.mutate({
                          id: email.id,
                          updates: { isRead: !email.isRead }
                        })}>
                          <MailOpen className="h-4 w-4 mr-2" />
                          Marquer comme {email.isRead ? "non lu" : "lu"}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Archive className="h-4 w-4 mr-2" />
                          Archiver
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Reçu {new Date(email.receivedAt).toLocaleString("fr-FR")}
                </p>
              </div>

              {/* Email Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                {isLoadingEmail ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-500" />
                    <p className="text-gray-500">Chargement...</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm">
                    {/* Main email */}
                    <div className="p-6">
                      {email.bodyHtml ? (
                        <div 
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
                        />
                      ) : (
                        <div className="whitespace-pre-wrap text-sm text-gray-700">
                          {email.bodyPlain}
                        </div>
                      )}

                      {/* Attachments */}
                      {email.attachments && email.attachments.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-100">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">
                            Pièces jointes ({email.attachments.length})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {email.attachments.map((att) => (
                              <div
                                key={att.id}
                                className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors"
                              >
                                <Paperclip className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-700">{att.filename}</span>
                                <span className="text-xs text-gray-400">
                                  {formatFileSize(att.size)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Thread replies */}
                    {threadEmails.length > 0 && (
                      <div className="border-t border-gray-100">
                        <button className="w-full px-6 py-3 flex items-center gap-2 text-sm text-primary-600 hover:bg-gray-50">
                          <ChevronDown className="h-4 w-4" />
                          {threadEmails.length} autre(s) message(s) dans cette conversation
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Reply Composer */}
              <div className="border-t border-gray-200 bg-white p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Select defaultValue="reply">
                      <SelectTrigger className="h-8 w-28 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reply">Répondre</SelectItem>
                        <SelectItem value="forward">Transférer</SelectItem>
                      </SelectContent>
                    </Select>
                    {emailConfig?.email && (
                      <span className="text-sm text-gray-500">
                        depuis {emailConfig.email}
                      </span>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mb-2">
                  <p className="text-sm text-gray-600">
                    À: {email.fromAddress}
                  </p>
                </div>
                <div className="mb-3">
                  <Textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder={`Bonjour ${email.fromName || email.fromAddress.split('@')[0]},`}
                    className="min-h-[120px] resize-none bg-gray-50 rounded-xl border-gray-200"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                      <Type className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                      <AtSign className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={() => sendReplyMutation.mutate()}
                    disabled={!replyBody.trim() || sendReplyMutation.isPending}
                    className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl shadow-lg shadow-primary-500/25"
                  >
                    {sendReplyMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Envoyer
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500">Sélectionnez un email pour le lire</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Lead Details */}
        {email && selectedLead && (
          <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto shadow-sm">
            <div className="p-6 space-y-6">
              {/* Profile Section */}
              <div className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-3 ring-4 ring-primary-100">
                  <AvatarFallback className="bg-primary-100 text-primary-700 text-xl font-semibold">
                    {getInitials(leadName)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-gray-900 text-lg">{leadName}</h3>
                <p className="text-sm text-gray-500">{leadJobTitle}</p>
              </div>

              {/* Contact Details */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Contact
                </h4>
                <div className="space-y-3">
                  {leadEmail && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{leadEmail}</span>
                    </div>
                  )}
                  {leadPhone && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{leadPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* View Lead Link */}
              <Link href={`/leads/${selectedLead.id}`}>
                <Button variant="outline" className="w-full rounded-xl">
                  <User className="mr-2 h-4 w-4" />
                  Voir le profil complet
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Compose Email Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b border-gray-200">
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary-500" />
              Nouveau message
            </DialogTitle>
          </DialogHeader>
          
          <div className="px-6 py-4 space-y-4">
            {/* From */}
            <div className="flex items-center gap-3">
              <Label className="w-16 text-right text-sm text-gray-500">De</Label>
              <div className="flex-1 text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                {emailConfig?.email || "Votre email"}
              </div>
            </div>
            
            {/* To */}
            <div className="flex items-center gap-3">
              <Label className="w-16 text-right text-sm text-gray-500">À</Label>
              <Input
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                placeholder="destinataire@example.com"
                className="flex-1 rounded-lg"
              />
              {!showCcBcc && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-500"
                  onClick={() => setShowCcBcc(true)}
                >
                  Cc/Cci
                </Button>
              )}
            </div>
            
            {/* Cc/Bcc */}
            {showCcBcc && (
              <>
                <div className="flex items-center gap-3">
                  <Label className="w-16 text-right text-sm text-gray-500">Cc</Label>
                  <Input
                    value={composeCc}
                    onChange={(e) => setComposeCc(e.target.value)}
                    placeholder="cc@example.com"
                    className="flex-1 rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Label className="w-16 text-right text-sm text-gray-500">Cci</Label>
                  <Input
                    value={composeBcc}
                    onChange={(e) => setComposeBcc(e.target.value)}
                    placeholder="cci@example.com"
                    className="flex-1 rounded-lg"
                  />
                </div>
              </>
            )}
            
            {/* Subject */}
            <div className="flex items-center gap-3">
              <Label className="w-16 text-right text-sm text-gray-500">Objet</Label>
              <Input
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                placeholder="Objet du message"
                className="flex-1 rounded-lg"
              />
            </div>
            
            {/* Body */}
            <div className="pt-2">
              <Textarea
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="Rédigez votre message..."
                className="min-h-[250px] resize-none rounded-xl border-gray-200"
              />
            </div>
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                <Type className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setComposeOpen(false);
                  resetComposeForm();
                }}
                className="rounded-xl"
              >
                Annuler
              </Button>
              <Button
                onClick={() => sendEmailMutation.mutate()}
                disabled={!composeTo.trim() || !composeSubject.trim() || !composeBody.trim() || sendEmailMutation.isPending}
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl shadow-lg shadow-primary-500/25"
              >
                {sendEmailMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Envoyer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Config Dialog */}
      <EmailConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["email-settings"] });
          queryClient.invalidateQueries({ queryKey: ["emails"] });
          queryClient.invalidateQueries({ queryKey: ["email-folders"] });
        }}
      />
    </div>
  );
}
