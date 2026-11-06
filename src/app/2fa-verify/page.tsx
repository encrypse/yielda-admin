'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { adminAuth } from '@/lib/api';
import { setToken, clearPendingToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';

const OTP_LENGTH = 6;

export default function TwoFAVerifyPage() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const code = digits.join('');

  async function submit(value: string) {
    if (value.length !== OTP_LENGTH) return;
    setError('');
    setLoading(true);
    try {
      const data = await adminAuth.verifyTotp(value);
      setToken(data.token, data.expiresIn);
      clearPendingToken();
      router.push('/');
    } catch {
      setError('Invalid code. Try again.');
      setDigits(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    if (digit && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }

    const filled = next.join('');
    if (filled.length === OTP_LENGTH) {
      void submit(filled);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputs.current[focusIndex]?.focus();
    if (pasted.length === OTP_LENGTH) {
      void submit(pasted);
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

          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                autoFocus={i === 0}
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                className={`w-11 h-13 text-center text-xl font-semibold border rounded-lg outline-none transition-colors
                  ${d ? 'border-[#C5DB10] bg-[#FAFFF0]' : 'border-[#E1E4EA] bg-white'}
                  focus:border-[#C5DB10] focus:ring-2 focus:ring-[#C5DB10]/20
                  disabled:opacity-50`}
                disabled={loading}
              />
            ))}
          </div>

          {error && <p className="text-sm text-[#FF3B30] text-center mb-4">{error}</p>}

          <Button
            onClick={() => submit(code)}
            className="w-full bg-[#C5DB10] text-[#0E121B] font-semibold hover:bg-[#b0c40e]"
            disabled={loading || code.length !== OTP_LENGTH}
          >
            {loading ? 'Verifying…' : 'Verify'}
          </Button>
          <button type="button" className="w-full text-sm text-[#717784] hover:text-[#0E121B] mt-3" onClick={() => router.push('/login')}>
            ← Back to login
          </button>
        </div>
      </div>
    </div>
  );
}
