import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/voxora/ui";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Debate History – Voxora" },
      { name: "description", content: "Debate History on Voxora, the AI debate arena." },
      { property: "og:title", content: "Debate History – Voxora" },
      { property: "og:description", content: "Debate History on Voxora, the AI debate arena." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return <PageHeader eyebrow="Debate History" title="Debate History" description="This page is still being built." />;
}
