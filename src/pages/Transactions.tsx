import { useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "../lib/supabase";

type Transaction = {
  id: string;
  payment_method: "pix" | "boleto" | "credit_card";
  amount_cents: number;
  status: string;
  payment_location: string;
  paid_at: string | null;
  created_at: string;
  payment: {
    process_number: string;
    due_date: string;
    payer_name: string;
    observations: string | null;
    seller: { name: string } | null;
  } | null;
};

const methodLabels: Record<string, string> = {
  pix: "PIX",
  boleto: "Boleto",
  credit_card: "Cartão",
};

const statusLabels: Record<string, string> = {
  paid: "Pago",
  pending: "Pendente",
  canceled: "Cancelado",
  failed: "Falhou",
  refunded: "Reembolsado",
};

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDateTime(iso: string | null) {
  if (!iso) return "-";

  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(isoDate: string | undefined) {
  if (!isoDate) return "-";

  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [dateFrom, setDateFrom] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [payerSearch, setPayerSearch] = useState("");
  const [processSearch, setProcessSearch] = useState("");

  async function loadTransactions() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("transactions")
      .select(
        "id, payment_method, amount_cents, status, payment_location, paid_at, created_at, payment:payments(process_number, due_date, payer_name, observations, seller:sellers(name))"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage("Não foi possível carregar as transações: " + error.message);
    } else {
      setTransactions((data ?? []) as unknown as Transaction[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesDateFrom =
        !dateFrom ||
        (transaction.paid_at ?? transaction.created_at).slice(0, 10) >=
          dateFrom;

      const matchesDueDate =
        !dueDate || transaction.payment?.due_date === dueDate;

      const matchesMethod =
        !paymentMethod || transaction.payment_method === paymentMethod;

      const matchesPayer =
        !payerSearch ||
        (transaction.payment?.payer_name ?? "")
          .toLowerCase()
          .includes(payerSearch.toLowerCase());

      const matchesProcess =
        !processSearch ||
        (transaction.payment?.process_number ?? "")
          .toLowerCase()
          .includes(processSearch.toLowerCase());

      return (
        matchesDateFrom &&
        matchesDueDate &&
        matchesMethod &&
        matchesPayer &&
        matchesProcess
      );
    });
  }, [transactions, dateFrom, dueDate, paymentMethod, payerSearch, processSearch]);

  function exportXLSX() {
    const rows = filteredTransactions.map((transaction) => ({
      DATA: formatDateTime(transaction.paid_at ?? transaction.created_at),
      VENCIMENTO: formatDate(transaction.payment?.due_date),
      VALOR: transaction.amount_cents / 100,
      STATUS: statusLabels[transaction.status] ?? transaction.status,
      "FORMA DE PAGTO": methodLabels[transaction.payment_method],
      "LOCAL DE PAGTO": transaction.payment_location,
      PROCESSO: transaction.payment?.process_number ?? "",
      PAGADOR: transaction.payment?.payer_name ?? "",
      SELLER: transaction.payment?.seller?.name ?? "",
      OBSERVAÇÕES: transaction.payment?.observations ?? "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet["!cols"] = [
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 28 },
      { wch: 20 },
      { wch: 40 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório Financeiro");

    XLSX.writeFile(
      workbook,
      `relatorio-financeiro-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transações</h1>

          <p className="mt-1 text-sm text-slate-500">
            Relatório financeiro das cobranças e pagamentos.
          </p>
        </div>

        <button
          type="button"
          onClick={exportXLSX}
          disabled={filteredTransactions.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
        >
          <Download size={18} />
          Exportar XLSX
        </button>
      </div>

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              A partir de
            </label>

            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Vencimento
            </label>

            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Forma de pagamento
            </label>

            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-violet-500"
            >
              <option value="">Todas</option>
              <option value="pix">PIX</option>
              <option value="boleto">Boleto</option>
              <option value="credit_card">Cartão</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Pagador
            </label>

            <input
              value={payerSearch}
              onChange={(event) => setPayerSearch(event.target.value)}
              placeholder="Buscar pagador"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Nº do Processo
            </label>

            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={processSearch}
                onChange={(event) => setProcessSearch(event.target.value)}
                placeholder="Buscar processo"
                className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 outline-none focus:border-violet-500"
              />
            </div>
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
                <TableHeader>DATA</TableHeader>
                <TableHeader>VENCIMENTO</TableHeader>
                <TableHeader>VALOR</TableHeader>
                <TableHeader>STATUS</TableHeader>
                <TableHeader>FORMA DE PAGTO</TableHeader>
                <TableHeader>PROCESSO</TableHeader>
                <TableHeader>PAGADOR</TableHeader>
                <TableHeader>SELLER</TableHeader>
                <TableHeader>OBSERVAÇÕES</TableHeader>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                    Carregando transações...
                  </td>
                </tr>
              )}

              {!loading &&
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="transition hover:bg-slate-50">
                    <TableCell>
                      {formatDateTime(transaction.paid_at ?? transaction.created_at)}
                    </TableCell>

                    <TableCell>{formatDate(transaction.payment?.due_date)}</TableCell>

                    <TableCell>
                      <span className="font-medium text-slate-800">
                        {formatCurrency(transaction.amount_cents)}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span
                        className={
                          "inline-flex rounded-full px-3 py-1 text-xs font-semibold " +
                          (transaction.status === "paid"
                            ? "bg-green-100 text-green-700"
                            : transaction.status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-200 text-slate-600")
                        }
                      >
                        {statusLabels[transaction.status] ?? transaction.status}
                      </span>
                    </TableCell>

                    <TableCell>{methodLabels[transaction.payment_method]}</TableCell>

                    <TableCell>
                      <span className="font-medium text-slate-800">
                        {transaction.payment?.process_number ?? "-"}
                      </span>
                    </TableCell>

                    <TableCell>{transaction.payment?.payer_name ?? "-"}</TableCell>

                    <TableCell>{transaction.payment?.seller?.name ?? "-"}</TableCell>

                    <TableCell>{transaction.payment?.observations || "-"}</TableCell>
                  </tr>
                ))}

              {!loading && filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-4 text-sm text-slate-500">
        {filteredTransactions.length} registro(s) encontrado(s).
      </p>
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
    <td className="whitespace-nowrap px-4 py-4 text-slate-700">{children}</td>
  );
}
