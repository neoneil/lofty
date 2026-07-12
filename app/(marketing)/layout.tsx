import Navbar from "@/components/site/navbar";
import Footer from "@/components/site/footer";
import { MarketingFloatingActions } from "@/components/site/marketing-floating-actions";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="relative z-10 flex min-h-screen flex-col">

      <Navbar />

      <main className="flex-1">

        {children}

      </main>

      <Footer />

      <MarketingFloatingActions />

    </div>
  );

}
