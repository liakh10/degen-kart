import type { Metadata } from "next";
import "./globals.css";
import { SolanaProviders } from "./providers";

export const metadata: Metadata = {
  title: "Degen Kart — $KART",
  description: "Meme kart racing on Solana. Pick your degen, drift, blast rivals and farm $KART.",
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
