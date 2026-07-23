import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import * as XLSX from "xlsx";

type Transaction = {
  id: string;
  date: string;
  dueDate: string;
  amount: number;
  paymentMethod: "PIX" | "Boleto" | "Cartão";
  paymentLocation: string;
  processNumber: string;
  customer: string;
  observations: string;
};

const initialTransactions: Transaction[] = [
  {
    id: "1",
    date: "21/07/2026",
    dueDate: "30/07/2026",
    amount: 2500,
    paymentMethod: "PIX",
    paymentLocation: "Pagar.me",
    processNumber: "0001234-56.2026",
    customer: "João da Silva",
    observations: "Pagamento identificado.",
  },
  {
    id: "2",
    date: "22/07/2026",
    dueDate: "01/08/2026",
    amount: 1800,
    paymentMethod: "Cartão",
    paymentLocation: "Pagar.me",
    processNumber: "0004567-89.2026",
    customer: "Empresa Exemplo Ltda.",
    observations: "",
  },
  {
    id: "3",
    date: "23/07/2026",
    dueDate: "05/08/2026",
    amount: 3200,
    paymentMethod: "Boleto",
    paymentLocation: "Pagar.me",
    processNumber: "0007890-12.2026",
    customer: "Maria Oliveira",
    observations: "Aguardando compensação.",
  },
];

export default function Transactions() {
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [customer, setCustomer] = useState("");

  const filteredTransactions = useMemo(() => {
    return initialTransactions.filter((transaction) => {
      const matchesSearch =
        !search ||
        transaction.processNumber
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesMethod =
        !paymentMethod ||
        transaction.paymentMethod === paymentMethod;

      const matchesCustomer =
        !customer ||
        transaction.customer
          .toLowerCase()
          .includes(customer.toLowerCase());

      return matchesSearch && matchesMethod && matchesCustomer;
    });
  }, [search, paymentMethod, customer]);

  function exportXLSX() {
    const rows = filteredTransactions.map((transaction) => ({
      DATA: transaction.date,
      VENCIMENTO: transaction.dueDate,
      VALOR: transaction.amount,
      "FORMA DE PAGTO": transaction.paymentMethod,
      "LOCAL DE PAGTO": transaction.paymentLocation,
      PROCESSO: transaction.processNumber,
      OBSERVAÇÕES: transaction.observations,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet["!cols"] = [
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 20 },
      { wch: 20 },
      { wch: 25 },
      { wch: 40 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Relatório Financeiro"
    );

    XLSX.writeFile(
      workbook,
      `relatorio-financeiro-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Transações
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Relatório financeiro das cobranças e pagamentos.
          </p>
        </div>

        <button
          type="button"
          onClick={exportXLSX}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700"
        >
          <Download size={18} />
          Exportar XLSX
        </button>
      </div>

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Período
            </label>

            <input
              type="date"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Vencimento
            </label>

            <input
              type="date"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Forma de pagamento
            </label>

            <select
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(event.target.value)
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-violet-500"
            >
              <option value="">Todas</option>
              <option value="PIX">PIX</option>
              <option value="Boleto">Boleto</option>
              <option value="Cartão">Cartão</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Cliente
            </label>

            <input
              value={customer}
              onChange={(event) =>
                setCustomer(event.target.value)
              }
              placeholder="Buscar cliente"
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
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Buscar processo"
                className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <TableHeader>DATA</TableHeader>
                <TableHeader>VENCIMENTO</TableHeader>
                <TableHeader>VALOR</TableHeader>
                <TableHeader>FORMA DE PAGTO</TableHeader>
                <TableHeader>LOCAL DE PAGTO</TableHeader>
                <TableHeader>PROCESSO</TableHeader>
                <TableHeader>OBSERVAÇÕES</TableHeader>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="transition hover:bg-slate-50"
                >
                  <TableCell>{transaction.date}</TableCell>

                  <TableCell>
                    {transaction.dueDate}
                  </TableCell>

                  <TableCell>
                    {transaction.amount.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </TableCell>

                  <TableCell>
                    {transaction.paymentMethod}
                  </TableCell>

                  <TableCell>
                    {transaction.paymentLocation}
                  </TableCell>

                  <TableCell>
                    <span className="font-medium text-slate-800">
                      {transaction.processNumber}
                    </span>
                  </TableCell>

                  <TableCell>
                    {transaction.observations || "-"}
                  </TableCell>
                </tr>
              ))}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-500"
                  >
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

function TableHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-slate-600">
      {children}
    </th>
  );
}

function TableCell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td className="whitespace-nowrap px-4 py-4 text-slate-700">
      {children}
    </td>
  );
}