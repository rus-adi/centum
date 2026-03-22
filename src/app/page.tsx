import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";

export default async function Home() {
  const session = await requireSession();
  const role = session.user.role;

  if (role === "SUPER_ADMIN") redirect("/hq");
  if (role === "ADMIN") redirect("/transformation");
  if (role === "IT") redirect("/tools");
  redirect("/dashboard");
}
