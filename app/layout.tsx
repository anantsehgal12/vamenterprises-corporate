import type { Metadata } from "next";
import { DynaPuff } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs"
import "./globals.css";
import { cn } from "@/lib/utils";
import { SpringCursorFollow } from "@/components/custom/spring-cursor-follow";

const dynaPuff = DynaPuff({
  subsets: ["latin"],
  variable: "--font-dyna-puff",
});

export const metadata: Metadata = {
  title: "VAM Enterprises ",
  description:
    "VAM Enterprises is a leading provider of high-quality products and services, dedicated to delivering excellence and innovation to our customers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased overflow-x-hidden",
        dynaPuff.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <SpringCursorFollow />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
