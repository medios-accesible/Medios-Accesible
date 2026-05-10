"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type ServicePlan = {
  id: string;
  tier_number: number;
  package_name: string;
  primary_purpose: string | null;
  monthly_price: number;
  annual_price: number | null;
  buyout_price: number | null;
  reduced_buyout_price: number | null;
  included_services: string[] | null;
  limits: string[] | null;
  is_active: boolean;
  sort_order: number;
};

type ServiceAddon = {
  id: string;
  name: string;
  price_label: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
};

export default function ServicesPage() {
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [addons, setAddons] = useState<ServiceAddon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadServices() {
      const { data: planData } = await supabase
        .from("service_plans")
        .select("id, tier_number, package_name, primary_purpose, monthly_price, annual_price, buyout_price, reduced_buyout_price, included_services, limits, is_active, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      const { data: addonData } = await supabase
        .from("service_addons")
        .select("id, name, price_label, description, is_active, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      setPlans((planData || []) as ServicePlan[]);
      setAddons((addonData || []) as ServiceAddon[]);
      setLoading(false);
    }

    loadServices();
  }, []);

  return (
    <main className="services-page">
      <section className="services-hero">
        <Link className="portal-link" href="/">
          ← Home
        </Link>

        <div>
          <p className="portal-kicker">Services & Pricing</p>
          <h1>Websites, SEO, content, portals, and digital growth systems.</h1>
          <p>
            Choose a monthly package based on how much digital support your business needs.
            Add-ons are available for extra edits, graphics, video, ecommerce, automations,
            and custom systems.
          </p>
        </div>
      </section>

      <section className="services-list-section">
        {loading ? (
          <article className="portal-card">
            <p>Loading services...</p>
          </article>
        ) : (
          <>
            <div className="service-plan-grid">
              {plans.map((plan) => (
                <article className="service-plan-card" key={plan.id}>
                  <div className="service-plan-head">
                    <span>Tier {plan.tier_number}</span>
                    <h2>{plan.package_name}</h2>
                    <p>{plan.primary_purpose}</p>
                  </div>

                  <div className="service-price-row">
                    <strong>${plan.monthly_price}</strong>
                    <span>/month</span>
                  </div>

                  {plan.annual_price && (
                    <p className="service-small-note">
                      Annual upfront: ${plan.annual_price}
                    </p>
                  )}

                  <div className="service-detail-block">
                    <h3>Included Services</h3>
                    <ul>
                      {(plan.included_services || []).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="service-detail-block service-limits">
                    <h3>Limits</h3>
                    <ul>
                      {(plan.limits || []).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {(plan.buyout_price || plan.reduced_buyout_price) && (
                    <div className="service-buyout">
                      <span>Website buyout</span>
                      <strong>
                        ${plan.buyout_price} / ${plan.reduced_buyout_price} after 12 months
                      </strong>
                    </div>
                  )}
                </article>
              ))}
            </div>

            <div className="services-addon-section">
              <div className="section-head">
                <div>
                  <div className="kicker">Add-ons</div>
                  <h2>Extra services when the project needs more.</h2>
                </div>

                <p>
                  Add-ons are billed separately and are only included when approved in writing.
                </p>
              </div>

              <div className="addon-grid">
                {addons.map((addon) => (
                  <article className="addon-card" key={addon.id}>
                    <h3>{addon.name}</h3>
                    <strong>{addon.price_label}</strong>
                    {addon.description && <p>{addon.description}</p>}
                  </article>
                ))}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
