import Navbar from "@/components/site/navbar";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative z-10 min-h-screen">
      <Navbar />

      <main className="pt-14 lg:pt-16">{children}</main>
    </div>
  );
}
