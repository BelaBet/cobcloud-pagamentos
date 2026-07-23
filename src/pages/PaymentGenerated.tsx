import { CheckCircle2, Copy, ExternalLink, Printer } from "lucide-react";

export default function PaymentGenerated() {
  const payment = {
    processNumber: "0001234-56.2026",
    customerName: "João da Silva",
    amount: 1250,
    dueDate: "25/07/2026",
    paymentUrl: "https://checkout.pagar.me/exemplo",
    pixCode:
      "00020126580014BR.GOV.BCB.PIX0136exemplo-pix-copia-e-cola-123456789",
    boletoLine: "00190.00009 01234.567890 12345.678901 1 99990000125000",
  };

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copiado com sucesso.");
    } catch {
      alert("Não foi possível copiar.");
    }
  }

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
              Os dados do pagamento estão disponíveis abaixo.
            </p>
          </div>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-slate-900">
            Resumo do pagamento
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <Detail label="Nº do Processo" value={payment.processNumber} />
            <Detail label="Cliente" value={payment.customerName} />

            <Detail
              label="Valor"
              value={payment.amount.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            />

            <Detail label="Vencimento" value={payment.dueDate} />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">
            Link de pagamento
          </h2>

          <p className="mb-4 text-sm text-slate-500">
            Copie ou abra o link gerado para o cliente realizar o pagamento.
          </p>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              readOnly
              value={payment.paymentUrl}
              className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
            />

            <button
              type="button"
              onClick={() => copyText(payment.paymentUrl)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
            >
              <Copy size={17} />
              Copiar link
            </button>

            <a
              href={payment.paymentUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-700"
            >
              <ExternalLink size={17} />
              Abrir pagamento
            </a>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">
            PIX
          </h2>

          <p className="mb-4 text-sm text-slate-500">
            QR Code e código PIX Copia e Cola.
          </p>

          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <div className="flex min-h-52 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50">
              <div className="text-center">
                <div className="mx-auto mb-2 h-32 w-32 bg-white p-3 shadow-sm">
                  <div className="grid h-full grid-cols-6 gap-1">
                    {Array.from({ length: 36 }).map((_, index) => (
                      <div
                        key={index}
                        className={
                          index % 3 === 0 ||
                          index % 5 === 0 ||
                          index % 7 === 0
                            ? "bg-slate-900"
                            : "bg-white"
                        }
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  QR Code ilustrativo
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                PIX Copia e Cola
              </label>

              <textarea
                readOnly
                rows={6}
                value={payment.pixCode}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
              />

              <button
                type="button"
                onClick={() => copyText(payment.pixCode)}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
              >
                <Copy size={17} />
                Copiar PIX
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">
            Boleto
          </h2>

          <p className="mb-4 text-sm text-slate-500">
            Linha digitável e opção para visualizar ou imprimir.
          </p>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              readOnly
              value={payment.boletoLine}
              className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
            />

            <button
              type="button"
              onClick={() => copyText(payment.boletoLine)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
            >
              <Copy size={17} />
              Copiar código
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
            >
              <Printer size={17} />
              Imprimir boleto
            </button>
          </div>
        </section>

        <div className="flex justify-between">
          <a
            href="/payments"
            className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
          >
            Voltar para pagamentos
          </a>

          <a
            href="/transactions"
            className="rounded-lg bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-700"
          >
            Ver transações
          </a>
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-medium text-slate-900">
        {value}
      </p>
    </div>
  );
}