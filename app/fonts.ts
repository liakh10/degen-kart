import { Titan_One, Rubik } from "next/font/google";

// Degen Kart identity — chunky cartoon racing, distinct from prior games.
export const display = Titan_One({ subsets: ["latin"], weight: "400", variable: "--font-display" });
export const ui = Rubik({ subsets: ["latin"], weight: ["400", "500", "700", "900"], variable: "--font-ui" });
