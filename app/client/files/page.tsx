"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ClientMobileNav from "../../../components/ClientMobileNav";
import { supabase } from "../../../lib/supabaseClient";

type Profile = {
  id: string;
  email: string;
  role: "admin" | "client";
};

type ClientFile = {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_category: string | null;
  uploaded_by: string | null;
  created_at: string;
};

const FILE_BUCKET = "client-files";
const MAX_FILE_SIZE = 12 * 1024 * 1024;

function cleanFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

function formatDate(value?: string | null) {
  if (!value) return "Pending";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function ClientFilesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  async function loadFiles() {
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

    if (profileData.role === "admin") {
      router.push("/admin");
      return;
    }

    setProfile(profileData as Profile);

    const { data } = await supabase
      .from("client_files")
      .select("id, file_name, file_url, file_type, file_category, uploaded_by, created_at")
      .eq("client_id", userId)
      .order("created_at", { ascending: false });

    setFiles((data || []) as ClientFile[]);
    setLoading(false);
  }

  useEffect(() => {
    loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    if (!file || !profile) return;

    if (file.size > MAX_FILE_SIZE) {
      alert("File is too large. Please upload a file under 12 MB.");
      event.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const safeName = cleanFileName(file.name);
      const filePath = `${profile.id}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage.from(FILE_BUCKET).upload(filePath, file, {
        cacheControl: "3600",
        upsert: false
      });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from(FILE_BUCKET).getPublicUrl(filePath);

      await supabase.from("client_files").insert({
        client_id: profile.id,
        uploaded_by: "client",
        file_name: file.name,
        file_url: publicUrlData.publicUrl,
        file_type: file.type,
        file_category: file.type.startsWith("image/") ? "image" : "document"
      });

      await loadFiles();
    } catch (error) {
      const message = error instanceof Error ? error.message : "File upload failed.";
      alert(message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  if (loading) {
    return (
      <main className="client-app-page">
        <section className="client-app-loading-card"><p>Loading files...</p></section>
      </main>
    );
  }

  return (
    <main className="client-app-page">
      <section className="client-app-shell">
        <header className="client-app-page-header">
          <div>
            <p className="client-app-kicker">Files</p>
            <h1>Project Files</h1>
            <p>View graphics, photos, and documents uploaded for your project.</p>
          </div>
          <Link href="/client" aria-label="Back to portal home">⌂</Link>
        </header>

        <label className="client-app-upload-card">
          <input type="file" onChange={handleUpload} disabled={uploading} />
          <span aria-hidden="true">＋</span>
          <strong>{uploading ? "Uploading..." : "Upload a file"}</strong>
          <p>Photos, graphics, PDFs, and project files.</p>
        </label>

        <section className="client-app-list-card">
          <div className="client-app-card-head">
            <div>
              <p className="client-app-kicker">Library</p>
              <h2>Uploaded Files</h2>
            </div>
            <strong>{files.length}</strong>
          </div>

          {files.length === 0 ? (
            <p className="client-app-empty-state">No files yet. Uploaded files will appear here.</p>
          ) : (
            <div className="client-app-file-grid">
              {files.map((file) => (
                <a className="client-app-file-card" href={file.file_url} target="_blank" rel="noreferrer" key={file.id}>
                  <span aria-hidden="true">{file.file_type?.startsWith("image/") ? "🖼️" : "📄"}</span>
                  <div>
                    <strong>{file.file_name}</strong>
                    <p>{file.file_category || "File"} · {formatDate(file.created_at)}</p>
                  </div>
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
