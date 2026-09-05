import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Giftbox from "@/assets/box2_(1).png";
import Star1 from "@/assets/star1_(1).png";
import Star2 from "@/assets/star2_(1).png";
import { Link001 } from "@/components/ui/skiper-ui/skiper40";

export default function Hero() {
  return (
    <section className="pt-8 w-screen pb-20 md:pt-5 md:pb-10 bg-[radial-gradient(ellipse_200%_100%_at_bottom_left,#309107_10%,#EAEEFE_90%)] overflow-x-clip">
      <div className="px-5 max-w-[1600px] mx-auto">
        <div className="md:flex items-center justify-between gap-8">
          {/* Text column */}
          <div className="md:w-[478px] xl:w-[560px] shrink-0">
            <div className="text-sm md:text-md lg:text-lg xl:text-xl inline-flex border border-2 border-[#222]/60 px-3 py-1 rounded-lg tracking-tight">
              Get Bulk Offers Here
            </div>
            <h1 className="text-5xl md:text-6xl xl:text-7xl font-bold tracking-tight bg-gradient-to-b from-black to-[#254f13] text-transparent bg-clip-text mt-6">
              The One-Stop Gifting Solution
            </h1>
            <p className="text-xl text-[#013e0f] tracking-tight mt-6">
              Get Exclusive Deals with Bulk Offers Now! Explore our wide range
              of products and enjoy unbeatable prices. Don't miss out on this
              opportunity to save big on your gifting needs.
            </p>
            <div className="flex gap-2 items-center mt-[30px]">
              <Button className="py-5 bg-[#112a06]">
                <Link001 href="#">
                  Get the Quote Now
                </Link001>
              </Button>
              <Button className="py-5" variant="ghost">
                <Link001 href="#">
                  View Products
                </Link001>
              </Button>
            </div>
          </div>

          {/* Image column */}
          <div className="mt-20 md:mt-0 w-full md:flex-1 relative aspect-square max-w-[560px] md:max-w-none">
            <Image
              src={Giftbox}
              alt="Gift Box"
              width={2160}
              height={2160}
              className="object-contain items-center flex"
              priority
            />
            <Image
              src={Star1}
              alt="Star"
              width={2160}
              height={2160}
              className="hidden md:block absolute bottom-[-8%] right-[-8%] xl:w-[150px] xl:h-[150px] md:h-20 md:w-20 lg:h-30 lg:w-30"
            />
            <Image
              src={Star2}
              alt="Star"
              width={2160}
              height={2160}
              className="hidden md:block absolute top-[-2%] left-[-8%] xl:w-[150px] xl:h-[150px] md:h-20 md:w-20 lg:h-30 lg:w-30"
            />
          </div>
        </div>
      </div>
    </section>
  );
}