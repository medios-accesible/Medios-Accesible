"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  role: "admin" | "client";
};

type Project = {
  id: string;
  title: string;
  status: string;
  stage: string;
  progress: number;
  plan: string | null;
  monthly_price: number | null;
  site_url: string | null;
  created_at?: string;
};

type MessageNotification = {
  id: string;
  project_id: string;
  sender_id: string;
  body?: string | null;
  read_at: string | null;
  created_at: string;
};

type ProjectUpdate = {
  id: string;
  project_id: string;
  title: string;
  summary: string;
  update_type: string;
  current_stage: string | null;
  progress_snapshot: number | null;
  completed_work: string | null;
  next_steps: string | null;
  client_action_needed: string | null;
  blockers: string | null;
  estimated_completion: string | null;
  created_at: string;
};

type DeveloperPresence = {
  id: string;
  is_logged_in: boolean | null;
  last_seen_at: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "Not updated yet";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function getGreetingName(profile: Profile | null) {
  return profile?.full_name || profile?.company_name || "Client";
}

export default function ClientDashboardPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [latestUpdates, setLatestUpdates] = useState<ProjectUpdate[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<MessageNotification[]>([]);
  const [developerAtDesk, setDeveloperAtDesk] = useState(false);
  const [loading, setLoading] = useState(true);

  const activeProject = projects[0] || null;
  const primaryUpdate = latestUpdates[0] || null;

  const monthlyTotal = useMemo(() => {
    return projects.reduce((sum, project) => sum + Number(project.monthly_price || 0), 0);
  }, [projects]);

  useEffect(() => {
    async function loadClientDashboard() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session?.user) {
        router.push("/login");
        return;
      }

      const userId = sessionData.session.user.id;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, email, full_name, company_name, role")
        .eq("id", userId)
        .single();

      if (!profileData) {
        router.push("/login");
        return;
      }

      if (profileData.role === "admin") {
        router.push("/admin");
        return;
      }

      setProfile(profileData as Profile);

      const { data: projectData } = await supabase
        .from("client_projects")
        .select("id, title, status, stage, progress, plan, monthly_price, site_url, created_at")
        .eq("client_id", userId)
        .order("created_at", { ascending: false });

      const loadedProjects = (projectData || []) as Project[];
      setProjects(loadedProjects);

      const projectIds = loadedProjects.map((project) => project.id);

      if (projectIds.length > 0) {
        const { data: updateData } = await supabase
          .from("project_updates")
          .select(
            "id, project_id, title, summary, update_type, current_stage, progress_snapshot, completed_work, next_steps, client_action_needed, blockers, estimated_completion, created_at"
          )
          .in("project_id", projectIds)
          .eq("is_visible_to_client", true)
          .order("created_at", { ascending: false })
          .limit(6);

        setLatestUpdates((updateData || []) as ProjectUpdate[]);

        const { data: messageData } = await supabase
          .from("messages")
          .select("id, project_id, sender_id, body, read_at, created_at")
          .in("project_id", projectIds)
          .is("read_at", null)
          .neq("sender_id", userId)
          .order("created_at", { ascending: false })
          .limit(8);

        setUnreadMessages((messageData || []) as MessageNotification[]);
      } else {
        setLatestUpdates([]);
        setUnreadMessages([]);
      }

      const { data: presenceData } = await supabase
        .from("developer_presence")
        .select("id, is_logged_in, last_seen_at")
        .eq("id", "main")
        .maybeSingle();

      const presence = presenceData as DeveloperPresence | null;
      setDeveloperAtDesk(Boolean(presence?.is_logged_in));

      setLoading(false);
    }

    loadClientDashboard();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="portal-dashboard-page">
        <section className="portal-dashboard-loading">
          <p>Loading client portal...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="portal-dashboard-page">
      <aside className="portal-sidebar">
        <Link className="portal-sidebar-brand" href="/">
          <div className="portal-brand-mark">&lt;/&gt;</div>
          <div>
            <strong>{getGreetingName(profile)}</strong>
            <span>Client Portal</span>
          </div>
        </Link>

        <nav className="portal-sidebar-nav">
          <Link className="active" href="/client">
            <span>▦</span> Dashboard
          </Link>
          <a href="#active-project">
            <span>□</span> Projects
          </a>
          <Link href="/client/messages">
            <span>☵</span> Messages
            {unreadMessages.length > 0 && <b>{unreadMessages.length}</b>}
          </Link>
          <a href="#project-updates">
            <span>◎</span> Updates
          </a>
          <a href="#files">
            <span>▱</span> Files
          </a>
          <a href="#billing">
            <span>▣</span> Invoices
          </a>
          <a href="#settings">
            <span>⚙</span> Settings
          </a>
        </nav>

        <div className="portal-sidebar-actions">
          <p>Quick Actions</p>

          <Link href="/client/messages">
            <span>＋</span> New Message
          </Link>

          <Link href="/client/messages">
            <span>⟳</span> Request Update
          </Link>
        </div>

        <div className="portal-sidebar-help">
          <p>Need help?</p>
          <span>We&apos;re here to help you</span>
          <a href="mailto:mediosaccesible@gmail.com">Contact Support</a>
        </div>
      </aside>

      <section className="portal-dashboard-main">
        <header className="portal-dashboard-header">
          <div>
            <p>Welcome back,</p>
            <h1>{getGreetingName(profile)} <span>👋</span></h1>
            <span>{profile?.email}</span>
          </div>

          <div className="portal-header-actions">
            <Link className="portal-top-button is-home" href="/">
              ⌂ Home
            </Link>

            <button className="portal-top-button" onClick={handleSignOut}>
              ⎋ Sign Out →
            </button>
          </div>
        </header>

        <div className="portal-stat-grid">
          <article className="portal-stat-card">
            <div className="portal-stat-icon">□</div>
            <div>
              <span>Active Projects</span>
              <strong>{projects.length}</strong>
              <p><i></i> Currently in progress</p>
            </div>
          </article>

          <article className="portal-stat-card">
            <div className="portal-stat-icon">☵</div>
            <div>
              <span>Messages</span>
              <strong>{unreadMessages.length}</strong>
              <p><i></i> Unread messages</p>
            </div>
          </article>

          <article className="portal-stat-card">
            <div className="portal-stat-icon">♢</div>
            <div>
              <span>Updates</span>
              <strong>{latestUpdates.length}</strong>
              <p><i></i> Recent updates</p>
            </div>
          </article>

          <article className="portal-stat-card" id="billing">
            <div className="portal-stat-icon">▣</div>
            <div>
              <span>Next Payment</span>
              <strong>{monthlyTotal > 0 ? `$${monthlyTotal}` : "Pending"}</strong>
              <p><i></i> Due date appears here</p>
            </div>
          </article>
        </div>

        <div className="portal-content-grid">
          <div className="portal-left-column">
            <article className="portal-dashboard-panel" id="active-project">
              <div className="portal-panel-head">
                <h2>Your Active Project</h2>
              </div>

              {activeProject ? (
                <div className="client-active-project-card">
                  <div className="client-project-header">
                    <div className="client-project-logo">◎</div>

                    <div>
                      <h3>{activeProject.title}</h3>
                      <p>{activeProject.stage}</p>
                    </div>

                    <span className="portal-status-pill">{activeProject.status}</span>
                  </div>

                  <div className="client-project-progress-area">
                    <div>
                      <span>Progress</span>
                      <strong>{activeProject.progress}%</strong>
                    </div>

                    <div className="portal-progress-bar">
                      <span style={{ width: `${activeProject.progress}%` }}></span>
                    </div>
                  </div>

                  <div className="project-data-grid">
                    <div>
                      <span>Project Status</span>
                      <strong>{activeProject.stage}</strong>
                    </div>

                    <div>
                      <span>Update Queue</span>
                      <strong>{primaryUpdate?.title || "No update yet"}</strong>
                    </div>

                    <div>
                      <span>Current Plan</span>
                      <strong>
                        {activeProject.monthly_price
                          ? `$${activeProject.monthly_price}/mo`
                          : activeProject.plan || "Active"}
                      </strong>
                    </div>

                    <div>
                      <span>Preview Link</span>
                      <strong>{activeProject.site_url ? "Ready" : "Pending"}</strong>
                    </div>

                    <div>
                      <span>Next Steps</span>
                      <strong>{primaryUpdate?.next_steps || "Waiting for update"}</strong>
                    </div>

                    <div>
                      <span>Last Updated</span>
                      <strong>{formatDate(primaryUpdate?.created_at)}</strong>
                    </div>
                  </div>

                  <div className="portal-card-actions">
                    {activeProject.site_url ? (
                      <a href={activeProject.site_url} target="_blank" rel="noreferrer">
                        View Project Details →
                      </a>
                    ) : (
                      <Link href="/client/messages">View Project Details →</Link>
                    )}

                    <Link className="ghost" href="/client/messages">
                      Request an Update ⟳
                    </Link>
                  </div>
                </div>
              ) : (
                <p>No projects have been assigned yet.</p>
              )}
            </article>

            <article className="portal-dashboard-panel">
              <div className="portal-panel-head">
                <h2>Messages</h2>
                <Link href="/client/messages">View all messages →</Link>
              </div>

              {unreadMessages.length === 0 ? (
                <p>No unread messages.</p>
              ) : (
                <div className="portal-message-list">
                  {unreadMessages.slice(0, 3).map((message) => (
                    <Link href="/client/messages" className="portal-message-row" key={message.id}>
                      <div className="portal-avatar">MA</div>

                      <div>
                        <strong>Medios Accesible</strong>
                        <p>{message.body || "Project message received."}</p>
                      </div>

                      <time>{formatDate(message.created_at)}</time>
                      <i></i>
                    </Link>
                  ))}
                </div>
              )}

              <Link className="portal-secondary-button" href="/client/messages">
                Open All Messages →
              </Link>
            </article>

            <article className="portal-dashboard-panel developer-portal-panel">
              <h2>Developer Status</h2>

              <div className="developer-status-layout">
                <div className="developer-status-avatar">♙</div>

                <div>
                  <strong className={developerAtDesk ? "is-online" : "is-away"}>
                    {developerAtDesk ? "At desk" : "Away from desk"}
                  </strong>

                  <p>
                    {developerAtDesk
                      ? "The developer is currently at his desk. Message me here in the client portal."
                      : "The developer is currently away from his desk. Please call or send email for a timely response."}
                  </p>
                </div>
              </div>

              <div className="portal-card-actions">
                <a href="tel:+17879074302">Call (787) 907-4302</a>
                <a className="ghost" href="mailto:mediosaccesible@gmail.com">Send Email</a>
              </div>
            </article>
          </div>

          <aside className="portal-right-column">
            <article className="portal-dashboard-panel" id="project-updates">
              <div className="portal-panel-head">
                <h2>Project Updates</h2>
                <a href="#project-updates">View all updates →</a>
              </div>

              {primaryUpdate ? (
                <div className="portal-update-card">
                  <div className="portal-update-meta">
                    <span>{primaryUpdate.update_type}</span>
                    <time>{formatDate(primaryUpdate.created_at)}</time>
                  </div>

                  <h3>{primaryUpdate.title}</h3>
                  <p>{primaryUpdate.summary}</p>

                  <div className="portal-update-detail">
                    <strong>Completed:</strong>
                    <p>{primaryUpdate.completed_work || "N/A"}</p>
                  </div>

                  <div className="portal-update-detail">
                    <strong>Next:</strong>
                    <p>{primaryUpdate.next_steps || "N/A"}</p>
                  </div>

                  <div className="portal-update-detail highlight">
                    <strong>Action needed from you:</strong>
                    <p>{primaryUpdate.client_action_needed || "N/A"}</p>
                  </div>

                  <div className="portal-update-detail warning">
                    <strong>Blockers:</strong>
                    <p>{primaryUpdate.blockers || "N/A"}</p>
                  </div>

                  <div className="portal-update-detail">
                    <strong>Timing:</strong>
                    <p>{primaryUpdate.estimated_completion || "Unknown at this time"}</p>
                  </div>
                </div>
              ) : (
                <p>No project updates posted yet.</p>
              )}
            </article>

            <article className="portal-dashboard-panel" id="files">
              <h2>Need Help?</h2>
              <p>We&apos;re here to support you</p>

              <div className="portal-help-list">
                <a href="mailto:mediosaccesible@gmail.com">
                  <span>✉</span>
                  <div>
                    <strong>Email</strong>
                    <p>mediosaccesible@gmail.com</p>
                  </div>
                </a>

                <a href="tel:+17879074302">
                  <span>☏</span>
                  <div>
                    <strong>Phone</strong>
                    <p>(787) 907-4302</p>
                  </div>
                </a>

                <div>
                  <span>◷</span>
                  <div>
                    <strong>Hours</strong>
                    <p>Mon - Fri: 8:00am - 6:00pm</p>
                  </div>
                </div>
              </div>

              <a className="portal-secondary-button" href="mailto:mediosaccesible@gmail.com">
                Contact Support →
              </a>
            </article>
          </aside>
        </div>

        <footer className="portal-dashboard-footer">
          © 2026 Medios Accesible. All rights reserved.
        </footer>
      </section>
    </main>
  );
}
