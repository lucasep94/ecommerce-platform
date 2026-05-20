"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-[1360px] px-10 py-24 text-center">
      <p className="font-body text-[11px] uppercase tracking-[0.12em] text-muted">Something went wrong</p>
      <h1 className="mt-2 font-heading text-[48px] font-bold text-heading">We hit a snag.</h1>
      <p className="mx-auto mt-3 max-w-md text-[14px] text-text">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <button
        onClick={reset}
        className="mt-8 inline-flex h-12 items-center rounded-md bg-accent px-6 font-body text-[14px] font-bold text-heading transition-colors hover:bg-[#ffbe3a]"
      >
        Try again
      </button>
    </div>
  );
}
