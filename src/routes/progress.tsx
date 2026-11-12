import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/voxora/ui";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Your Progress – Voxora" },
      { name: "description", content: "Your Progress on Voxora, the AI debate arena." },
      { property: "og:title", content: "Your Progress – Voxora" },
      { property: "og:description", content: "Your Progress on Voxora, the AI debate arena." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return <PageHeader eyebrow="Your Progress" title="Your Progress" description="This page is still being built." />;
}
