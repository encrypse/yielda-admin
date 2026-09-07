'use client';
import { useEffect, useState } from 'react';
import { adminMetrics } from '@/lib/api';
import { formatMoney } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, ResponsiveContainer,
} from 'recharts';

export default function MetricsPage() {
  const [regs, setRegs] = useState<{ date: string; count: number }[]>([]);
  const [volume, setVolume] = useState<{ date: string; volume: number }[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([adminMetrics.registrations(days), adminMetrics.tradeVolume(days)])
      .then(([r, v]) => { setRegs(r); setVolume(v); })
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#0E121B]">Metrics</h2>
          <p className="text-sm text-[#717784]">Platform trends over time</p>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium border transition-colors ${days === d ? 'bg-[#C5DB10] text-[#0E121B] border-transparent' : 'bg-white text-[#717784] border-[#E1E4EA] hover:bg-[#F5F7FA]'}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4">
          <div className="h-72 bg-white rounded-xl animate-pulse border border-[#E1E4EA]" />
          <div className="h-72 bg-white rounded-xl animate-pulse border border-[#E1E4EA]" />
        </div>
      ) : (
        <div className="grid gap-4">
          <Card className="border-[#E1E4EA]">
            <CardHeader><CardTitle className="text-sm font-semibold">User Registrations</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={regs}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E1E4EA" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#C5DB10" fill="#EFF6B5" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-[#E1E4EA]">
            <CardHeader><CardTitle className="text-sm font-semibold">Trade Volume (NGN)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={volume}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E1E4EA" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatMoney(v)} />
                  <Tooltip formatter={(v) => formatMoney(Number(v))} />
                  <Bar dataKey="volume" fill="#C5DB10" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
