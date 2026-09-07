'use client';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { adminAuth } from '@/lib/api';
import { clearToken } from '@/lib/auth';
import type { AdminUser } from '@/hooks/useAuth';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Props = { admin: AdminUser | null; title?: string };

export function Header({ admin, title }: Props) {
  const router = useRouter();

  async function handleLogout() {
    try { await adminAuth.logout(); } catch {}
    clearToken();
    router.push('/login');
  }

  const initials = admin ? `${admin.firstName[0]}${admin.lastName[0]}`.toUpperCase() : '??';

  return (
    <header className="h-14 bg-white border-b border-[#E1E4EA] flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-base font-semibold text-[#0E121B]">{title}</h1>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#C5DB10] cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-[#C5DB10] flex items-center justify-center text-xs font-semibold text-[#0E121B]">
            {initials}
          </div>
          {admin && (
            <span className="text-sm font-medium text-[#0E121B] hidden sm:block">
              {admin.firstName} {admin.lastName}
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-3 py-2">
            <p className="text-sm font-medium">{admin?.firstName} {admin?.lastName}</p>
            <p className="text-xs text-[#717784]">{admin?.email}</p>
            {admin?.isSuperAdmin && <p className="text-xs text-[#576106] font-semibold mt-0.5">Superadmin</p>}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-[#FF3B30]" onClick={handleLogout}>
            <LogOut size={14} className="mr-2" /> Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
