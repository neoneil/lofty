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
      <div className="lofty-marketing-chrome">
        <Navbar />
      </div>

      <main className="lofty-marketing-main flex-1">{children}</main>

      <div className="lofty-marketing-chrome">
        <Footer />
        <MarketingFloatingActions />
      </div>
    </div>
  );
}
