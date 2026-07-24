import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Quando o link do e-mail e aberto, o Supabase cria uma sessao
    // temporaria de recuperacao automaticamente (via hash da URL).
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");

    if (password.length < 6) {
      setErrorMessage("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.auth.updateUser({ password });

    setSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccess(true);

    setTimeout(() => navigate("/"), 2000);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold text-slate-900">
          Nova senha
        </h1>

        <p className="mb-6 text-sm text-slate-500">
          Escolha uma nova senha pra sua conta.
        </p>

        {!ready && (
          <p className="text-sm text-slate-500">
            Link inválido ou expirado. Solicite um novo link de recuperação.
          </p>
        )}

        {ready && success && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            Senha atualizada! Redirecionando...
          </div>
        )}

        {ready && !success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Nova senha
              </span>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
                autoFocus
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Confirmar nova senha
              </span>

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={6}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </label>

            {errorMessage && (
              <p className="text-sm text-red-600">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-violet-600 px-4 py-2.5 font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
            >
              {submitting ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
