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
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";

const NAV_LINKS = [
  { href: "/our-catalogue", label: "Our Catalogue" },
];

export default function Sidebar() {
  const { user, isLoaded } = useUser();
  const isUserAdmin = isLoaded && user?.publicMetadata?.role === "admin";

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
                <Link href="/get-your-quote">Get Your Quote</Link>
              </Button>
            </SheetClose>
            {isUserAdmin && <SheetClose asChild><Link href="/admin" className="text-lg">Admin</Link></SheetClose>}
            {isLoaded && user ? <UserButton /> : isLoaded ? <div className="flex flex-col items-center gap-3">
              <SignInButton mode="modal"><Button variant="outline" className="min-w-32 border-[#112a06] text-[#112a06]">Sign in</Button></SignInButton>
              <SignUpButton mode="modal"><Button className="min-w-32 bg-[#112a06] text-white hover:bg-[#244d32]">Sign up</Button></SignUpButton>
            </div> : null}
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
