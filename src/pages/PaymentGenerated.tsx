import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Clock, Copy, ExternalLink } from "lucide-react";
import { supabase } from "../lib/supabase";

type Payment = {
  id: string;
  process_number: string;
  payer_name: string;
  amount_cents: number;
  charged_amount_cents: number | null;
  due_date: string;
  payment_method: "pix" | "boleto" | "credit_card" | null;
  status: string;
  payment_link: string | null;
  pix_qr_code: string | null;
  pix_copy_paste: string | null;
  boleto_line: string | null;
  boleto_url: string | null;
  seller: {
    name: string;
  } | null;
};

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

const methodLabels: Record<string, string> = {
  pix: "PIX",
  boleto: "Boleto",
  credit_card: "Cartão de crédito",
};

export default function PaymentGenerated() {
  const { id } = useParams<{ id: string }>();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadPayment() {
      if (!id) return;

      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("payments")
        .select(
          "id, process_number, payer_name, amount_cents, charged_amount_cents, due_date, payment_method, status, payment_link, pix_qr_code, pix_copy_paste, boleto_line, boleto_url, seller:sellers(name)"
        )
        .eq("id", id)
        .single();

      if (error) {
        setErrorMessage(
          "Não foi possível carregar a cobrança: " + error.message
        );
      } else {
        setPayment(data as unknown as Payment);
      }

      setLoading(false);
    }

    loadPayment();
  }, [id]);

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copiado com sucesso.");
    } catch {
      alert("Não foi possível copiar.");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl py-12 text-center text-slate-500">
        Carregando cobrança...
      </div>
    );
  }

  if (errorMessage || !payment) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          {errorMessage || "Cobrança não encontrada."}
        </div>
      </div>
    );
  }

  const notGeneratedYet =
    !payment.payment_link && !payment.pix_copy_paste && !payment.boleto_url;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Pagamento gerado
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          A cobrança foi criada e está pronta para compartilhamento.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-5">
          <CheckCircle2 className="mt-0.5 text-green-600" size={24} />

          <div>
            <p className="font-semibold text-green-900">
              Cobrança criada com sucesso
            </p>

            <p className="mt-1 text-sm text-green-700">
              Os dados abaixo já estão salvos no sistema.
            </p>
          </div>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-slate-900">
            Resumo do pagamento
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <Detail label="Nº do Processo" value={payment.process_number} />
            <Detail label="Pagador" value={payment.payer_name} />
            <Detail
              label="Seller / Recebedor"
              value={payment.seller?.name ?? "-"}
            />
            <Detail
              label="Forma de pagamento"
              value={
                payment.payment_method
                  ? methodLabels[payment.payment_method]
                  : "-"
              }
            />
            <Detail
              label="Seller recebe"
              value={formatCurrency(payment.amount_cents)}
            />
            <Detail
              label="Pagador paga"
              value={
                payment.charged_amount_cents
                  ? formatCurrency(payment.charged_amount_cents)
                  : "Calculando..."
              }
            />
            <Detail label="Vencimento" value={formatDate(payment.due_date)} />
          </div>
        </section>

        {notGeneratedYet && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <Clock className="mt-0.5 text-amber-600" size={24} />

            <div>
              <p className="font-semibold text-amber-900">
                Aguardando integração com o Pagar.me
              </p>

              <p className="mt-1 text-sm text-amber-700">
                A cobrança foi salva, mas o link de pagamento, PIX ou boleto
                ainda não foram gerados. Isso pode indicar um erro na geração
                — verifique os logs da função no Supabase.
              </p>
            </div>
          </div>
        )}

        {payment.payment_link && (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Link de pagamento (cartão)
            </h2>

            <p className="mb-4 text-sm text-slate-500">
              Página hospedada pelo Pagar.me onde o pagador informa os dados
              do cartão.
            </p>

            <div className="flex flex-col gap-3 md:flex-row">
              <input
                readOnly
                value={payment.payment_link}
                className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
              />

              <button
                type="button"
                onClick={() => copyText(payment.payment_link!)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
              >
                <Copy size={17} />
                Copiar link
              </button>

              <a
                href={payment.payment_link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-700"
              >
                <ExternalLink size={17} />
                Abrir pagamento
              </a>
            </div>
          </section>
        )}

        {payment.pix_copy_paste && (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              PIX
            </h2>

            {payment.pix_qr_code && (
              <img
                src={payment.pix_qr_code}
                alt="QR Code PIX"
                className="mb-4 h-40 w-40 rounded-lg border border-slate-200"
              />
            )}

            <label className="mb-2 block text-sm font-medium text-slate-700">
              PIX Copia e Cola
            </label>

            <textarea
              readOnly
              rows={4}
              value={payment.pix_copy_paste}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
            />

            <button
              type="button"
              onClick={() => copyText(payment.pix_copy_paste!)}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
            >
              <Copy size={17} />
              Copiar PIX
            </button>
          </section>
        )}

        {payment.boleto_line && (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Boleto
            </h2>

            <p className="mb-4 text-sm text-slate-500">
              Linha digitável e PDF oficial gerado pelo Pagar.me.
            </p>

            <div className="flex flex-col gap-3 md:flex-row">
              <input
                readOnly
                value={payment.boleto_line}
                className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
              />

              <button
                type="button"
                onClick={() => copyText(payment.boleto_line!)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
              >
                <Copy size={17} />
                Copiar código
              </button>

              {payment.boleto_url && (
                <a
                  href={payment.boleto_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-700"
                >
                  <ExternalLink size={17} />
                  Abrir boleto (PDF)
                </a>
              )}
            </div>
          </section>
        )}

        <div className="flex justify-between">
          <Link
            to="/payments"
            className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
          >
            Voltar para pagamentos
          </Link>

          <Link
            to="/transactions"
            className="rounded-lg bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-700"
          >
            Ver transações
          </Link>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-medium text-slate-900">{value}</p>
    </div>
  );
}
