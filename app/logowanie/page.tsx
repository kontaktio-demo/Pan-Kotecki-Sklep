import type { Metadata } from "next";
import LoginForm from "@/components/account/LoginForm";

export const metadata: Metadata = {
  title: "Logowanie",
  description: "Zaloguj się do konta Pan Kotecki - bez hasła, przez link na e-mail. Konto jest opcjonalne.",
  robots: { index: false },
};

export default function LogowaniePage() {
  return <LoginForm />;
}
