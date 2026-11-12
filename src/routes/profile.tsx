import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/voxora/ui";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile – Voxora" },
      { name: "description", content: "Profile on Voxora, the AI debate arena." },
      { property: "og:title", content: "Profile – Voxora" },
      { property: "og:description", content: "Profile on Voxora, the AI debate arena." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return <PageHeader eyebrow="Profile" title="Profile" description="This page is still being built." />;
}
