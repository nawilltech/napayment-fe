import type { Metadata } from "next";
import { ProfileForm } from "@/components/settings/profile-form";

export const metadata: Metadata = { title: "Profile — Settings — Nawill Pay" };

export default function ProfileSettingsPage() {
  return <ProfileForm />;
}
