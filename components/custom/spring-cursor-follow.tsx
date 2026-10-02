"use client";

import { motion, useSpring } from "framer-motion";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const SPRING = {
  mass: 0.1,
  damping: 10,
  stiffness: 131,
};

export function SpringCursorFollow() {
  const pathname = usePathname();
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const xSpring = useSpring(0, SPRING);
  const ySpring = useSpring(0, SPRING);
  const opacitySpring = useSpring(0, SPRING);
  const scaleSpring = useSpring(0, SPRING);

  // Avoid rendering (and attaching listeners) on touch-only devices
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => {
    if (isTouch || isAdminPage) return;

    const handleMove = (e: PointerEvent) => {
      xSpring.set(e.clientX);
      ySpring.set(e.clientY);
    };

    const handleEnter = () => {
      opacitySpring.set(1);
      scaleSpring.set(1);
    };

    const handleLeave = () => {
      opacitySpring.set(0);
      scaleSpring.set(0);
    };

    window.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerenter", handleEnter);
    document.addEventListener("pointerleave", handleLeave);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerenter", handleEnter);
      document.removeEventListener("pointerleave", handleLeave);
    };
  }, [isTouch, isAdminPage, xSpring, ySpring, opacitySpring, scaleSpring]);

  if (isTouch || isAdminPage) return null;

  return (
    <motion.div
      style={{
        x: xSpring,
        y: ySpring,
        opacity: opacitySpring,
        scale: scaleSpring,
        translateX: "-50%",
        translateY: "-50%",
      }}
      className="pointer-events-none fixed left-0 top-0 z-[11999] size-10 rounded-full bg-[#4ca626] mix-blend-darken"
      aria-hidden="true"
    />
  );
}
