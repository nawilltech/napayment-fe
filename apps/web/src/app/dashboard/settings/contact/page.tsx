import type { Metadata } from "next";
import { requireBusinessAccount } from "@/server/console";
import { ContactForm } from "@/components/settings/contact-form";

export const metadata: Metadata = { title: "Contact — Settings — Napayment" };

export default async function ContactSettingsPage() {
  await requireBusinessAccount();
  return <ContactForm />;
}
