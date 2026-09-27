import { IBM_Plex_Mono, IBM_Plex_Sans, Special_Elite } from "next/font/google";

// Brand type (theme.css maps these variables): IBM Plex Sans for interface
// text, IBM Plex Mono for amounts/references/dates, Special Elite for the
// wordmark only.
const plexSans = IBM_Plex_Sans({ variable: "--font-plex-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500", "600"] });
const specialElite = Special_Elite({ variable: "--font-special-elite", subsets: ["latin"], weight: "400" });

/** Put on <body> in every app's root layout. */
export const fontVariables = `${plexSans.variable} ${plexMono.variable} ${specialElite.variable}`;
