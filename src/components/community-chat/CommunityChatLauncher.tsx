"use client";
import dynamic from "next/dynamic";
import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
const CommunityChatPanel = dynamic(() => import("./CommunityChatPanel"), { ssr: false });
export default function CommunityChatLauncher() {
  const [open, setOpen] = useState(false); const pathname = usePathname();
  if (pathname.startsWith("/app/admin")) return null;
  return <div className="fixed bottom-5 right-5 z-50"><button type="button" aria-label="Open community chat" aria-expanded={open} onClick={() => setOpen(true)} className="group inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-[#0c1427] px-3 py-3 text-cyan-300 shadow-[0_14px_40px_rgba(2,6,23,.5)] transition hover:-translate-y-0.5 hover:border-cyan-300/70 hover:bg-[#121d35] hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"><MessageCircle className="h-5 w-5" /><span className="hidden text-xs font-bold sm:inline">Chat</span></button>{open ? <CommunityChatPanel onClose={() => setOpen(false)} /> : null}</div>;
}