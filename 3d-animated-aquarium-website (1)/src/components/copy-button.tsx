"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyButton({ text, label, className = "" }: { text: string; label: string; className?: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "manual">("idle");
  async function copy() {
    let success = false;
    try { await navigator.clipboard.writeText(text); success = true; } catch {
      const input = document.createElement("textarea");
      input.value = text; input.style.position = "fixed"; input.style.opacity = "0";
      document.body.appendChild(input); input.select();
      try { success = document.execCommand("copy"); } catch { success = false; }
      input.remove();
    }
    setStatus(success ? "copied" : "manual");
  }
  return <div className={`copy-control ${className}`}><button type="button" className="button button-outline" onClick={copy}>{status === "copied" ? <Check size={15} /> : <Copy size={15} />}{status === "copied" ? "Copied" : label}</button>{status === "manual" && <span role="status">Copy is blocked here. Select the text shown below and copy it manually.</span>}</div>;
}
