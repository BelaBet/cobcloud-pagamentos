import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
} from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

type PaymentMethod = "pix" | "boleto" | "credit_card";

type SellerOption = {
  id: string;
  name: string;
  document: string;
  pagarme_recipient_id: string;
};

type FeeRule = {
  payment_method: PaymentMethod;
  acquirer_cost_type: "fixed" | "percentage";
  acquirer_cost_value: number;
  platform_margin_type: "fixed" | "percentage";
  platform_margin_value: number;
};

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

function documentTypeOf(value: string): "cpf" | "cnpj" {
  return onlyDigits(value).length === 14 ? "cnpj" : "cpf";
}

function getToday() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseBRLAmount(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return NaN;
  }

  // Se tem vírgula, ela é o separador decimal: remove pontos (milhar) e
  // troca a vírgula por ponto. Ex: "1.500,50" -> "1500.50"
  if (trimmed.includes(",")) {
    return Number(trimmed.replace(/\./g, "").replace(",", "."));
  }

  // Sem vírgula: assume que já está em formato numérico simples (ponto
  // como decimal, ou número inteiro).
  return Number(trimmed);
}

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function computeChargedCents(baseCents: number, rule: FeeRule) {
  const acquirerCents =
    rule.acquirer_cost_type === "fixed"
      ? Math.round(rule.acquirer_cost_value)
      : Math.round(baseCents * Number(rule.acquirer_cost_value));

  const marginCents =
    rule.platform_margin_type === "fixed"
      ? Math.round(rule.platform_margin_value)
      : Math.round(baseCents * Number(rule.platform_margin_value));

  return baseCents + acquirerCents + marginCents;
}

export default function Payments() {
  const navigate = useNavigate();

  const [sellers, setSellers] = useState<SellerOption[]>([]);
  const [loadingSellers, setLoadingSellers] = useState(true);
  const [sellerId, setSellerId] = useState("");

  const [feeRules, setFeeRules] = useState<FeeRule[]>([]);
  const [method, setMethod] = useState<PaymentMethod>("pix");

  const [processNumber, setProcessNumber] = useState("");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadSellers() {
      setLoadingSellers(true);

      const { data, error } = await supabase
        .from("sellers")
        .select("id, name, document, pagarme_recipient_id")
        .eq("active", true)
        .order("name", { ascending: true });

      if (!error) {
        setSellers((data ?? []) as SellerOption[]);
      }

      setLoadingSellers(false);
    }

    async function loadFeeRules() {
      const { data, error } = await supabase
        .from("fee_rules")
        .select(
          "payment_method, acquirer_cost_type, acquirer_cost_value, platform_margin_type, platform_margin_value"
        )
        .eq("active", true);

      if (!error) {
        setFeeRules((data ?? []) as FeeRule[]);
      }
    }

    loadSellers();
    loadFeeRules();
  }, []);

  const feePreview = useMemo(() => {
    const baseValue = parseBRLAmount(amountInput);

    if (!Number.isFinite(baseValue) || baseValue <= 0) {
      return null;
    }

    const baseCents = Math.round(baseValue * 100);
    const rule = feeRules.find((item) => item.payment_method === method);

    if (!rule) {
      return null;
    }

    const chargedCents = computeChargedCents(baseCents, rule);

    return {
      baseCents,
      chargedCents,
      extraCents: chargedCents - baseCents,
    };
  }, [amountInput, method, feeRules]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const payerName = String(form.get("payer_name") || "").trim();
    const payerEmail = String(form.get("payer_email") || "").trim();
    const amount = parseBRLAmount(amountInput);
    const dueDate = String(form.get("due_date") || "");

    if (!sellerId) {
      alert("Selecione o seller que vai receber esta cobrança.");
      return;
    }

    if (!/^\d{2}\/\d{6}$/.test(processNumber)) {
      alert("O Nº do Processo deve estar no formato 05/122039.");
      return;
    }

    if (!payerName) {
      alert("Informe o nome ou razão social do pagador.");
      return;
    }

    if (!isValidDocument(document)) {
      alert("Informe um CPF ou CNPJ válido para o pagador.");
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

    if (payerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payerEmail)) {
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
      alert("A data de vencimento não pode ser anterior à data atual.");
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase
      .from("payments")
      .insert({
        seller_id: sellerId,
        process_number: processNumber,

        payer_name: payerName,
        payer_document: onlyDigits(document),
        payer_document_type: documentTypeOf(document),
        payer_email: payerEmail || null,
        payer_phone: phoneDigits || null,

        description: String(form.get("description") || "").trim() || null,
        amount_cents: Math.round(amount * 100),
        due_date: dueDate,
        observations:
          String(form.get("observations") || "").trim() || null,

        payment_method: method,
      })
      .select()
      .single();

    if (error) {
      setSubmitting(false);
      alert("Erro ao gerar a cobrança: " + error.message);
      return;
    }

    const { error: fnError } = await supabase.functions.invoke(
      "generate-pagarme-charge",
      { body: { payment_id: data.id } }
    );

    setSubmitting(false);

    if (fnError) {
      alert(
        "A cobrança foi salva, mas houve um erro ao gerar no Pagar.me: " +
          fnError.message +
          "\n\nVocê pode conferir os detalhes na tela seguinte."
      );
    }

    navigate(`/payments/generated/${data.id}`);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Pagamentos</h1>

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
            Recebedor / Seller
          </h2>

          <p className="text-sm text-slate-500">
            Quem vai receber esta cobrança.
          </p>
        </div>

        <label className="mb-2 block text-sm font-medium text-slate-700">
          Selecione o seller
        </label>

        <select
          value={sellerId}
          onChange={(event) => setSellerId(event.target.value)}
          required
          disabled={loadingSellers}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        >
          <option value="">
            {loadingSellers
              ? "Carregando sellers..."
              : sellers.length === 0
                ? "Nenhum seller ativo cadastrado"
                : "Selecione..."}
          </option>

          {sellers.map((seller) => (
            <option key={seller.id} value={seller.id}>
              {seller.name} — {formatDocument(seller.document)} — {" "}
              {seller.pagarme_recipient_id}
            </option>
          ))}
        </select>

        {!loadingSellers && sellers.length === 0 && (
          <p className="mt-2 text-sm text-amber-600">
            Nenhum seller ativo encontrado. Cadastre um seller antes de criar
            uma cobrança.
          </p>
        )}

        <div className="mt-8 mb-6 border-t border-slate-200 pt-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Dados do pagador
          </h2>

          <p className="text-sm text-slate-500">
            Quem vai efetuar o pagamento desta cobrança.
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
                setProcessNumber(formatProcess(event.target.value))
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
            name="payer_name"
            label="Nome / Razão Social do pagador"
            placeholder="Nome completo ou razão social"
            required
          />

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              CPF / CNPJ
            </span>

            <input
              name="payer_document"
              value={document}
              onChange={(event) =>
                setDocument(formatDocument(event.target.value))
              }
              inputMode="numeric"
              maxLength={18}
              placeholder="CPF ou CNPJ"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </label>

          <Input
            name="payer_email"
            label="E-mail"
            type="email"
            placeholder="cliente@email.com"
          />

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Telefone
            </span>

            <input
              name="payer_phone"
              value={phone}
              onChange={(event) => setPhone(formatPhone(event.target.value))}
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

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Valor (o que o seller vai receber)
            </span>

            <input
              name="amount"
              value={amountInput}
              onChange={(event) => setAmountInput(event.target.value)}
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </label>

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
            Forma de pagamento
          </h2>

          <p className="mb-4 mt-1 text-sm text-slate-500">
            O pagador só verá o método escolhido aqui. Cartão parcelado ainda
            não é suportado — só à vista.
          </p>

          <div className="flex flex-wrap gap-3">
            <MethodRadio
              label="PIX"
              checked={method === "pix"}
              onChange={() => setMethod("pix")}
            />

            <MethodRadio
              label="Boleto"
              checked={method === "boleto"}
              onChange={() => setMethod("boleto")}
            />

            <MethodRadio
              label="Cartão de crédito (à vista)"
              checked={method === "credit_card"}
              onChange={() => setMethod("credit_card")}
            />
          </div>

          {feePreview && (
            <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50 p-4 text-sm">
              <div className="flex justify-between text-slate-700">
                <span>Seller recebe</span>
                <span className="font-medium">
                  {formatCurrency(feePreview.baseCents)}
                </span>
              </div>

              <div className="flex justify-between text-slate-700">
                <span>Custo + margem (repassado ao pagador)</span>
                <span className="font-medium">
                  {formatCurrency(feePreview.extraCents)}
                </span>
              </div>

              <div className="mt-2 flex justify-between border-t border-violet-200 pt-2 font-semibold text-violet-900">
                <span>Pagador paga</span>
                <span>{formatCurrency(feePreview.chargedCents)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
          >
            {submitting ? "Gerando..." : "Gerar pagamento"}
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

function MethodRadio({
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
        type="radio"
        name="payment_method_radio"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4"
      />

      <span className="text-sm font-medium text-slate-700">{label}</span>
    </label>
  );
}
