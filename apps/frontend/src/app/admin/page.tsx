import Link from "next/link";

export default function AdminIndexPage() {
  const menus = [
    {
      id: 'Products',
      url: '/products'
    },
    {
      id: 'Categories',
      url: '/categories'
    },
    {
      id: 'Orders',
      url: '/orders'
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {menus.map((menu) => (
        <Link
          key={menu.id}
          href={`/admin${menu.url}`}
          className={`group flex flex-col items-center justify-center gap-2 rounded-2xl p-8 transition-shadow hover:shadow-md bg-bg-warm`}
        >
          <span className="font-heading text-[16px] font-semibold text-heading">{menu.id}</span>
        </Link>
      ))}
    </div>
  );
}
