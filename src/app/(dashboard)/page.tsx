'use client';
import { useEffect, useState } from 'react';
import { adminMetrics } from '@/lib/api';
import { formatMoney } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingCart, Clock, Wallet, TrendingUp, Building2 } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
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

export default function DashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [registrations, setRegistrations] = useState<{ date: string; count: number }[]>([]);
  const [tradeVolume, setTradeVolume] = useState<{ date: string; volume: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminMetrics.overview(),
      adminMetrics.registrations(30),
      adminMetrics.tradeVolume(30),
    ]).then(([ov, regs, tv]) => {
      setOverview(ov);
      setRegistrations(regs);
      setTradeVolume(tv);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4"><div className="h-32 bg-white rounded-xl animate-pulse" /><div className="h-64 bg-white rounded-xl animate-pulse" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#0E121B]">Overview</h2>
        <p className="text-sm text-[#717784]">Platform metrics at a glance</p>
      </div>

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
                {money ? formatMoney(overview?.[key as keyof Overview] ?? 0) : (overview?.[key as keyof Overview] ?? 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-[#E1E4EA]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#0E121B]">New Registrations (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={registrations}>
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
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#0E121B]">Trade Volume (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tradeVolume}>
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
    </div>
  );
}
