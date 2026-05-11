"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ClientMobileNav from "../../../components/ClientMobileNav";
import { supabase } from "../../../lib/supabaseClient";

type Profile = { id: string; email: string; role: "admin" | "client" };
type ClientDocument = {
  id: string;
  document_title: string | null;
  document_type: string | null;
  document_url: string | null;
  status: string | null;
  requires_signature: boolean | null;
  signed_at: string | null;
  created_at: string;
};

function formatDate(value?: string | null) {
  if (!value) return "Not signed";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function ClientDocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDocuments() {
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

      const { data } = await supabase
        .from("client_documents")
        .select("id, document_title, document_type, document_url, status, requires_signature, signed_at, created_at")
        .eq("client_id", userId)
        .order("created_at", { ascending: false });

      setDocuments((data || []) as ClientDocument[]);
      setLoading(false);
    }

    loadDocuments();
  }, [router]);

  if (loading) {
    return <main className="client-app-page"><section className="client-app-loading-card"><p>Loading documents...</p></section></main>;
  }

  return (
    <main className="client-app-page">
      <section className="client-app-shell">
        <header className="client-app-page-header">
          <div>
            <p className="client-app-kicker">Documents</p>
            <h1>Contracts</h1>
            <p>Sign contracts, renewals, add-ons, and view previously signed records.</p>
          </div>
          <Link href="/client" aria-label="Back to portal home">⌂</Link>
        </header>

        <section className="client-app-action-grid is-three">
          <Link href="/client/documents">📝 Sign Contract</Link>
          <Link href="/client/documents">⟳ Renew Contract</Link>
          <Link href="/client/documents">＋ Add-on Contract</Link>
        </section>

        <section className="client-app-list-card">
          <div className="client-app-card-head">
            <div>
              <p className="client-app-kicker">Records</p>
              <h2>Signed & Pending Documents</h2>
            </div>
            <strong>{documents.length}</strong>
          </div>

          {documents.length === 0 ? (
            <p className="client-app-empty-state">No contracts are available yet. New agreements will appear here.</p>
          ) : (
            <div className="client-app-record-list">
              {documents.map((document) => (
                <a
                  className="client-app-record-row"
                  href={document.document_url || "#"}
                  target={document.document_url ? "_blank" : undefined}
                  rel={document.document_url ? "noreferrer" : undefined}
                  key={document.id}
                >
                  <span aria-hidden="true">📝</span>
                  <div>
                    <strong>{document.document_title || "Document"}</strong>
                    <p>{document.document_type || "Contract"} · {document.status || "Pending"}</p>
                  </div>
                  <b>{document.signed_at ? formatDate(document.signed_at) : document.requires_signature ? "Sign" : "View"}</b>
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
