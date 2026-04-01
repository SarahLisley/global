'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button } from '@pgb/ui';

interface NPSData {
  rated: boolean;
  nps: {
    SCORE: number;
    FEEDBACK: string;
  } | null;
}

export function NPSSurvey({ ticketId }: { ticketId: string }) {
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<NPSData | null>(null);
  const [checking, setChecking] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function checkNPS() {
      try {
        const res = await fetch(`/api/sac/tickets/${ticketId}/nps`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Error checking NPS status:', err);
      } finally {
        setChecking(false);
      }
    }
    checkNPS();
  }, [ticketId]);

  const handleSubmit = async () => {
    if (score === null) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sac/tickets/${ticketId}/nps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, feedback }),
      });

      if (res.ok) {
        setSuccess(true);
        setData({ rated: true, nps: { SCORE: score, FEEDBACK: feedback } });
      }
    } catch (err) {
      console.error('Error submitting NPS:', err);
    } finally {
      setLoading(false);
    }
  };

  if (checking) return null;
  if (data?.rated && !success) {
    return (
      <Card className="p-6 bg-emerald-50 dark:bg-emerald-950/30/50 border-emerald-100 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-500 font-bold text-xl">
            {data.nps?.SCORE}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-zinc-100">Obrigado pela sua avaliação!</h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400">Sua nota ajuda a melhorar nosso atendimento cada vez mais.</p>
          </div>
        </div>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="p-6 bg-emerald-50 dark:bg-emerald-950/30/50 border-emerald-100 mb-6 animate-in fade-in zoom-in-95">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-500 mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-100">Avaliação enviada com sucesso!</h3>
          <p className="text-slate-600 dark:text-zinc-400 mt-2">Agradecemos o seu feedback.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden border-blue-200 dark:border-blue-800/50 shadow-lg mb-6 border-2">
      <div className="bg-blue-600 p-4 text-white">
        <h3 className="font-bold flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Sua opinião é fundamental
        </h3>
        <p className="text-blue-100 text-xs mt-1">Como você avalia o atendimento recebido neste ticket?</p>
      </div>

      <div className="p-6">
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              onClick={() => setScore(n)}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl font-bold text-sm sm:text-lg transition-all border-2 ${
                score === n
                  ? 'bg-blue-600 text-white border-blue-600 scale-110 shadow-md'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 dark:text-blue-500'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest px-2 mb-6">
          <span>Pouco Satisfeito</span>
          <span>Muito Satisfeito</span>
        </div>

        <div className="space-y-4">
          <label className="block sm:px-1">
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Conte-nos mais (opcional)</span>
            <textarea
              className="mt-1 block w-full rounded-xl border-slate-200 dark:border-zinc-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-24 p-3 bg-slate-50 dark:bg-zinc-900/40 transition-colors"
              placeholder="Sua experiência ajuda a Bravo a melhorar..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </label>

          <Button
            onClick={handleSubmit}
            disabled={score === null || loading}
            loading={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-blue-200 transition-all flex items-center justify-center gap-2"
          >
            Enviar Avaliação
          </Button>
        </div>
      </div>
    </Card>
  );
}
