import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/voxora/ui";

export const Route = createFileRoute("/debate/$id")({
  head: () => ({
    meta: [
      { title: "Debate – Voxora" },
      { name: "description", content: "Debate on Voxora, the AI debate arena." },
      { property: "og:title", content: "Debate – Voxora" },
      { property: "og:description", content: "Debate on Voxora, the AI debate arena." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return <PageHeader eyebrow="Debate" title="Debate" description="This page is still being built." />;
}
