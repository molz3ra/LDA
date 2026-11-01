"use client";

import React, { useState, Suspense } from "react";
import { useParams } from "next/navigation";
import {
  FileText,
  Volume2,
  Play,
  Pause,
  ArrowUp,
  Sparkles,
  ShieldCheck
} from "lucide-react";

function SharedDocumentContent() {
  const params = useParams();
  const token = params?.token as string;

  const [docData, setDocData] = useState<{
    filename: string;
    page_count: number;
    summary: string;
    key_topics: string[];
    tables_count: number;
  }>({
    filename: "Documento Compartilhado",
    page_count: 5,
    summary: "Este documento foi sintetizado e compartilhado publicamente via LDA Studio.",
    key_topics: ["Cláusulas Contratuais", "Termos Técnicos", "Obrigações"],
    tables_count: 2,
  });

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    {
      role: "assistant",
      content: "Olá! Este é um documento público. Você pode ouvir o Audio Briefing acima ou me fazer perguntas sobre o conteúdo.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsGenerating(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Com base nas páginas públicas deste documento, o ponto sobre "${userMsg}" foi verificado e está em conformidade com as cláusulas originais.`,
        },
      ]);
      setIsGenerating(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#08090C] text-[#E2E8F0] flex flex-col font-sans ambient-glow">
      {/* Header Público */}
      <header className="h-14 border-b border-white/[0.06] px-6 flex items-center justify-between z-20 backdrop-blur-md bg-[#08090C]/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <rect x="5" y="4" width="16" height="22" rx="3" stroke="#64748B" strokeWidth="2" />
              <rect x="9" y="7" width="16" height="22" rx="3" fill="#0D111A" stroke="#3B82F6" strokeWidth="2" />
              <line x1="13" y1="13" x2="21" y2="13" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
              <line x1="13" y1="17" x2="19" y2="17" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
              <circle cx="21" cy="21" r="2.5" fill="#38BDF8" />
            </svg>
          </div>
          <div>
            <span className="font-semibold text-sm tracking-tight text-white">LDA</span>
            <span className="text-xs text-blue-400 ml-2 border-l border-white/10 pl-2">
              Visualização Pública
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.06]">
            <ShieldCheck size={12} className="text-green-400" />
            <span>Link Seguro • Somente Leitura</span>
          </span>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-6">
        {/* Card do Documento */}
        <div className="bg-[#121622] border border-white/[0.08] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-blue-400" />
                <h1 className="text-lg font-semibold text-white">{docData.filename}</h1>
              </div>
              <p className="text-xs text-slate-400">
                {docData.page_count} página(s) • {docData.tables_count} tabela(s) estruturada(s)
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] bg-blue-500/10 border border-blue-500/20 text-blue-300">
              Token: {token?.slice(0, 8) || "acesso"}...
            </span>
          </div>

          <p className="mt-4 text-xs text-slate-300 leading-relaxed bg-white/[0.02] p-4 rounded-xl border border-white/[0.04]">
            {docData.summary}
          </p>

          {/* Player do Audio Briefing */}
          <div className="mt-4 bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
            <button
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white shrink-0 shadow-lg transition-all"
            >
              {isPlayingAudio ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
            </button>
            <div className="flex-1">
              <div className="flex justify-between text-[11px] text-indigo-300 mb-1">
                <span className="font-medium flex items-center gap-1.5">
                  <Volume2 size={12} />
                  Podcast Executivo do Documento
                </span>
                <span>{isPlayingAudio ? "01:14 / 02:45" : "02:45"}</span>
              </div>
              <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-400 h-full transition-all"
                  style={{ width: isPlayingAudio ? "45%" : "30%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Público */}
        <div className="bg-[#0F131D] border border-white/[0.08] rounded-2xl flex flex-col h-[400px] shadow-xl overflow-hidden">
          <div className="p-3 border-b border-white/[0.06] bg-[#0A0D14] flex items-center gap-2 text-xs text-slate-300">
            <Sparkles size={14} className="text-blue-400" />
            <span className="font-medium">Pergunte a este documento</span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2.5 leading-relaxed ${
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-[#181D29] border border-white/[0.06] text-slate-200 rounded-bl-none"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isGenerating && (
              <div className="flex items-center gap-2 text-blue-400 animate-pulse text-xs">
                <Sparkles size={12} />
                <span>Consultando o índice público do documento...</span>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-white/[0.06] bg-[#0A0D14] flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Digite sua dúvida sobre o documento..."
              className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 flex items-center justify-center text-white shrink-0"
            >
              <ArrowUp size={14} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PublicSharePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#08090C] text-white flex items-center justify-center text-xs">Carregando visualização pública...</div>}>
      <SharedDocumentContent />
    </Suspense>
  );
}
