import { redirect } from "next/navigation";
import { HomePageClient } from "@/components/home/home-page-client";
import { getServerAuthUser, toUserRole } from "@/lib/server-auth";

export default async function HomePage() {
  const user = await getServerAuthUser();

  if (user) {
    redirect(toUserRole(user) === "admin" ? "/admin" : "/chat");
  }

  return <HomePageClient />;
}
