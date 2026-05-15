import type { ReactNode } from "react";
import Header from "./header";
import Footer from "./footer";

type BasicLayoutProps = {
  children: ReactNode;
};

export default function BasicLayout({ children }: BasicLayoutProps) {
  return (
    <div className="flex flex-col flex-1 bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
