import "./globals.css";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata = {
  title: "CargoPool — Pooled shipping & customs manifests",
  description: "Cross-border cargo pooling and automated customs documentation",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-paper text-ink font-body min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
