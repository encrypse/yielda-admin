'use client';
import { useEffect, useState } from 'react';
import { adminAdmins } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { UserPlus, Copy, Check } from 'lucide-react';

type AdminUser = {
  id: string; email: string; firstName: string; lastName: string;
  isSuperAdmin: boolean; isActive: boolean; createdAt: string;
  permissions: string[];
};

type PermissionDef = { key: string; label: string };

export default function AdminsPage() {
  const { isSuperAdmin } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [permDefs, setPermDefs] = useState<PermissionDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  function load() {
    return adminAdmins.list().then(setAdmins);
  }

  useEffect(() => {
    Promise.all([load(), adminAdmins.permissions().then(setPermDefs)])
      .finally(() => setLoading(false));
  }, []);

  function togglePerm(key: string) {
    setSelectedPerms((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError('');
    setInviting(true);
    try {
      const data = await adminAdmins.invite(inviteEmail, selectedPerms);
      const link = `${window.location.origin}/accept-invite?token=${data.inviteToken}`;
      setInviteLink(link);
      setInviteEmail('');
      setSelectedPerms([]);
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setInviteError(msg ?? 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function closeDialog() {
    setInviteOpen(false);
    setInviteLink('');
    setInviteError('');
  }

  async function toggleActive(admin: AdminUser) {
    await adminAdmins.update(admin.id, { isActive: !admin.isActive });
    await load();
  }

  if (!isSuperAdmin) return <p className="text-[#717784]">Access restricted to superadmin.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#0E121B]">Admin Users</h2>
          <p className="text-sm text-[#717784]">{admins.length} admins</p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="bg-[#C5DB10] text-[#0E121B] hover:bg-[#b0c40e]">
          <UserPlus size={16} className="mr-2" /> Invite Admin
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#E1E4EA] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E1E4EA] bg-[#F5F7FA]">
              {['Name', 'Email', 'Role', 'Permissions', 'Status', 'Joined', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#717784] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-b border-[#E1E4EA]">
                {Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-[#EDF0F7] rounded animate-pulse" /></td>
                ))}
              </tr>
            )) : admins.map((a) => (
              <tr key={a.id} className="border-b border-[#E1E4EA] hover:bg-[#F5F7FA]">
                <td className="px-4 py-3 font-medium text-[#0E121B]">{a.firstName || <span className="text-[#CACFD8] italic">Pending</span>} {a.lastName}</td>
                <td className="px-4 py-3 text-[#717784]">{a.email}</td>
                <td className="px-4 py-3">
                  {a.isSuperAdmin
                    ? <Badge className="bg-[#EFF6B5] text-[#576106] border-[#C5DB10]/40 text-xs border">Superadmin</Badge>
                    : <Badge className="bg-[#EDF0F7] text-[#717784] border-[#E1E4EA] text-xs border">Admin</Badge>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {a.isSuperAdmin
                      ? <Badge className="bg-[#EFF6B5] text-[#576106] text-xs border border-[#C5DB10]/40">All</Badge>
                      : a.permissions.slice(0, 3).map((p) => (
                        <Badge key={p} className="text-xs bg-[#EDF0F7] text-[#717784] border border-[#E1E4EA]">{p.replace(/_/g, ' ')}</Badge>
                      ))}
                    {!a.isSuperAdmin && a.permissions.length > 3 && (
                      <Badge className="text-xs bg-[#EDF0F7] text-[#717784] border border-[#E1E4EA]">+{a.permissions.length - 3}</Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge className={`text-xs border ${a.isActive ? 'bg-[#F6FFF9] text-[#12B76A] border-[#12B76A]/20' : 'bg-[#FFF6F6] text-[#FF3B30] border-[#FF3B30]/20'}`}>
                    {a.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-[#717784]">{formatDate(a.createdAt, 'dd MMM yyyy')}</td>
                <td className="px-4 py-3">
                  {!a.isSuperAdmin && (
                    <Button size="sm" variant="outline" onClick={() => toggleActive(a)} className={a.isActive ? 'text-[#FF3B30] border-[#FF3B30]/30' : 'text-[#12B76A] border-[#12B76A]/30'}>
                      {a.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={inviteOpen} onOpenChange={(o) => { if (!o) closeDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{inviteLink ? 'Invite Link Ready' : 'Invite Admin'}</DialogTitle></DialogHeader>

          {inviteLink ? (
            <div className="space-y-4">
              <p className="text-sm text-[#717784]">Share this link with <strong>{admins.at(-1)?.email}</strong>. It expires in 48 hours.</p>
              <div className="flex items-center gap-2 bg-[#EDF0F7] rounded-lg px-3 py-2">
                <p className="text-xs font-mono text-[#0E121B] flex-1 break-all">{inviteLink}</p>
                <button onClick={copyLink} className="text-[#717784] hover:text-[#0E121B] flex-shrink-0">
                  {copied ? <Check size={16} className="text-[#12B76A]" /> : <Copy size={16} />}
                </button>
              </div>
              <DialogFooter>
                <Button onClick={closeDialog} className="bg-[#C5DB10] text-[#0E121B] hover:bg-[#b0c40e]">Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Email address</Label>
                <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {permDefs.map((p) => (
                    <label key={p.key} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={selectedPerms.includes(p.key)} onChange={() => togglePerm(p.key)} className="accent-[#C5DB10]" />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
              {inviteError && <p className="text-sm text-[#FF3B30]">{inviteError}</p>}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                <Button type="submit" className="bg-[#C5DB10] text-[#0E121B] hover:bg-[#b0c40e]" disabled={inviting}>
                  {inviting ? 'Creating…' : 'Create Invite Link'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
