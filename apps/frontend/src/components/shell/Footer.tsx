const linkGroups = [
  {
    title: "Get to know us",
    links: ["About Storely", "Careers", "Press releases", "Storely Cares", "Gift a smile"],
  },
  {
    title: "Make money with us",
    links: ["Sell on Storely", "Sell as an affiliate", "Advertise products", "Self-publish", "Host a hub"],
  },
  {
    title: "Let us help you",
    links: ["Your account", "Your orders", "Shipping rates", "Returns & refunds", "Help center"],
  },
  {
    title: "Payment & gifts",
    links: ["Payment methods", "Gift cards", "Reload balance", "Currency converter", "Tax-free shopping"],
  },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-bg">
      <div className="mx-auto max-w-[1360px] px-10 py-12">
        <div className="grid grid-cols-5 gap-8">
          <div>
            <div className="mb-4 flex items-baseline gap-1">
              <span className="font-heading text-2xl font-bold text-heading">storely</span>
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            </div>
            <p className="text-[13px] text-muted">
              A modern marketplace for everyday and editorial finds. Curated, fast, fair.
            </p>
          </div>
          {linkGroups.map((group) => (
            <div key={group.title}>
              <h5 className="mb-4 font-heading text-[13px] font-semibold uppercase tracking-wider text-heading">
                {group.title}
              </h5>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link}>
                    <a className="text-[13px] text-text transition-colors hover:text-heading" href="#">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6 text-[12px] text-muted">
          <div className="flex items-center gap-4">
            <span>© 2026 Storely Inc.</span>
            <a className="hover:text-heading" href="#">Conditions of use</a>
            <a className="hover:text-heading" href="#">Privacy notice</a>
            <a className="hover:text-heading" href="#">Interest-based ads</a>
          </div>
          <div className="flex items-center gap-2">
            {["VISA", "MC", "AMEX", "PAYPAL", "APPLE"].map((p) => (
              <span
                key={p}
                className="flex h-6 items-center rounded border border-border bg-white px-2 text-[10px] font-bold tracking-wide text-heading"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
