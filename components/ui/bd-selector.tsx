"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type User = {
  id: string;
  email: string;
  avatar?: string | null;
  role: string;
};

interface BDSelectorProps {
  value: string[];
  onChange: (userIds: string[]) => void;
  placeholder?: string;
  role?: "BD" | "MANAGER" | "ADMIN";
  className?: string;
}

export function BDSelector({
  value,
  onChange,
  placeholder = "Sélectionner des BD...",
  role,
  className,
}: BDSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: usersData, isLoading } = useQuery<{ users: User[] } | User[]>({
    queryKey: ["users", role],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (role) params.set("role", role);
      const res = await fetch(`/api/users?${params}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  // Handle both response formats: { users: [] } or []
  const users = Array.isArray(usersData) ? usersData : (usersData?.users || []);

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  const selectedUsers = users.filter((user) => value.includes(user.id));

  const toggleUser = (userId: string) => {
    if (value.includes(userId)) {
      onChange(value.filter((id) => id !== userId));
    } else {
      onChange([...value, userId]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn("w-full justify-between", className)}
        >
          <span className="truncate">
            {selectedUsers.length === 0
              ? placeholder
              : selectedUsers.length === 1
              ? selectedUsers[0].email
              : `${selectedUsers.length} sélectionné${selectedUsers.length > 1 ? "s" : ""}`}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <div className="p-2">
          <Input
            placeholder="Rechercher des utilisateurs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Chargement...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Aucun utilisateur trouvé
            </div>
          ) : (
            <div className="p-1">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-accent cursor-pointer"
                  onClick={() => toggleUser(user.id)}
                >
                  <Checkbox
                    checked={value.includes(user.id)}
                    onCheckedChange={() => toggleUser(user.id)}
                  />
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.email}
                      className="h-6 w-6 rounded-full"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-500">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                  <span className="flex-1 text-sm">{user.email}</span>
                  {value.includes(user.id) && (
                    <Check className="h-4 w-4 text-primary-500" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

