import type { Metadata } from "next";
import AccountShell from "@/components/account/AccountShell";

export const metadata: Metadata = {
  title: "Moje konto",
  robots: { index: false },
};

export default function KontoLayout({ children }: { children: React.ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
