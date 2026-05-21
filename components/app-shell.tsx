import Link from 'next/link';
import { SignOutButton } from '@/components/sign-out-button';

const NAV = [
  { href: '/', label: 'Overview' },
  { href: '/patients', label: 'Patients' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 flex-col border-r bg-muted/30 p-4 md:flex">
        <h1 className="mb-6 px-2 text-lg font-semibold">RheumaTrack Admin</h1>
        <nav className="flex-1 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <SignOutButton />
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
