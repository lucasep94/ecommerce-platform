import Link from "next/link";

interface Props {
  page: number;
  total: number;
  pageSize: number;
  searchParams: Record<string, string>;
}

function pageHref(params: Record<string, string>, p: number): string {
  const qs = new URLSearchParams({ ...params, page: String(p) });
  return `/products?${qs.toString()}`;
}

export function Pagination({ page, total, pageSize, searchParams }: Props) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const base = { ...searchParams };
  delete base.page;

  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }

  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Pagination">
      {page > 1 && (
        <Link
          href={pageHref(base, page - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-[13px] hover:border-heading"
        >
          ‹
        </Link>
      )}
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-1 text-muted">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={pageHref(base, p)}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-medium transition-colors ${
              p === page
                ? "bg-heading text-white"
                : "border border-border hover:border-heading"
            }`}
          >
            {p}
          </Link>
        ),
      )}
      {page < totalPages && (
        <Link
          href={pageHref(base, page + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-[13px] hover:border-heading"
        >
          ›
        </Link>
      )}
    </nav>
  );
}
