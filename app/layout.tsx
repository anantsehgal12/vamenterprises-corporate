import type { Metadata } from "next";
import { DynaPuff } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";


const dynaPuff = DynaPuff({
  subsets: ["latin"],
  variable: "--font-dyna-puff",
});

export const metadata: Metadata = {
  title: "VAM Enterprises ",
  description: "VAM Enterprises is a leading provider of high-quality products and services, dedicated to delivering excellence and innovation to our customers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased overflow-x-hidden", dynaPuff.variable)}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
