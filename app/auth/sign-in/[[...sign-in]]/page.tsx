"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import SignIn from "@/components/custom/auth/good";

function SignInContent() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || undefined;

  return (
    <main className="bg-[radial-gradient(ellipse_200%_100%_at_bottom_left,#309107_10%,#EAEEFE_90%)]">
      <div className="relative flex min-h-screen overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 " />

        {/* Left Side */}
        <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-b from-black to-[#254f13] bg-clip-text text-transparent p-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-xl"
          >
            <span className="inline-flex rounded-full border border-gray-800 bg-white/5 px-4 py-2 text-sm ">
              Welcome Back
            </span>

            <h1 className="mt-6 text-5xl font-bold tracking-tight ">
              Sign In to VAM Enterprises
            </h1>

            <p className="mt-6 text-lg leading-relaxed ">
              Discover premium handcrafted home décor, gifts, and lifestyle
              products designed to elevate every space with timeless
              craftsmanship, elegant designs, and exceptional quality. Find
              unique pieces that bring warmth, style, and character to your
              home.
            </p>
          </motion.div>
        </div>

        {/* Right Side */}
        <div className="relative z-10 flex flex-1 items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* CHANGED: pass redirectUrl through — see note at bottom of file */}
            <SignIn redirectUrl={redirectUrl} />
          </motion.div>
        </div>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SignInContent />
    </Suspense>
  );
}