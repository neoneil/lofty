import type { ReactNode } from "react";

export default function ClassroomLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="-m-1 flex min-h-0 w-full flex-1 flex-col">
      {children}
    </div>
  );
}
