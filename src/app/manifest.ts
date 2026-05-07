import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Upper Left Indie",
    short_name: "UL Indie",
    description:
      "A Northwest music curation project supporting local underserved and under-heard independent artists.",
    start_url: "/",
    display: "standalone",
    background_color: "#fffdf6",
    theme_color: "#101014",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
