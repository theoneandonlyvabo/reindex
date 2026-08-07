import { MotionConfig } from "motion/react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Hero } from "@/components/marketing/hero";
import { Problem } from "@/components/marketing/problem";
import { Bridge } from "@/components/marketing/bridge";
import { Why } from "@/components/marketing/why";
import { Features } from "@/components/marketing/features";
import { Cta } from "@/components/marketing/cta";

export default function Home() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <SiteHeader />
        <main className="flex-1">
          <Hero />
          <Problem />
          <Bridge />
          <Why />
          <Features />
          <Cta />
        </main>
        <SiteFooter />
      </div>
    </MotionConfig>
  );
}
