import "./globals.css";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "CargoPool — Pooled shipping & customs manifests",
  description: "Cross-border cargo pooling and automated customs documentation",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper font-body text-ink">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
