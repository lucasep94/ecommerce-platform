export function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating: ${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.min(1, Math.max(0, rating - i));
        const pct = Math.round(fill * 100);
        const id = `star-grad-${i}-${Math.round(rating * 10)}`;
        return (
          <svg key={i} width="12" height="12" viewBox="0 0 24 24">
            <defs>
              <linearGradient id={id}>
                <stop offset={`${pct}%`} stopColor="#fcaf18" />
                <stop offset={`${pct}%`} stopColor="#e5e5e5" />
              </linearGradient>
            </defs>
            <polygon
              points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
              fill={`url(#${id})`}
            />
          </svg>
        );
      })}
    </div>
  );
}
