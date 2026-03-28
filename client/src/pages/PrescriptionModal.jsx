import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import { Skeleton } from "@mui/material";

export default function PrescriptionModal({ checkup, patient, onClose, onSaved, autoGenerateOnOpen = false }) {
  const [pdfBase64, setPdfBase64] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [saved, setSaved] = useState(!!checkup?.prescription?.pdfUrl);
  const [pdfUrl, setPdfUrl] = useState(checkup?.prescription?.pdfUrl || "");

  const base64ToBlob = (base64) => {
    const byteChars = atob(base64);
    const byteNums = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
    const byteArray = new Uint8Array(byteNums);
    return new Blob([byteArray], { type: "application/pdf" });
  };

  // Keep view-only opens read-only. Auto-generate only when explicitly requested.
  useEffect(() => {
    if (!checkup?._id || !autoGenerateOnOpen) return;

    let cancelled = false;
    const generate = async () => {
      setIsGenerating(true);
      setPdfBase64(null);
      setSaved(false);
      setPdfUrl("");
      try {
        const res = await axiosInstance.post(`/prescriptions/generate/${checkup._id}`);
        if (cancelled) return;
        setPdfBase64(res.data.pdf);
        // Auto-open in new tab
        const blob = base64ToBlob(res.data.pdf);
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");

        // Auto-save to Cloudinary in background (don't block the UI)
        setIsSaving(true);
        try {
          const saveRes = await axiosInstance.post(`/prescriptions/save/${checkup._id}`);
          if (cancelled) return;
          setPdfUrl(saveRes.data.pdfUrl);
          setSaved(true);
          onSaved?.(saveRes.data.pdfUrl);
          toast.success("Prescription saved to cloud");
        } catch (err) {
          if (!cancelled) toast.error(err.response?.data?.message || "Failed to save prescription");
        } finally {
          if (!cancelled) setIsSaving(false);
        }
      } catch (err) {
        if (!cancelled) toast.error(err.response?.data?.message || "Failed to generate prescription");
      } finally {
        if (!cancelled) setIsGenerating(false);
      }
    };
    generate();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkup?._id, autoGenerateOnOpen]);

  const handleDownload = async () => {
    const filename = `prescription_${patient?.name?.replace(/\s+/g, "_") || "patient"}_${new Date().toISOString().split("T")[0]}.pdf`;
    if (pdfBase64) {
      const blob = base64ToBlob(pdfBase64);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (checkup?._id) {
      try {
        const res = await axiosInstance.get(`/prescriptions/download/${checkup._id}`, {
          responseType: "blob",
        });
        const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to download prescription");
      }
    }
  };

  const handleWhatsApp = async () => {
    if (!checkup?._id) return;
    setIsSending(true);
    try {
      await axiosInstance.post(`/prescriptions/send-whatsapp/${checkup._id}`);
      toast.success("Prescription sent via WhatsApp!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send via WhatsApp");
    } finally {
      setIsSending(false);
    }
  };

  const handleViewPdf = () => {
    if (pdfBase64) {
      const blob = base64ToBlob(pdfBase64);
      window.open(URL.createObjectURL(blob), "_blank");
    } else if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden animate-in border border-[var(--color-border)] bg-[var(--color-card)]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--color-primary)]/15">
              <span className="text-lg">📋</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Prescription</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">{patient?.name}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">

          {/* Status */}
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Skeleton variant="circular" width={40} height={40} 
                sx={{ bgcolor: "var(--color-primary)", opacity: 0.15, marginBottom: "12px" }} />
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Generating prescription...</p>
              <p className="text-xs mt-1 text-[var(--color-text-secondary)]">This may take a moment</p>
            </div>
          ) : (pdfBase64 || pdfUrl) ? (
            <>
              {/* Success indicator */}
              <div className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--color-success)]/25 bg-[var(--color-success)]/10">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="text-sm font-bold text-[var(--color-success)]">
                    {saved ? "Prescription Ready" : "Prescription Generated"}
                  </p>
                  <p className="text-xs mt-0.5 text-[var(--color-text-secondary)]">
                    {saved ? "Saved to cloud" : "PDF opened in new tab for preview"}
                  </p>
                </div>
              </div>

              {/* Prescription summary */}
              <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--color-text-secondary)]">Diagnosis</span>
                    <span className="text-xs font-semibold text-[var(--color-text-primary)]">{checkup?.prescription?.diagnosis}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--color-text-secondary)]">Medicines</span>
                    <span className="text-xs font-semibold text-[var(--color-text-primary)]">{checkup?.prescription?.medicines?.length || 0}</span>
                  </div>
                  {checkup?.prescription?.labTests?.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-xs text-[var(--color-text-secondary)]">Lab Tests</span>
                      <span className="text-xs font-semibold text-[var(--color-text-primary)]">{checkup.prescription.labTests.length}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <button onClick={handleViewPdf}
                  className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
                  👁️ View PDF Again
                </button>

                <button onClick={handleDownload}
                  className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                  ⬇️ Download PDF
                </button>

                <button onClick={handleWhatsApp} disabled={isSending}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#25D366,#128C7E)", boxShadow: "0 4px 15px rgba(37,211,102,0.25)" }}>
                  {isSending ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 animate-spin inline-block"
                        style={{ borderColor: "white", borderTopColor: "transparent" }} />
                      Sending...
                    </span>
                  ) : "📱 Send via WhatsApp"}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <span className="text-4xl mb-3">❌</span>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">No prescription PDF available</p>
              <p className="text-xs mt-1 text-[var(--color-text-secondary)]">Generate a prescription first</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--color-border)]">
          <button onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}