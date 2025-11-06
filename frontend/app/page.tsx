import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import ImpactSection from "@/components/ImpactSection";
import ValueSection from "@/components/ValueSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ImpactSection />
        <ValueSection />
      </main>
      <Footer />
    </div>
  );
}
