"use client";

import Logo from "@/assets/logo_ico.png";
import MenuIcon from "@/assets/menu.svg";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link001 } from "@/components/ui/skiper-ui/skiper40";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import Image from "next/image";
import Link from "next/link";

const NAV_LINKS = [
  { href: "#", label: "Home" },
  { href: "#", label: "About" },
  { href: "#", label: "Contact" },
];

export default function Sidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="md:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full z-[99999] sm:max-w-sm border-none bg-gradient-to-b from-[#FFFFFF] to-[#5b8363] p-0"
      >
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
          <Image
            src={Logo}
            className="h-20 w-20"
            height={2160}
            width={2160}
            alt="Logo"
          />
          <h1 className="text-4xl font-bold bg-gradient-to-b from-black to-[#254f13] text-transparent bg-clip-text">
            VAM Enterprises
          </h1>

          <nav className="mt-8 flex flex-col items-center gap-6 bg-gradient-to-b from-black to-[#254f13] text-transparent bg-clip-text">
            {NAV_LINKS.map(({ href, label }) => (
              <SheetClose asChild key={label}>
                <Link001 href={href} className="text-lg">
                  {label}
                </Link001>
              </SheetClose>
            ))}
            <SheetClose asChild>
              <Button className="px-4 py-4 rounded-lg font-medium inline-flex tracking-tight bg-[#112a06]">
                <Link href="#">Get for free</Link>
              </Button>
            </SheetClose>
          </nav>

          <Separator className="mt-10 w-2/3 bg-black/20" />

          <p className="mt-5 text-xs font-bold bg-gradient-to-b from-black to-[#254f13] text-transparent bg-clip-text">
            © 2026 VAM Enterprises. All rights reserved.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}