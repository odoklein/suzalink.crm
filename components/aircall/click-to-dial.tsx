"use client";

import { useEffect } from "react";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

type ClickToDialProps = {
  phoneNumber: string;
  apiId?: string;
  apiToken?: string;
  className?: string;
};

export function ClickToDial({ phoneNumber, apiId, apiToken, className }: ClickToDialProps) {
  useEffect(() => {
    // Load Aircall widget script if API credentials are provided
    if (apiId && apiToken && typeof window !== "undefined") {
      const script = document.createElement("script");
      script.innerHTML = `
        (function(e,t,n,a,o){e[a]=e[a]||function(){(e[a].q=e[a].q||[]).push(arguments)};
        o=t.createElement(n),o.async=1,o.src="https://cdn.aircall.io/callbar.js";
        t.head.appendChild(o)})(window,document,"script","Aircall");
        Aircall("init", {
          apiId: "${apiId}",
          apiToken: "${apiToken}",
          locale: "en"
        });
      `;
      document.head.appendChild(script);

      return () => {
        // Cleanup
        const aircallScript = document.querySelector('script[src*="aircall.io"]');
        if (aircallScript) {
          aircallScript.remove();
        }
      };
    }
  }, [apiId, apiToken]);

  const handleClick = () => {
    if (typeof window !== "undefined" && (window as any).Aircall) {
      const formattedPhone = phoneNumber.replace(/\D/g, "");
      (window as any).Aircall("dial", formattedPhone);
    } else {
      // Fallback: open tel: link
      window.location.href = `tel:${phoneNumber}`;
    }
  };

  return (
    <Button onClick={handleClick} variant="outline" className={className}>
      <Phone className="mr-2 h-4 w-4" />
      Call
    </Button>
  );
}

