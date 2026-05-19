export function UtilityBar() {
  return (
    <div className="border-b border-border text-[12px] text-muted">
      <div className="mx-auto flex h-9 max-w-[1360px] items-center justify-between px-10">
        <div className="flex items-center gap-4">
          <button className="transition-colors hover:text-heading">Deliver to ES ▾</button>
          <span className="h-3 w-px bg-border" />
          <button className="transition-colors hover:text-heading">English (EN) ▾</button>
          <span className="h-3 w-px bg-border" />
          <button className="transition-colors hover:text-heading">EUR ▾</button>
        </div>
        <div className="flex items-center gap-4">
          <button className="transition-colors hover:text-heading">Track order</button>
          <button className="transition-colors hover:text-heading">Customer service</button>
          <button className="transition-colors hover:text-heading">Sell on Storely</button>
          <button className="transition-colors hover:text-heading">Gift cards</button>
        </div>
      </div>
    </div>
  );
}
