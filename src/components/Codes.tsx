import React, { useState } from 'react';
import { ArrowLeft, Key, CheckCircle2, XCircle } from 'lucide-react';
import { Screen } from '../types';

interface CodesProps {
  onNavigate: (screen: Screen) => void;
  onRedeem: (code: string) => 'success' | 'used' | 'error';
}

export default function Codes({ onNavigate, onRedeem }: CodesProps) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'used'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const result = onRedeem(code.trim());
    setStatus(result);
    if (result === 'success') {
      setCode('');
    }
    setTimeout(() => setStatus('idle'), 3000);
  };

  return (
    <div className="h-full bg-slate-900 text-white p-6 flex flex-col items-center justify-center">
      <div className="max-w-md w-full">
        <div className="flex items-center mb-8">
          <button
            onClick={() => onNavigate('menu')}
            className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors mr-4"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-black italic tracking-tighter">CÓDIGOS</h1>
        </div>

        <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/50">
              <Key className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <p className="text-slate-400 text-center mb-8">
            Insira um código secreto para desbloquear recompensas especiais!
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="DIGITE O CÓDIGO..."
                className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl px-4 py-4 font-bold text-center tracking-widest focus:border-blue-500 outline-none transition-colors uppercase"
              />
              {status === 'success' && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 animate-in fade-in zoom-in">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              )}
              {status === 'error' && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 animate-in fade-in zoom-in">
                  <XCircle className="w-6 h-6" />
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-900/20"
            >
              RESGATAR
            </button>
          </form>

          {status === 'success' && (
            <p className="text-green-400 text-center mt-4 font-bold animate-pulse">
              CÓDIGO RESGATADO!
            </p>
          )}
          {status === 'used' && (
            <p className="text-yellow-400 text-center mt-4 font-bold">
              ESTE CÓDIGO JÁ FOI USADO!
            </p>
          )}
          {status === 'error' && (
            <p className="text-red-400 text-center mt-4 font-bold">
              CÓDIGO INVÁLIDO!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
