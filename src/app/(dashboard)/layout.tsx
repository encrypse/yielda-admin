'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSessionExpiry } from '@/hooks/useSessionExpiry';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { SessionExpiryModal } from '@/components/layout/SessionExpiryModal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { admin, loading, permissions, isSuperAdmin } = useAuth();

  function handleLogout() {
    router.push('/login');
  }

  const { showModal, countdown, extendSession, doLogout } = useSessionExpiry(handleLogout);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="w-8 h-8 rounded-full border-2 border-[#C5DB10] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="sticky top-0 h-screen flex-shrink-0">
        <Sidebar permissions={permissions} isSuperAdmin={isSuperAdmin} authLoading={loading} />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <Header admin={admin} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
      <SessionExpiryModal
        open={showModal}
        countdown={countdown}
        onExtend={extendSession}
        onLogout={doLogout}
      />
    </div>
  );
}
