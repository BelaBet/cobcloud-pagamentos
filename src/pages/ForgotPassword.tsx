import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold text-slate-900">
          Recuperar senha
        </h1>

        <p className="mb-6 text-sm text-slate-500">
          Informe seu e-mail e enviaremos um link pra redefinir sua senha.
        </p>

        {sent ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              Se esse e-mail estiver cadastrado, você vai receber um link
              pra redefinir sua senha em instantes.
            </div>

            <Link
              to="/login"
              className="block text-center text-sm font-medium text-violet-700 hover:underline"
            >
              Voltar pro login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                E-mail
              </span>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoFocus
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
              {submitting ? "Enviando..." : "Enviar link"}
            </button>

            <Link
              to="/login"
              className="block text-center text-sm font-medium text-slate-500 hover:underline"
            >
              Voltar pro login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
