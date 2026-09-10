'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminUsers, adminOrders, adminReports, adminUsersExtra } from '@/lib/api';
import { toast } from 'sonner';
import { formatDate, formatMoney, downloadBlob } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExportModal } from '@/components/ExportModal';
import { ChevronLeft, Download, Pencil, RefreshCw, User, ShieldCheck, ClipboardList, TrendingUp, X, ZoomIn } from 'lucide-react';

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
  id: string; currency: string; provider: string; status: string;
  virtualAccountNumber: string; virtualAccountBankName: string; bankName: string;
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

const STATUS_DESC: Record<string, string> = {
  ACTIVE: 'Can log in and trade',
  PENDING: 'Awaiting Naya broker account setup — app account is not locked',
  SUSPENDED: 'Blocked from login and trading',
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
  return '•'.repeat(Math.min(val.length - keep, 6)) + val.slice(-keep);
}

function isImageUrl(val: string): boolean {
  try {
    const url = new URL(val);
    return /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url.pathname);
  } catch { return false; }
}

function toLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

const SENSITIVE_KEYS = new Set(['bvn', 'nin', 'password', 'pin', 'ssn']);

function ImageThumb({ src, label, onOpen }: { src: string; label: string; onOpen: (src: string, label: string) => void }) {
  return (
    <button
      onClick={() => onOpen(src, label)}
      className="relative group w-20 h-20 rounded-lg overflow-hidden border border-[#E1E4EA] flex-shrink-0 hover:border-[#C5DB10] transition-colors"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={label} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
        <ZoomIn size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  );
}

function TierDataBlock({
  label, data, onImageOpen,
}: { label: string; data: Record<string, unknown>; onImageOpen: (src: string, label: string) => void }) {
  const entries = Object.entries(data).filter(([, v]) => v != null && v !== '');
  if (entries.length === 0) return null;

  const images: { key: string; url: string }[] = [];
  const fields: { key: string; val: string }[] = [];

  entries.forEach(([k, v]) => {
    const raw = String(v);
    if (isImageUrl(raw)) {
      images.push({ key: k, url: raw });
    } else {
      fields.push({ key: k, val: raw });
    }
  });

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-[#717784] uppercase tracking-wide">{label}</p>

      {/* Image thumbnails */}
      {images.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {images.map(({ key, url }) => (
            <div key={key} className="flex flex-col items-center gap-1">
              <ImageThumb src={url} label={toLabel(key)} onOpen={onImageOpen} />
              <span className="text-xs text-[#717784]">{toLabel(key)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Fields */}
      <div className="bg-[#F5F7FA] rounded-lg px-4 divide-y divide-[#E1E4EA]">
        {fields.map(({ key, val }) => {
          const isSensitive = SENSITIVE_KEYS.has(key.toLowerCase());
          const display = isSensitive ? mask(val) : val;
          const isDate = key.toLowerCase().includes('date') || key.toLowerCase().includes('at');
          let formatted = display;
          if (isDate && !isSensitive) {
            try { formatted = formatDate(val); } catch { /* keep raw */ }
          }
          return (
            <div key={key} className="py-2.5 flex items-start justify-between gap-4">
              <span className="text-xs text-[#717784] flex-shrink-0">{toLabel(key)}</span>
              <span className="text-xs font-medium text-[#0E121B] text-right break-all max-w-[65%]">{formatted}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ImageModal({ src, label, onClose }: { src: string; label: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-2xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors flex items-center gap-1.5 text-sm"
        >
          <X size={16} /> Close
        </button>
        <p className="text-white/60 text-xs mb-2">{label}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={label} className="w-full max-h-[80vh] object-contain rounded-xl" />
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
  const [retryingBroker, setRetryingBroker] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersLoaded, setOrdersLoaded] = useState(false);

  const [imageModal, setImageModal] = useState<{ src: string; label: string } | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{ targetStatus: 'ACTIVE' | 'SUSPENDED' } | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmReason, setConfirmReason] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);

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

  function closeConfirmModal() {
    setConfirmModal(null);
    setConfirmPassword('');
    setConfirmReason('');
    setConfirmError('');
  }

  async function confirmStatusChange() {
    if (!confirmModal) return;
    setConfirmLoading(true);
    setConfirmError('');
    try {
      await adminUsers.updateStatus(id, confirmModal.targetStatus, confirmPassword, confirmReason || undefined);
      setUser((u) => u ? { ...u, accountStatus: confirmModal.targetStatus } : u);
      closeConfirmModal();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Something went wrong';
      setConfirmError(msg);
    } finally {
      setConfirmLoading(false);
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

  async function retryBrokerAccount() {
    setRetryingBroker(true);
    try {
      const result = await adminUsersExtra.retryBrokerAccount(id);
      if (result?.action === 'status_checked') {
        toast.info('Creation already in progress', {
          description: `Naya already received this request. Status: ${result.status ?? 'unknown'} (code ${result.statusCode ?? '?'})`,
          duration: 8000,
        });
      } else {
        toast.success('Re-submitted to Naya', {
          description: 'Account creation re-sent. The system will check for activation in ~20 minutes.',
        });
      }
    } catch {
      // errors handled globally by api interceptor
    } finally {
      setRetryingBroker(false);
    }
  }

  async function handleExportStatement(from: string, to: string, format: 'csv' | 'pdf') {
    const res = await adminReports.userStatement(id, { from, to, format });
    downloadBlob(res.data, `statement-${user?.lastName ?? id}-${from}-${to}.${format}`);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-[#EDF0F7] rounded-lg animate-pulse w-48" />
        <div className="h-48 bg-white rounded-xl animate-pulse border border-[#E1E4EA]" />
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
      {imageModal && (
        <ImageModal src={imageModal.src} label={imageModal.label} onClose={() => setImageModal(null)} />
      )}
      {exportOpen && (
        <ExportModal
          title="Export Statement"
          onExport={handleExportStatement}
          onClose={() => setExportOpen(false)}
        />
      )}

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
            {user.phoneNumber && <p className="text-sm text-[#717784]">{user.phoneNumber}</p>}

            {/* Labeled status chips */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#717784]">Account</span>
                <Badge
                  title={STATUS_DESC[user.accountStatus]}
                  className={`text-xs border cursor-help ${STATUS_COLOR[user.accountStatus] ?? 'bg-[#EDF0F7] text-[#717784] border-[#E1E4EA]'}`}
                >
                  {user.accountStatus}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#717784]">KYC</span>
                <Badge className={`text-xs border ${KYC_COLOR[kycStatus]}`}>
                  {kycStatus.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#717784]">Tier</span>
                <span className="text-xs text-[#0E121B] bg-[#EDF0F7] px-2 py-0.5 rounded-full font-medium">{user.tier}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#717784]">Email</span>
                {user.emailVerified
                  ? <span className="text-xs text-[#12B76A] bg-[#F6FFF9] px-2 py-0.5 rounded-full border border-[#12B76A]/20">Verified</span>
                  : <span className="text-xs text-[#D99800] bg-[#FFF6BD] px-2 py-0.5 rounded-full border border-[#D99800]/20">Unverified</span>
                }
              </div>
            </div>

            {/* PENDING status explanation */}
            {user.accountStatus === 'PENDING' && (
              <div className="mt-3 flex items-start gap-2 bg-[#EDF0F7] rounded-lg px-3 py-2.5">
                <span className="text-xs text-[#717784] leading-relaxed">
                  <strong className="text-[#0E121B]">PENDING</strong> refers to the <strong className="text-[#0E121B]">Naya broker account</strong> setup — not the app account. The app account is active; the user can log in but cannot trade until the Naya broker account is ready.
                </span>
              </div>
            )}

          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#E1E4EA] flex-wrap">
          <Button size="sm" variant="outline" onClick={() => setExportOpen(true)} className="h-8 text-xs gap-1.5">
            <Download size={13} /> Export Statement
          </Button>
          <Button size="sm" variant="outline" onClick={startEdit} className="h-8 text-xs gap-1.5">
            <Pencil size={13} /> Edit
          </Button>
          {user.accountStatus === 'ACTIVE' && (
            <Button size="sm" onClick={() => setConfirmModal({ targetStatus: 'SUSPENDED' })}
              className="h-8 text-xs bg-[#D99800] text-white hover:bg-yellow-600">
              Suspend
            </Button>
          )}
          {user.accountStatus === 'SUSPENDED' && (
            <Button size="sm" onClick={() => setConfirmModal({ targetStatus: 'ACTIVE' })}
              className="h-8 text-xs bg-[#12B76A] text-white hover:bg-green-600">
              Activate
            </Button>
          )}
          {user.accountStatus === 'PENDING' && !user.brokerAccNo && kycStatus === 'APPROVED' && (
            <Button size="sm" variant="outline" onClick={retryBrokerAccount} disabled={retryingBroker}
              className="h-8 text-xs gap-1.5">
              <RefreshCw size={13} className={retryingBroker ? 'animate-spin' : ''} />
              {retryingBroker ? 'Scheduling…' : 'Retry Naya Broker Account'}
            </Button>
          )}
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
              <Field label="First Name" value={user.firstName} />
              <Field label="Last Name" value={user.lastName} />
              <Field label="Email" value={user.email} />
              <Field label="Phone" value={user.phoneNumber ?? '—'} />
              <Field label="Country" value={user.country ?? '—'} />
            </div>
            <div>
              <Field label="Member Since" value={formatDate(user.createdAt)} />
              <Field label="Account Status" value={
                <span className="flex items-center gap-1.5">
                  <Badge className={`text-xs border ${STATUS_COLOR[user.accountStatus] ?? ''}`}>{user.accountStatus}</Badge>
                  {user.accountStatus === 'PENDING' && <span className="text-xs text-[#717784]">(Naya broker account pending)</span>}
                </span>
              } />
              <Field label="Tier" value={<span className="text-xs bg-[#EDF0F7] text-[#717784] px-2 py-0.5 rounded-full">{user.tier}</span>} />
              <Field label="Broker Acc No. (Naya)" value={user.brokerAccNo ? <span className="font-mono text-xs">{user.brokerAccNo}</span> : '—'} />
              <Field label="CHN" value={user.chn ? <span className="font-mono text-xs">{user.chn}</span> : '—'} />
            </div>
          </div>
          <div className="px-5">
            <Field label="User ID" value={<span className="font-mono text-xs text-[#717784]">{user.id}</span>} />
          </div>

          {/* Wallets */}
          {user.wallets && user.wallets.length > 0 && (
            <div className="px-5 pt-3 pb-4 border-t border-[#E1E4EA] mt-2">
              <p className="text-xs font-semibold text-[#717784] uppercase tracking-wide mb-3">Virtual Accounts</p>
              <div className="space-y-2">
                {user.wallets.map((w) => (
                  <div key={w.id} className="flex items-center justify-between bg-[#F5F7FA] rounded-lg px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-[#0E121B] font-mono">{w.virtualAccountNumber}</p>
                      <p className="text-xs text-[#717784]">{w.virtualAccountBankName} · {w.currency} · {w.provider}</p>
                    </div>
                    <Badge className={`text-xs border ${w.status === 'ACTIVE' ? 'bg-[#F6FFF9] text-[#12B76A] border-[#12B76A]/20' : 'bg-[#EDF0F7] text-[#717784] border-[#E1E4EA]'}`}>
                      {w.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: KYC & Identity */}
      {tab === 'kyc' && (
        <div className="space-y-4">
          {/* KYC Summary */}
          <div className="bg-white rounded-xl border border-[#E1E4EA] overflow-hidden">
            <p className="px-5 py-3.5 text-xs font-semibold text-[#717784] uppercase tracking-wide border-b border-[#E1E4EA]">KYC Summary</p>
            <div className="px-5 grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div>
                <Field label="KYC Status" value={
                  <Badge className={`text-xs border ${KYC_COLOR[kycStatus]}`}>{kycStatus.replace(/_/g, ' ')}</Badge>
                } />
                <Field label="Liveness Check" value={
                  kyc
                    ? <Badge className={`text-xs border ${LIVENESS_COLOR[kyc.livenessStatus] ?? 'bg-[#EDF0F7] text-[#717784] border-[#E1E4EA]'}`}>{kyc.livenessStatus}</Badge>
                    : '—'
                } />
                <Field label="Liveness Verified" value={kyc?.livenessVerifiedAt ? formatDate(kyc.livenessVerifiedAt) : '—'} />
                <Field label="Liveness Ref" value={kyc?.livenessRef ? <span className="font-mono text-xs text-[#717784]">{kyc.livenessRef}</span> : '—'} />
              </div>
              <div>
                <Field label="Naya KYC Ref" value={
                  (user.mayaKycRefNo || kyc?.mayaKycRefNo)
                    ? <span className="font-mono text-xs">{user.mayaKycRefNo ?? kyc?.mayaKycRefNo}</span>
                    : '—'
                } />
                <Field label="Bank Account" value={kyc?.accountNumber ? <span className="font-mono text-xs">{mask(kyc.accountNumber, 4)}</span> : '—'} />
                <Field label="Bank Code" value={kyc?.bankCode ?? '—'} />
                <Field label="Tax ID (TIN)" value={kyc?.taxIdentificationNumber ? <span className="font-mono text-xs">{mask(kyc.taxIdentificationNumber, 4)}</span> : '—'} />
              </div>
            </div>
          </div>

          {/* Tier data blocks */}
          {kyc ? (
            (() => {
              const tiers = [1, 2, 3, 4, 5].map((n) => ({
                n,
                data: kyc[`tier${n}Data` as keyof KycProfile] as Record<string, unknown> | null,
              })).filter(({ data }) => data != null);

              return tiers.length > 0 ? (
                <div className="bg-white rounded-xl border border-[#E1E4EA] p-5 space-y-6">
                  <p className="text-xs font-semibold text-[#717784] uppercase tracking-wide">Submitted KYC Data</p>
                  {tiers.map(({ n, data }) => (
                    <TierDataBlock
                      key={n}
                      label={`Tier ${n} Submission`}
                      data={data!}
                      onImageOpen={(src, label) => setImageModal({ src, label })}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-[#E1E4EA] p-8 text-center">
                  <p className="text-sm text-[#717784]">KYC profile exists but no submission data recorded</p>
                </div>
              );
            })()
          ) : (
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
            Recent Transactions <span className="normal-case font-normal text-[#CACFD8]">(last 10)</span>
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
                    <td className="px-5 py-3 text-[#717784] max-w-[220px] truncate">{tx.reason ?? '—'}</td>
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

      {/* Confirm Status Change Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E1E4EA] w-full max-w-md p-6 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-[#0E121B]">
                {confirmModal.targetStatus === 'SUSPENDED' ? 'Suspend Account' : 'Activate Account'}
              </h3>
              <p className="text-sm text-[#717784] mt-1">
                {confirmModal.targetStatus === 'SUSPENDED'
                  ? 'This will block the user from logging in and trading.'
                  : "This will restore the user's access to login and trading."}
              </p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#0E121B]">
                  Reason <span className="text-[#CACFD8] font-normal">(optional)</span>
                </label>
                <textarea
                  value={confirmReason}
                  onChange={(e) => setConfirmReason(e.target.value)}
                  rows={2}
                  placeholder="e.g. Suspicious activity, account verification…"
                  className="w-full border border-[#E1E4EA] rounded-lg px-3 py-2 text-sm text-[#0E121B] focus:outline-none focus:ring-2 focus:ring-[#C5DB10] resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#0E121B]">
                  Your Password <span className="text-[#FF3B30] font-normal">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setConfirmError(''); }}
                  placeholder="Enter your admin password to confirm"
                  className="w-full border border-[#E1E4EA] rounded-lg px-3 py-2 text-sm text-[#0E121B] focus:outline-none focus:ring-2 focus:ring-[#C5DB10]"
                />
              </div>
              {confirmError && <p className="text-xs text-[#FF3B30]">{confirmError}</p>}
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button size="sm" variant="outline" onClick={closeConfirmModal} disabled={confirmLoading}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={confirmStatusChange}
                disabled={confirmLoading || !confirmPassword}
                className={`${confirmModal.targetStatus === 'SUSPENDED' ? 'bg-[#D99800] hover:bg-yellow-600' : 'bg-[#12B76A] hover:bg-green-600'} text-white`}
              >
                {confirmLoading ? 'Confirming…' : confirmModal.targetStatus === 'SUSPENDED' ? 'Suspend' : 'Activate'}
              </Button>
            </div>
          </div>
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
                  <label className="text-sm font-medium text-[#0E121B]">{toLabel(field)}</label>
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
