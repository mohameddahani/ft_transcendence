import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { parseJwtPayload, isAdminUser } from "@/lib/auth";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (token && isAdminUser(parseJwtPayload(token))) {
    redirect("/admins");
  } else {
    redirect("/login");
  }
}
