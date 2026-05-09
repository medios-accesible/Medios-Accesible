"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  role: "admin" | "client";
};

export default function AdminClientsPage() {
  const router = useRouter();

  const [clients, setClients] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClients() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session?.user) {
        router.push("/login");
        return;
      }

      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", sessionData.session.user.id)
        .single();

      if (!adminProfile || adminProfile.role !== "admin") {
        router.push("/client");
        return;
      }

      const { data: clientData } = await supabase
        .from("profiles")
        .select("id, email, full_name, company_name, role")
        .eq("role", "client")
        .order("created_at", { ascending: false });

      setClients((clientData || []) as Profile[]);
      setLoading(false);
    }

    loadClients();
  }, [router]);

  if (loading) {
    return (
      <main className="portal-page">
        <section className="portal-card">
          <p>Loading clients...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="portal-page">
      <section className="portal-shell">
        <header className="portal-header">
          <div>
            <p className="portal-kicker">Admin Clients</p>
            <h1>Client Workspaces</h1>
            <p>Open a client to manage their project and private messages.</p>
          </div>

          <div className="portal-header-actions">
            <Link className="portal-link" href="/">
              Home
            </Link>

            <Link className="portal-link" href="/admin">
              ← Admin
            </Link>
          </div>
        </header>

        <article className="portal-card">
          <h2>All Clients</h2>

          {clients.length === 0 ? (
            <p>No clients found.</p>
          ) : (
            <div className="portal-list">
              {clients.map((client) => (
                <Link
                  href={`/admin/clients/${client.id}`}
                  className="portal-list-item portal-clickable"
                  key={client.id}
                >
                  <div>
                    <h3>{client.full_name || client.company_name || "Client"}</h3>
                    <p>{client.email}</p>
                  </div>

                  <span>Open →</span>
                </Link>
              ))}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
