import { Skiper16 } from "@/components/ui/skiper-ui/skiper16";

export default function Showcase() {
  return (
    <section className="bg-gradient-to-b py-10 from-[#FFFFFF] to-[#5b8363] text-center mt-25">
      <h1 className="text-7xl font-bold bg-gradient-to-b from-black to-[#254f13] text-transparent bg-clip-text">
          Our Catalog Includes
        </h1>
      <Skiper16 />
      <h1 className="text-7xl font-bold bg-gradient-to-b from-black to-[#254f13] text-transparent bg-clip-text my-10">
          and many more.....
      </h1>
    </section>
  );
}