'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { adminAuth } from '@/lib/api';
import { setToken, clearPendingToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TwoFASetupPage() {
  const router = useRouter();
  const [qrUri, setQrUri] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    adminAuth.getTotpSetup()
      .then((data) => {
        setQrUri(data.qrCodeDataUri);
        setManualKey(data.manualEntryKey);
      })
      .catch(() => router.push('/login'))
      .finally(() => setFetching(false));
  }, [router]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await adminAuth.verifyTotpSetup(code);
      setToken(data.token, data.expiresIn);
      clearPendingToken();
      router.push('/');
    } catch {
      setError('Invalid code. Try again.');
    } finally {
      setLoading(false);
    }
  }

  if (fetching) return <div className="min-h-screen flex items-center justify-center"><p className="text-[#717784]">Loading…</p></div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Image src="/logo.png" alt="Yielda" width={120} height={48} className="object-contain" />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-[#E1E4EA] p-8">
          <h1 className="text-xl font-semibold text-[#0E121B] mb-1">Set Up Authenticator</h1>
          <p className="text-sm text-[#717784] mb-6">Scan with Google Authenticator or Authy, then enter the 6-digit code.</p>

          <div className="flex justify-center mb-4">
            {qrUri.startsWith('data:') ? (
              <img src={qrUri} alt="QR Code" className="w-48 h-48" />
            ) : (
              <QRCodeSVG value={qrUri} size={192} />
            )}
          </div>

          <div className="bg-[#EDF0F7] rounded-lg p-3 mb-6 text-center">
            <p className="text-xs text-[#717784] mb-1">Manual entry key</p>
            <p className="text-sm font-mono font-semibold text-[#0E121B] break-all">{manualKey}</p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="code">6-digit code</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} pattern="\d{6}" required autoComplete="one-time-code" inputMode="numeric" />
            </div>
            {error && <p className="text-sm text-[#FF3B30]">{error}</p>}
            <Button type="submit" className="w-full bg-[#C5DB10] text-[#0E121B] font-semibold hover:bg-[#b0c40e]" disabled={loading || code.length !== 6}>
              {loading ? 'Verifying…' : 'Verify & Continue'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
