"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    const redirectTo = `${window.location.origin}/update-password`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMessage("Password reset email sent. Check your inbox.");
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <img
            src="https://res.cloudinary.com/dovrzmlqj/image/upload/v1778281428/my-company-logo_gavksa.png"
            alt="Medios Accesible logo"
          />
          <span>Medios Accesible</span>
        </div>

        <h1>Reset Password</h1>
        <p>Enter your email and we will send you a password reset link.</p>

        <form onSubmit={handleReset} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@email.com"
              required
            />
          </label>

          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-message">{message}</div>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Email"}
          </button>
        </form>

        <a className="auth-link" href="/login">
          Back to login
        </a>
      </section>
    </main>
  );
}
