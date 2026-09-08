'use client';
import { useEffect, useState } from 'react';
import { adminSettings, adminMaintenance, adminProfile } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Trash2, Play, Shield, User, SlidersHorizontal, Wrench, CheckCircle2, XCircle } from 'lucide-react';

function LastRun({ result }: { result: { at: Date; status: 'ok' | 'err' } | null | undefined }) {
  if (!result) return null;
  const diff = Math.floor((Date.now() - result.at.getTime()) / 1000);
  const ago = diff < 60 ? `${diff}s ago` : `${Math.floor(diff / 60)}m ago`;
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${result.status === 'ok' ? 'text-[#12B76A]' : 'text-[#FF3B30]'}`}>
      {result.status === 'ok'
        ? <CheckCircle2 size={12} />
        : <XCircle size={12} />}
      {result.status === 'ok' ? 'Succeeded' : 'Failed'} · {ago}
    </span>
  );
}

type Tab = 'profile' | 'security' | 'financial' | 'maintenance';

const SETTING_META: Record<string, { label: string; description: string; prefix?: string; suffix?: string }> = {
  MIN_INVESTMENT_AMOUNT: { label: 'Minimum Investment', description: 'Smallest allowed investment in NGN', prefix: '₦' },
  MAX_INVESTMENT_AMOUNT: { label: 'Maximum Investment', description: 'Largest allowed investment in NGN', prefix: '₦' },
  MIN_WITHDRAWAL_AMOUNT: { label: 'Minimum Withdrawal', description: 'Smallest withdrawal allowed in NGN', prefix: '₦' },
  MAX_WITHDRAWAL_AMOUNT: { label: 'Maximum Withdrawal', description: 'Largest withdrawal allowed in NGN', prefix: '₦' },
  TRANSACTION_FEE_PERCENT: { label: 'Transaction Fee', description: 'Fee charged on each transaction', suffix: '%' },
  SETTLEMENT_CYCLE_DAYS: { label: 'Settlement Cycle', description: 'Number of days for settlement cycle', suffix: 'days' },
};

function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors w-full ${
        active ? 'bg-[#C5DB10] text-[#0E121B]' : 'text-[#717784] hover:bg-[#EDF0F7] hover:text-[#0E121B]'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[#E1E4EA] overflow-hidden">
      <p className="px-5 py-3.5 text-xs font-semibold text-[#717784] uppercase tracking-wide border-b border-[#E1E4EA]">{title}</p>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Feedback({ msg }: { msg: { type: 'ok' | 'err'; text: string } | null }) {
  if (!msg) return null;
  return <p className={`text-sm ${msg.type === 'ok' ? 'text-[#12B76A]' : 'text-[#FF3B30]'}`}>{msg.text}</p>;
}

export default function SettingsPage() {
  const { admin, isSuperAdmin, hasPermission, refreshAdmin } = useAuth();

  const tabs: { key: Tab; label: string; icon: React.ElementType; show: boolean }[] = [
    { key: 'profile',     label: 'Profile',     icon: User,             show: true },
    { key: 'security',    label: 'Security',    icon: Shield,           show: true },
    { key: 'financial',   label: 'Financial',   icon: SlidersHorizontal, show: isSuperAdmin || hasPermission('SETTINGS_READ') },
    { key: 'maintenance', label: 'Maintenance', icon: Wrench,           show: isSuperAdmin || hasPermission('MAINTENANCE_RUN') },
  ];

  const [tab, setTab] = useState<Tab>('profile');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [settings, setSettings] = useState<Record<string, string>>({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [jobs, setJobs] = useState<{ name: string; label: string; description: string }[]>([]);
  const [runningJob, setRunningJob] = useState<string | null>(null);
  const [clearingCache, setClearingCache] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [jobLastRun, setJobLastRun] = useState<Record<string, { at: Date; status: 'ok' | 'err' }>>({});
  const [cacheLastRun, setCacheLastRun] = useState<{ at: Date; status: 'ok' | 'err' } | null>(null);

  useEffect(() => {
    if (admin) { setFirstName(admin.firstName); setLastName(admin.lastName); }
  }, [admin]);

  useEffect(() => {
    if (tab === 'financial' && (hasPermission('SETTINGS_READ') || isSuperAdmin)) {
      setSettingsLoading(true);
      adminSettings.get()
        .then((data) => {
          const flat: Record<string, string> = {};
          for (const [k, v] of Object.entries(data as Record<string, { value: string }>)) flat[k] = v.value;
          setSettings(flat);
        })
        .finally(() => setSettingsLoading(false));
    }
    if (tab === 'maintenance' && (hasPermission('MAINTENANCE_RUN') || isSuperAdmin)) {
      adminMaintenance.jobs().then(setJobs);
    }
  }, [tab, isSuperAdmin, hasPermission]);

  async function saveProfile() {
    setProfileSaving(true); setProfileMsg(null);
    try {
      await adminProfile.update({
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      setProfileMsg({ type: 'ok', text: 'Profile updated successfully.' });
      setCurrentPassword(''); setNewPassword('');
      void refreshAdmin();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setProfileMsg({ type: 'err', text: msg ?? 'Failed to update profile.' });
    } finally {
      setProfileSaving(false);
    }
  }

  async function saveSettings() {
    setSettingsSaving(true); setSettingsMsg(null);
    try {
      await adminSettings.update(settings);
      setSettingsMsg({ type: 'ok', text: 'Settings saved.' });
    } catch {
      setSettingsMsg({ type: 'err', text: 'Failed to save settings.' });
    } finally {
      setSettingsSaving(false);
    }
  }

  async function clearCache() {
    setClearingCache(true); setMaintenanceMsg(null);
    try {
      await adminMaintenance.clearCache();
      setCacheLastRun({ at: new Date(), status: 'ok' });
      setMaintenanceMsg({ type: 'ok', text: 'Cache cleared successfully.' });
    } catch {
      setCacheLastRun({ at: new Date(), status: 'err' });
      setMaintenanceMsg({ type: 'err', text: 'Failed to clear cache.' });
    } finally {
      setClearingCache(false);
    }
  }

  async function runJob(name: string) {
    setRunningJob(name); setMaintenanceMsg(null);
    try {
      await adminMaintenance.runJob(name);
      setJobLastRun((prev) => ({ ...prev, [name]: { at: new Date(), status: 'ok' } }));
    } catch {
      setJobLastRun((prev) => ({ ...prev, [name]: { at: new Date(), status: 'err' } }));
    } finally {
      setRunningJob(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-[#0E121B]">Settings</h2>
        <p className="text-sm text-[#717784]">Manage your profile, security, and system configuration</p>
      </div>

      <div className="flex gap-6 items-start">
        <div className="w-44 flex-shrink-0 space-y-1">
          {tabs.filter((t) => t.show).map((t) => (
            <TabBtn key={t.key} active={tab === t.key} onClick={() => setTab(t.key)} icon={t.icon} label={t.label} />
          ))}
        </div>

        <div className="flex-1 space-y-4 min-w-0 max-w-xl">

          {tab === 'profile' && (
            <>
              <Section title="Personal Information">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>First Name</Label>
                      <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Last Name</Label>
                      <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input value={admin?.email ?? ''} disabled className="opacity-60" />
                    <p className="text-xs text-[#717784]">Email cannot be changed.</p>
                  </div>
                </div>
              </Section>

              <Section title="Change Password">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Current Password</Label>
                    <div className="relative">
                      <Input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="pr-10" />
                      <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#717784]">
                        {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>New Password</Label>
                    <div className="relative">
                      <Input type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pr-10" />
                      <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#717784]">
                        {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>
              </Section>

              <Feedback msg={profileMsg} />
              <Button onClick={saveProfile} disabled={profileSaving} className="bg-[#C5DB10] text-[#0E121B] font-semibold hover:bg-[#b0c40e]">
                {profileSaving ? 'Saving…' : 'Save Changes'}
              </Button>
            </>
          )}

          {tab === 'security' && (
            <Section title="Two-Factor Authentication">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-[#0E121B]">Authenticator App (TOTP)</p>
                  <p className="text-xs text-[#717784] mt-0.5">Required for all admin logins. Compatible with Google Authenticator, Authy, and similar apps.</p>
                </div>
                <Badge className={`text-xs border ${admin?.twoFactorEnabled ? 'bg-[#F6FFF9] text-[#12B76A] border-[#12B76A]/20' : 'bg-[#FFF6F6] text-[#FF3B30] border-[#FF3B30]/20'}`}>
                  {admin?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="mt-4 p-4 bg-[#F5F7FA] rounded-lg">
                <p className="text-xs text-[#717784]">
                  2FA is enforced on every login. To reset your authenticator app, log out and complete the 2FA setup flow on next login — your current session remains active until it expires.
                </p>
              </div>
            </Section>
          )}

          {tab === 'financial' && (hasPermission('SETTINGS_READ') || isSuperAdmin) && (
            <>
              <Section title="Financial Thresholds">
                {settingsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-10 bg-[#EDF0F7] rounded animate-pulse" />)}
                  </div>
                ) : (
                  <div className="space-y-5">
                    {Object.entries(SETTING_META).map(([key, meta]) => (
                      <div key={key} className="space-y-1">
                        <Label>{meta.label}</Label>
                        <p className="text-xs text-[#717784]">{meta.description}</p>
                        <div className="relative mt-1">
                          {meta.prefix && (
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#717784]">{meta.prefix}</span>
                          )}
                          <Input
                            type="number"
                            value={settings[key] ?? ''}
                            onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
                            disabled={!hasPermission('SETTINGS_WRITE') && !isSuperAdmin}
                            className={`${meta.prefix ? 'pl-7' : ''} ${meta.suffix ? 'pr-14' : ''}`}
                          />
                          {meta.suffix && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#717784]">{meta.suffix}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              <Feedback msg={settingsMsg} />

              {(hasPermission('SETTINGS_WRITE') || isSuperAdmin) && (
                <Button onClick={saveSettings} disabled={settingsSaving} className="bg-[#C5DB10] text-[#0E121B] font-semibold hover:bg-[#b0c40e]">
                  {settingsSaving ? 'Saving…' : 'Save Settings'}
                </Button>
              )}
            </>
          )}

          {tab === 'maintenance' && (hasPermission('MAINTENANCE_RUN') || isSuperAdmin) && (
            <>
              <Section title="Cache Management">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#0E121B]">Application Cache</p>
                    <p className="text-xs text-[#717784] mt-0.5">Clears all in-memory cached data including stock prices and payment quotes.</p>
                    <div className="mt-1"><LastRun result={cacheLastRun} /></div>
                  </div>
                  <Button size="sm" variant="outline" onClick={clearCache} disabled={clearingCache} className="gap-1.5 flex-shrink-0">
                    <Trash2 size={14} />
                    {clearingCache ? 'Clearing…' : 'Clear Cache'}
                  </Button>
                </div>
              </Section>

              <Section title="Scheduled Jobs">
                <div className="divide-y divide-[#E1E4EA]">
                  {jobs.map((job) => (
                    <div key={job.name} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium text-[#0E121B]">{job.label}</p>
                        <p className="text-xs text-[#717784] mt-0.5">{job.description}</p>
                        <div className="mt-1"><LastRun result={jobLastRun[job.name]} /></div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => runJob(job.name)} disabled={runningJob === job.name} className="gap-1.5 flex-shrink-0 ml-4">
                        <Play size={13} />
                        {runningJob === job.name ? 'Running…' : 'Run Now'}
                      </Button>
                    </div>
                  ))}
                </div>
              </Section>

              <div className="bg-[#FFF6BD] border border-[#D99800]/20 rounded-lg p-4">
                <p className="text-xs text-[#D99800] font-medium">
                  Manually triggering jobs outside their scheduled window may cause duplicate processing. Use only when necessary.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
