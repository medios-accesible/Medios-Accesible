"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

type Blog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  category: string | null;
  background_url: string | null;
  created_at: string;
};

export default function SingleBlogPage() {
  const params = useParams();
  const slug = String(params.slug);

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBlog() {
      const { data } = await supabase
        .from("blogs")
        .select("id, title, slug, excerpt, content, category, background_url, created_at")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      setBlog((data || null) as Blog | null);
      setLoading(false);
    }

    loadBlog();
  }, [slug]);

  if (loading) {
    return (
      <main className="blog-page">
        <section className="blog-hero">
          <p>Loading blog...</p>
        </section>
      </main>
    );
  }

  if (!blog) {
    return (
      <main className="blog-page">
        <section className="blog-hero">
          <Link className="portal-link" href="/blog">
            ← Blog
          </Link>

          <h1>Blog not found.</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="blog-page">
      <article className="single-blog">
        <Link className="portal-link" href="/blog">
          ← Blog
        </Link>

        {blog.background_url && (
          <img className="single-blog-bg" src={blog.background_url} alt="" />
        )}

        <div className="single-blog-content">
          <p className="portal-kicker">{blog.category || "Blog"}</p>
          <h1>{blog.title}</h1>

          {blog.excerpt && <p className="single-blog-excerpt">{blog.excerpt}</p>}

          <div className="single-blog-body">
            {(blog.content || "").split("\\n").map((paragraph, index) =>
              paragraph.trim() ? <p key={index}>{paragraph}</p> : <br key={index} />
            )}
          </div>
        </div>
      </article>
    </main>
  );
}
