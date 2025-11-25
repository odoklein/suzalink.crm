"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, MoreVertical, Edit, Trash2, UserX, UserCheck } from "lucide-react";
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
};

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

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
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
      toast({
        title: "Succès",
        description: "Utilisateur désactivé avec succès",
      });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de désactiver l'utilisateur",
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

  const handleDelete = (user: User) => {
    setUserToDelete({ id: user.id, email: user.email });
    setDeleteDialogOpen(true);
  };

  const handleNewUser = () => {
    setEditingUserId(undefined);
    setUserDialogOpen(true);
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
        return "bg-[#EF4444]/10 text-[#EF4444]";
      case "MANAGER":
        return "bg-[#4C85FF]/10 text-[#4C85FF]";
      case "BD":
        return "bg-[#3BBF7A]/10 text-[#3BBF7A]";
      case "DEVELOPER":
        return "bg-[#8B5CF6]/10 text-[#8B5CF6]";
      default:
        return "bg-[#6B7280]/10 text-[#6B7280]";
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

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.isActive) ||
      (statusFilter === "inactive" && !user.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-[1440px] mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#3BBF7A]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1440px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1B1F24] tracking-[-0.5px]">
            Gestion des utilisateurs
          </h1>
          <p className="text-body text-[#6B7280] mt-2">
            Gérez les utilisateurs, leurs rôles et leurs autorisations
          </p>
        </div>
        <Button onClick={handleNewUser} className="rounded-[12px]">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un utilisateur
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-[#E6E8EB] mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1B1F24]">Rechercher</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                <Input
                  placeholder="Rechercher par email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-[12px]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1B1F24]">Rôle</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="rounded-[12px]">
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1B1F24]">Statut</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="rounded-[12px]">
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
      <Card className="border-[#E6E8EB]">
        <CardHeader>
          <CardTitle className="text-h2 font-semibold text-[#1B1F24]">
            Utilisateurs ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-body text-[#6B7280]">Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière activité</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="flex items-center gap-3 hover:text-[#3BBF7A] transition-colors"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar || undefined} />
                          <AvatarFallback className="bg-[#3BBF7A]/10 text-[#3BBF7A] font-semibold">
                            {getInitials(user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-[#1B1F24]">{user.email}</p>
                          {user._count && (
                            <p className="text-xs text-[#6B7280]">
                              {user._count.assignedLeads || 0} leads, {user._count.activities || 0}{" "}
                              activités
                            </p>
                          )}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.isActive ? "default" : "secondary"}
                        className={user.isActive ? "bg-[#3BBF7A] text-white" : ""}
                      >
                        {user.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.lastLoginAt ? (
                        <span className="text-sm text-[#6B7280]">
                          {formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true })}
                        </span>
                      ) : (
                        <span className="text-sm text-[#9CA3AF]">Jamais connecté</span>
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
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
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
                                Désactiver
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
                            className="text-[#EF4444]"
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
        title="Désactiver l'utilisateur"
        description={`Êtes-vous sûr de vouloir désactiver ${userToDelete?.email} ? L'utilisateur perdra l'accès au système, mais ses données historiques seront conservées.`}
      />
    </div>
  );
}

