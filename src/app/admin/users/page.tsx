import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { UsersAdminTable } from "./users-admin-table";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") {
    redirect("/backtests/testagens");
  }

  const { data: users, error } = await supabase
    .from("users")
    .select("id, email, name, role, status, created_at, last_login")
    .order("created_at", { ascending: false });

  const t = await getTranslations("admin.users");

  if (error) {
    return (
      <div className="rounded-xl border border-error-200 bg-error-50 p-6 text-sm text-error-800">
        {t("errorLoading", { error: error.message })}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-display-xs font-semibold text-primary">{t("title")}</h1>
      <p className="mt-1 text-sm text-tertiary">{t("description")}</p>
      <div className="mt-8">
        <UsersAdminTable initialUsers={users ?? []} currentUserId={user.id} />
      </div>
    </div>
  );
}
