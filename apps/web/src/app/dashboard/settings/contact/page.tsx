import type { Metadata } from "next";
import { ContactForm } from "@/components/settings/contact-form";

export const metadata: Metadata = { title: "Contact — Settings — Nawill Pay" };

export default function ContactSettingsPage() {
  return <ContactForm />;
}
