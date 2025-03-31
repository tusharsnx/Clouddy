import type { Metadata } from "next";
import "./globals.css";
import { Roboto } from "next/font/google";
import { ClientOnly } from "#/components/client-only";
import Providers from "#/components/providers";

const font = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clouddy",
  description: "AI powered next generation cloud storage",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${font.className} antialiased dark`}
        // <body> seems to be used as a state manager by some
        // extensions. This causes a lot of hydration warnings.
        // Suppress hydration warning on <body>.
        suppressHydrationWarning
      >
        <ClientOnly>
          <Providers>{children}</Providers>
        </ClientOnly>
      </body>
    </html>
  );
}
