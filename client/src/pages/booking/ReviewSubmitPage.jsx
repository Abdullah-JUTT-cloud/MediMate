import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "../../api/axios";
import toast from "react-hot-toast";

export default function ReviewSubmitPage() {
  const { token } = useParams();
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get(`/public/reviews/${token}`)
      .then(({ data }) => setContext(data))
      .catch((err) => setError(err.response?.data?.message || "Invalid or expired review link"))
      .finally(() => setLoading(false));
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return toast.error("Please select a star rating");
    setSubmitting(true);
    try {
      await axios.post(`/public/reviews/${token}`, { rating, comment });
      setDone(true);
      toast.success("Thank you for your review!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">🔗</div>
        <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-2">Link Unavailable</h2>
        <p className="text-zinc-500">{error}</p>
      </div>
    </div>
  );

  if (done) return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 to-violet-100 dark:from-zinc-900 dark:to-zinc-800">
      <div className="text-center max-w-sm bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-2xl">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Thank you!</h2>
        <p className="text-zinc-500">Your feedback helps other patients find great care.</p>
      </div>
    </div>
  );

  const doc = context?.doctor;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 to-violet-100 dark:from-zinc-900 dark:to-zinc-800">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 border border-indigo-100 dark:border-zinc-700">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-2xl font-bold text-indigo-600 mx-auto mb-3 overflow-hidden">
            {doc?.profilePicUrl ? <img src={doc.profilePicUrl} alt={doc.fullName} className="w-full h-full object-cover" /> : doc?.fullName?.charAt(0)}
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Rate your visit</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">with {doc?.title} {doc?.fullName}</p>
          <p className="text-xs text-indigo-500">{doc?.specialization}</p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">How was your experience?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className={`text-3xl transition-transform hover:scale-110 ${s <= rating ? "opacity-100" : "opacity-30"}`}
                >
                  ⭐
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-medium">
                {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Comment (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Share your experience to help other patients…"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !rating}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 transition-colors"
          >
            {submitting ? "Submitting…" : "Submit Review"}
          </button>
        </form>
      </div>
    </div>
  );
}
