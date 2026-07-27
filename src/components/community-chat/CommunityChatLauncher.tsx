"use client";
import dynamic from "next/dynamic";
import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
const CommunityChatPanel = dynamic(() => import("./CommunityChatPanel"), { ssr: false });
export default function CommunityChatLauncher() {
  const [open, setOpen] = useState(false); const pathname = usePathname();
  if (pathname.startsWith("/app/admin")) return null;
  return <div className="fixed bottom-5 right-5 z-50"><button type="button" aria-label="Open community chat" aria-expanded={open} onClick={() => setOpen(true)} className="rounded-full bg-blue-600 p-4 text-white shadow-lg hover:bg-blue-700"><MessageCircle className="h-5 w-5" /></button>{open ? <CommunityChatPanel onClose={() => setOpen(false)} /> : null}</div>;
}