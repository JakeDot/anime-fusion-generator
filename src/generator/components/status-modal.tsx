import React, { useState, useEffect } from 'react';
import { X, Activity, CheckCircle2, AlertCircle, Loader2, Server } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
}

type APIStatus = 'checking' | 'online' | 'offline' | 'error';

export const StatusModal: React.FC<StatusModalProps> = ({
  isOpen,
  onClose,
  apiKey,
}) => {
  const [status, setStatus] = useState<APIStatus>('checking');
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkStatus = async () => {
    if (!apiKey) {
      setStatus('error');
      return;
    }

    setStatus('checking');
    const startTime = performance.now();

    try {
      const ai = new GoogleGenAI({ apiKey });
      // Simple lightweight check - list models or just a tiny prompt
      await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "ping",
      });
      
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      setStatus('online');
      setLastChecked(new Date());
    } catch (err) {
      console.error("Status check failed:", err);
      setStatus('offline');
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-neutral-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">System Status</h2>
                <p className="text-xs text-neutral-500 font-mono uppercase tracking-widest">Neural Engine Diagnostics</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-neutral-500" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Main Status Card */}
            <div className="p-6 bg-black rounded-2xl border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full animate-pulse ${
                  status === 'online' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' :
                  status === 'checking' ? 'bg-indigo-500' :
                  'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                }`} />
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest">
                    {status === 'online' ? 'Operational' :
                     status === 'checking' ? 'Checking...' :
                     status === 'error' ? 'Config Error' : 'Service Disruption'}
                  </p>
                  <p className="text-[10px] text-neutral-500 font-mono uppercase mt-0.5">
                    Gemini Neural Engine
                  </p>
                </div>
              </div>
              {status === 'checking' && <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />}
              {status === 'online' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              {status === 'offline' && <AlertCircle className="w-5 h-5 text-red-500" />}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest mb-1">Latency</p>
                <p className="text-lg font-bold font-mono">
                  {latency ? `${latency}ms` : '--'}
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest mb-1">Region</p>
                <p className="text-lg font-bold font-mono">Global</p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                <span>Last Diagnostic</span>
                <span>{lastChecked ? lastChecked.toLocaleTimeString() : 'Never'}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                <span>API Version</span>
                <span>v2.5-flash</span>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <button 
              onClick={checkStatus}
              disabled={status === 'checking'}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {status === 'checking' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running Diagnostics...
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  Run New Diagnostic
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
