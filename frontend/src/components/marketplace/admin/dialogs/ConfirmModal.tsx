import { Button } from "@/components/marketplace/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/marketplace/ui/dialog";
import { Loader2 } from "lucide-react";

export function ConfirmModal({
  title,
  body,
  onClose,
  onConfirm,
  busy,
}: {
  title: string;
  body: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  busy: boolean;
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <DialogTitle className="text-destructive">{title}</DialogTitle>
          <DialogDescription>{body}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={() => void onConfirm()}
          >
            {busy && <Loader2 className="size-4 animate-spin mr-1.5" />}
            Remove product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
