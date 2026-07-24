import { useEffect, useState, type FormEvent } from "react";
import { Plus, Power, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Role } from "../lib/auth";

type UserRow = {
  id: string;
  email: string | null;
  name: string;
  role: Role;
  seller_id: string | null;
  active: boolean;
};

type SellerOption = {
  id: string;
  name: string;
};

const roleLabels: Record<Role, string> = {
  admin: "Administrador",
  credor: "Credor",
  operador: "Operador",
};

const emptyForm = {
  email: "",
  password: "",
  name: "",
  role: "operador" as Role,
  seller_id: "",
};

export default function Users() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [sellers, setSellers] = useState<SellerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function callManageUsers(body: Record<string, unknown>) {
    const { data, error } = await supabase.functions.invoke(
      "admin-manage-users",
      { body }
    );

    if (error) {
      let detail = error.message;
      const context = (error as { context?: Response }).context;

      if (context) {
        try {
          const parsed = await context.clone().json();
          detail = parsed?.error || detail;
        } catch {
          // mantem mensagem generica
        }
      }

      throw new Error(detail);
    }

    return data;
  }

  async function loadUsers() {
    setLoading(true);
    setErrorMessage("");

    try {
      const data = await callManageUsers({ action: "list" });
      setUsers((data.users ?? []) as UserRow[]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao carregar usuários."
      );
    }

    setLoading(false);
  }

  async function loadSellers() {
    const { data } = await supabase
      .from("sellers")
      .select("id, name")
      .order("name", { ascending: true });

    setSellers((data ?? []) as SellerOption[]);
  }

  useEffect(() => {
    loadUsers();
    loadSellers();
  }, []);

  function openCreateModal() {
    setEditingUser(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  }

  function openEditModal(user: UserRow) {
    setEditingUser(user);

    setForm({
      email: user.email ?? "",
      password: "",
      name: user.name,
      role: user.role,
      seller_id: user.seller_id ?? "",
    });

    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingUser(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("Informe o nome do usuário.");
      return;
    }

    if (form.role === "credor" && !form.seller_id) {
      alert("Selecione o seller vinculado a esse credor.");
      return;
    }

    setSaving(true);

    try {
      if (editingUser) {
        await callManageUsers({
          action: "update",
          id: editingUser.id,
          name: form.name.trim(),
          role: form.role,
          seller_id: form.role === "credor" ? form.seller_id : null,
        });
      } else {
        if (!form.email.trim() || !form.password) {
          alert("Informe e-mail e senha.");
          setSaving(false);
          return;
        }

        if (form.password.length < 6) {
          alert("A senha precisa ter pelo menos 6 caracteres.");
          setSaving(false);
          return;
        }

        await callManageUsers({
          action: "create",
          email: form.email.trim(),
          password: form.password,
          name: form.name.trim(),
          role: form.role,
          seller_id: form.role === "credor" ? form.seller_id : null,
        });
      }

      closeModal();
      loadUsers();
    } catch (error) {
      alert(
        "Erro ao salvar usuário: " +
          (error instanceof Error ? error.message : String(error))
      );
    }

    setSaving(false);
  }

  async function toggleActive(user: UserRow) {
    try {
      await callManageUsers({
        action: "update",
        id: user.id,
        active: !user.active,
      });

      loadUsers();
    } catch (error) {
      alert(
        "Erro ao atualizar status: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  }

  function sellerName(sellerId: string | null) {
    if (!sellerId) return "-";
    return sellers.find((seller) => seller.id === sellerId)?.name ?? "-";
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuários</h1>

          <p className="mt-1 text-sm text-slate-500">
            Gerencie quem tem acesso ao sistema e com qual papel.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700"
        >
          <Plus size={18} />
          Novo usuário
        </button>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600">
                  NOME
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600">
                  E-MAIL
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600">
                  PAPEL
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600">
                  SELLER
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600">
                  STATUS
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600">
                  AÇÕES
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Carregando usuários...
                  </td>
                </tr>
              )}

              {!loading &&
                users.map((user) => (
                  <tr key={user.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-4 font-medium text-slate-800">
                      {user.name}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{user.email}</td>
                    <td className="px-4 py-4 text-slate-600">
                      {roleLabels[user.role]}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {sellerName(user.seller_id)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={
                          "inline-flex rounded-full px-3 py-1 text-xs font-semibold " +
                          (user.active
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-200 text-slate-600")
                        }
                      >
                        {user.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(user)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleActive(user)}
                          title={user.active ? "Inativar" : "Ativar"}
                          className={
                            "rounded-lg border p-1.5 transition " +
                            (user.active
                              ? "border-red-200 text-red-600 hover:bg-red-50"
                              : "border-green-200 text-green-600 hover:bg-green-50")
                          }
                        >
                          <Power size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingUser ? "Editar usuário" : "Novo usuário"}
              </h2>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Nome
                </span>

                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-violet-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  E-mail
                </span>

                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  disabled={!!editingUser}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-violet-500 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </label>

              {!editingUser && (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Senha
                  </span>

                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    minLength={6}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-violet-500"
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Papel
                </span>

                <select
                  value={form.role}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      role: event.target.value as Role,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-violet-500"
                >
                  <option value="admin">Administrador (acesso total)</option>
                  <option value="operador">
                    Operador (páginas de pagamento)
                  </option>
                  <option value="credor">Credor (transações do seller)</option>
                </select>
              </label>

              {form.role === "credor" && (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Seller vinculado
                  </span>

                  <select
                    value={form.seller_id}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        seller_id: event.target.value,
                      }))
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-violet-500"
                  >
                    <option value="">Selecione...</option>
                    {sellers.map((seller) => (
                      <option key={seller.id} value={seller.id}>
                        {seller.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-violet-600 px-5 py-2 font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
