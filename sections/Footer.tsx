import Logo from "@/assets/logo_ico.png";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default function Footer() {
  return (
    <section className="w-full bg-gradient-to-b pb-15 from-[#FFFFFF] to-[#5b8363] justify-center flex flex-col text-center items-center">
      <div className="w-full flex flex-col items-center gap-2 justify-center py-5">
        <Image
          src={Logo}
          className="h-20 w-20"
          height={2160}
          width={2160}
          alt="Logo"
        />
        <h1 className="text-5xl font-bold bg-gradient-to-b from-black to-[#254f13] text-transparent bg-clip-text">
          VAM Enterprises
        </h1>
        
      </div>
      <div className="flex flex-col gap-5 justify-center py-5 w-full">
        <section className="flex items-center justify-center mx-auto flex-col space-y-2">
          <nav className="flex gap-6 bg-gradient-to-b from-black to-[#254f13] text-transparent bg-clip-text items-center">
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
          <p className="bg-gradient-to-b from-black to-[#254f13] text-transparent bg-clip-text">
            --------------------------------------------
          </p>
          <div className="pb-5">
            <h1 className="font-bold bg-gradient-to-b from-black to-[#254f13] text-transparent bg-clip-text">
              © 2026 VAM Enterprises. All rights reserved.
            </h1>
          </div>
        </section>
      </div>
    </section>
  );
}
