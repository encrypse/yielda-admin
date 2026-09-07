'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Suspense } from 'react';
import { adminAuth } from '@/lib/api';
import { setPendingToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function AcceptInviteForm() {
  const router = useRouter();
  const params = useSearchParams();
  const inviteToken = params.get('token') ?? '';

  const [form, setForm] = useState({ firstName: '', lastName: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!inviteToken) router.push('/login');
  }, [inviteToken, router]);

  function setField(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const data = await adminAuth.acceptInvite(inviteToken, form.firstName, form.lastName, form.password);
      setPendingToken(data.pendingToken);
      router.push('/2fa-setup');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Invalid or expired invite link');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Image src="/logo.png" alt="Yielda" width={120} height={48} className="object-contain" />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-[#E1E4EA] p-8">
          <h1 className="text-xl font-semibold text-[#0E121B] mb-1">Accept Invitation</h1>
          <p className="text-sm text-[#717784] mb-6">Set up your admin account to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>First name</Label>
                <Input value={form.firstName} onChange={setField('firstName')} required />
              </div>
              <div className="space-y-1.5">
                <Label>Last name</Label>
                <Input value={form.lastName} onChange={setField('lastName')} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" value={form.password} onChange={setField('password')} required />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm password</Label>
              <Input type="password" value={form.confirm} onChange={setField('confirm')} required />
            </div>
            {error && <p className="text-sm text-[#FF3B30]">{error}</p>}
            <Button type="submit" className="w-full bg-[#C5DB10] text-[#0E121B] font-semibold hover:bg-[#b0c40e]" disabled={loading}>
              {loading ? 'Setting up…' : 'Create Account'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense>
      <AcceptInviteForm />
    </Suspense>
  );
}
