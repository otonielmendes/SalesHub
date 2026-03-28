import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      response: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
      supabase: null as Awaited<ReturnType<typeof createClient>> | null,
    };
  }
  const { data: row } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (row?.role !== "admin") {
    return {
      response: NextResponse.json({ error: "Acesso negado" }, { status: 403 }),
      supabase: null,
    };
  }
  return { response: null, supabase };
}

export async function GET() {
  const { response, supabase } = await requireAdmin();
  if (response) return response;

  const { data, error } = await supabase!
    .from("users")
    .select("id, email, name, role, status, created_at, last_login")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ users: data ?? [] });
}

export async function PATCH(req: Request) {
  const { response, supabase } = await requireAdmin();
  if (response) return response;

  let body: { id?: string; status?: string; role?: string };
  try {
    body = (await req.json()) as { id?: string; status?: string; role?: string };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const targetId = body.id;
  if (!targetId) {
    return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  }

  const { data: target, error: targetErr } = await supabase!
    .from("users")
    .select("role, status")
    .eq("id", targetId)
    .single();

  if (targetErr || !target) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  const { data: admins } = await supabase!
    .from("users")
    .select("id")
    .eq("role", "admin")
    .eq("status", "active");

  const isTargetActiveAdmin = target.role === "admin" && target.status === "active";
  const otherActiveAdmins = (admins ?? []).filter((a) => a.id !== targetId).length;

  if (isTargetActiveAdmin && body.role === "user" && otherActiveAdmins === 0) {
    return NextResponse.json({ error: "Não é possível remover o último administrador" }, { status: 400 });
  }
  if (isTargetActiveAdmin && body.status === "disabled" && otherActiveAdmins === 0) {
    return NextResponse.json({ error: "Não é possível desativar o último administrador" }, { status: 400 });
  }

  const updates: Record<string, string> = {};
  if (body.status === "pending" || body.status === "active" || body.status === "disabled") {
    updates.status = body.status;
  }
  if (body.role === "admin" || body.role === "user") {
    updates.role = body.role;
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nenhuma alteração válida" }, { status: 400 });
  }

  const { error: upErr } = await supabase!.from("users").update(updates).eq("id", targetId);
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
