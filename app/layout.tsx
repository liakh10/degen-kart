import type { Metadata } from "next";
import "./globals.css";
import { SolanaProviders } from "./providers";

export const metadata: Metadata = {
  title: "Meme Lords Drift League",
  description: "Meme Lords Drift League: pixel kart racing on Solana. Pick your meme lord, drift, blast rivals and farm $MLDL.",
  openGraph: {
    title: "Meme Lords Drift League — $MLDL",
    description: "Pixel meme kart racing on Solana. Drift, blast rivals, farm $MLDL.",
    images: ["/og.png"], type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Meme Lords Drift League — $MLDL",
    description: "Pixel meme kart racing on Solana. Drift, blast rivals, farm $MLDL.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SolanaProviders>{children}</SolanaProviders>
      </body>
    </html>
  );
}
