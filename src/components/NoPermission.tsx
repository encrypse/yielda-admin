import { ShieldOff } from 'lucide-react';

export function NoPermission({ section }: { section: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-full bg-[#EDF0F7] flex items-center justify-center mb-4">
        <ShieldOff size={24} className="text-[#CACFD8]" />
      </div>
      <p className="text-base font-semibold text-[#0E121B]">No access to {section}</p>
      <p className="text-sm text-[#717784] mt-1 max-w-xs">
        Your account doesn&apos;t have permission to view this section. Contact your superadmin to request access.
      </p>
    </div>
  );
}
