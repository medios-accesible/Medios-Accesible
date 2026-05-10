"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CodeRain from "../../components/CodeRain";
import { siteContent } from "../../data/siteContent";
import { supabase } from "../../lib/supabaseClient";

type Blog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string | null;
  background_url: string | null;
  created_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function estimateReadTime(blog: Blog) {
  const text = `${blog.title} ${blog.excerpt || ""}`;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(3, Math.ceil(words / 160));
  return `${minutes} min read`;
}

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");

  useEffect(() => {
    async function loadBlogs() {
      const { data } = await supabase
        .from("blogs")
        .select("id, title, slug, excerpt, category, background_url, created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      setBlogs((data || []) as Blog[]);
      setLoading(false);
    }

    loadBlogs();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(blogs.map((blog) => blog.category || "Blog"))
    ).sort();

    return ["All Categories", ...uniqueCategories];
  }, [blogs]);

  const filteredBlogs = useMemo(() => {
    const cleanSearch = searchTerm.trim().toLowerCase();

    return blogs.filter((blog) => {
      const matchesSearch =
        !cleanSearch ||
        blog.title.toLowerCase().includes(cleanSearch) ||
        (blog.excerpt || "").toLowerCase().includes(cleanSearch) ||
        (blog.category || "").toLowerCase().includes(cleanSearch);

      const matchesCategory =
        categoryFilter === "All Categories" ||
        (blog.category || "Blog") === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [blogs, searchTerm, categoryFilter]);

  const featuredBlogs = filteredBlogs.slice(0, 5);
  const mainFeature = featuredBlogs[0];
  const secondaryFeatures = featuredBlogs.slice(1, 5);
  const articleList = filteredBlogs.slice(5);

  return (
    <main className="blog-revamp-page">
      <header className="site-header blog-revamp-header">
        <Link className="brand" href="/" aria-label="Medios Accesible Home">
          <img
            className="brand-logo-img"
            src={siteContent.brand.logo}
            alt="Medios Accesible logo"
          />
          <span>{siteContent.brand.name}</span>
        </Link>

        <nav className="nav" aria-label="Blog navigation">
          <Link href="/">Home</Link>
          <Link href="/services">Services</Link>
          <Link href="/portfolio">Portfolio</Link>
          <Link className="active" href="/blog">Blog</Link>
          <Link href="/contact">Contact</Link>
        </nav>

        <Link className="login-btn" href="/login">
          Open Portal ⊗
        </Link>
      </header>

      <section className="blog-revamp-hero">
        <img className="hero-bg-image blog-hero-art" src={siteContent.hero.backgroundImage} alt="" />
        <CodeRain className="hero-canvas blog-code-canvas" />

        <div className="blog-hero-glow one"></div>
        <div className="blog-hero-glow two"></div>

        <div className="blog-revamp-hero-content">
          <div className="eyebrow">Insights. Strategies. Real growth.</div>

          <h1>
            The <span className="gradient-text">Blog</span>
          </h1>

          <p>
            Practical tips, industry insights, and tech strategies to help your
            business grow online.
          </p>

          <label className="blog-search-box">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search articles..."
            />

            <span>⌕</span>
          </label>
        </div>
      </section>

      <section className="blog-featured-section">
        <div className="blog-section-title-row">
          <h2>Featured Articles</h2>

          <a href="#all-articles">
            View all articles <span>→</span>
          </a>
        </div>

        {loading ? (
          <article className="blog-revamp-empty">
            <p>Loading articles...</p>
          </article>
        ) : filteredBlogs.length === 0 ? (
          <article className="blog-revamp-empty">
            <p>No articles match your search.</p>
          </article>
        ) : (
          <div className="featured-blog-layout">
            {mainFeature && (
              <Link className="featured-blog-main" href={`/blog/${mainFeature.slug}`}>
                {mainFeature.background_url && (
                  <img src={mainFeature.background_url} alt="" />
                )}

                <div className="featured-blog-content">
                  <span>{mainFeature.category || "Blog"}</span>
                  <small>{formatDate(mainFeature.created_at)}</small>
                  <h2>{mainFeature.title}</h2>
                  <p>{mainFeature.excerpt || "Read the full article from Medios Accesible."}</p>
                  <strong>Read More →</strong>
                </div>
              </Link>
            )}

            <div className="featured-blog-side-grid">
              {secondaryFeatures.map((blog) => (
                <Link className="featured-blog-small" href={`/blog/${blog.slug}`} key={blog.id}>
                  {blog.background_url && <img src={blog.background_url} alt="" />}

                  <div className="featured-blog-content">
                    <span>{blog.category || "Blog"}</span>
                    <small>{formatDate(blog.created_at)}</small>
                    <h3>{blog.title}</h3>
                    <p>{blog.excerpt || "Read the full article."}</p>
                    <strong>Read More →</strong>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="blog-all-section" id="all-articles">
        <div className="blog-section-title-row">
          <h2>All Articles</h2>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="Filter articles by category"
          >
            {categories.map((category) => (
              <option value={category} key={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="blog-list-revamp">
          {(articleList.length > 0 ? articleList : filteredBlogs).map((blog) => (
            <Link className="blog-list-row-revamp" href={`/blog/${blog.slug}`} key={blog.id}>
              <div className="blog-row-image">
                {blog.background_url ? <img src={blog.background_url} alt="" /> : <span>MA</span>}
              </div>

              <div className="blog-row-copy">
                <span>{blog.category || "Blog"}</span>
                <h3>{blog.title}</h3>
                <p>{blog.excerpt || "Read the full article from Medios Accesible."}</p>
              </div>

              <div className="blog-row-meta">
                <small>{formatDate(blog.created_at)}</small>
                <small>◷ {estimateReadTime(blog)}</small>
                <strong>Read More →</strong>
              </div>
            </Link>
          ))}
        </div>

        {filteredBlogs.length > 8 && (
          <div className="blog-pagination-demo" aria-label="Article pagination">
            <button className="active" type="button">1</button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button type="button">...</button>
            <button type="button">10</button>
            <button type="button">›</button>
          </div>
        )}
      </section>

      <section className="blog-subscribe-cta">
        <div className="blog-cta-line-art"></div>

        <div>
          <div className="kicker">Stay ahead of the curve</div>
          <h2>Get insights and tips delivered to your inbox.</h2>
          <p>No spam. Just valuable content to help your business grow.</p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            alert("Subscription form can be connected next.");
          }}
        >
          <input type="email" placeholder="Enter your email" required />
          <button className="btn btn-primary" type="submit">
            Subscribe <span>→</span>
          </button>
        </form>
      </section>

      <footer className="blog-footer-revamp">
        <div>
          <Link className="brand" href="/">
            <img
              className="brand-logo-img"
              src={siteContent.brand.logo}
              alt="Medios Accesible logo"
            />
            <span>{siteContent.brand.name}</span>
          </Link>

          <p>Custom code. Clear systems. Real growth.</p>
        </div>

        <div>
          <h3>Company</h3>
          <Link href="/">Home</Link>
          <Link href="/services">Services</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/contact">Contact</Link>
        </div>

        <div>
          <h3>Services</h3>
          <Link href="/services">Custom Website Development</Link>
          <Link href="/services">Client Portals & Dashboards</Link>
          <Link href="/services">SEO & Content Systems</Link>
          <Link href="/services">Support & Consulting</Link>
        </div>

        <div>
          <h3>Connect</h3>
          <a href="mailto:mediosaccesible@gmail.com">mediosaccesible@gmail.com</a>
          <a href="tel:+17879074302">(787) 907-4302</a>
        </div>
      </footer>
    </main>
  );
}
