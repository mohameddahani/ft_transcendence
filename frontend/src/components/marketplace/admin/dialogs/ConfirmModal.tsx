import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/marketplace/ui/dialog";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent onClose={onClose} className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-rose-600 dark:text-rose-400">
                {title}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {body}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-6 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={busy}
            className="toota-pill h-10 px-5 text-xs font-semibold cursor-pointer border-border/50 hover:bg-toota-inner"
          >
            {t("cancel") || "Cancel"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            onClick={() => void onConfirm()}
            className="toota-pill h-10 px-6 text-xs font-semibold cursor-pointer bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
          >
            {busy && <Loader2 className="size-3.5 animate-spin mr-2 rtl:mr-0 rtl:ml-2" />}
            {t("confirmDelete") || "Confirm Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
