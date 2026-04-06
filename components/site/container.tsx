import { ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
  className?: string;
};

export default function Container({
  children,
  className = "",
}: ContainerProps) {
  return (
    <div
      className={`mx-auto w-full max-w-420 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 ${className}`}
    >
      {children}
    </div>
  );
}