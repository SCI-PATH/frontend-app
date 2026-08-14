import { Navbar } from "@/components/common/Navbar";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-brand-background">
      <Navbar />
      {children}
    </div>
  );
}
