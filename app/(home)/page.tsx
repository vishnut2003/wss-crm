import BasicLayout from "@/layouts/basic-layout";
import Hero from "./_components/hero";
import Features from "./_components/features";
import HowItWorks from "./_components/how-it-works";
import Cta from "./_components/cta";

export default function HomePage() {
  return (
    <BasicLayout>
      <Hero />
      <Features />
      <HowItWorks />
      <Cta />
    </BasicLayout>
  );
}
