"use client";
import dynamic from "next/dynamic";
import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
const CommunityChatPanel = dynamic(() => import("./CommunityChatPanel"), { ssr: false });
export default function CommunityChatLauncher() {
  const [open, setOpen] = useState(false); const pathname = usePathname();
  useEffect(() => { document.body.classList.toggle("community-chat-open", open); return () => document.body.classList.remove("community-chat-open"); }, [open]);
  if (pathname.startsWith("/app/admin")) return null;
  return <div className="fixed bottom-5 right-5 z-50"><button type="button" aria-label="Open community chat" aria-expanded={open} onClick={() => setOpen(true)} className="group inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-3 text-blue-700 shadow-[0_14px_40px_rgba(15,23,42,.14)] transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"><MessageCircle className="h-5 w-5" /><span className="hidden text-xs font-bold sm:inline">Chat</span></button>{open ? <CommunityChatPanel onClose={() => setOpen(false)} /> : null}</div>;
}