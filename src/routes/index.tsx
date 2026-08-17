import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  loader: () => {
    throw redirect({ to: "/studio" });
  },
  head: () => ({
    meta: [
      { title: "Scripta — AI Book Authoring Platform" },
      {
        name: "description",
        content:
          "Scripta architects full-length books: configure title, synopsis, genre and scale, then generate, read and export a complete manuscript.",
      },
      { property: "og:title", content: "Scripta — AI Book Authoring Platform" },
      {
        property: "og:description",
        content: "Editorial-grade long-form manuscript generation with a custom skill engine.",
      },
    ],
  }),
});
