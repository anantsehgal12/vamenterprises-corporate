import ArrowRight from "@/assets/arrow-right.svg";
import Logo from "@/assets/logo_ico.png";
import Image from "next/image";
import MenuIcon from "@/assets/menu.svg";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 backdrop-blur-sm z-9999">
      <main className="flex justify-center items-center py-3 bg-black text-white text-sm gap-3">
        <p className="text-white/60 hidden md:block gap-3 text-sm">!! The One-Stop Gifting Solution !! Get Excl. Deals with Bulk Offers Now</p>
        <div className="inline-flex gap-2 items-center text-lg md:text-sm">
          <h1>Get the Quote Now</h1>
          <ArrowRight className="h-4 w-4 inline-flex justify-center items-center" />
        </div>
      </main>
      <section className="py-5 px-10 flex justify-center">
        <div className="container">
          <div className="flex items-center justify-between">
            <Image
              src={Logo}
              alt="VAM Enterprises Logo"
              width={1024}
              height={1024}
              className="h-15 w-auto"
            />
            <MenuIcon className="h-5 w-5 md:hidden" />
            <nav className="hidden md:flex gap-4 hidden md:flex gap-6 text-black/80 items-center">
              <Link href="#" className="hover:underline">
                Home
              </Link>
              <Link href="#" className="hover:underline">
                About
              </Link>
              <Link href="#" className="hover:underline">
                Contact
              </Link>
              <Button className="px-4 py-2 rounded-lg font-medium inline-flex tracking-tight">
                Get for free
              </Button>
            </nav>
          </div>
        </div>
      </section>
    </header>
  );
}
