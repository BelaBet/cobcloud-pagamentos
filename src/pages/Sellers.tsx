import { useEffect, useState, type FormEvent } from "react";
import {
  Pencil,
  Plus,
  Power,
  Search,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";

type DocumentType = "cpf" | "cnpj";

type Seller = {
  id: string;
  name: string;
  document: string;
  document_type: DocumentType;
  pagarme_recipient_id: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  created_at: string;
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatDocument(value: string) {
  const digits = onlyDigits(value).slice(0, 14);

  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function isValidCPF(value: string) {
  const cpf = onlyDigits(value);

  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
    return false;
  }

  let sum = 0;

  for (let i = 0; i < 9; i++) {
    sum += Number(cpf[i]) * (10 - i);
  }

  let digit = (sum * 10) % 11;

  if (digit === 10) digit = 0;

  if (digit !== Number(cpf[9])) return false;

  sum = 0;

  for (let i = 0; i < 10; i++) {
    sum += Number(cpf[i]) * (11 - i);
  }

  digit = (sum * 10) % 11;

  if (digit === 10) digit = 0;

  return digit === Number(cpf[10]);
}

function isValidCNPJ(value: string) {
  const cnpj = onlyDigits(value);

  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) {
    return false;
  }

  function calculateDigit(base: string, weights: number[]) {
    const total = base
      .split("")
      .reduce(
        (sum, digit, index) => sum + Number(digit) * weights[index],
        0
      );

    const remainder = total % 11;

    return remainder < 2 ? 0 : 11 - remainder;
  }

  const firstDigit = calculateDigit(
    cnpj.slice(0, 12),
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  );

  const secondDigit = calculateDigit(
    cnpj.slice(0, 12) + firstDigit,
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  );

  return (
    firstDigit === Number(cnpj[12]) && secondDigit === Number(cnpj[13])
  );
}

function isValidDocument(value: string) {
  const digits = onlyDigits(value);

  if (digits.length === 11) return isValidCPF(digits);
  if (digits.length === 14) return isValidCNPJ(digits);

  return false;
}

function documentTypeOf(value: string): DocumentType {
  return onlyDigits(value).length === 14 ? "cnpj" : "cpf";
}

const emptyForm = {
  name: "",
  document: "",
  pagarme_recipient_id: "",
  email: "",
  phone: "",
};

export default function Sellers() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function loadSellers() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("sellers")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      setErrorMessage(
        "Não foi possível carregar os sellers: " + error.message
      );
    } else {
      setSellers((data ?? []) as Seller[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadSellers();
  }, []);

  const filteredSellers = sellers.filter((seller) => {
    const matchesSearch =
      !search ||
      seller.name.toLowerCase().includes(search.toLowerCase()) ||
      seller.document.includes(onlyDigits(search)) ||
      seller.pagarme_recipient_id
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && seller.active) ||
      (statusFilter === "inactive" && !seller.active);

    return matchesSearch && matchesStatus;
  });

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  }

  function openEditModal(seller: Seller) {
    setEditingId(seller.id);

    setForm({
      name: seller.name,
      document: formatDocument(seller.document),
      pagarme_recipient_id: seller.pagarme_recipient_id,
      email: seller.email ?? "",
      phone: seller.phone ? formatPhone(seller.phone) : "",
    });

    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("Informe o nome do seller.");
      return;
    }

    if (!isValidDocument(form.document)) {
      alert("Informe um CPF ou CNPJ válido.");
      return;
    }

    if (!form.pagarme_recipient_id.trim()) {
      alert("Informe o ID do recipient no Pagar.me.");
      return;
    }

    if (
      form.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      alert("Informe um e-mail válido.");
      return;
    }

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      document: onlyDigits(form.document),
      document_type: documentTypeOf(form.document),
      pagarme_recipient_id: form.pagarme_recipient_id.trim(),
      email: form.email.trim() || null,
      phone: onlyDigits(form.phone) || null,
    };

    const { error } = editingId
      ? await supabase.from("sellers").update(payload).eq("id", editingId)
      : await supabase.from("sellers").insert(payload);

    setSaving(false);

    if (error) {
      if (error.code === "23505") {
        alert(
          "Já existe um seller cadastrado com esse CPF/CNPJ ou ID de recipient."
        );
      } else {
        alert("Erro ao salvar seller: " + error.message);
      }
      return;
    }

    closeModal();
    loadSellers();
  }

  async function toggleActive(seller: Seller) {
    const { error } = await supabase
      .from("sellers")
      .update({ active: !seller.active })
      .eq("id", seller.id);

    if (error) {
      alert("Erro ao atualizar status: " + error.message);
      return;
    }

    loadSellers();
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sellers</h1>

          <p className="mt-1 text-sm text-slate-500">
            Recebedores cadastrados no Pagar.me que podem ser selecionados
            para receber cobranças.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700"
        >
          <Plus size={18} />
          Novo seller
        </button>
      </div>

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Buscar
            </label>

            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nome, CPF/CNPJ ou ID do recipient"
                className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Status
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as "all" | "active" | "inactive"
                )
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-violet-500"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>
        </div>
      </section>

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
                <TableHeader>NOME</TableHeader>
                <TableHeader>CPF/CNPJ</TableHeader>
                <TableHeader>RECIPIENT PAGAR.ME</TableHeader>
                <TableHeader>CONTATO</TableHeader>
                <TableHeader>STATUS</TableHeader>
                <TableHeader>AÇÕES</TableHeader>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    Carregando sellers...
                  </td>
                </tr>
              )}

              {!loading &&
                filteredSellers.map((seller) => (
                  <tr key={seller.id} className="transition hover:bg-slate-50">
                    <TableCell>
                      <span className="font-medium text-slate-800">
                        {seller.name}
                      </span>
                    </TableCell>

                    <TableCell>{formatDocument(seller.document)}</TableCell>

                    <TableCell>
                      <span className="font-mono text-xs">
                        {seller.pagarme_recipient_id}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        {seller.email && <span>{seller.email}</span>}
                        {seller.phone && (
                          <span className="text-slate-500">
                            {formatPhone(seller.phone)}
                          </span>
                        )}
                        {!seller.email && !seller.phone && "-"}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span
                        className={
                          "inline-flex rounded-full px-3 py-1 text-xs font-semibold " +
                          (seller.active
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-200 text-slate-600")
                        }
                      >
                        {seller.active ? "Ativo" : "Inativo"}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(seller)}
                          title="Editar"
                          className="rounded-lg border border-slate-300 p-2 text-slate-600 transition hover:bg-slate-50"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleActive(seller)}
                          title={seller.active ? "Inativar" : "Ativar"}
                          className={
                            "rounded-lg border p-2 transition " +
                            (seller.active
                              ? "border-red-200 text-red-600 hover:bg-red-50"
                              : "border-green-200 text-green-600 hover:bg-green-50")
                          }
                        >
                          <Power size={16} />
                        </button>
                      </div>
                    </TableCell>
                  </tr>
                ))}

              {!loading && filteredSellers.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    Nenhum seller encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-4 text-sm text-slate-500">
        {filteredSellers.length} seller(s) encontrado(s).
      </p>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingId ? "Editar seller" : "Novo seller"}
              </h2>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Nome / Razão Social
                </span>

                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Nome do seller"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  CPF / CNPJ
                </span>

                <input
                  value={form.document}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      document: formatDocument(event.target.value),
                    }))
                  }
                  inputMode="numeric"
                  maxLength={18}
                  placeholder="CPF ou CNPJ"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  ID do recipient no Pagar.me
                </span>

                <input
                  value={form.pagarme_recipient_id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      pagarme_recipient_id: event.target.value,
                    }))
                  }
                  placeholder="re_xxxxxxxxxxxxxxxx"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  E-mail
                </span>

                <input
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  type="email"
                  placeholder="seller@email.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Telefone
                </span>

                <input
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      phone: formatPhone(event.target.value),
                    }))
                  }
                  type="tel"
                  maxLength={15}
                  placeholder="(00) 00000-0000"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </label>

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

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-slate-600">
      {children}
    </th>
  );
}

function TableCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="whitespace-nowrap px-4 py-4 text-slate-700">
      {children}
    </td>
  );
}
