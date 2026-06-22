import Navbar from "@/components/site/navbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative z-10 min-h-screen bg-[var(--bg)] pt-14 lg:pt-16">
      <Navbar />
      {children}
    </div>
  );
}
