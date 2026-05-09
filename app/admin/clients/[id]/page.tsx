"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";

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
  client_id: string;
};

type Message = {
  id: string;
  project_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export default function AdminClientWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const clientId = String(params.id);

  const [adminProfile, setAdminProfile] = useState<Profile | null>(null);
  const [client, setClient] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const [messageBody, setMessageBody] = useState("");
  const [newProjectTitle, setNewProjectTitle] = useState("Website Build");
  const [newProjectPlan, setNewProjectPlan] = useState("Grow");
  const [newProjectPrice, setNewProjectPrice] = useState("300");

  const [loading, setLoading] = useState(true);
  const [savingProject, setSavingProject] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  async function loadWorkspace() {
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

    if (!profileData || profileData.role !== "admin") {
      router.push("/client");
      return;
    }

    setAdminProfile(profileData as Profile);

    const { data: clientData } = await supabase
      .from("profiles")
      .select("id, email, full_name, company_name, role")
      .eq("id", clientId)
      .single();

    setClient((clientData || null) as Profile | null);

    const { data: projectData } = await supabase
      .from("client_projects")
      .select("id, title, status, stage, progress, plan, monthly_price, client_id")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    const loadedProjects = (projectData || []) as Project[];
    setProjects(loadedProjects);

    const firstProject = loadedProjects[0] || null;
    setSelectedProject(firstProject);

    if (firstProject) {
      const { data: messageData } = await supabase
        .from("messages")
        .select("id, project_id, sender_id, body, created_at")
        .eq("project_id", firstProject.id)
        .order("created_at", { ascending: true });

      setMessages((messageData || []) as Message[]);
    } else {
      setMessages([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function selectProject(project: Project) {
    setSelectedProject(project);

    const { data: messageData } = await supabase
      .from("messages")
      .select("id, project_id, sender_id, body, created_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: true });

    setMessages((messageData || []) as Message[]);
  }

  async function createProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSavingProject(true);

    const { error } = await supabase.from("client_projects").insert({
      client_id: clientId,
      title: newProjectTitle,
      status: "active",
      stage: "Onboarding",
      progress: 10,
      plan: newProjectPlan,
      monthly_price: Number(newProjectPrice)
    });

    setSavingProject(false);

    if (error) {
      alert(error.message);
      return;
    }

    await loadWorkspace();
  }

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProject || !adminProfile || !messageBody.trim()) return;

    setSendingMessage(true);

    const { error } = await supabase.from("messages").insert({
      project_id: selectedProject.id,
      sender_id: adminProfile.id,
      body: messageBody.trim()
    });

    setSendingMessage(false);

    if (error) {
      alert(error.message);
      return;
    }

    setMessageBody("");

    const { data: messageData } = await supabase
      .from("messages")
      .select("id, project_id, sender_id, body, created_at")
      .eq("project_id", selectedProject.id)
      .order("created_at", { ascending: true });

    setMessages((messageData || []) as Message[]);
  }

  if (loading) {
    return (
      <main className="portal-page">
        <section className="portal-card">
          <p>Loading client workspace...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="portal-page">
      <section className="portal-shell">
        <header className="portal-header">
          <div>
            <p className="portal-kicker">Client Workspace</p>
            <h1>{client?.full_name || client?.company_name || "Client"}</h1>
            <p>{client?.email}</p>
          </div>

          <Link className="portal-link" href="/admin">
            ← Admin Home
          </Link>
        </header>

        <div className="portal-grid portal-grid-two">
          <article className="portal-card">
            <h2>Projects</h2>

            {projects.length === 0 ? (
              <p>No project exists for this client yet.</p>
            ) : (
              <div className="portal-list">
                {projects.map((project) => (
                  <button
                    type="button"
                    className="portal-list-item portal-clickable"
                    key={project.id}
                    onClick={() => selectProject(project)}
                  >
                    <div>
                      <h3>{project.title}</h3>
                      <p>
                        {project.stage} · {project.status}
                      </p>
                    </div>

                    <strong>{project.progress}%</strong>
                  </button>
                ))}
              </div>
            )}

            <form className="portal-form" onSubmit={createProject}>
              <h3>Create Project</h3>

              <label>
                Project Title
                <input
                  value={newProjectTitle}
                  onChange={(event) => setNewProjectTitle(event.target.value)}
                  required
                />
              </label>

              <label>
                Plan
                <input
                  value={newProjectPlan}
                  onChange={(event) => setNewProjectPlan(event.target.value)}
                />
              </label>

              <label>
                Monthly Price
                <input
                  type="number"
                  value={newProjectPrice}
                  onChange={(event) => setNewProjectPrice(event.target.value)}
                />
              </label>

              <button className="auth-submit" type="submit" disabled={savingProject}>
                {savingProject ? "Creating..." : "Create Project"}
              </button>
            </form>
          </article>

          <article className="portal-card">
            <h2>Private Messages</h2>

            {!selectedProject ? (
              <p>Create or select a project before messaging.</p>
            ) : (
              <>
                <p>
                  Messaging for <strong>{selectedProject.title}</strong>
                </p>

                <div className="message-thread">
                  {messages.length === 0 ? (
                    <p>No messages yet.</p>
                  ) : (
                    messages.map((message) => {
                      const isAdmin = message.sender_id === adminProfile?.id;

                      return (
                        <div
                          className={`message-bubble ${
                            isAdmin ? "admin-message" : "client-message"
                          }`}
                          key={message.id}
                        >
                          <span>{isAdmin ? "You" : client?.full_name || "Client"}</span>
                          <p>{message.body}</p>
                        </div>
                      );
                    })
                  )}
                </div>

                <form className="message-form" onSubmit={sendMessage}>
                  <textarea
                    value={messageBody}
                    onChange={(event) => setMessageBody(event.target.value)}
                    placeholder="Write a message to this client..."
                    required
                  />

                  <button className="auth-submit" type="submit" disabled={sendingMessage}>
                    {sendingMessage ? "Sending..." : "Send Message"}
                  </button>
                </form>
              </>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}
