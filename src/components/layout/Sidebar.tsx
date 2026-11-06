'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard, Users, ShoppingCart, ArrowLeftRight,
  Landmark, Wallet, Settings, Shield, ScrollText, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { label: 'Dashboard',    href: '/',            icon: LayoutDashboard, permission: 'METRICS_READ',      superAdminOnly: false },
  { label: 'Users',        href: '/users',        icon: Users,           permission: 'USERS_READ',        superAdminOnly: false },
  { label: 'Orders',       href: '/orders',       icon: ShoppingCart,    permission: 'ORDERS_READ',       superAdminOnly: false },
  { label: 'Settlements',  href: '/settlements',  icon: ArrowLeftRight,  permission: 'SETTLEMENTS_READ',  superAdminOnly: false },
  { label: 'Transactions', href: '/transactions', icon: Landmark,        permission: 'TRANSACTIONS_READ', superAdminOnly: false },
  { label: 'Wallet',       href: '/wallet',       icon: Wallet,          permission: 'WALLET_READ',       superAdminOnly: false },
  { label: 'Admins',       href: '/admins',       icon: Shield,          permission: 'ADMINS_MANAGE',     superAdminOnly: false },
  { label: 'Audit Logs',   href: '/audit-logs',   icon: ScrollText,      permission: null,                superAdminOnly: true  },
  { label: 'Settings',     href: '/settings',     icon: Settings,        permission: null,                superAdminOnly: false },
];

type Props = {
  permissions: Set<string>;
  isSuperAdmin: boolean;
  authLoading?: boolean;
  open?: boolean;
  onClose?: () => void;
};

export function Sidebar({ permissions, isSuperAdmin, authLoading, open, onClose }: Props) {
  const pathname = usePathname();

  const visible = NAV.filter((item) => {
    if (item.superAdminOnly) return isSuperAdmin;
    if (!item.permission) return true;
    return isSuperAdmin || permissions.has(item.permission);
  });

  const navItems = authLoading ? (
    Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
        <div className="w-[18px] h-[18px] rounded bg-white/10 animate-pulse flex-shrink-0" />
        <div className="h-3.5 rounded bg-white/10 animate-pulse flex-1" style={{ width: `${55 + (i % 3) * 15}%` }} />
      </div>
    ))
  ) : visible.map((item) => {
    const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
          active
            ? 'bg-[#C5DB10] text-[#0E121B]'
            : 'text-white/70 hover:text-white hover:bg-white/10',
        )}
      >
        <item.icon size={18} />
        {item.label}
      </Link>
    );
  });

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar — fixed overlay on mobile, static in-flow on desktop */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex flex-col overflow-y-auto transition-transform duration-200',
          'md:static md:w-60 md:h-screen md:sticky md:top-0 md:flex-shrink-0 md:translate-x-0 md:z-auto',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ background: '#2C3E4F' }}
      >
        <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <Image src="/logo.png" alt="Yielda" width={100} height={40} className="object-contain brightness-0 invert" />
            <p className="text-xs text-white/50 mt-1 font-medium tracking-wide uppercase">Admin</p>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-white/50 hover:text-white transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems}
        </nav>
      </aside>
    </>
  );
}
