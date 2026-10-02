'use client';
import About from "@/components/custom/About";
import Footer from "@/components/custom/Footer";
import Header from "@/components/custom/Header";
import Hero from "@/components/custom/Hero";
import Showcase from "@/components/custom/Showcase";

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <Showcase />
      <About />
      <Footer />
    </main>
  );
}
