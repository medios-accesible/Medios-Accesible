"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ClientMobileNav from "../../../components/ClientMobileNav";
import { supabase } from "../../../lib/supabaseClient";

type Profile = { id: string; email: string; role: "admin" | "client" };
type Project = { id: string; title: string; plan: string | null; monthly_price: number | null };
type Invoice = {
  id: string;
  invoice_number: string | null;
  invoice_title: string | null;
  amount: number | null;
  status: string | null;
  due_date: string | null;
  paid_at: string | null;
  invoice_url: string | null;
  created_at: string;
};

function formatMoney(value: number | null | undefined) {
  if (!value) return "$0";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return "Pending";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function ClientBillingPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const currentBillables = useMemo(() => projects.reduce((sum, project) => sum + Number(project.monthly_price || 0), 0), [projects]);
  const pastDue = useMemo(() => invoices.filter((invoice) => invoice.status === "past_due").reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0), [invoices]);
  const upcoming = useMemo(() => invoices.filter((invoice) => invoice.status === "upcoming" || invoice.status === "open").reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0), [invoices]);
  const buyoutCost = currentBillables > 0 ? currentBillables * 12 : 0;

  useEffect(() => {
    async function loadBilling() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session?.user) {
        router.push("/login");
        return;
      }

      const userId = sessionData.session.user.id;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, email, role")
        .eq("id", userId)
        .single();

      if (!profileData) {
        router.push("/login");
        return;
      }

      if ((profileData as Profile).role === "admin") {
        router.push("/admin");
        return;
      }

      const { data: projectData } = await supabase
        .from("client_projects")
        .select("id, title, plan, monthly_price")
        .eq("client_id", userId)
        .order("created_at", { ascending: false });

      setProjects((projectData || []) as Project[]);

      const { data: invoiceData } = await supabase
        .from("client_invoices")
        .select("id, invoice_number, invoice_title, amount, status, due_date, paid_at, invoice_url, created_at")
        .eq("client_id", userId)
        .order("created_at", { ascending: false });

      setInvoices((invoiceData || []) as Invoice[]);
      setLoading(false);
    }

    loadBilling();
  }, [router]);

  if (loading) {
    return <main className="client-app-page"><section className="client-app-loading-card"><p>Loading billing...</p></section></main>;
  }

  return (
    <main className="client-app-page">
      <section className="client-app-shell">
        <header className="client-app-page-header">
          <div>
            <p className="client-app-kicker">Billing</p>
            <h1>Invoices & Balance</h1>
            <p>Track current billables, balances, and past invoices.</p>
          </div>
          <Link href="/client" aria-label="Back to portal home">⌂</Link>
        </header>

        <section className="client-app-billing-grid">
          <article><span>Current Billables</span><strong>{formatMoney(currentBillables)}</strong></article>
          <article><span>Past Due Balance</span><strong>{formatMoney(pastDue)}</strong></article>
          <article><span>Upcoming Balance</span><strong>{formatMoney(upcoming)}</strong></article>
          <article><span>Website Buyout Cost</span><strong>{buyoutCost ? formatMoney(buyoutCost) : "TBD"}</strong></article>
        </section>

        <section className="client-app-list-card">
          <div className="client-app-card-head">
            <div>
              <p className="client-app-kicker">History</p>
              <h2>Past Billed Invoices</h2>
            </div>
            <strong>{invoices.length}</strong>
          </div>

          {invoices.length === 0 ? (
            <p className="client-app-empty-state">No invoices have been added yet.</p>
          ) : (
            <div className="client-app-record-list">
              {invoices.map((invoice) => (
                <a
                  className="client-app-record-row"
                  href={invoice.invoice_url || "#"}
                  target={invoice.invoice_url ? "_blank" : undefined}
                  rel={invoice.invoice_url ? "noreferrer" : undefined}
                  key={invoice.id}
                >
                  <span aria-hidden="true">💳</span>
                  <div>
                    <strong>{invoice.invoice_title || invoice.invoice_number || "Invoice"}</strong>
                    <p>{invoice.status || "Pending"} · Due {formatDate(invoice.due_date)}</p>
                  </div>
                  <b>{formatMoney(invoice.amount)}</b>
                </a>
              ))}
            </div>
          )}
        </section>
      </section>

      <ClientMobileNav />
    </main>
  );
}
