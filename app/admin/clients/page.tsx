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

type ClientProject = {
  id: string;
  client_id: string;
};

type MessageNotification = {
  id: string;
  project_id: string;
  sender_id: string;
  read_at: string | null;
};

export default function AdminClientsPage() {
  const router = useRouter();

  const [adminId, setAdminId] = useState("");
  const [clients, setClients] = useState<Profile[]>([]);
  const [unreadByClient, setUnreadByClient] = useState<Record<string, number>>({});
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    async function setDeveloperLoggedIn() {
      await supabase.from("developer_presence").upsert({
        id: "main",
        is_logged_in: true,
        last_seen_at: new Date().toISOString()
      });
    }

    setDeveloperLoggedIn();
  }, []);

  useEffect(() => {
    async function loadClients() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session?.user) {
        router.push("/login");
        return;
      }

      const currentAdminId = sessionData.session.user.id;
      setAdminId(currentAdminId);

      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", currentAdminId)
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

      const loadedClients = (clientData || []) as Profile[];
      setClients(loadedClients);

      const { data: projectData } = await supabase
        .from("client_projects")
        .select("id, client_id");

      const projects = (projectData || []) as ClientProject[];
      const projectIds = projects.map((project) => project.id);
      const nextUnreadByClient: Record<string, number> = {};

      if (projectIds.length > 0) {
        const { data: unreadData } = await supabase
          .from("messages")
          .select("id, project_id, sender_id, read_at")
          .in("project_id", projectIds)
          .is("read_at", null)
          .neq("sender_id", currentAdminId);

        const unreadMessages = (unreadData || []) as MessageNotification[];

        unreadMessages.forEach((message) => {
          const project = projects.find((item) => item.id === message.project_id);
          if (!project) return;

          nextUnreadByClient[project.client_id] =
            (nextUnreadByClient[project.client_id] || 0) + 1;
        });
      }

      setUnreadByClient(nextUnreadByClient);
      setTotalUnread(
        Object.values(nextUnreadByClient).reduce((sum, count) => sum + count, 0)
      );

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

            {totalUnread > 0 && (
              <div className="notification-summary">
                {totalUnread} unread client message{totalUnread === 1 ? "" : "s"}
              </div>
            )}
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
          <h2>
            All Clients
            {totalUnread > 0 && <span className="notification-badge">{totalUnread}</span>}
          </h2>

          {clients.length === 0 ? (
            <p>No clients found.</p>
          ) : (
            <div className="portal-list">
              {clients.map((client) => {
                const unreadCount = unreadByClient[client.id] || 0;

                return (
                  <Link
                    href={`/admin/clients/${client.id}`}
                    className="portal-list-item portal-clickable"
                    key={client.id}
                  >
                    <div>
                      <h3>
                        {client.full_name || client.company_name || "Client"}
                        {unreadCount > 0 && (
                          <span className="notification-badge">{unreadCount}</span>
                        )}
                      </h3>
                      <p>{client.email}</p>
                    </div>

                    <span>{unreadCount > 0 ? `${unreadCount} New` : "Open →"}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
