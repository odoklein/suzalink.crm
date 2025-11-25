"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock } from "lucide-react";
import { useSession } from "next-auth/react";

interface LeadLockIndicatorProps {
  leadId: string;
  lockedByUserId?: string | null;
  lockedByEmail?: string;
}

export function LeadLockIndicator({
  leadId,
  lockedByUserId,
  lockedByEmail,
}: LeadLockIndicatorProps) {
  const { data: session } = useSession();
  const [isLockedByOther, setIsLockedByOther] = useState(false);
  const [lockerEmail, setLockerEmail] = useState<string | null>(null);

  useEffect(() => {
    if (lockedByUserId && lockedByUserId !== session?.user?.id) {
      setIsLockedByOther(true);
      setLockerEmail(lockedByEmail || null);
    } else {
      setIsLockedByOther(false);
      setLockerEmail(null);
    }

    // TODO: Subscribe to Socket.io events for real-time lock updates
    // socket.on(`lead:${leadId}:locked`, (data) => {
    //   if (data.userId !== session?.user?.id) {
    //     setIsLockedByOther(true);
    //     setLockerEmail(data.email);
    //   }
    // });
    //
    // socket.on(`lead:${leadId}:unlocked`, () => {
    //   setIsLockedByOther(false);
    //   setLockerEmail(null);
    // });

    return () => {
      // Cleanup socket listeners
    };
  }, [leadId, lockedByUserId, lockedByEmail, session?.user?.id]);

  if (!isLockedByOther) return null;

  return (
    <Badge variant="outline" className="border-[#F59E0B] text-[#F59E0B] bg-[#FEF3C7]/50">
      <Lock className="h-3 w-3 mr-1" />
      Verrouillé par {lockerEmail?.split("@")[0] || "un autre utilisateur"}
    </Badge>
  );
}



