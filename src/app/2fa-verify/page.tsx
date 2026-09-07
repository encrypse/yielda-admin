'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { adminAuth } from '@/lib/api';
import { setToken, clearPendingToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TwoFAVerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await adminAuth.verifyTotp(code);
      setToken(data.token, data.expiresIn);
      clearPendingToken();
      router.push('/');
    } catch {
      setError('Invalid code. Try again.');
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
          <h1 className="text-xl font-semibold text-[#0E121B] mb-1">Two-Factor Authentication</h1>
          <p className="text-sm text-[#717784] mb-6">Enter the 6-digit code from your authenticator app.</p>

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="code">Authentication code</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} pattern="\d{6}" required autoComplete="one-time-code" inputMode="numeric" className="text-center text-2xl tracking-widest" />
            </div>
            {error && <p className="text-sm text-[#FF3B30]">{error}</p>}
            <Button type="submit" className="w-full bg-[#C5DB10] text-[#0E121B] font-semibold hover:bg-[#b0c40e]" disabled={loading || code.length !== 6}>
              {loading ? 'Verifying…' : 'Verify'}
            </Button>
            <button type="button" className="w-full text-sm text-[#717784] hover:text-[#0E121B]" onClick={() => router.push('/login')}>
              ← Back to login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
