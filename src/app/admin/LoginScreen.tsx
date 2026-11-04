"use client";

import { FiLock } from "react-icons/fi";

export function LoginScreen({
  password,
  setPassword,
  onSubmit,
  message,
}: {
  password: string;
  setPassword: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  message: string;
}) {
  return (
    <div className="mx-auto max-w-md rounded-md border border-ink/10 bg-paper p-6 shadow-soft">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-paper">
          <FiLock size={20} />
        </span>
        <div>
          <h1 className="text-2xl font-black text-ink">Admin</h1>
          <p className="text-sm text-ink/60">Upper Left Indie queue</p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="space-y-2 text-sm font-bold text-ink/70">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-md border border-ink/15 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-clay"
          />
        </label>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-paper transition hover:bg-clay"
        >
          <FiLock size={16} />
          Unlock
        </button>
      </form>
      {message ? <p className="mt-4 text-sm text-clay">{message}</p> : null}
    </div>
  );
}
