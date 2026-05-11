"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ClientMobileNav from "../../../components/ClientMobileNav";
import { supabase } from "../../../lib/supabaseClient";

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  role: "admin" | "client";
};

export default function ClientSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
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

      const loaded = profileData as Profile;
      setProfile(loaded);
      setFullName(loaded.full_name || "");
      setCompanyName(loaded.company_name || "");
      setLoading(false);
    }

    loadSettings();
  }, [router]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName || null,
        company_name: companyName || null
      })
      .eq("id", profile.id);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Profile updated. Phone, website, and profile picture fields need matching Supabase columns/storage before saving.");
  }

  if (loading) {
    return <main className="client-app-page"><section className="client-app-loading-card"><p>Loading settings...</p></section></main>;
  }

  return (
    <main className="client-app-page">
      <section className="client-app-shell">
        <header className="client-app-page-header">
          <div>
            <p className="client-app-kicker">Settings</p>
            <h1>Profile</h1>
            <p>Edit your client information.</p>
          </div>
          <Link href="/client" aria-label="Back to portal home">⌂</Link>
        </header>

        <form className="client-app-settings-card" onSubmit={handleSave}>
          <label className="client-app-avatar-upload">
            <input type="file" accept="image/*" disabled />
            <span aria-hidden="true">＋</span>
            <strong>Profile Picture</strong>
            <p>Storage connection can be added next.</p>
          </label>

          <label>
            <span>Name</span>
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your name" />
          </label>

          <label>
            <span>Company</span>
            <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="Company name" />
          </label>

          <label>
            <span>Email</span>
            <input value={profile?.email || ""} disabled />
          </label>

          <label>
            <span>Phone Number</span>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Add phone number" />
          </label>

          <label>
            <span>Website Link</span>
            <input value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} placeholder="https://yourwebsite.com" />
          </label>

          <button className="client-app-primary-button" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </section>

      <ClientMobileNav />
    </main>
  );
}
