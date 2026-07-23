import {
  useState,
  type FormEvent,
  type InputHTMLAttributes,
} from "react";
import { useNavigate } from "react-router-dom";

type PaymentMethod = "pix" | "boleto" | "credit_card";

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatProcess(value: string) {
  const digits = onlyDigits(value).slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
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

  if (digit === 10) {
    digit = 0;
  }

  if (digit !== Number(cpf[9])) {
    return false;
  }

  sum = 0;

  for (let i = 0; i < 10; i++) {
    sum += Number(cpf[i]) * (11 - i);
  }

  digit = (sum * 10) % 11;

  if (digit === 10) {
    digit = 0;
  }

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
        (sum, digit, index) =>
          sum + Number(digit) * weights[index],
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
    firstDigit === Number(cnpj[12]) &&
    secondDigit === Number(cnpj[13])
  );
}

function isValidDocument(value: string) {
  const digits = onlyDigits(value);

  if (digits.length === 11) {
    return isValidCPF(digits);
  }

  if (digits.length === 14) {
    return isValidCNPJ(digits);
  }

  return false;
}

function getToday() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function Payments() {
  const navigate = useNavigate();

  const [methods, setMethods] = useState<PaymentMethod[]>([
    "pix",
    "boleto",
    "credit_card",
  ]);

  const [processNumber, setProcessNumber] = useState("");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");

  function toggleMethod(method: PaymentMethod) {
    setMethods((current) =>
      current.includes(method)
        ? current.filter((item) => item !== method)
        : [...current, method]
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const name = String(
      form.get("customer_name") || ""
    ).trim();

    const email = String(
      form.get("customer_email") || ""
    ).trim();

    const amount = Number(form.get("amount"));

    const dueDate = String(
      form.get("due_date") || ""
    );

    if (!/^\d{2}\/\d{6}$/.test(processNumber)) {
      alert(
        "O Nº do Processo deve estar no formato 05/122039."
      );
      return;
    }

    if (!name) {
      alert("Informe o nome ou razão social do pagador.");
      return;
    }

    if (!isValidDocument(document)) {
      alert("Informe um CPF ou CNPJ válido.");
      return;
    }

    const phoneDigits = onlyDigits(phone);

    if (
      phoneDigits.length > 0 &&
      phoneDigits.length !== 10 &&
      phoneDigits.length !== 11
    ) {
      alert("Informe um telefone válido com DDD.");
      return;
    }

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      alert("Informe um e-mail válido.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Informe um valor maior que zero.");
      return;
    }

    if (!dueDate) {
      alert("Informe a data de vencimento.");
      return;
    }

    if (dueDate < getToday()) {
      alert(
        "A data de vencimento não pode ser anterior à data atual."
      );
      return;
    }

    if (!methods.length) {
      alert(
        "Selecione pelo menos uma forma de pagamento."
      );
      return;
    }

    const payload = {
      processNumber,

      payer: {
        name,
        document: onlyDigits(document),
        email,
        phone: onlyDigits(phone),
      },

      description: String(
        form.get("description") || ""
      ).trim(),

      amount,

      amountInCents: Math.round(amount * 100),

      dueDate,

      observations: String(
        form.get("observations") || ""
      ).trim(),

      acceptedPaymentMethods: methods,
    };

    console.log("Cobrança validada:", payload);

    navigate("/payments/generated");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Pagamentos
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Crie uma nova cobrança.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Nova cobrança
          </h2>

          <p className="text-sm text-slate-500">
            Preencha os dados do pagador e da cobrança.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Nº do Processo
            </span>

            <input
              name="process_number"
              value={processNumber}
              onChange={(event) =>
                setProcessNumber(
                  formatProcess(event.target.value)
                )
              }
              type="text"
              inputMode="numeric"
              maxLength={9}
              placeholder="05/122039"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />

            <span className="mt-1 block text-xs text-slate-500">
              Formato obrigatório: 00/000000
            </span>
          </label>

          <Input
            name="customer_name"
            label="Nome / Razão Social do pagador"
            placeholder="Nome completo ou razão social"
            required
          />

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              CPF / CNPJ
            </span>

            <input
              name="customer_document"
              value={document}
              onChange={(event) =>
                setDocument(
                  formatDocument(event.target.value)
                )
              }
              inputMode="numeric"
              maxLength={18}
              placeholder="CPF ou CNPJ"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </label>

          <Input
            name="customer_email"
            label="E-mail"
            type="email"
            placeholder="cliente@email.com"
          />

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Telefone
            </span>

            <input
              name="customer_phone"
              value={phone}
              onChange={(event) =>
                setPhone(
                  formatPhone(event.target.value)
                )
              }
              type="tel"
              inputMode="tel"
              maxLength={15}
              placeholder="(00) 00000-0000"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </label>

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
            min={getToday()}
            required
          />
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Observações
          </label>

          <textarea
            name="observations"
            rows={4}
            maxLength={500}
            placeholder="Adicione observações, se necessário"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6">
          <h2 className="font-semibold text-slate-900">
            Formas disponíveis no link
          </h2>

          <p className="mb-4 mt-1 text-sm text-slate-500">
            Selecione as formas de pagamento disponíveis.
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
              checked={methods.includes(
                "credit_card"
              )}
              onChange={() =>
                toggleMethod("credit_card")
              }
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
