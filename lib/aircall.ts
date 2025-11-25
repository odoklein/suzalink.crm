// Aircall integration utilities

export function getAircallWidgetScript(apiId: string, apiToken: string) {
  return `
    (function(e,t,n,a,o){e[a]=e[a]||function(){(e[a].q=e[a].q||[]).push(arguments)};
    o=t.createElement(n),o.async=1,o.src="https://cdn.aircall.io/callbar.js";
    t.head.appendChild(o)})(window,document,"script","Aircall");
    Aircall("init", {
      apiId: "${apiId}",
      apiToken: "${apiToken}",
      locale: "en"
    });
  `;
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");
  
  // Format for Aircall (E.164 format)
  if (cleaned.startsWith("+")) {
    return cleaned;
  }
  
  // Assume French number if starts with 0, convert to +33
  if (cleaned.startsWith("0")) {
    return `+33${cleaned.substring(1)}`;
  }
  
  // Default: add + prefix
  return `+${cleaned}`;
}

