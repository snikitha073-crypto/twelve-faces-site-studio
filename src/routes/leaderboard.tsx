import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/voxora/ui";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard – Voxora" },
      { name: "description", content: "Leaderboard on Voxora, the AI debate arena." },
      { property: "og:title", content: "Leaderboard – Voxora" },
      { property: "og:description", content: "Leaderboard on Voxora, the AI debate arena." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return <PageHeader eyebrow="Leaderboard" title="Leaderboard" description="This page is still being built." />;
}
