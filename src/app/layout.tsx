import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tally Sync API",
  description: "Tally integration sync endpoints",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
