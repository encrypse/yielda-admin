'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

type Props = {
  open: boolean;
  countdown: number;
  onExtend: () => void;
  onLogout: () => void;
};

export function SessionExpiryModal({ open, countdown, onExtend, onLogout }: Props) {
  return (
    <Dialog open={open} disablePointerDismissal>
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Session Expiring Soon</DialogTitle>
          <DialogDescription>
            Your session will expire in <strong>{countdown}</strong> second{countdown !== 1 ? 's' : ''}. Would you like to stay logged in?
          </DialogDescription>
        </DialogHeader>
        <Progress value={(countdown / 60) * 100} className="h-1.5" />
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onLogout} className="text-[#FF3B30] border-[#FF3B30]/30 hover:bg-[#FF3B30]/5">
            Logout
          </Button>
          <Button onClick={onExtend} className="bg-[#C5DB10] text-[#0E121B] hover:bg-[#b0c40e]">
            Stay Logged In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
