'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

type Format = 'csv' | 'pdf';

type Props = {
  title: string;
  onExport: (from: string, to: string, format: Format) => Promise<void>;
  onClose: () => void;
};

export function ExportModal({ title, onExport, onClose }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState(today);
  const [format, setFormat] = useState<Format>('pdf');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const valid = from && to && from <= to;

  async function handleExport() {
    if (!valid) return;
    setLoading(true);
    setError('');
    try {
      await onExport(from, to, format);
      onClose();
    } catch {
      setError('Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-[#E1E4EA] w-full max-w-sm p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-[#0E121B]">{title}</h3>
          <p className="text-sm text-[#717784] mt-0.5">Select a date range — both dates are required.</p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#0E121B]">From <span className="text-[#FF3B30]">*</span></label>
            <input
              type="date"
              value={from}
              max={to || today}
              onChange={(e) => { setFrom(e.target.value); setError(''); }}
              className="w-full border border-[#E1E4EA] rounded-lg px-3 py-2 text-sm text-[#0E121B] focus:outline-none focus:ring-2 focus:ring-[#C5DB10]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#0E121B]">To <span className="text-[#FF3B30]">*</span></label>
            <input
              type="date"
              value={to}
              min={from}
              max={today}
              onChange={(e) => { setTo(e.target.value); setError(''); }}
              className="w-full border border-[#E1E4EA] rounded-lg px-3 py-2 text-sm text-[#0E121B] focus:outline-none focus:ring-2 focus:ring-[#C5DB10]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#0E121B]">Format</label>
            <div className="flex gap-2">
              {(['pdf', 'csv'] as Format[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    format === f
                      ? 'bg-[#C5DB10] border-[#C5DB10] text-[#0E121B]'
                      : 'border-[#E1E4EA] text-[#717784] hover:border-[#0E121B] hover:text-[#0E121B]'
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-[#FF3B30]">{error}</p>}
          {from && to && from > to && (
            <p className="text-xs text-[#FF3B30]">"From" date must be before "To" date.</p>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <Button size="sm" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={!valid || loading}
            className="bg-[#C5DB10] text-[#0E121B] font-semibold hover:bg-[#b0c40e] gap-1.5"
          >
            <Download size={13} />
            {loading ? 'Exporting…' : `Download ${format.toUpperCase()}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
