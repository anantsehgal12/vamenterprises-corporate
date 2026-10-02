import Header from "@/components/custom/Header";
import Footer from "@/components/custom/Footer";
import GeneralRequirementForm from "@/components/custom/GeneralRequirementForm";

export const metadata = { title: "Get Your Quote | VAM Enterprises" };

export default function GetYourQuotePage() {
  return <main className="min-h-screen bg-[#f7faf5]"><Header/><GeneralRequirementForm/><Footer/></main>;
}
