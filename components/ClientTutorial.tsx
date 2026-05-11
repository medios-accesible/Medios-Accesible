"use client";

import { useState } from "react";

const steps = [
  {
    icon: "⌂",
    title: "Home dashboard",
    text: "Track your current project, latest update, progress, and next action from one clean screen."
  },
  {
    icon: "💬",
    title: "Messages",
    text: "Send questions, approvals, and images directly through your portal conversation."
  },
  {
    icon: "📁",
    title: "Files",
    text: "View graphics, photos, documents, and upload files for your project."
  },
  {
    icon: "💳",
    title: "Billing",
    text: "See current billables, past due balance, upcoming balance, buyout cost, and invoice history."
  },
  {
    icon: "📝",
    title: "Documents",
    text: "Review, sign, renew, and download contracts or service add-ons."
  }
];

export default function ClientTutorial() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const current = steps[step];

  function nextStep() {
    if (step >= steps.length - 1) {
      setOpen(false);
      setStep(0);
      return;
    }

    setStep((value) => value + 1);
  }

  return (
    <>
      <button className="client-app-tutorial-button" type="button" onClick={() => setOpen(true)}>
        <span aria-hidden="true">?</span>
        <span>How it works</span>
      </button>

      {open && (
        <div className="client-app-tutorial-overlay" role="dialog" aria-modal="true">
          <button
            className="client-app-tutorial-backdrop"
            type="button"
            aria-label="Close tutorial"
            onClick={() => setOpen(false)}
          />

          <article className="client-app-tutorial-card">
            <button
              className="client-app-tutorial-close"
              type="button"
              aria-label="Close tutorial"
              onClick={() => setOpen(false)}
            >
              ×
            </button>

            <div className="client-app-tutorial-icon" aria-hidden="true">
              {current.icon}
            </div>

            <p className="client-app-kicker">Step {step + 1} of {steps.length}</p>
            <h2>{current.title}</h2>
            <p>{current.text}</p>

            <div className="client-app-tutorial-progress" aria-hidden="true">
              {steps.map((item, index) => (
                <span className={index <= step ? "is-active" : ""} key={item.title}></span>
              ))}
            </div>

            <button className="client-app-primary-button" type="button" onClick={nextStep}>
              {step >= steps.length - 1 ? "Finish" : "Next"} <span>→</span>
            </button>
          </article>
        </div>
      )}
    </>
  );
}
