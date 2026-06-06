import { permanentRedirect } from "next/navigation";

export default function GamesIndexPage() {
  permanentRedirect("/offers#games");
}
