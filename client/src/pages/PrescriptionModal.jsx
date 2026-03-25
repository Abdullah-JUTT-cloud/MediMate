import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axios";
import { Skeleton } from "@mui/material";

export default function PrescriptionModal({ checkup, patient, onClose, onSaved }) {
  const [pdfBase64, setPdfBase64] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [saved, setSaved] = useState(!!checkup?.prescription?.pdfUrl);
  const [pdfUrl, setPdfUrl] = useState(checkup?.prescription?.pdfUrl || "");

  // Generate PDF on mount
  useEffect(() => {
    if (!checkup?._id) return;
    const generate = async () => {
      setIsGenerating(true);
      try {
        const res = await axiosInstance.post(`/prescriptions/generate/${checkup._id}`);
        setPdfBase64(res.data.pdf);
        // Auto-open in new tab
        const byteChars = atob(res.data.pdf);
        const byteNums = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
        const byteArray = new Uint8Array(byteNums);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");

        // Auto-save to Cloudinary
        setIsSaving(true);
        try {
          const saveRes = await axiosInstance.post(`/prescriptions/save/${checkup._id}`);
          setPdfUrl(saveRes.data.pdfUrl);
          setSaved(true);
          onSaved?.(saveRes.data.pdfUrl);
          toast.success("Prescription saved to cloud");
        } catch (err) {
          toast.error(err.response?.data?.message || "Failed to save prescription");
        } finally {
          setIsSaving(false);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to generate prescription");
      } finally {
        setIsGenerating(false);
      }
    };
    generate();
  }, [checkup?._id, onSaved]);

  const handleDownload = () => {
    if (!pdfBase64) return;
    const byteChars = atob(pdfBase64);
    const byteNums = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
    const byteArray = new Uint8Array(byteNums);
    const blob = new Blob([byteArray], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prescription_${patient?.name?.replace(/\s+/g, "_") || "patient"}_${new Date().toISOString().split("T")[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    } else if (pdfBase64) {
      const byteChars = atob(pdfBase64);
      const byteNums = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
      const byteArray = new Uint8Array(byteNums);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      window.open(URL.createObjectURL(blob), "_blank");
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
          ) : isSaving ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Skeleton variant="circular" width={40} height={40} 
                sx={{ bgcolor: "var(--color-primary)", opacity: 0.15, marginBottom: "12px" }} />
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Saving to cloud...</p>
            </div>
          ) : pdfBase64 ? (
            <>
              {/* Success indicator */}
              <div className="flex items-center gap-3 p-4 rounded-2xl border border-[var(--color-success)]/25 bg-[var(--color-success)]/10">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="text-sm font-bold text-[var(--color-success)]">
                    {saved ? "Prescription Generated & Saved" : "Prescription Generated"}
                  </p>
                  <p className="text-xs mt-0.5 text-[var(--color-text-secondary)]">
                    PDF opened in new tab for preview
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
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Failed to generate prescription</p>
              <p className="text-xs mt-1 text-[var(--color-text-secondary)]">Please try again</p>
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