import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="mx-auto flex max-w-[1360px] flex-col items-center justify-center px-10 py-32 text-center">
      <p className="font-body text-[11px] uppercase tracking-[0.12em] text-muted">404</p>
      <h1 className="mt-2 font-heading text-[32px] font-bold text-heading">Product not found</h1>
      <p className="mt-3 max-w-sm font-body text-[14px] text-muted">
        This product may have been removed or the link is incorrect.
      </p>
      <Link
        href="/products"
        className="mt-8 rounded-full bg-accent px-8 py-3 font-body text-[14px] font-bold text-heading hover:bg-[#ffbe3a]"
      >
        Back to catalog
      </Link>
    </div>
  );
}
