'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminUsers } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

type User = { id: string; firstName: string; lastName: string; email: string; accountStatus: string; tier: string; createdAt: string };

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-[#F6FFF9] text-[#12B76A] border-[#12B76A]/20',
  BLOCKED: 'bg-[#FFF6F6] text-[#FF3B30] border-[#FF3B30]/20',
  SUSPENDED: 'bg-[#FFF6BD] text-[#D99800] border-[#D99800]/20',
  PENDING: 'bg-[#EDF0F7] text-[#717784] border-[#E1E4EA]',
};

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminUsers.list({ page, limit: 20, search: search || undefined })
      .then((data) => { setUsers(data.content); setTotal(data.total); })
      .finally(() => setLoading(false));
  }, [page, search]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#0E121B]">Users</h2>
          <p className="text-sm text-[#717784]">{total.toLocaleString()} total</p>
        </div>
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717784]" />
          <Input placeholder="Search name or email…" className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E1E4EA] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E1E4EA] bg-[#F5F7FA]">
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#717784] uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#717784] uppercase tracking-wide">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#717784] uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#717784] uppercase tracking-wide">Tier</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#717784] uppercase tracking-wide">Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-[#E1E4EA]">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-[#EDF0F7] rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : users.map((user) => (
              <tr key={user.id} className="border-b border-[#E1E4EA] hover:bg-[#F5F7FA] cursor-pointer" onClick={() => router.push(`/users/${user.id}`)}>
                <td className="px-4 py-3 font-medium text-[#0E121B]">{user.firstName} {user.lastName}</td>
                <td className="px-4 py-3 text-[#717784]">{user.email}</td>
                <td className="px-4 py-3">
                  <Badge className={`text-xs border ${STATUS_COLOR[user.accountStatus] ?? 'bg-[#EDF0F7] text-[#717784]'}`}>
                    {user.accountStatus}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-[#717784]">{user.tier ?? '—'}</td>
                <td className="px-4 py-3 text-[#717784]">{formatDate(user.createdAt, 'dd MMM yyyy')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-4 py-3 border-t border-[#E1E4EA]">
          <p className="text-xs text-[#717784]">Page {page} of {totalPages || 1}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={14} /></Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><ChevronRight size={14} /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
