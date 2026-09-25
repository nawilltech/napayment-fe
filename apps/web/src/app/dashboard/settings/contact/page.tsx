import type { Metadata } from "next";
import { ContactForm } from "@/components/settings/contact-form";

export const metadata: Metadata = { title: "Contact — Settings — Napayment" };

export default function ContactSettingsPage() {
  return <ContactForm />;
}
