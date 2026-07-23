import { useState, type FormEvent, type InputHTMLAttributes } from "react";
import { useNavigate } from "react-router-dom";

type PaymentMethod = "pix" | "boleto" | "credit_card";

export default function Payments() {
  const navigate = useNavigate();

  const [methods, setMethods] = useState<PaymentMethod[]>([
    "pix",
    "boleto",
    "credit_card",
  ]);

  function toggleMethod(method: PaymentMethod) {
    setMethods((current) =>
      current.includes(method)
        ? current.filter((item) => item !== method)
        : [...current, method]
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!methods.length) {
      alert("Selecione pelo menos uma forma de pagamento.");
      return;
    }

    navigate("/payments/generated");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Pagamentos
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Crie uma nova cobrança para o cliente.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Nova cobrança
          </h2>

          <p className="text-sm text-slate-500">
            Preencha os dados da cobrança abaixo.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Input
            name="process_number"
            label="Nº do Processo"
            placeholder="Informe o número do processo"
            required
          />

          <Input
            name="customer_name"
            label="Nome / Razão Social"
            placeholder="Nome do cliente"
            required
          />

          <Input
            name="customer_document"
            label="CPF / CNPJ"
            placeholder="CPF ou CNPJ"
            required
          />

          <Input
            name="customer_email"
            label="E-mail"
            type="email"
            placeholder="cliente@email.com"
          />

          <Input
            name="customer_phone"
            label="Telefone"
            placeholder="(00) 00000-0000"
          />

          <Input
            name="description"
            label="Descrição"
            placeholder="Descrição da cobrança"
          />

          <Input
            name="amount"
            label="Valor"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0,00"
            required
          />

          <Input
            name="due_date"
            label="Vencimento"
            type="date"
          />
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Observações
          </label>

          <textarea
            name="observations"
            rows={4}
            placeholder="Adicione observações, se necessário"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6">
          <h2 className="font-semibold text-slate-900">
            Formas disponíveis no link
          </h2>

          <p className="mb-4 mt-1 text-sm text-slate-500">
            Selecione as formas de pagamento que o cliente poderá utilizar.
          </p>

          <div className="flex flex-wrap gap-3">
            <MethodCheckbox
              label="PIX"
              checked={methods.includes("pix")}
              onChange={() => toggleMethod("pix")}
            />

            <MethodCheckbox
              label="Boleto"
              checked={methods.includes("boleto")}
              onChange={() => toggleMethod("boleto")}
            />

            <MethodCheckbox
              label="Cartão de crédito"
              checked={methods.includes("credit_card")}
              onChange={() => toggleMethod("credit_card")}
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            className="rounded-lg bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700"
          >
            Gerar pagamento
          </button>
        </div>
      </form>
    </div>
  );
}

function Input({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <input
        {...props}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
      />
    </label>
  );
}

function MethodCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-300 px-4 py-3 transition hover:bg-slate-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4"
      />

      <span className="text-sm font-medium text-slate-700">
        {label}
      </span>
    </label>
  );
}