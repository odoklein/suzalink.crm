"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Building2, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccountDialog } from "@/components/accounts/account-dialog";
import { DeleteDialog } from "@/components/ui/delete-dialog";

type Account = {
  id: string;
  companyName: string;
  logoUrl: string | null;
  contractStatus: string;
  guestToken: string;
  createdAt: string;
  _count: {
    campaigns: number;
    interlocuteurs: number;
  };
};

export default function AccountsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<{ id: string; name: string } | null>(null);

  const { data: accounts = [], isLoading } = useQuery<Account[]>({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await fetch("/api/accounts");
      if (!res.ok) throw new Error("Échec du chargement des comptes");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Échec de la suppression du compte");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast({
        title: "Succès",
        description: "Compte supprimé avec succès",
      });
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Échec de la suppression du compte",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (accountId: string) => {
    setEditingAccountId(accountId);
    setAccountDialogOpen(true);
  };

  const handleDelete = (account: Account) => {
    setAccountToDelete({ id: account.id, name: account.companyName });
    setDeleteDialogOpen(true);
  };

  const handleNewAccount = () => {
    setEditingAccountId(undefined);
    setAccountDialogOpen(true);
  };

  const filteredAccounts = accounts.filter((account) =>
    account.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-success-100 text-success-text";
      case "Inactive":
        return "bg-destructive-100 text-destructive-text";
      case "Pending":
        return "bg-warning-100 text-warning-500";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="p-6 max-w-[1440px] mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-semibold text-text-main tracking-[-0.5px]">Comptes</h1>
          <p className="text-body text-text-body mt-2">
            Gérer les comptes clients
          </p>
        </div>
        <Button onClick={handleNewAccount}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Compte
        </Button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-body" />
          <Input
            placeholder="Rechercher des comptes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-text-body">Chargement...</div>
      ) : filteredAccounts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-text-body mb-4 opacity-50" />
            <p className="text-body text-text-body">
              {searchQuery ? "Aucun compte trouvé" : "Aucun compte pour le moment"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAccounts.map((account) => (
            <Card 
              key={account.id} 
              className="hover:scale-[1.01] transition-all duration-150 cursor-pointer"
              onClick={() => router.push(`/accounts/${account.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {account.logoUrl ? (
                      <img
                        src={account.logoUrl}
                        alt={account.companyName}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E6F7F1]">
                        <Building2 className="h-5 w-5 text-primary-500" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-h2 font-semibold text-text-main">{account.companyName}</CardTitle>
                      <span
                        className={`mt-1 inline-block rounded-[50px] px-2 py-1 text-xs font-medium ${getStatusColor(
                          account.contractStatus
                        )}`}
                      >
                        {account.contractStatus}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <span className="sr-only">More</span>
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          />
                        </svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem asChild>
                        <Link href={`/accounts/${account.id}`}>Voir les détails</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(account.id);
                        }}
                      >
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(account);
                        }}
                        className="text-destructive"
                      >
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-body">Campagnes</span>
                    <span className="font-medium text-text-main">{account._count.campaigns}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-body">Contacts</span>
                    <span className="font-medium text-text-main">{account._count.interlocuteurs}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AccountDialog
        open={accountDialogOpen}
        onOpenChange={(open) => {
          setAccountDialogOpen(open);
          if (!open) {
            setEditingAccountId(undefined);
          }
        }}
        accountId={editingAccountId}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => accountToDelete && deleteMutation.mutate(accountToDelete.id)}
        title="Supprimer le compte"
        description="Êtes-vous sûr de vouloir supprimer"
        itemName={accountToDelete?.name}
      />
    </div>
  );
}

