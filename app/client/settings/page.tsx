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
  avatar_url: string | null;
  phone: string | null;
  website_url: string | null;
};

const PROFILE_BUCKET = "profile-pictures";
const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;

function getInitials(profile: Profile | null) {
  const source = profile?.full_name || profile?.company_name || profile?.email || "Client";
  return source
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function normalizeWebsiteUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export default function ClientSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session?.user) {
        router.push("/login");
        return;
      }

      const userId = sessionData.session.user.id;

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, company_name, role, avatar_url, phone, website_url")
        .eq("id", userId)
        .single();

      if (error) {
        alert(`${error.message}\n\nIf this mentions avatar_url, phone, or website_url, run the Supabase SQL file included with this update.`);
        router.push("/client");
        return;
      }

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
      setPhone(loaded.phone || "");
      setWebsiteUrl(loaded.website_url || "");
      setAvatarUrl(loaded.avatar_url || "");
      setLoading(false);
    }

    loadSettings();
  }, [router]);

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !profile) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      alert("Profile pictures must be 5MB or smaller.");
      return;
    }

    setUploadingAvatar(true);

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const cleanExtension = extension.replace(/[^a-z0-9]/g, "") || "jpg";
    const filePath = `${profile.id}/profile-picture.${cleanExtension}`;

    const { error: uploadError } = await supabase.storage
      .from(PROFILE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true
      });

    if (uploadError) {
      setUploadingAvatar(false);
      alert(`${uploadError.message}\n\nMake sure the profile-pictures storage bucket and policies are created in Supabase.`);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from(PROFILE_BUCKET)
      .getPublicUrl(filePath);

    const nextAvatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: nextAvatarUrl })
      .eq("id", profile.id);

    setUploadingAvatar(false);

    if (updateError) {
      alert(`${updateError.message}\n\nMake sure the profiles.avatar_url column exists.`);
      return;
    }

    setAvatarUrl(nextAvatarUrl);
    setProfile({ ...profile, avatar_url: nextAvatarUrl });
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        company_name: companyName.trim() || null,
        phone: phone.trim() || null,
        website_url: normalizeWebsiteUrl(websiteUrl) || null
      })
      .eq("id", profile.id);

    setSaving(false);

    if (error) {
      alert(`${error.message}\n\nIf this mentions phone or website_url, run the Supabase SQL file included with this update.`);
      return;
    }

    setProfile({
      ...profile,
      full_name: fullName.trim() || null,
      company_name: companyName.trim() || null,
      phone: phone.trim() || null,
      website_url: normalizeWebsiteUrl(websiteUrl) || null
    });
    setWebsiteUrl(normalizeWebsiteUrl(websiteUrl));
    alert("Profile updated.");
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
          <label className={`client-app-avatar-upload ${avatarUrl ? "has-image" : ""}`}>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleAvatarUpload} disabled={uploadingAvatar} />

            {avatarUrl ? (
              <img className="client-app-avatar-preview" src={avatarUrl} alt="Client profile picture" />
            ) : (
              <span aria-hidden="true">{getInitials(profile)}</span>
            )}

            <strong>{uploadingAvatar ? "Uploading..." : "Profile Picture"}</strong>
            <p>{uploadingAvatar ? "Please wait while the image uploads." : "Tap to upload a new image."}</p>
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

          <button className="client-app-primary-button" type="submit" disabled={saving || uploadingAvatar}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </section>

      <ClientMobileNav />
    </main>
  );
}
