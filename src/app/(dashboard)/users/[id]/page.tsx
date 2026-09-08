'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminUsers, adminReports, adminUsersExtra } from '@/lib/api';
import { formatDate, formatMoney, downloadBlob } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Download, Pencil, Trash2 } from 'lucide-react';

type UserDetail = {
  id: string; firstName: string; lastName: string; email: string;
  phoneNumber: string; accountStatus: string; tier: string; createdAt: string;
  kycStatus?: string;
  recentTransactions?: Array<{
    id: string; transactionType: string; amount: string; reason: string; createdAt: string;
  }>;
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-[#F6FFF9] text-[#12B76A] border-[#12B76A]/20',
  BLOCKED: 'bg-[#FFF6F6] text-[#FF3B30] border-[#FF3B30]/20',
  SUSPENDED: 'bg-[#FFF6BD] text-[#D99800] border-[#D99800]/20',
  PENDING: 'bg-[#EDF0F7] text-[#717784] border-[#E1E4EA]',
};

const KYC_COLOR: Record<string, string> = {
  APPROVED: 'bg-[#F6FFF9] text-[#12B76A] border-[#12B76A]/20',
  IN_REVIEW: 'bg-[#FFF6BD] text-[#D99800] border-[#D99800]/20',
  FAILED: 'bg-[#FFF6F6] text-[#FF3B30] border-[#FF3B30]/20',
  NOT_SUBMITTED: 'bg-[#EDF0F7] text-[#717784] border-[#E1E4EA]',
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-3.5 flex items-center justify-between border-b border-[#E1E4EA] last:border-0">
      <span className="text-sm text-[#717784]">{label}</span>
      <span className="text-sm font-medium text-[#0E121B] text-right">{value}</span>
    </div>
  );
}

function initials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', phoneNumber: '' });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    adminUsers.get(id).then(setUser).finally(() => setLoading(false));
  }, [id]);

  async function toggleStatus(status: string) {
    setUpdating(true);
    try {
      await adminUsers.updateStatus(id, status);
      setUser((u) => u ? { ...u, accountStatus: status } : u);
    } finally {
      setUpdating(false);
    }
  }

  function startEdit() {
    if (!user) return;
    setEditForm({ firstName: user.firstName, lastName: user.lastName, phoneNumber: user.phoneNumber ?? '' });
    setEditing(true);
  }

  async function saveEdit() {
    setUpdating(true);
    try {
      const updated = await adminUsersExtra.edit(id, editForm);
      setUser((u) => u ? { ...u, ...updated } : u);
      setEditing(false);
    } finally {
      setUpdating(false);
    }
  }

  async function deleteUser() {
    if (!confirm('Permanently delete this user account? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await adminUsersExtra.delete(id);
      router.push('/users');
    } finally {
      setDeleting(false);
    }
  }

  async function downloadStatement(format: 'csv' | 'pdf') {
    const res = await adminReports.userStatement(id, { format });
    downloadBlob(res.data, `statement-${id}.${format}`);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-[#EDF0F7] rounded-lg animate-pulse w-48" />
        <div className="h-36 bg-white rounded-xl animate-pulse border border-[#E1E4EA]" />
        <div className="h-48 bg-white rounded-xl animate-pulse border border-[#E1E4EA]" />
        <div className="h-64 bg-white rounded-xl animate-pulse border border-[#E1E4EA]" />
      </div>
    );
  }

  if (!user) return <p className="text-[#FF3B30] text-sm">User not found.</p>;

  const kycStatus = user.kycStatus ?? 'NOT_SUBMITTED';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E1E4EA] bg-white text-[#717784] hover:text-[#0E121B] hover:border-[#0E121B] transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <h2 className="text-lg font-semibold text-[#0E121B] flex-1">User Profile</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => downloadStatement('csv')} className="h-8 text-xs gap-1.5">
            <Download size={13} /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => downloadStatement('pdf')} className="h-8 text-xs gap-1.5">
            <Download size={13} /> PDF
          </Button>
          <Button size="sm" variant="outline" onClick={startEdit} className="h-8 text-xs gap-1.5">
            <Pencil size={13} /> Edit
          </Button>
          {user.accountStatus === 'ACTIVE' ? (
            <Button size="sm" onClick={() => toggleStatus('SUSPENDED')} disabled={updating}
              className="h-8 text-xs bg-[#D99800] text-white hover:bg-yellow-600">
              Suspend
            </Button>
          ) : (
            <Button size="sm" onClick={() => toggleStatus('ACTIVE')} disabled={updating}
              className="h-8 text-xs bg-[#12B76A] text-white hover:bg-green-600">
              Activate
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={deleteUser} disabled={deleting}
            className="h-8 text-xs gap-1.5 border-[#FF3B30] text-[#FF3B30] hover:bg-[#FFF6F6]">
            <Trash2 size={13} /> Delete
          </Button>
        </div>
      </div>

      {/* Identity card */}
      <div className="bg-white rounded-xl border border-[#E1E4EA] p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#C5DB10] flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-bold text-[#0E121B]">{initials(user.firstName, user.lastName)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-[#0E121B]">{user.firstName} {user.lastName}</p>
          <p className="text-sm text-[#717784]">{user.email}</p>
          <p className="text-sm text-[#717784]">{user.phoneNumber ?? '—'}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge className={`text-xs border ${STATUS_COLOR[user.accountStatus] ?? ''}`}>{user.accountStatus}</Badge>
          {user.tier && <span className="text-xs text-[#717784] bg-[#EDF0F7] px-2 py-0.5 rounded-full">{user.tier}</span>}
        </div>
      </div>

      {/* Account Details */}
      <div className="bg-white rounded-xl border border-[#E1E4EA] overflow-hidden">
        <p className="px-5 py-3.5 text-xs font-semibold text-[#717784] uppercase tracking-wide border-b border-[#E1E4EA]">Account Details</p>
        <div className="px-5 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E1E4EA]">
          <div>
            <Field label="Member since" value={formatDate(user.createdAt)} />
            <Field label="Account Status" value={
              <Badge className={`text-xs border ${STATUS_COLOR[user.accountStatus] ?? ''}`}>{user.accountStatus}</Badge>
            } />
            <Field label="Tier" value={
              <span className="text-xs bg-[#EDF0F7] text-[#717784] px-2 py-0.5 rounded-full">{user.tier}</span>
            } />
          </div>
          <div className="md:pl-5">
            <Field label="KYC Status" value={
              <Badge className={`text-xs border ${KYC_COLOR[kycStatus] ?? 'bg-[#EDF0F7] text-[#717784] border-[#E1E4EA]'}`}>
                {kycStatus.replace(/_/g, ' ')}
              </Badge>
            } />
            <Field label="Phone" value={user.phoneNumber ?? '—'} />
            <Field label="User ID" value={<span className="font-mono text-xs text-[#717784]">{user.id}</span>} />
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E1E4EA] w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-semibold text-[#0E121B]">Edit User</h3>
            <div className="space-y-3">
              {(['firstName', 'lastName', 'phoneNumber'] as const).map((field) => (
                <div key={field} className="space-y-1.5">
                  <label className="text-sm font-medium text-[#0E121B] capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                  <input
                    value={editForm[field]}
                    onChange={(e) => setEditForm((f) => ({ ...f, [field]: e.target.value }))}
                    className="w-full border border-[#E1E4EA] rounded-lg px-3 py-2 text-sm text-[#0E121B] focus:outline-none focus:ring-2 focus:ring-[#C5DB10]"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={saveEdit} disabled={updating} className="bg-[#C5DB10] text-[#0E121B] font-semibold hover:bg-[#b0c40e]">
                {updating ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border border-[#E1E4EA] overflow-hidden">
        <p className="px-5 py-3.5 text-xs font-semibold text-[#717784] uppercase tracking-wide border-b border-[#E1E4EA]">
          Recent Transactions
        </p>
        {(user.recentTransactions ?? []).length === 0 ? (
          <p className="text-sm text-[#717784] text-center py-10">No transactions yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F5F7FA] border-b border-[#E1E4EA]">
                {['Date', 'Type', 'Amount', 'Reason'].map((h) => (
                  <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold text-[#717784] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(user.recentTransactions ?? []).map((tx) => (
                <tr key={tx.id} className="border-b border-[#E1E4EA] last:border-0">
                  <td className="px-5 py-3 text-[#717784] text-xs">{formatDate(tx.createdAt)}</td>
                  <td className="px-5 py-3">
                    <Badge className={`text-xs border ${
                      tx.transactionType === 'CREDIT' ? 'bg-[#F6FFF9] text-[#12B76A] border-[#12B76A]/20' :
                      tx.transactionType === 'REVERSED' ? 'bg-[#EFF6FF] text-[#3571F1] border-[#3571F1]/20' :
                      'bg-[#FFF6F6] text-[#FF3B30] border-[#FF3B30]/20'
                    }`}>
                      {tx.transactionType}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 font-medium text-[#0E121B]">{formatMoney(tx.amount)}</td>
                  <td className="px-5 py-3 text-[#717784] max-w-[200px] truncate">{tx.reason ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
