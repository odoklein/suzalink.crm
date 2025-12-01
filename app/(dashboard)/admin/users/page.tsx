"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  UserX,
  UserCheck,
  ArrowUpDown,
  Target,
  Mail,
  Phone,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { UserDialog } from "@/components/admin/user-dialog";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";

type User = {
  id: string;
  email: string;
  role: string;
  avatar: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  _count?: {
    assignedLeads: number;
    activities: number;
  };
  leadsConverted?: number;
  conversionRate?: number;
};

type SortField = "email" | "role" | "lastLoginAt" | "createdAt" | "leads" | "conversionRate";
type SortDirection = "asc" | "desc";

export default function AdminUsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; email: string } | null>(null);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const { data: users = [], isLoading, error } = useQuery<User[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Failed to fetch users" }));
        throw new Error(error.error || "Failed to fetch users");
      }
      return res.json();
    },
    retry: 1,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed to update user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-stats"] });
      toast({
        title: "Succès",
        description: "Statut de l'utilisateur mis à jour",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-stats"] });
      toast({
        title: "Succès",
        description: "Utilisateur supprimé avec succès",
      });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'utilisateur",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (userId: string) => {
    setEditingUserId(userId);
    setUserDialogOpen(true);
  };

  const handleToggleActive = (user: User) => {
    toggleActiveMutation.mutate({
      userId: user.id,
      isActive: !user.isActive,
    });
  };

  const handleInlineToggle = (user: User, checked: boolean) => {
    toggleActiveMutation.mutate({
      userId: user.id,
      isActive: checked,
    });
  };

  const handleDelete = (user: User) => {
    setUserToDelete({ id: user.id, email: user.email });
    setDeleteDialogOpen(true);
  };

  const handleNewUser = () => {
    setEditingUserId(undefined);
    setUserDialogOpen(true);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      ADMIN: "Administrateur",
      MANAGER: "Gestionnaire",
      BD: "Business Developer",
      DEVELOPER: "Développeur",
    };
    return roleMap[role] || role;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20";
      case "MANAGER":
        return "bg-[#1A6BFF]/10 text-[#1A6BFF] border-[#1A6BFF]/20";
      case "BD":
        return "bg-[#00D985]/10 text-[#00D985] border-[#00D985]/20";
      case "DEVELOPER":
        return "bg-[#A46CFF]/10 text-[#A46CFF] border-[#A46CFF]/20";
      default:
        return "bg-[#6B7280]/10 text-[#6B7280] border-[#6B7280]/20";
    }
  };

  const getInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredAndSortedUsers = users
    .filter((user) => {
      const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.isActive) ||
        (statusFilter === "inactive" && !user.isActive);
      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "email":
          comparison = a.email.localeCompare(b.email);
          break;
        case "role":
          comparison = a.role.localeCompare(b.role);
          break;
        case "lastLoginAt":
          comparison =
            new Date(a.lastLoginAt || 0).getTime() - new Date(b.lastLoginAt || 0).getTime();
          break;
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "leads":
          comparison = (a._count?.assignedLeads || 0) - (b._count?.assignedLeads || 0);
          break;
        case "conversionRate":
          comparison = (a.conversionRate || 0) - (b.conversionRate || 0);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

  if (isLoading) {
    return (
      <div className="p-6 max-w-[1440px] mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#1A6BFF]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-[1440px] mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Erreur de chargement</h2>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : "Impossible de charger les utilisateurs"}
            </p>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-users"] })} variant="outline">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1440px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-bold text-[#1B1F24] tracking-[-0.5px]">
            Gestion des utilisateurs
          </h1>
          <p className="text-[15px] text-[#6B7280] mt-1">
            Gérez les utilisateurs, leurs rôles et leurs autorisations
          </p>
        </div>
        <Button
          onClick={handleNewUser}
          className="rounded-[12px] bg-[#1A6BFF] hover:bg-[#0F4FCC] shadow-sm hover:shadow-md transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un utilisateur
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-[#E6E8EB] shadow-sm">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1B1F24]">Rechercher</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                <Input
                  placeholder="Rechercher par email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-[12px] border-[#DEE2E6] focus:border-[#1A6BFF] focus:ring-[#1A6BFF]/20"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1B1F24]">Rôle</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="rounded-[12px] border-[#DEE2E6]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="ADMIN">Administrateur</SelectItem>
                  <SelectItem value="MANAGER">Gestionnaire</SelectItem>
                  <SelectItem value="BD">Business Developer</SelectItem>
                  <SelectItem value="DEVELOPER">Développeur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1B1F24]">Statut</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="rounded-[12px] border-[#DEE2E6]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-[#E6E8EB] shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[#F8F9FA] to-[#F1F3F5] border-b border-[#E6E8EB]">
          <CardTitle className="text-lg font-semibold text-[#1B1F24]">
            Utilisateurs ({filteredAndSortedUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredAndSortedUsers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F1F3F5] flex items-center justify-center">
                <Search className="h-7 w-7 text-[#9CA3AF]" />
              </div>
              <p className="text-[15px] text-[#6B7280] font-medium">Aucun utilisateur trouvé</p>
              <p className="text-sm text-[#9CA3AF] mt-1">
                Essayez de modifier vos critères de recherche
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F8F9FA] hover:bg-[#F8F9FA]">
                  <TableHead className="font-semibold text-[#1B1F24]">
                    <button
                      onClick={() => handleSort("email")}
                      className="flex items-center gap-1 hover:text-[#1A6BFF] transition-colors"
                    >
                      Utilisateur
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold text-[#1B1F24]">
                    <button
                      onClick={() => handleSort("role")}
                      className="flex items-center gap-1 hover:text-[#1A6BFF] transition-colors"
                    >
                      Rôle
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold text-[#1B1F24]">Statut</TableHead>
                  <TableHead className="font-semibold text-[#1B1F24]">
                    <button
                      onClick={() => handleSort("leads")}
                      className="flex items-center gap-1 hover:text-[#1A6BFF] transition-colors"
                    >
                      Leads
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold text-[#1B1F24]">
                    <button
                      onClick={() => handleSort("lastLoginAt")}
                      className="flex items-center gap-1 hover:text-[#1A6BFF] transition-colors"
                    >
                      Dernière activité
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold text-[#1B1F24]">
                    <button
                      onClick={() => handleSort("createdAt")}
                      className="flex items-center gap-1 hover:text-[#1A6BFF] transition-colors"
                    >
                      Créé le
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right font-semibold text-[#1B1F24]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedUsers.map((user, index) => (
                  <TableRow
                    key={user.id}
                    className="group hover:bg-[#F8F9FA]/50 transition-colors"
                    style={{
                      animationDelay: `${index * 30}ms`,
                    }}
                  >
                    <TableCell>
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="flex items-center gap-3 group/link"
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10 ring-2 ring-transparent group-hover/link:ring-[#1A6BFF]/20 transition-all">
                            <AvatarImage src={user.avatar || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-[#1A6BFF] to-[#0F4FCC] text-white font-semibold text-sm">
                              {getInitials(user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                              user.isActive ? "bg-[#00D985]" : "bg-[#9CA3AF]"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-[#1B1F24] group-hover/link:text-[#1A6BFF] transition-colors">
                            {user.email}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            {user._count && (
                              <>
                                <span className="text-xs text-[#6B7280] flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  {user._count.assignedLeads || 0} leads
                                </span>
                                <span className="text-xs text-[#6B7280] flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3" />
                                  {user._count.activities || 0} activités
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getRoleColor(user.role)} border font-medium`}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.isActive}
                          onCheckedChange={(checked) => handleInlineToggle(user, checked)}
                          disabled={toggleActiveMutation.isPending}
                          className="data-[state=checked]:bg-[#00D985]"
                        />
                        <span className={`text-sm ${user.isActive ? "text-[#00D985]" : "text-[#9CA3AF]"}`}>
                          {user.isActive ? "Actif" : "Inactif"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#1B1F24]">
                          {user._count?.assignedLeads || 0}
                        </span>
                        {user.conversionRate !== undefined && (
                          <span className="text-xs text-[#00D985]">
                            {user.conversionRate}% conversion
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.lastLoginAt ? (
                        <div className="flex flex-col">
                          <span className="text-sm text-[#1B1F24]">
                            {formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true })}
                          </span>
                          <span className="text-xs text-[#9CA3AF]">
                            {new Date(user.lastLoginAt).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-[#9CA3AF] italic">Jamais connecté</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-[#6B7280]">
                        {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleEdit(user.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleActive(user)}
                            disabled={toggleActiveMutation.isPending}
                          >
                            {user.isActive ? (
                              <>
                                <UserX className="h-4 w-4 mr-2" />
                                Supprimer
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Activer
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(user)}
                            className="text-[#EF4444] focus:text-[#EF4444]"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <UserDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        userId={editingUserId}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => userToDelete && deleteMutation.mutate(userToDelete.id)}
        title="Supprimer l'utilisateur"
        description={`Êtes-vous sûr de vouloir supprimer ${userToDelete?.email} ? Cette action est irréversible et supprimera définitivement l'utilisateur de la base de données.`}
      />
    </div>
  );
}
