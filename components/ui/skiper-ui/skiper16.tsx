"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import ReactLenis from "lenis/react";
import Link from "next/link";
import React, { useRef } from "react";

const projects = [
  {
    title: "Opalware Collection",
    src: "/cards/opalware.png",
    href: "",
  },
  {
    title: "Glassware Collection",
    src: "/cards/glassware.png",
    href: "",
  },
  {
    title: "Thermoware Collection",
    src: "/cards/thermo.png",
    href: "",
  },
  {
    title: "Luggage Collection",
    src: "/cards/luggage.png",
    href: "",
  },
  {
    title: "Appliances Collection",
    src: "/cards/appliances.png",
    href: "",
  },
  {
    title: "Professional Gifting",
    src: "/cards/profgift.png",
    href: "",
  },
  {
    title: "Customised Gifitng",
    src: "/cards/customgift.png",
    href: "",
  },
  {
    title: "Wooden Utility Collection",
    src: "/cards/wooden.png",
    href: "",
  },
  {
    title: "DryFruit Collection",
    src: "/cards/dry.png",
    href: "",
  },
  {
    title: "Leather Collection",
    src: "/cards/leather.png",
    href: "",
  },
  {
    title: "Lamps & Lighting Collection",
    src: "/cards/lamp.png",
    href: "",
  },
];

const StickyCard_001 = ({
  i,
  title,
  src,
  href,
  progress,
  range,
  targetScale,
}: {
  i: number;
  title: string;
  src: string;
  href: string;
  progress: any;
  range: [number, number];
  targetScale: number;
}) => {
  const container = useRef<HTMLDivElement>(null);

  const scale = useTransform(progress, range, [1, targetScale]);
  const rotate = useTransform(progress, range, [0, i % 2 === 0 ? -4 : 4]);

  return (
    <div
      ref={container}
      className="sticky top-0 flex items-center justify-center"
    >
      <Link href={href}>
        <motion.div
          style={{
            scale,
            rotate,
            top: `calc(-5vh + ${Math.min(i, 3) * 20 + 250}px)`,
          }}
          className="rounded-4xl relative -top-1/4 flex origin-top flex-col overflow-hidden h-[200px] w-[320px] lg:h-[500px] lg:w-[800px] xl:w-[960px] xl:h-[600px] md:h-[400px] md:w-[640px] shadow-2xl shadow-black/20"
        >
          <img src={src} alt={title} className="h-full w-full object-cover" />
        </motion.div>
      </Link>
    </div>
  );
};

const Skiper16 = () => {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  return (
    <ReactLenis root>
      <main
        ref={container}
        className="relative flex w-full flex-col items-center justify-center pb-[30vh] -top-25"
      >
        {projects.map((project, i) => {
          const targetScale = Math.max(
            0.5,
            1 - (projects.length - i - 1) * 0.1,
          );
          const start = i / projects.length;
          return (
            <StickyCard_001
              key={`p_${i}`}
              i={i}
              {...project}
              progress={scrollYProgress}
              range={[start, 1]}
              targetScale={targetScale}
            />
          );
        })}
      </main>
    </ReactLenis>
  );
};

export { Skiper16, StickyCard_001 };

/**
 * Skiper 16 StickyCard_001 — React + Framer Motion
 * We respect the original creators. This is an inspired rebuild with our own taste and does not claim any ownership.
 *
 * License & Usage:
 * - Free to use and modify in both personal and commercial projects.
 * - Attribution to Skiper UI is required when using the free version.
 * - No attribution required with Skiper UI Pro.
 *
 * Feedback and contributions are welcome.
 *
 * Author: @gurvinder-singh02
 * Website: https://gxuri.me
 * Twitter: https://x.com/Gur__vi
 */
