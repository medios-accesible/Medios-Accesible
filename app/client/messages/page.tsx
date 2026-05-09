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

type Project = {
  id: string;
  title: string;
  status: string;
  stage: string;
  progress: number;
};

type Message = {
  id: string;
  project_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export default function ClientMessagesPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageBody, setMessageBody] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  async function loadMessages() {
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

    const { data: projectData, error: projectError } = await supabase
      .from("client_projects")
      .select("id, title, status, stage, progress")
      .eq("client_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (projectError || !projectData) {
      setProject(null);
      setMessages([]);
      setLoading(false);
      return;
    }

    setProject(projectData as Project);

    const { data: messageData } = await supabase
      .from("messages")
      .select("id, project_id, sender_id, body, created_at")
      .eq("project_id", projectData.id)
      .order("created_at", { ascending: true });

    setMessages((messageData || []) as Message[]);
    setLoading(false);
  }

  useEffect(() => {
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!project || !profile || !messageBody.trim()) return;

    setSending(true);

    const { error } = await supabase.from("messages").insert({
      project_id: project.id,
      sender_id: profile.id,
      body: messageBody.trim()
    });

    setSending(false);

    if (error) {
      alert(error.message);
      return;
    }

    setMessageBody("");
    await loadMessages();
  }

  if (loading) {
    return (
      <main className="portal-page">
        <section className="portal-card">
          <p>Loading messages...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="portal-page">
      <section className="portal-shell">
        <header className="portal-header">
          <div>
            <p className="portal-kicker">Client Messages</p>
            <h1>Messages</h1>
            <p>{profile?.email}</p>
          </div>

          <Link className="portal-link" href="/client">
            ← Client Home
          </Link>
        </header>

        <article className="portal-card">
          {!project ? (
            <p>No project has been assigned yet. Messaging will activate after your project is created.</p>
          ) : (
            <>
              <h2>{project.title}</h2>
              <p>
                {project.stage} · {project.status} · {project.progress}%
              </p>

              <div className="message-thread">
                {messages.length === 0 ? (
                  <p>No messages yet.</p>
                ) : (
                  messages.map((message) => {
                    const isClient = message.sender_id === profile?.id;

                    return (
                      <div
                        className={`message-bubble ${
                          isClient ? "client-message" : "admin-message"
                        }`}
                        key={message.id}
                      >
                        <span>{isClient ? "You" : "Medios Accesible"}</span>
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
                  placeholder="Write your message..."
                  required
                />

                <button className="auth-submit" type="submit" disabled={sending}>
                  {sending ? "Sending..." : "Send Message"}
                </button>
              </form>
            </>
          )}
        </article>
      </section>
    </main>
  );
}
