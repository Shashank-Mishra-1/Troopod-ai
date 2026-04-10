"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function PreviewPage() {
  const [data, setData] = useState<{ originalHtml: string; personalizedHtml: string } | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("personalizedData");
    if (stored) {
      setData(JSON.parse(stored));
    }
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white">
        <p className="text-xl mb-4 font-semibold">No personalized data found.</p>
        <Link href="/" className="px-6 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors">
          Go Back
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex flex-col">
      <header className="p-4 border-b border-white/10 flex justify-between items-center bg-black/50 backdrop-blur-md sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Troopod AI
          </h1>
          <p className="text-xs text-neutral-400 mt-1">Personalized Landing Page Preview</p>
        </div>
        <Link href="/" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors border border-white/5">
          Generate Another
        </Link>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/10">
        {/* Original Column */}
        <div className="flex flex-col bg-neutral-950">
          <div className="p-3 border-b border-white/5 bg-neutral-900/50 flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-400 uppercase tracking-widest">Original Page</span>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden relative">
            <iframe 
              srcDoc={data.originalHtml}
              className="w-full h-full border-none bg-white absolute inset-0"
              title="Original Landing Page"
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        </div>

        {/* Personalized Column */}
        <div className="flex flex-col bg-neutral-950">
          <div className="p-3 border-b border-white/5 bg-neutral-900/50 flex items-center justify-between">
            <span className="text-sm font-medium text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI Personalized Page
            </span>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden relative">
            <iframe 
              srcDoc={data.personalizedHtml}
              className="w-full h-full border-none bg-white absolute inset-0"
              title="Personalized Landing Page"
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
