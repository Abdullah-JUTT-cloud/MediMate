import { useCallback, useState } from "react";

const DEFAULT_DIALOG = {
  open: false,
  title: "Please Confirm",
  message: "Are you sure you want to continue?",
  confirmText: "Confirm",
  cancelText: "Cancel",
  tone: "danger",
  resolver: null,
};

export default function useConfirmDialog() {
  const [dialog, setDialog] = useState(DEFAULT_DIALOG);

  const closeWith = useCallback((result) => {
    setDialog((prev) => {
      if (typeof prev.resolver === "function") prev.resolver(result);
      return DEFAULT_DIALOG;
    });
  }, []);

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setDialog({
        ...DEFAULT_DIALOG,
        ...options,
        open: true,
        resolver: resolve,
      });
    });
  }, []);

  return {
    confirm,
    dialogProps: {
      open: dialog.open,
      title: dialog.title,
      message: dialog.message,
      confirmText: dialog.confirmText,
      cancelText: dialog.cancelText,
      tone: dialog.tone,
      onConfirm: () => closeWith(true),
      onCancel: () => closeWith(false),
      onClose: () => closeWith(false),
    },
  };
}
