import BasicLayout from "@/layouts/basic-layout";
import Hero from "./_components/hero";
import Modules from "./_components/modules";
import Personas from "./_components/personas";
import HowItWorks from "./_components/how-it-works";
import Stats from "./_components/stats";
import Testimonials from "./_components/testimonials";
import Pricing from "./_components/pricing";
import FAQ from "./_components/faq";
import Cta from "./_components/cta";

export default function HomePage() {
  return (
    <BasicLayout>
      <Hero />
      <Modules />
      <Personas />
      <HowItWorks />
      <Stats />
      <Testimonials />
      <Pricing />
      <FAQ />
      <Cta />
    </BasicLayout>
  );
}
