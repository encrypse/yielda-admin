'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminUsers, adminOrders, adminReports, adminUsersExtra } from '@/lib/api';
import { formatDate, formatMoney, downloadBlob } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Download, Pencil, Trash2, User, ShieldCheck, ClipboardList, TrendingUp } from 'lucide-react';

type KycProfile = {
  id: string;
  livenessStatus: string;
  livenessRef: string | null;
  livenessVerifiedAt: string | null;
  bankCode: string | null;
  accountNumber: string | null;
  mayaKycRefNo: string | null;
  taxIdentificationNumber: string | null;
  tier1Data: Record<string, unknown> | null;
  tier2Data: Record<string, unknown> | null;
  tier3Data: Record<string, unknown> | null;
  tier4Data: Record<string, unknown> | null;
  tier5Data: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

type Wallet = {
  id: string;
  currency: string;
  provider: string;
  status: string;
  virtualAccountNumber: string;
  virtualAccountBankName: string;
  bankName: string;
};

type UserDetail = {
  id: string; firstName: string; lastName: string; email: string;
  phoneNumber: string | null; accountStatus: string; tier: string;
  country: string; emailVerified: boolean;
  brokerAccNo: string | null; chn: string | null; mayaKycRefNo: string | null;
  createdAt: string; updatedAt: string;
  kycStatus?: string;
  kycProfile: KycProfile | null;
  wallets: Wallet[];
  recentTransactions?: Array<{
    id: string; transactionType: string; amount: string; reason: string | null; reference: string; createdAt: string;
  }>;
};

type Order = {
  id: string; side: string; symbol: string; quantity: number; price: string;
  totalEstimatedValue: string; status: string; createdAt: string;
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-[#F6FFF9] text-[#12B76A] border-[#12B76A]/20',
  SUSPENDED: 'bg-[#FFF6BD] text-[#D99800] border-[#D99800]/20',
  PENDING: 'bg-[#EDF0F7] text-[#717784] border-[#E1E4EA]',
};

const KYC_COLOR: Record<string, string> = {
  APPROVED: 'bg-[#F6FFF9] text-[#12B76A] border-[#12B76A]/20',
  IN_REVIEW: 'bg-[#FFF6BD] text-[#D99800] border-[#D99800]/20',
  FAILED: 'bg-[#FFF6F6] text-[#FF3B30] border-[#FF3B30]/20',
  NOT_SUBMITTED: 'bg-[#EDF0F7] text-[#717784] border-[#E1E4EA]',
};

const LIVENESS_COLOR: Record<string, string> = {
  PASSED: 'bg-[#F6FFF9] text-[#12B76A] border-[#12B76A]/20',
  FAILED: 'bg-[#FFF6F6] text-[#FF3B30] border-[#FF3B30]/20',
  PENDING: 'bg-[#EDF0F7] text-[#717784] border-[#E1E4EA]',
};

const ORDER_STATUS_COLOR: Record<string, string> = {
  COMPLETED: 'bg-[#F6FFF9] text-[#12B76A] border-[#12B76A]/20',
  PENDING: 'bg-[#FFF6BD] text-[#D99800] border-[#D99800]/20',
  FAILED: 'bg-[#FFF6F6] text-[#FF3B30] border-[#FF3B30]/20',
  CANCELLED: 'bg-[#FFF6F6] text-[#FF3B30] border-[#FF3B30]/20',
  QUOTED: 'bg-[#EFF6FF] text-[#3571F1] border-[#3571F1]/20',
  SUBMITTED: 'bg-[#EDF0F7] text-[#717784] border-[#E1E4EA]',
};

const TX_COLOR: Record<string, string> = {
  CREDIT: 'bg-[#F6FFF9] text-[#12B76A] border-[#12B76A]/20',
  DEBIT: 'bg-[#FFF6F6] text-[#FF3B30] border-[#FF3B30]/20',
  REVERSED: 'bg-[#EFF6FF] text-[#3571F1] border-[#3571F1]/20',
};

type Tab = 'overview' | 'kyc' | 'transactions' | 'orders';

function initials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-3 flex items-center justify-between border-b border-[#E1E4EA] last:border-0">
      <span className="text-sm text-[#717784]">{label}</span>
      <span className="text-sm font-medium text-[#0E121B] text-right max-w-[60%] break-all">{value}</span>
    </div>
  );
}

function mask(val: string | null | undefined, keep = 4): string {
  if (!val) return '—';
  if (val.length <= keep) return val;
  return '•'.repeat(val.length - keep) + val.slice(-keep);
}

function TierDataBlock({ label, data }: { label: string; data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([, v]) => v != null && v !== '');
  if (entries.length === 0) return null;

  const SENSITIVE = new Set(['bvn', 'nin', 'password', 'pin', 'ssn', 'dob']);
  return (
    <div>
      <p className="text-xs font-semibold text-[#717784] uppercase tracking-wide mb-2">{label}</p>
      <div className="bg-[#F5F7FA] rounded-lg px-4 divide-y divide-[#E1E4EA]">
        {entries.map(([k, v]) => {
          const raw = String(v);
          const isSensitive = SENSITIVE.has(k.toLowerCase());
          const display = isSensitive ? mask(raw) : raw;
          return (
            <div key={k} className="py-2.5 flex items-center justify-between gap-4">
              <span className="text-xs text-[#717784] capitalize">{k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</span>
              <span className="text-xs font-medium text-[#0E121B] font-mono text-right break-all max-w-[60%]">{display}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
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
  const [tab, setTab] = useState<Tab>('overview');

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersLoaded, setOrdersLoaded] = useState(false);

  useEffect(() => {
    adminUsers.get(id).then(setUser).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (tab === 'orders' && !ordersLoaded) {
      setOrdersLoading(true);
      adminOrders.list({ userId: id, limit: 20 })
        .then((data) => { setOrders(data.content); setOrdersLoaded(true); })
        .finally(() => setOrdersLoading(false));
    }
  }, [tab, id, ordersLoaded]);

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
        <div className="h-10 bg-white rounded-xl animate-pulse border border-[#E1E4EA]" />
        <div className="h-64 bg-white rounded-xl animate-pulse border border-[#E1E4EA]" />
      </div>
    );
  }

  if (!user) return <p className="text-[#FF3B30] text-sm">User not found.</p>;

  const kycStatus = user.kycStatus ?? 'NOT_SUBMITTED';
  const kyc = user.kycProfile;

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Overview', icon: User },
    { key: 'kyc', label: 'KYC & Identity', icon: ShieldCheck },
    { key: 'transactions', label: 'Transactions', icon: ClipboardList },
    { key: 'orders', label: 'Orders', icon: TrendingUp },
  ];

  return (
    <div className="space-y-4">
      {/* Back */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E1E4EA] bg-white text-[#717784] hover:text-[#0E121B] hover:border-[#0E121B] transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <h2 className="text-lg font-semibold text-[#0E121B] flex-1">User Profile</h2>
      </div>

      {/* Identity card */}
      <div className="bg-white rounded-xl border border-[#E1E4EA] p-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-[#C5DB10] flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-[#0E121B]">{initials(user.firstName, user.lastName)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-[#0E121B]">{user.firstName} {user.lastName}</p>
            <p className="text-sm text-[#717784]">{user.email}</p>
            <p className="text-sm text-[#717784]">{user.phoneNumber ?? '—'}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge className={`text-xs border ${STATUS_COLOR[user.accountStatus] ?? 'bg-[#EDF0F7] text-[#717784] border-[#E1E4EA]'}`}>
                {user.accountStatus}
              </Badge>
              <Badge className={`text-xs border ${KYC_COLOR[kycStatus]}`}>{kycStatus.replace(/_/g, ' ')}</Badge>
              {user.tier && <span className="text-xs text-[#717784] bg-[#EDF0F7] px-2 py-0.5 rounded-full">{user.tier}</span>}
              {user.emailVerified
                ? <span className="text-xs text-[#12B76A] bg-[#F6FFF9] px-2 py-0.5 rounded-full border border-[#12B76A]/20">Email Verified</span>
                : <span className="text-xs text-[#D99800] bg-[#FFF6BD] px-2 py-0.5 rounded-full border border-[#D99800]/20">Email Unverified</span>
              }
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#E1E4EA] flex-wrap">
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
            className="h-8 text-xs gap-1.5 border-[#FF3B30] text-[#FF3B30] hover:bg-[#FFF6F6] ml-auto">
            <Trash2 size={13} /> Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F5F7FA] p-1 rounded-xl border border-[#E1E4EA]">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              tab === key ? 'bg-white text-[#0E121B] shadow-sm border border-[#E1E4EA]' : 'text-[#717784] hover:text-[#0E121B]'
            }`}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === 'overview' && (
        <div className="bg-white rounded-xl border border-[#E1E4EA] overflow-hidden">
          <p className="px-5 py-3.5 text-xs font-semibold text-[#717784] uppercase tracking-wide border-b border-[#E1E4EA]">Account Details</p>
          <div className="px-5 grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div>
              <Field label="Member since" value={formatDate(user.createdAt)} />
              <Field label="Account Status" value={
                <Badge className={`text-xs border ${STATUS_COLOR[user.accountStatus] ?? ''}`}>{user.accountStatus}</Badge>
              } />
              <Field label="Account Tier" value={
                <span className="text-xs bg-[#EDF0F7] text-[#717784] px-2 py-0.5 rounded-full">{user.tier}</span>
              } />
              <Field label="Country" value={user.country ?? '—'} />
              <Field label="Email Verified" value={
                user.emailVerified
                  ? <span className="text-[#12B76A] text-xs font-semibold">Yes</span>
                  : <span className="text-[#FF3B30] text-xs font-semibold">No</span>
              } />
            </div>
            <div>
              <Field label="KYC Status" value={
                <Badge className={`text-xs border ${KYC_COLOR[kycStatus]}`}>{kycStatus.replace(/_/g, ' ')}</Badge>
              } />
              <Field label="Phone" value={user.phoneNumber ?? '—'} />
              <Field label="Broker Acc No." value={user.brokerAccNo ? <span className="font-mono text-xs">{user.brokerAccNo}</span> : '—'} />
              <Field label="CHN" value={user.chn ? <span className="font-mono text-xs">{user.chn}</span> : '—'} />
              <Field label="User ID" value={<span className="font-mono text-xs text-[#717784]">{user.id}</span>} />
            </div>
          </div>

          {/* Wallets */}
          {user.wallets && user.wallets.length > 0 && (
            <>
              <div className="px-5 pt-4 pb-2 border-t border-[#E1E4EA]">
                <p className="text-xs font-semibold text-[#717784] uppercase tracking-wide mb-3">Wallets</p>
                <div className="space-y-2">
                  {user.wallets.map((w) => (
                    <div key={w.id} className="flex items-center justify-between bg-[#F5F7FA] rounded-lg px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-[#0E121B]">{w.virtualAccountNumber}</p>
                        <p className="text-xs text-[#717784]">{w.virtualAccountBankName} · {w.currency} · {w.provider}</p>
                      </div>
                      <Badge className={`text-xs border ${w.status === 'ACTIVE' ? 'bg-[#F6FFF9] text-[#12B76A] border-[#12B76A]/20' : 'bg-[#EDF0F7] text-[#717784] border-[#E1E4EA]'}`}>
                        {w.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pb-2" />
            </>
          )}
        </div>
      )}

      {/* Tab: KYC & Identity */}
      {tab === 'kyc' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E1E4EA] overflow-hidden">
            <p className="px-5 py-3.5 text-xs font-semibold text-[#717784] uppercase tracking-wide border-b border-[#E1E4EA]">KYC Summary</p>
            <div className="px-5">
              <Field label="KYC Status" value={
                <Badge className={`text-xs border ${KYC_COLOR[kycStatus]}`}>{kycStatus.replace(/_/g, ' ')}</Badge>
              } />
              <Field label="Liveness Status" value={
                kyc
                  ? <Badge className={`text-xs border ${LIVENESS_COLOR[kyc.livenessStatus] ?? 'bg-[#EDF0F7] text-[#717784] border-[#E1E4EA]'}`}>{kyc.livenessStatus}</Badge>
                  : '—'
              } />
              <Field label="Liveness Verified At" value={kyc?.livenessVerifiedAt ? formatDate(kyc.livenessVerifiedAt) : '—'} />
              <Field label="Liveness Ref" value={kyc?.livenessRef ? <span className="font-mono text-xs text-[#717784]">{kyc.livenessRef}</span> : '—'} />
              <Field label="Maya KYC Ref" value={
                (user.mayaKycRefNo || kyc?.mayaKycRefNo)
                  ? <span className="font-mono text-xs text-[#717784]">{user.mayaKycRefNo ?? kyc?.mayaKycRefNo}</span>
                  : '—'
              } />
              <Field label="Bank Account" value={kyc?.accountNumber ? <span className="font-mono text-xs">{mask(kyc.accountNumber, 4)}</span> : '—'} />
              <Field label="Bank Code" value={kyc?.bankCode ?? '—'} />
              <Field label="Tax ID (TIN)" value={kyc?.taxIdentificationNumber ? <span className="font-mono text-xs">{mask(kyc.taxIdentificationNumber, 4)}</span> : '—'} />
              {kyc && <Field label="KYC Profile Created" value={formatDate(kyc.createdAt)} />}
            </div>
          </div>

          {/* Tier data */}
          {kyc && (
            <div className="bg-white rounded-xl border border-[#E1E4EA] p-5 space-y-5">
              <p className="text-xs font-semibold text-[#717784] uppercase tracking-wide">Submitted Data</p>
              {[1, 2, 3, 4, 5].map((n) => {
                const data = kyc[`tier${n}Data` as keyof KycProfile] as Record<string, unknown> | null;
                return data ? <TierDataBlock key={n} label={`Tier ${n} Data`} data={data} /> : null;
              })}
              {!kyc.tier1Data && !kyc.tier2Data && !kyc.tier3Data && !kyc.tier4Data && !kyc.tier5Data && (
                <p className="text-sm text-[#717784] text-center py-4">No submission data recorded</p>
              )}
            </div>
          )}

          {!kyc && (
            <div className="bg-white rounded-xl border border-[#E1E4EA] p-10 text-center">
              <ShieldCheck size={32} className="text-[#CACFD8] mx-auto mb-3" />
              <p className="text-sm font-medium text-[#717784]">No KYC profile submitted</p>
              <p className="text-xs text-[#CACFD8] mt-1">This user has not started the KYC process.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Transactions */}
      {tab === 'transactions' && (
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
                  {['Date', 'Type', 'Amount', 'Reference', 'Reason'].map((h) => (
                    <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold text-[#717784] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(user.recentTransactions ?? []).map((tx) => (
                  <tr key={tx.id} className="border-b border-[#E1E4EA] last:border-0 hover:bg-[#F5F7FA]">
                    <td className="px-5 py-3 text-[#717784] text-xs">{formatDate(tx.createdAt)}</td>
                    <td className="px-5 py-3">
                      <Badge className={`text-xs border ${TX_COLOR[tx.transactionType] ?? 'bg-[#EDF0F7] text-[#717784] border-[#E1E4EA]'}`}>
                        {tx.transactionType}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 font-medium text-[#0E121B]">{formatMoney(tx.amount)}</td>
                    <td className="px-5 py-3 text-xs font-mono text-[#717784]">{tx.reference.slice(0, 14)}…</td>
                    <td className="px-5 py-3 text-[#717784] max-w-[200px] truncate">{tx.reason ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Orders */}
      {tab === 'orders' && (
        <div className="bg-white rounded-xl border border-[#E1E4EA] overflow-hidden">
          <p className="px-5 py-3.5 text-xs font-semibold text-[#717784] uppercase tracking-wide border-b border-[#E1E4EA]">Orders</p>
          {ordersLoading ? (
            <div className="p-5 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-[#EDF0F7] rounded animate-pulse" />)}
            </div>
          ) : orders.length === 0 ? (
            <p className="text-sm text-[#717784] text-center py-10">No orders yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5F7FA] border-b border-[#E1E4EA]">
                  {['Side', 'Symbol', 'Qty', 'Price', 'Value', 'Status', 'Date'].map((h) => (
                    <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold text-[#717784] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-[#E1E4EA] last:border-0 hover:bg-[#F5F7FA] cursor-pointer"
                    onClick={() => router.push(`/orders/${o.id}`)}>
                    <td className="px-5 py-3">
                      <Badge className={`text-xs border ${o.side === 'BUY' ? 'bg-[#F6FFF9] text-[#12B76A] border-[#12B76A]/20' : 'bg-[#FFF6F6] text-[#FF3B30] border-[#FF3B30]/20'}`}>{o.side}</Badge>
                    </td>
                    <td className="px-5 py-3 font-mono text-[#0E121B]">{o.symbol}</td>
                    <td className="px-5 py-3 text-[#717784]">{o.quantity}</td>
                    <td className="px-5 py-3 text-[#717784]">{formatMoney(o.price)}</td>
                    <td className="px-5 py-3 font-medium text-[#0E121B]">{formatMoney(o.totalEstimatedValue)}</td>
                    <td className="px-5 py-3">
                      <Badge className={`text-xs border ${ORDER_STATUS_COLOR[o.status] ?? 'bg-[#EDF0F7] text-[#717784] border-[#E1E4EA]'}`}>{o.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-[#717784] text-xs">{formatDate(o.createdAt, 'dd MMM yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

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
    </div>
  );
}
