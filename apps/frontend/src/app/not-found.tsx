import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[1360px] px-10 py-24 text-center">
      <p className="font-body text-[11px] uppercase tracking-[0.12em] text-muted">404</p>
      <h1 className="mt-2 font-heading text-[48px] font-bold text-heading">Page not found.</h1>
      <p className="mx-auto mt-3 max-w-md text-[14px] text-text">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-12 items-center rounded-md bg-accent px-6 font-body text-[14px] font-bold text-heading transition-colors hover:bg-[#ffbe3a]"
      >
        Back to home
      </Link>
    </div>
  );
}
