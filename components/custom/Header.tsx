'use client';
import ArrowRight from "@/assets/arrow-right.svg";
import Logo from "@/assets/logo_ico.png";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Link001 } from "@/components/ui/skiper-ui/skiper40";
import Sidebar from "@/components/custom/sidebar";
import { UserButton, useUser } from "@clerk/nextjs";


export default function Header() {
  const { user, isLoaded } = useUser();
  const isUserAdmin = isLoaded && user?.publicMetadata?.role === "admin";

  return (
    <header className="sticky top-0 z-9999 border-b border-border backdrop-blur-sm">
      <main className="flex justify-center items-center py-3 bg-black text-white text-sm gap-3">
        <p className="text-white/60 hidden md:block gap-3 text-sm">!! The One-Stop Gifting Solution !! Get Excl. Deals with Bulk Offers Now</p>
        <div className="inline-flex gap-2 items-center text-lg md:text-sm">
          <Link001 href="/get-your-quote">Get the Quote Now</Link001>
          <ArrowRight className="h-4 w-4 inline-flex justify-center items-center" />
        </div>
      </main>
      <section className="py-4 px-4 flex justify-center sm:py-5 sm:px-6 lg:px-10">
        <div className="container">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Image
                src={Logo}
                alt="VAM Enterprises Logo"
                width={1024}
                height={1024}
                className="h-15 w-auto z-8909"
              />
            </Link>
            <Sidebar />
            
            <nav className="hidden md:flex gap-4 hidden md:flex gap-6 text-black/80 items-center">
              <Link001 href="/our-catalogue">
                Our Catalogue
              </Link001>
                <Link001 href="/get-your-quote">Get Your Quote</Link001>

              {isUserAdmin && (
                <Button asChild className="px-4 py-4 rounded-lg font-medium inline-flex tracking-tight bg-[#112a06]">
                  <Link href="/admin">Admin</Link>
                </Button>
              )}
              {isLoaded && user ? <UserButton /> : isLoaded ? <div className="flex items-center gap-2">
                <Button variant="outline" className="rounded-lg border-[#112a06] px-4 py-4 font-medium text-[#112a06]">
                  <Link href="/auth/sign-in">
                    Sign in
                  </Link>
                </Button>
                <Button className="rounded-lg bg-[#112a06] px-4 py-4 font-medium text-white hover:bg-[#244d32]">
                  <Link href="/auth/sign-up">
                    Sign up
                  </Link>
                </Button>
              </div> : null}
            </nav>
          </div>
        </div>
      </section>
    </header>
  );
}
