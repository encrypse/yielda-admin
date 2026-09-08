'use client';
import { useEffect, useState } from 'react';
import { adminMetrics } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { NoPermission } from '@/components/NoPermission';
import { formatMoney } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingCart, Clock, Wallet, TrendingUp, Building2 } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

type Overview = {
  totalUsers: number;
  activeUsers: number;
  totalOrders: number;
  pendingSettlements: number;
  totalWalletFunds: number;
  orgWalletBalance: number;
};

const KPI_CONFIG = [
  { key: 'totalUsers', label: 'Total Users', icon: Users, color: '#3571F1' },
  { key: 'activeUsers', label: 'Active Users', icon: Users, color: '#12B76A' },
  { key: 'totalOrders', label: 'Total Orders', icon: ShoppingCart, color: '#C5DB10' },
  { key: 'pendingSettlements', label: 'Pending Settlements', icon: Clock, color: '#D99800' },
  { key: 'totalWalletFunds', label: 'Total Wallet Funds', icon: Wallet, color: '#576106', money: true },
  { key: 'orgWalletBalance', label: 'Org Wallet Balance', icon: Building2, color: '#F59929', money: true },
];

// Fill in every date in the last `days` days, setting missing ones to 0
function fillDays<T extends { date: string }>(
  data: T[],
  days: number,
  zeroEntry: (date: string) => T,
): T[] {
  const map = new Map(data.map((d) => [d.date, d]));
  const result: T[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push(map.get(key) ?? zeroEntry(key));
  }
  return result;
}

function compactMoney(v: number): string {
  if (v >= 1_000_000) return `NGN ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `NGN ${(v / 1_000).toFixed(0)}K`;
  return `NGN ${v.toFixed(0)}`;
}

function compactCount(v: number): string {
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

export default function DashboardPage() {
  const { hasPermission, loading: authLoading } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [registrations, setRegistrations] = useState<{ date: string; count: number }[]>([]);
  const [tradeVolume, setTradeVolume] = useState<{ date: string; volume: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !hasPermission('METRICS_READ')) return;
    Promise.all([
      adminMetrics.overview(),
      adminMetrics.registrations(30),
      adminMetrics.tradeVolume(30),
    ]).then(([ov, regs, tv]) => {
      setOverview(ov);
      setRegistrations(fillDays(regs, 30, (date) => ({ date, count: 0 })));
      setTradeVolume(fillDays(tv, 30, (date) => ({ date, volume: 0 })));
    }).finally(() => setLoading(false));
  }, [authLoading, hasPermission]);

  if (!authLoading && !hasPermission('METRICS_READ')) return <NoPermission section="Dashboard Metrics" />;

  if (loading || authLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-xl animate-pulse border border-[#E1E4EA]" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-64 bg-white rounded-xl animate-pulse border border-[#E1E4EA]" />
          <div className="h-64 bg-white rounded-xl animate-pulse border border-[#E1E4EA]" />
        </div>
      </div>
    );
  }

  const xTickFormatter = (v: string) => {
    // Show "03 Sep" style from "2026-09-03"
    try {
      return new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    } catch { return v.slice(5); }
  };

  // Only show every 5th label so they don't crowd
  const xTickInterval = 4;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#0E121B]">Overview</h2>
        <p className="text-sm text-[#717784]">Platform metrics at a glance</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {KPI_CONFIG.map(({ key, label, icon: Icon, color, money }) => (
          <Card key={key} className="border-[#E1E4EA]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-[#717784]">{label}</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                  <Icon size={16} style={{ color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#0E121B]">
                {money
                  ? formatMoney(overview?.[key as keyof Overview] ?? 0)
                  : (overview?.[key as keyof Overview] ?? 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Registrations */}
        <Card className="border-[#E1E4EA]">
          <CardHeader className="pb-0 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-[#0E121B]">New Registrations</CardTitle>
            <p className="text-xs text-[#717784] mt-0.5">Users signed up — last 30 days</p>
          </CardHeader>
          <CardContent className="pt-4 px-2 pb-4">
            {registrations.every((r) => r.count === 0) ? (
              <div className="flex items-center justify-center h-48 text-sm text-[#CACFD8]">No registrations in this period</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={registrations} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C5DB10" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#C5DB10" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E1E4EA" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#717784' }}
                    tickFormatter={xTickFormatter}
                    interval={xTickInterval}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#717784' }}
                    tickFormatter={compactCount}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip
                    contentStyle={{ border: '1px solid #E1E4EA', borderRadius: 8, fontSize: 12 }}
                    labelFormatter={(v) => xTickFormatter(String(v))}
                    formatter={(v) => [v, 'Registrations']}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#C5DB10"
                    fill="url(#regGrad)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#C5DB10' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Trade Volume */}
        <Card className="border-[#E1E4EA]">
          <CardHeader className="pb-0 pt-5 px-5">
            <CardTitle className="text-sm font-semibold text-[#0E121B]">Trade Volume</CardTitle>
            <p className="text-xs text-[#717784] mt-0.5">Total order value (NGN) — last 30 days</p>
          </CardHeader>
          <CardContent className="pt-4 px-2 pb-4">
            {tradeVolume.every((r) => r.volume === 0) ? (
              <div className="flex items-center justify-center h-48 text-sm text-[#CACFD8]">No trades in this period</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={tradeVolume} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tvGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3571F1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3571F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E1E4EA" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#717784' }}
                    tickFormatter={xTickFormatter}
                    interval={xTickInterval}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#717784' }}
                    tickFormatter={compactMoney}
                    axisLine={false}
                    tickLine={false}
                    width={72}
                  />
                  <Tooltip
                    contentStyle={{ border: '1px solid #E1E4EA', borderRadius: 8, fontSize: 12 }}
                    labelFormatter={(v) => xTickFormatter(String(v))}
                    formatter={(v) => [formatMoney(Number(v)), 'Volume']}
                  />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="#3571F1"
                    fill="url(#tvGrad)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#3571F1' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
