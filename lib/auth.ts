import { clerkClient } from "@clerk/nextjs/server";

export async function isAdmin(userId: string) {
  const allowlist = (process.env.ADMIN_USER_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean);
  if (allowlist.includes(userId)) return true;
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  return user.publicMetadata?.role === "admin";
}
