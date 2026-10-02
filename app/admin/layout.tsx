import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/auth";
import AdminDashboardShell from "@/components/custom/AdminDashboardShell";

export const metadata = { title: "Admin · VAM Enterprises", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/auth/sign-in");
  if (!(await isAdmin(userId))) redirect("/");
  return <AdminDashboardShell>{children}</AdminDashboardShell>;
}
