"use client";

import { useState } from "react";
import { supportOptions, type SupportOptionKey } from "./supportData";

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
  const [error, setError] = useState("");

  const handleSupport = async (optionKey: SupportOptionKey) => {
    setError("");
    setLoadingKey(optionKey);

    try {
      await startCheckout(optionKey);
    } catch (checkoutError) {
      console.error(checkoutError);
      setLoadingKey(null);
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Unable to start checkout."
      );
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {supportOptions.map((option) => {
          const isLoading = loadingKey === option.key;

          return (
            <article
              key={option.key}
              className="flex min-h-56 flex-col justify-between rounded-md border border-ink/10 bg-paper/80 p-5 shadow-soft"
            >
              <div>
                <div className="mb-4 flex items-start justify-between gap-4">
                  <h2 className="text-xl font-black text-ink">{option.title}</h2>
                  <p className="shrink-0 text-lg font-black text-clay">
                    {option.amount}
                  </p>
                </div>
                <p className="text-sm leading-6 text-ink/65">
                  {option.description}
                </p>
              </div>
              <button
                type="button"
                disabled={loadingKey !== null}
                onClick={() => handleSupport(option.key)}
                className="mt-6 rounded-full border border-ink/15 px-5 py-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-ink transition hover:border-clay hover:text-clay disabled:cursor-not-allowed disabled:opacity-55"
              >
                {isLoading ? "Opening..." : "Chip in"}
              </button>
            </article>
          );
        })}
      </div>

      {error ? (
        <p className="rounded-md border border-clay/30 bg-paper px-4 py-3 text-sm font-bold text-clay">
          {error}
        </p>
      ) : null}
    </div>
  );
}
