"use client";

import { useState } from "react";
import { Button } from "../components/ui/Button";
import { supportOptions, type SupportOptionKey } from "./supportData";

/**
 * Project support tiers — Figma "Support the project · Desktop 1440" (27:188)
 * and the Support Tier Card component (15:96).
 *
 * Loading now affects only the pressed card, and the error message appears
 * beside that card rather than under the whole grid. Stripe Checkout behaviour
 * is unchanged.
 */
type CheckoutResponse = {
  url?: string;
  error?: string;
};

async function startCheckout(optionKey: SupportOptionKey) {
  const response = await fetch("/api/support/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ optionKey }),
  });

  const result = (await response.json()) as CheckoutResponse;

  if (!response.ok || !result.url) {
    throw new Error(result.error || "Unable to start checkout.");
  }

  window.location.assign(result.url);
}

export default function SupportOptions() {
  const [loadingKey, setLoadingKey] = useState<SupportOptionKey | null>(null);
  const [errorKey, setErrorKey] = useState<SupportOptionKey | null>(null);
  const [error, setError] = useState("");

  const handleSupport = async (optionKey: SupportOptionKey) => {
    setError("");
    setErrorKey(null);
    setLoadingKey(optionKey);

    try {
      await startCheckout(optionKey);
    } catch (checkoutError) {
      // The API can return configuration detail ("Missing …_PRICE_ID"). That is
      // useful in the logs and meaningless to a visitor.
      console.error(checkoutError);
      setLoadingKey(null);
      setErrorKey(optionKey);
      setError(
        "Checkout could not start. Please try again in a moment, or use another amount."
      );
    }
  };

  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {supportOptions.map((option) => {
        const isLoading = loadingKey === option.key;
        const showError = errorKey === option.key && Boolean(error);

        return (
          <li key={option.key} className="flex min-w-0">
            <article className="flex w-full flex-col gap-2.5 rounded-card border-[1.5px] border-subtle bg-surface p-6">
              <p className="type-display-l text-primary">{option.amount}</p>
              <h3 className="type-heading-s text-primary">{option.title}</h3>
              <p className="type-body-s text-secondary">{option.description}</p>

              <div className="mt-auto flex flex-col gap-2 pt-3">
                <Button
                  emphasis="secondary"
                  size="md"
                  fullWidth
                  // Only the pressed tier goes into a loading state; the others
                  // stay usable.
                  disabled={isLoading}
                  aria-busy={isLoading}
                  onClick={() => handleSupport(option.key)}
                >
                  {isLoading ? "Opening…" : `Chip in ${option.amount}`}
                </Button>
                <p className="type-body-s font-medium text-error empty:hidden" role="status">
                  {showError ? error : ""}
                </p>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
