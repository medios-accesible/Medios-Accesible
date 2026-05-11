"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function redirectByRole(userId: string) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError) {
      setError("Login worked, but profile could not be loaded.");
      setCheckingSession(false);
      return;
    }

    if (profile?.role === "admin") {
      router.replace("/admin");
      return;
    }

    router.replace("/client");
  }

  useEffect(() => {
    async function checkExistingSession() {
      const params = new URLSearchParams(window.location.search);
      const confirmed = params.get("confirmed") === "true";
      const reset = params.get("reset") === "success";
      const authError = params.get("authError");

      if (authError) {
        setError(decodeURIComponent(authError));
        setCheckingSession(false);
        return;
      }

      if (confirmed) {
        await supabase.auth.signOut();
        setMessage("Email confirmed. You can now sign in to your portal.");
        setCheckingSession(false);
        return;
      }

      if (reset) {
        await supabase.auth.signOut();
        setMessage("Password updated. Sign in with your new password.");
        setCheckingSession(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (user) {
        await redirectByRole(user.id);
        return;
      }

      setCheckingSession(false);
    }

    checkExistingSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (mode === "signup") {
        const emailRedirectTo = `${window.location.origin}/login?confirmed=true`;

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo,
            data: {
              full_name: fullName,
              company_name: companyName
            }
          }
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        if (data.user) {
          await supabase
            .from("profiles")
            .update({
              full_name: fullName,
              company_name: companyName
            })
            .eq("id", data.user.id);
        }

        setMessage("Account created. Check your email to confirm your account, then sign in.");
        setMode("login");
        setPassword("");
        return;
      }

      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (loginError) {
        setError(loginError.message);
        return;
      }

      if (data.user) {
        await redirectByRole(data.user.id);
      }
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
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

          <h1>Opening Portal</h1>
          <p>Checking your secure session...</p>
        </section>
      </main>
    );
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

        <h1>{mode === "login" ? "Client Login" : "Create Account"}</h1>
        <p>
          {mode === "login"
            ? "Sign in to view your project, messages, updates, and billing."
            : "Create your client portal account. New accounts start as client accounts."}
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setError("");
              setMessage("");
            }}
          >
            Sign In
          </button>

          <button
            type="button"
            className={mode === "signup" ? "active" : ""}
            onClick={() => {
              setMode("signup");
              setError("");
              setMessage("");
            }}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "signup" && (
            <>
              <label>
                Full Name
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your name"
                  required
                />
              </label>

              <label>
                Company Name
                <input
                  type="text"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  placeholder="Business name"
                />
              </label>
            </>
          )}

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

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              required
            />
          </label>

          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-message">{message}</div>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <a className="auth-link" href="/reset-password">
          Forgot password? Reset by email
        </a>

        <a className="auth-back" href="/">
          ← Back to Home
        </a>
      </section>
    </main>
  );
}
