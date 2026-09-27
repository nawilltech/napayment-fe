import { safeCall } from "@napayment/bff/safe-call";
import { AdminShell } from "@/components/admin-shell";
import { authedBackendClient } from "@/server/backend-client";
import { getStaff } from "@/server/staff";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const staff = await getStaff();
  const stats = await safeCall((await authedBackendClient()).admin.businessStats());

  return (
    <AdminShell
      staff={{
        name: `${staff.firstName} ${staff.lastName}`,
        email: staff.email,
        role: staff.userType === "SUPERADMIN" ? "Super admin" : "Admin",
      }}
      pendingKyc={stats?.byKycStatus.PENDING_REVIEW ?? 0}
    >
      {children}
    </AdminShell>
  );
}
