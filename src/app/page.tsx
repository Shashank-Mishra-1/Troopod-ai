"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [adCreative, setAdCreative] = useState("");
  const [landingUrl, setLandingUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adCreative || !landingUrl) {
      setError("Please provide both an ad creative and a landing page URL.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/personalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adCreative, landingUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to personalize page");
      }

      const data = await res.json();
      
      // Store the combined generated page data in localStorage or pass via URL state
      // For simplicity, we use sessionStorage
      sessionStorage.setItem("personalizedData", JSON.stringify(data));
      router.push("/preview");

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 font-sans text-neutral-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/30 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-2xl w-full">
        <header className="mb-12 text-center text-balance">
          <div className="inline-block px-3 py-1 mb-6 rounded-full bg-white/5 border border-white/10 text-sm tracking-wide text-neutral-300">
            Troopod AI PM Assignment
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white to-neutral-400">
            Dynamic Landing Page Personalizer
          </h1>
          <p className="text-lg text-neutral-400">
            Align your static destination page with the exact tone and offer of your ad creatives using AI.
          </p>
        </header>

        <form 
          onSubmit={handleSubmit} 
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-all"
        >
          {loading && (
            <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-md z-20 flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-lg font-medium animate-pulse text-indigo-200">
                AI is analyzing and rewriting your page...
              </p>
              <p className="text-sm text-neutral-400 mt-2">This may take up to 20 seconds.</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Ad Creative (Text / Offer Context)
              </label>
              <textarea
                value={adCreative}
                onChange={(e) => setAdCreative(e.target.value)}
                placeholder="E.g., 'Flash Sale! 50% off for Students. Bright, energetic tone.'"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium h-32 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Target Landing Page URL
              </label>
              <input
                type="url"
                value={landingUrl}
                onChange={(e) => setLandingUrl(e.target.value)}
                placeholder="https://example.com/pricing"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-white text-black font-semibold rounded-xl hover:bg-neutral-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              Generate Personalized Page
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
