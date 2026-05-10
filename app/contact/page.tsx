"use client";

import Link from "next/link";
import { useState } from "react";
import CodeRain from "../../components/CodeRain";
import { siteContent } from "../../data/siteContent";

export default function ContactPage() {
  const [projectType, setProjectType] = useState("");

  return (
    <main className="contact-revamp-page">
      <header className="site-header contact-revamp-header">
        <Link className="brand" href="/" aria-label="Medios Accesible Home">
          <img
            className="brand-logo-img"
            src={siteContent.brand.logo}
            alt="Medios Accesible logo"
          />
          <span>{siteContent.brand.name}</span>
        </Link>

        <nav className="nav" aria-label="Contact navigation">
          <Link href="/">Home</Link>
          <Link href="/services">Services</Link>
          <Link href="/portfolio">Portfolio</Link>
          <Link href="/blog">Blog</Link>
          <Link className="active" href="/contact">Contact</Link>
        </nav>

        <Link className="login-btn" href="/login">
          Open Portal ⊗
        </Link>
      </header>

      <section className="contact-hero-revamp">
        <img className="hero-bg-image contact-hero-art" src={siteContent.hero.backgroundImage} alt="" />
        <CodeRain className="hero-canvas contact-code-canvas" />

        <div className="contact-hero-glow one"></div>
        <div className="contact-hero-glow two"></div>

        <div className="contact-hero-content">
          <div className="eyebrow">Let&apos;s connect.</div>

          <h1>
            Let&apos;s Build
            <br />
            Something
            <br />
            <span className="gradient-text">Great.</span>
          </h1>

          <p>
            Have a project in mind or want to learn more about how we can help
            your business grow? We&apos;d love to hear from you.
          </p>

          <div className="hero-actions">
            <a className="btn btn-primary" href="#contact-form">
              Start a Project <span>→</span>
            </a>

            <Link className="btn btn-secondary" href="/portfolio">
              View Our Work <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="contact-main-grid" id="contact-form">
        <article className="contact-form-card">
          <h2>Send Us a Message</h2>
          <p>Fill out the form below and we&apos;ll get back to you as soon as possible.</p>

          <form
            className="contact-form-revamp"
            onSubmit={(event) => {
              event.preventDefault();

              const form = event.currentTarget;
              const formData = new FormData(form);

              const name = String(formData.get("name") || "");
              const email = String(formData.get("email") || "");
              const company = String(formData.get("company") || "");
              const type = String(formData.get("projectType") || "");
              const message = String(formData.get("message") || "");

              const subject = encodeURIComponent(`New project inquiry from ${name || "website visitor"}`);
              const body = encodeURIComponent(
                `Name: ${name}\nEmail: ${email}\nCompany: ${company}\nProject Type: ${type}\n\nMessage:\n${message}`
              );

              window.location.href = `mailto:mediosaccesible@gmail.com?subject=${subject}&body=${body}`;
            }}
          >
            <div className="contact-form-row">
              <input name="name" placeholder="Full Name" required />
              <input name="email" type="email" placeholder="Email Address" required />
            </div>

            <input name="company" placeholder="Company Name" />

            <select
              name="projectType"
              value={projectType}
              onChange={(event) => setProjectType(event.target.value)}
              required
            >
              <option value="">How can we help you?</option>
              <option value="Website">Website</option>
              <option value="Client Portal">Client Portal</option>
              <option value="E-Commerce">E-Commerce</option>
              <option value="SEO / Content">SEO / Content</option>
              <option value="Custom Web App">Custom Web App</option>
              <option value="Maintenance / Support">Maintenance / Support</option>
            </select>

            <textarea name="message" placeholder="Tell us about your project..." required />

            <div className="contact-form-bottom">
              <button className="btn btn-primary" type="submit">
                Send Message <span>→</span>
              </button>

              <div className="contact-safe-note">
                <span>◇</span>
                <p>
                  Your information is safe with us.
                  <br />
                  We never share your data.
                </p>
              </div>
            </div>
          </form>
        </article>

        <aside className="contact-info-card">
          <h2>Get in Touch</h2>

          <div className="contact-info-list">
            <a className="contact-info-item" href="mailto:mediosaccesible@gmail.com">
              <span>✉</span>
              <div>
                <h3>Email Us</h3>
                <p>mediosaccesible@gmail.com</p>
                <small>We typically reply within 24 hours.</small>
              </div>
            </a>

            <a className="contact-info-item" href="tel:+17879074302">
              <span>☏</span>
              <div>
                <h3>Call Us</h3>
                <p>(787) 907-4302</p>
                <small>Mon - Fri: 8:00am - 6:00pm</small>
              </div>
            </a>

            <div className="contact-info-item">
              <span>⌖</span>
              <div>
                <h3>Location</h3>
                <p>Remote Worldwide</p>
                <small>We work with clients everywhere.</small>
              </div>
            </div>

            <div className="contact-info-item">
              <span>◷</span>
              <div>
                <h3>Office Hours</h3>
                <p>Mon - Fri: 8:00am - 6:00pm</p>
                <small>Sat - Sun: Closed</small>
              </div>
            </div>

            <div className="contact-info-item">
              <span>✈</span>
              <div>
                <h3>Follow Us</h3>
                <p className="contact-socials">
                  <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
                  <a href="https://linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a>
                  <a href="https://x.com" target="_blank" rel="noreferrer">X</a>
                </p>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="contact-world-card">
        <div className="world-map-art" aria-hidden="true">
          <span className="pin one"></span>
          <span className="pin two"></span>
          <span className="pin three"></span>
          <span className="pin four"></span>
        </div>

        <div>
          <div className="kicker">We work globally</div>
          <h2>No matter where you are, we&apos;re here to help.</h2>
          <p>
            We partner with businesses and organizations around the world to
            build custom solutions that drive real results.
          </p>
        </div>
      </section>

      <section className="contact-cta-revamp">
        <div className="contact-cta-line-art"></div>

        <div>
          <div className="kicker">Ready to get started?</div>
          <h2>Let&apos;s turn your ideas into reality.</h2>
          <p>Book a free consultation and let&apos;s discuss your project.</p>
        </div>

        <a className="btn btn-primary" href="tel:+17879074302">
          Schedule a Call <span>→</span>
        </a>
      </section>

      <footer className="contact-footer-revamp">
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
          <Link href="/portfolio">Portfolio</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/contact">Contact</Link>
        </div>

        <div>
          <h3>Services</h3>
          <Link href="/services">Custom Website Development</Link>
          <Link href="/services">Client Portals & Dashboards</Link>
          <Link href="/services">Database Design & Integration</Link>
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
