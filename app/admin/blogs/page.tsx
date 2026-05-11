"use client";

import Link from "next/link";
import AdminMobileNav from "../../../components/AdminMobileNav";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

type Blog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  category: string | null;
  background_url: string | null;
  is_published: boolean;
  is_home_featured: boolean;
  home_feature_order: number | null;
  created_at: string;
};

const BLOG_BUCKET = "blog-backgrounds";
const MAX_BLOG_IMAGE_SIZE = 6 * 1024 * 1024;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

export default function AdminBlogsPage() {
  const router = useRouter();

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Strategy");
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [isHomeFeatured, setIsHomeFeatured] = useState(false);
  const [homeFeatureOrder, setHomeFeatureOrder] = useState("1");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const homeFeaturedCount = useMemo(
    () => blogs.filter((blog) => blog.is_home_featured).length,
    [blogs]
  );

  useEffect(() => {
    async function updateDeveloperPresence() {
      await supabase.from("developer_presence").upsert({
        id: "main",
        is_logged_in: true,
        last_seen_at: new Date().toISOString()
      });
    }

    updateDeveloperPresence();
  }, []);

  useEffect(() => {
    async function loadAdmin() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session?.user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", sessionData.session.user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        router.push("/client");
        return;
      }

      await loadBlogs();
      setLoading(false);
    }

    loadAdmin();
  }, [router]);

  async function loadBlogs() {
    const { data } = await supabase
      .from("blogs")
      .select(
        "id, title, slug, excerpt, content, category, background_url, is_published, is_home_featured, home_feature_order, created_at"
      )
      .order("created_at", { ascending: false });

    setBlogs((data || []) as Blog[]);
  }

  function resetForm() {
    setSelectedBlog(null);
    setTitle("");
    setSlug("");
    setExcerpt("");
    setContent("");
    setCategory("Strategy");
    setBackgroundUrl("");
    setIsPublished(true);
    setIsHomeFeatured(false);
    setHomeFeatureOrder("1");
    setSelectedImage(null);

    const fileInput = document.getElementById("blog-background-upload") as HTMLInputElement | null;
    if (fileInput) fileInput.value = "";
  }

  function editBlog(blog: Blog) {
    setSelectedBlog(blog);
    setTitle(blog.title);
    setSlug(blog.slug);
    setExcerpt(blog.excerpt || "");
    setContent(blog.content || "");
    setCategory(blog.category || "Strategy");
    setBackgroundUrl(blog.background_url || "");
    setIsPublished(blog.is_published);
    setIsHomeFeatured(blog.is_home_featured);
    setHomeFeatureOrder(String(blog.home_feature_order || 1));
    setSelectedImage(null);
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setSelectedImage(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      event.target.value = "";
      setSelectedImage(null);
      return;
    }

    if (file.size > MAX_BLOG_IMAGE_SIZE) {
      alert("Image is too large. Use an image under 6 MB.");
      event.target.value = "";
      setSelectedImage(null);
      return;
    }

    setSelectedImage(file);
  }

  async function uploadBlogBackground(file: File) {
    const safeName = cleanFileName(file.name);
    const filePath = `${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from(BLOG_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false
      });

    if (error) throw error;

    const { data } = supabase.storage.from(BLOG_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function saveBlog(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isHomeFeatured && Number(homeFeatureOrder) > 3) {
      alert("Homepage preview order can only be 1, 2, or 3.");
      return;
    }

    setSaving(true);

    try {
      let finalBackgroundUrl = backgroundUrl.trim();

      if (selectedImage) {
        finalBackgroundUrl = await uploadBlogBackground(selectedImage);
      }

      const finalSlug = slug.trim() || slugify(title);

      const payload = {
        title: title.trim(),
        slug: finalSlug,
        excerpt: excerpt.trim() || null,
        content: content.trim() || null,
        category: category.trim() || null,
        background_url: finalBackgroundUrl || null,
        is_published: isPublished,
        is_home_featured: isHomeFeatured,
        home_feature_order: isHomeFeatured ? Number(homeFeatureOrder) : null
      };

      const { error } = selectedBlog
        ? await supabase.from("blogs").update(payload).eq("id", selectedBlog.id)
        : await supabase.from("blogs").insert(payload);

      if (error) {
        alert(error.message);
        return;
      }

      await loadBlogs();
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Blog save failed.";
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteBlog(blogId: string) {
    const confirmed = window.confirm("Delete this blog? This cannot be undone.");
    if (!confirmed) return;

    const { error } = await supabase.from("blogs").delete().eq("id", blogId);

    if (error) {
      alert(error.message);
      return;
    }

    if (selectedBlog?.id === blogId) {
      resetForm();
    }

    await loadBlogs();
  }

  if (loading) {
    return (
      <main className="portal-page">
        <section className="portal-card">
          <p>Loading blog manager...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="portal-page">
      <section className="portal-shell">
        <header className="portal-header">
          <div>
            <p className="portal-kicker">Admin Blog Manager</p>
            <h1>Blogs</h1>
            <p>Create, edit, delete, upload backgrounds, and choose the 3 homepage previews.</p>

            <div className="notification-summary">
              {homeFeaturedCount}/3 homepage preview slots selected
            </div>
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

        <div className="portal-grid portal-grid-two">
          <article className="portal-card">
            <h2>{selectedBlog ? "Edit Blog" : "Create Blog"}</h2>

            <form className="portal-form blog-admin-form" onSubmit={saveBlog}>
              <label>
                Blog Title
                <input
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    if (!selectedBlog) setSlug(slugify(event.target.value));
                  }}
                  required
                />
              </label>

              <label>
                URL Slug
                <input
                  value={slug}
                  onChange={(event) => setSlug(slugify(event.target.value))}
                  placeholder="my-blog-post"
                  required
                />
              </label>

              <label>
                Category
                <input
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  placeholder="Strategy"
                />
              </label>

              <label>
                Short Excerpt
                <textarea
                  value={excerpt}
                  onChange={(event) => setExcerpt(event.target.value)}
                  placeholder="Short preview text for homepage and blog cards..."
                />
              </label>

              <label>
                Full Blog Content
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Write the full blog article here..."
                  required
                />
              </label>

              <label>
                Background Image
                <div className="imessage-composer blog-upload-composer">
                  <label className="imessage-photo-button" aria-label="Upload blog background">
                    <input
                      id="blog-background-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />

                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 7h3l1.4-2h7.2L17 7h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"></path>
                      <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                  </label>

                  <input
                    value={backgroundUrl}
                    onChange={(event) => setBackgroundUrl(event.target.value)}
                    placeholder={selectedImage ? selectedImage.name : "Upload image or paste image URL"}
                  />
                </div>
              </label>

              {backgroundUrl && (
                <img className="blog-admin-preview-img" src={backgroundUrl} alt="" />
              )}

              {selectedImage && (
                <div className="imessage-file-chip">
                  <span>{selectedImage.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      const fileInput = document.getElementById("blog-background-upload") as HTMLInputElement | null;
                      if (fileInput) fileInput.value = "";
                    }}
                  >
                    ×
                  </button>
                </div>
              )}

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(event) => setIsPublished(event.target.checked)}
                />
                Published
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={isHomeFeatured}
                  onChange={(event) => setIsHomeFeatured(event.target.checked)}
                />
                Show on homepage preview
              </label>

              {isHomeFeatured && (
                <label>
                  Homepage Preview Slot
                  <select
                    value={homeFeatureOrder}
                    onChange={(event) => setHomeFeatureOrder(event.target.value)}
                  >
                    <option value="1">1 - First</option>
                    <option value="2">2 - Second</option>
                    <option value="3">3 - Third</option>
                  </select>
                </label>
              )}

              <button className="auth-submit" type="submit" disabled={saving}>
                {saving ? "Saving..." : selectedBlog ? "Save Blog" : "Create Blog"}
              </button>

              {selectedBlog && (
                <button className="portal-link" type="button" onClick={resetForm}>
                  Cancel Edit
                </button>
              )}
            </form>
          </article>

          <article className="portal-card">
            <h2>Existing Blogs</h2>

            {blogs.length === 0 ? (
              <p>No blogs created yet.</p>
            ) : (
              <div className="portal-list">
                {blogs.map((blog) => (
                  <div className="portal-list-item blog-admin-list-item" key={blog.id}>
                    <div>
                      <h3>
                        {blog.title}
                        {blog.is_home_featured && (
                          <span className="notification-badge">
                            Home {blog.home_feature_order || ""}
                          </span>
                        )}
                      </h3>

                      <p>
                        {blog.is_published ? "Published" : "Draft"} · {blog.category || "Blog"}
                      </p>
                    </div>

                    <div className="blog-admin-actions">
                      <a href={`/blog/${blog.slug}`} target="_blank" rel="noreferrer">
                        View ↗
                      </a>

                      <button type="button" onClick={() => editBlog(blog)}>
                        Edit
                      </button>

                      <button type="button" onClick={() => deleteBlog(blog.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>
          <AdminMobileNav />
    </main>
  );
}
