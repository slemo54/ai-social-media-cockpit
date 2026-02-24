'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function QuickGenerationCard() {
  const [project, setProject] = useState<'IWA' | 'IWP'>('IWA');
  const [topic, setTopic] = useState('');
  const router = useRouter();

  const handleGenerate = () => {
    if (topic.trim()) {
      router.push(`/generate?topic=${encodeURIComponent(topic)}&project=${project}`);
    }
  };

  return (
    <section className="rounded-2xl overflow-hidden bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark shadow-sm">
      {/* Hero Image Header */}
      <div className="relative h-32 w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBjJb0RjvHqbuRDp29sTi9sFb5K-EErhS3GsA0Py4EMNTRavj0fCG0XLbxZ1Mc3p89C7VHq1ZqYy3BOpn744nZTpfE8Qp4SzRAeiULi1nAZFwSBYo_UDNrBuOwbQY9H8NkPiQrniHoWLAB-cOvqj6rI0fHEfoP7c3RE6On1Ngq_lM8JmPqvQouA6FUqhSSQ0Us43uRMyi1yXlX-Ei8-FdsbQgnbuXCNSaREfnnE8mfcnLa9lHyT3dBUy_ruh-xrveOZOANtLCUiA4HN')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-surface-dark/60 to-transparent"></div>
        <div className="absolute bottom-4 left-4">
          <h2 className="text-xl font-bold text-white mb-1">Generazione Rapida</h2>
          <p className="text-sm text-slate-300">Crea nuovi contenuti AI per i tuoi canali</p>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-5">
        {/* Brand Toggle */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Seleziona Brand</label>
          <div className="bg-slate-100 dark:bg-[#121212] p-1 rounded-xl flex border border-slate-200 dark:border-border-dark">
            <button
              onClick={() => setProject('IWA')}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg text-sm font-medium transition-all border border-transparent ${project === 'IWA'
                ? 'bg-white dark:bg-surface-dark text-primary dark:text-white shadow-sm border-slate-200 dark:border-border-dark'
                : 'text-slate-500 dark:text-slate-400'}`}
            >
              IWA
            </button>
            <button
              onClick={() => setProject('IWP')}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg text-sm font-medium transition-all border border-transparent ${project === 'IWP'
                ? 'bg-white dark:bg-surface-dark text-primary dark:text-white shadow-sm border-slate-200 dark:border-border-dark'
                : 'text-slate-500 dark:text-slate-400'}`}
            >
              IWP
            </button>
          </div>
        </div>

        {/* Topic Input */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Argomento</label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full h-32 p-4 rounded-xl bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-border-dark text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-base transition-all outline-none"
            placeholder="Inserisci un argomento o prompt (es. 'Tendenze vino biologico 2024')..."
          ></textarea>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!topic.trim()}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-primary to-primary-light text-white font-semibold shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
          Genera Contenuto
        </button>
      </div>
    </section>
  );
}
