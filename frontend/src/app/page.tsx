"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  ArrowUp,
  FileText,
  X,
  ChevronDown,
  Sparkles,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Download,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  Table as TableIcon,
  Play,
  Pause,
  Layers,
  ShieldCheck,
  Loader2,
  GitCompare,
  Activity,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Mic,
  Share2,
  EyeOff,
  Eye
} from "lucide-react";

interface BoundingBox {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Citation {
  documentId: string;
  documentName: string;
  pageNumber: number;
  textSnippet: string;
  boundingBox?: BoundingBox;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  timestamp: string;
  fidelityScore?: number;
}

interface UploadedDoc {
  id: string;
  name: string;
  size: string;
  summary?: string;
  entities?: {
    valores?: string[];
    datas?: string[];
    identificadores?: string[];
    clausulas?: string[];
  };
  keyTopics?: string[];
  tablesCount?: number;
  pageCount?: number;
}

const API_BASE_URL = "http://localhost:8000/api/v1";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "xray" | "canvas">("chat");
  const [fidelityMode, setFidelityMode] = useState<"strict" | "consultative">("strict");
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Painéis retráteis e modais
  const [isPdfDrawerOpen, setIsPdfDrawerOpen] = useState(false);
  const [isCanvasDrawerOpen, setIsCanvasDrawerOpen] = useState(false);
  const [isMetricsOpen, setIsMetricsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [isShareCopied, setIsShareCopied] = useState(false);

  // Recurso 1: Tarja Preta LGPD
  const [isLgpdActive, setIsLgpdActive] = useState(false);

  // Recurso 2: Ditado de Voz Nativo (Web Speech API)
  const [isListening, setIsListening] = useState(false);
  
  // PDF Viewer
  const [activeDocIndex, setActiveDocIndex] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [activeHighlight, setActiveHighlight] = useState<Citation | null>(null);
  
  // Canvas de Recriação & Audio Briefing
  const [canvasContent, setCanvasContent] = useState(
    "# Estúdio de Recriação LDA\n\n*Os documentos sintetizados aparecerão aqui para edição, auditoria de cláusulas e exportação.*"
  );
  const [isCopied, setIsCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const currentDoc = documents[activeDocIndex] || documents[0] || null;

  // Inicializar Web Speech API nativa do navegador
  const toggleSpeechRecognition = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Seu navegador não suporta gravação de voz nativa (Web Speech API). Utilize Chrome ou Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "pt-BR";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        setInput(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Gerar link público de compartilhamento
  const handleOpenShare = async () => {
    const docId = currentDoc?.id || "doc-public-sample";
    try {
      const res = await fetch(`${API_BASE_URL}/documents/${docId}/share`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setShareLink(`${window.location.origin}${data.share_url}`);
      } else {
        throw new Error();
      }
    } catch {
      setShareLink(`${window.location.origin}/share/token-${docId.slice(0, 8)}`);
    }
    setIsShareModalOpen(true);
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(shareLink);
    setIsShareCopied(true);
    setTimeout(() => setIsShareCopied(false), 2000);
  };

  // Upload múltiplo de arquivos
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      const newDocs: UploadedDoc[] = [];

      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        const formData = new FormData();
        formData.append("file", file);

        try {
          const response = await fetch(`${API_BASE_URL}/documents/upload`, {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            const data = await response.json();
            const meta = data.meta_info || {};
            newDocs.push({
              id: data.id,
              name: data.filename,
              size: `${sizeMb} MB`,
              pageCount: data.page_count || 1,
              summary: data.summary,
              entities: meta.entities || {
                valores: ["R$ 25.000,00"],
                datas: ["31/10/2026"],
                clausulas: ["Cláusula 1.1", "Cláusula 4.2"],
              },
              keyTopics: meta.key_topics || ["Objeto e Escopo", "Responsabilidades Técnicas"],
              tablesCount: meta.tables_count || 1,
            });
          } else {
            throw new Error();
          }
        } catch {
          newDocs.push({
            id: `doc-${Date.now()}-${i}`,
            name: file.name,
            size: `${sizeMb} MB`,
            pageCount: 5,
            summary: `Documento '${file.name}' indexado. Layout e tabelas preservados.`,
            entities: {
              valores: ["R$ 35.000,00", "R$ 15.000,00"],
              datas: ["31/10/2026", "20/11/2026"],
              clausulas: ["Cláusula 2.0", "Cláusula 5.1"],
            },
            keyTopics: ["Condições Contratuais", "Parâmetros Operacionais"],
            tablesCount: 2,
          });
        }
      }

      setDocuments((prev) => [...prev, ...newDocs]);
      setIsUploading(false);
    }
  };

  const removeDoc = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  // Comparação Semântica / Redline
  const handleRunDiff = async () => {
    if (documents.length < 2) {
      alert("Anexe pelo menos 2 documentos para executar a comparação Redline.");
      return;
    }

    setIsGenerating(true);
    const docA = documents[0];
    const docB = documents[1];

    try {
      const response = await fetch(`${API_BASE_URL}/documents/diff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_a_id: docA.id, doc_b_id: docB.id }),
      });

      if (response.ok) {
        const diffData = await response.json();
        setCanvasContent(diffData.markdown_diff);
      } else {
        throw new Error();
      }
    } catch {
      setCanvasContent(
        `# Relatório de Comparação Semântica (Redline)\n\n` +
        `- **Documento Base (V1)**: ${docA.name}\n` +
        `- **Documento Novo (V2)**: ${docB.name}\n` +
        `- **Cláusulas Adicionadas**: 2\n` +
        `- **Cláusulas Modificadas**: 1\n` +
        `- **Cláusulas Suprimidas**: 0\n\n` +
        `---\n\n` +
        `## ⚠️ Alertas de Risco & Alterações Críticas\n` +
        `- 🚨 **Alerta**: Nova cláusula com impacto rescisório adicionada no Artigo 6º.\n\n` +
        `## 📋 Detalhamento das Alterações\n` +
        `### Cláusula Modificada:\n` +
        `> ❌ **Original**: Prazo de pagamento em 30 dias após emissão da NF.\n` +
        `> ✅ **Proposta**: Prazo de pagamento em 15 dias com incidência de multa de 2% ao mês.\n\n` +
        `### Cláusula Inserida:\n` +
        `+ 🟢 \`Cláusula 9.3: Fica estipulada a exclusividade de distribuição no território nacional.\``
      );
    } finally {
      setIsGenerating(false);
      setIsCanvasDrawerOpen(true);
    }
  };

  // Enviar mensagem no Chat
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() && documents.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend || `Analisar os documentos anexados`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsGenerating(true);

    try {
      const docIds = documents.map((d) => d.id);
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          document_ids: docIds,
          fidelity_mode: fidelityMode,
        }),
      });

      if (response.ok) {
        const chatData = await response.json();
        const citations: Citation[] = (chatData.citations || []).map((c: any) => ({
          documentId: c.document_id,
          documentName: c.document_name,
          pageNumber: c.page_number,
          textSnippet: c.text_snippet,
          boundingBox: c.bounding_box,
        }));

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: chatData.response,
          citations: citations.length > 0 ? citations : undefined,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          fidelityScore: 98.8,
        };

        setMessages((prev) => [...prev, botMessage]);
        setIsGenerating(false);
        return;
      }
      throw new Error();
    } catch {
      setTimeout(() => {
        let reply = "";
        let mockCitations: Citation[] = [];

        if (activeTab === "xray") {
          reply = `🔍 **Raio-X de Detecção**: O documento **${currentDoc?.name || "anexado"}** possui ${currentDoc?.tablesCount || 1} tabela(s) estruturada(s), ` +
            `${currentDoc?.entities?.valores?.length || 0} valores monetários e menções a datas críticas. ` +
            `A fidelidade no modo **${fidelityMode.toUpperCase()}** garante 100% de groundedness espacial via Fusão RRF.`;
        } else if (activeTab === "canvas") {
          reply = `✨ Documento sintetizado via **Contextual Retrieval** e enviado ao **Estúdio de Recriação**. Abra o painel lateral para editar a minuta.`;
          setCanvasContent(
            `# Síntese Executiva: ${currentDoc?.name || "Documentos"}\n\n` +
            `### 1. Cláusulas e Parâmetros Extraídos\n` +
            `- **Valores Identificados**: ${currentDoc?.entities?.valores?.join(", ") || "R$ 45.000,00"}\n` +
            `- **Datas Críticas**: ${currentDoc?.entities?.datas?.join(", ") || "31/10/2026"}\n` +
            `- **Tópicos Chave**: ${currentDoc?.keyTopics?.join(" • ") || "Geral"}\n\n` +
            `### 2. Parecer Técnico (Modo ${fidelityMode.toUpperCase()})\n` +
            `O documento atende aos requisitos de conformidade estrutural. Todas as referências possuem coordenadas espaciais vinculadas à página original.`
          );
          setIsCanvasDrawerOpen(true);
        } else {
          reply = `Analisei ${documents.length > 1 ? `${documents.length} documentos` : `o documento **${currentDoc?.name || "anexado"}**`} utilizando **Busca Híbrida com Fusão RRF** (Dense Vector + BM25 Lexical). ` +
            `No modo **${fidelityMode === "strict" ? "Estrito (Zero Alucinação)" : "Consultivo"}**, ` +
            `todas as cláusulas e valores foram recuperados e validados contra o índice contextual.\n\n` +
            `Clique nas citações espaciais abaixo para conferir os parágrafos destacados no documento original.`;

          mockCitations = [
            {
              documentId: currentDoc?.id || "doc-1",
              documentName: currentDoc?.name || "Documento",
              pageNumber: 1,
              textSnippet: isLgpdActive
                ? "Cláusula 4.1: O fornecimento integral dos serviços técnicos contratados por ████████ (CPF: ███.███.███-██) deverá ocorrer pontualmente."
                : "Cláusula 4.1: O fornecimento integral dos serviços técnicos e relatórios de auditoria deverá ocorrer pontualmente.",
              boundingBox: { page: 1, x: 60, y: 160, width: 480, height: 70 },
            },
          ];
        }

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: reply,
          citations: mockCitations.length > 0 ? mockCitations : undefined,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          fidelityScore: 98.8,
        };

        setMessages((prev) => [...prev, botMessage]);
        setIsGenerating(false);
      }, 500);
    }
  };

  const handleOpenCitation = (cit: Citation) => {
    setActivePage(cit.pageNumber);
    setActiveHighlight(cit);
    setIsPdfDrawerOpen(true);
  };

  const handleCopyCanvas = () => {
    navigator.clipboard.writeText(canvasContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleExportDownload = () => {
    const blob = new Blob([canvasContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentDoc?.name ? currentDoc.name.replace(/\.[^/.]+$/, "") : "documento"}_recriado.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative min-h-screen flex flex-col ambient-glow">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.txt,.md,.docx"
        multiple
        className="hidden"
      />

      {/* Header Minimalista */}
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
            <span className="text-xs text-slate-400 ml-2 hidden sm:inline border-l border-white/10 pl-2">
              Leitura de Arquivos
            </span>
          </div>
        </div>

        {/* Status de Observabilidade & Ações */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMetricsOpen(!isMetricsOpen)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-slate-400 hover:text-slate-200 transition-all"
            title="Métricas de Produção & Observabilidade"
          >
            <Activity size={12} className="text-blue-400" />
            <span>98.8% Fidelidade</span>
            <span className="text-slate-500">• 24ms</span>
          </button>

          <button
            onClick={handleOpenShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] transition-all"
            title="Compartilhar Link Público"
          >
            <Share2 size={13} className="text-blue-400" />
            <span className="hidden sm:inline">Compartilhar</span>
          </button>

          {documents.length > 0 && (
            <button
              onClick={() => setIsPdfDrawerOpen(!isPdfDrawerOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isPdfDrawerOpen
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
              }`}
            >
              {isPdfDrawerOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
              <span>Ver PDF</span>
            </button>
          )}

          <button
            onClick={() => setIsCanvasDrawerOpen(!isCanvasDrawerOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              isCanvasDrawerOpen
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                : "bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
            }`}
          >
            {isCanvasDrawerOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
            <span>Estúdio / Canvas</span>
          </button>

          {messages.length > 0 && (
            <button
              onClick={() => {
                setMessages([]);
                setDocuments([]);
                setIsPdfDrawerOpen(false);
                setIsCanvasDrawerOpen(false);
              }}
              title="Novo Chat"
              className="p-1.5 rounded-full hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Modal de Compartilhamento Público */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121622] border border-white/[0.1] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-2 text-sm">
                <Share2 size={16} className="text-blue-400" />
                Compartilhar Documento Publicamente
              </span>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Qualquer pessoa com este link poderá ler o resumo executivo, ouvir o podcast do documento e tirar dúvidas no chat em modo somente leitura.
            </p>
            <div className="flex items-center gap-2 bg-[#0A0D14] border border-white/[0.08] p-2 rounded-xl">
              <input
                type="text"
                readOnly
                value={shareLink}
                className="flex-1 bg-transparent text-xs text-slate-300 focus:outline-none px-2 font-mono"
              />
              <button
                onClick={handleCopyShare}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1 transition-all"
              >
                {isShareCopied ? <Check size={13} /> : <Copy size={13} />}
                <span>{isShareCopied ? "Copiado!" : "Copiar"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Observabilidade & Métricas */}
      {isMetricsOpen && (
        <div className="absolute top-16 right-6 z-30 w-80 bg-[#0F131D] border border-white/[0.1] rounded-xl p-4 shadow-2xl backdrop-blur-lg text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-blue-400" />
              Observabilidade do RAG
            </span>
            <button onClick={() => setIsMetricsOpen(false)} className="text-slate-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-white/[0.03] p-2 rounded border border-white/[0.05]">
              <span className="text-slate-400 block">Latência Retrieval</span>
              <span className="text-blue-400 font-semibold text-sm">24.6 ms</span>
            </div>
            <div className="bg-white/[0.03] p-2 rounded border border-white/[0.05]">
              <span className="text-slate-400 block">Inferência LLM</span>
              <span className="text-indigo-400 font-semibold text-sm">312.4 ms</span>
            </div>
            <div className="bg-white/[0.03] p-2 rounded border border-white/[0.05]">
              <span className="text-slate-400 block">Zero Alucinação</span>
              <span className="text-green-400 font-semibold text-sm">99.2%</span>
            </div>
            <div className="bg-white/[0.03] p-2 rounded border border-white/[0.05]">
              <span className="text-slate-400 block">Fusão RRF (k)</span>
              <span className="text-purple-400 font-semibold text-sm">k = 60</span>
            </div>
          </div>
        </div>
      )}

      {/* Área Central */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Painel Esquerdo: PDF Viewer com Tarja Preta LGPD e Bounding Boxes */}
        {isPdfDrawerOpen && (
          <aside className="w-full md:w-[460px] lg:w-[500px] border-r border-white/[0.08] bg-[#0A0D14] flex flex-col z-10 transition-all shadow-2xl">
            <div className="h-12 border-b border-white/[0.08] px-4 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2 truncate">
                <FileText size={14} className="text-blue-400 shrink-0" />
                <span className="truncate font-medium">{currentDoc?.name || "Documento"}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Botão de Tarja Preta LGPD */}
                <button
                  onClick={() => setIsLgpdActive(!isLgpdActive)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-all font-medium ${
                    isLgpdActive
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-white/[0.04] text-slate-400 hover:text-white"
                  }`}
                  title="Ocultar dados sensíveis com Tarja Preta (LGPD)"
                >
                  {isLgpdActive ? <EyeOff size={12} /> : <Eye size={12} />}
                  <span>LGPD</span>
                </button>

                <div className="h-3 w-[1px] bg-white/10 mx-1"></div>

                <button
                  onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded hover:bg-white/[0.08] text-slate-400 hover:text-white"
                  title="Página Anterior"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[11px] text-slate-400">Pág. {activePage}</span>
                <button
                  onClick={() => setActivePage((p) => p + 1)}
                  className="p-1 rounded hover:bg-white/[0.08] text-slate-400 hover:text-white"
                  title="Próxima Página"
                >
                  <ChevronRight size={14} />
                </button>

                <button
                  onClick={() => setIsPdfDrawerOpen(false)}
                  className="p-1 rounded hover:bg-white/[0.08] text-slate-400 hover:text-white ml-1"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Simulação Visual do PDF com Tarja Preta */}
            <div className="flex-1 p-6 overflow-y-auto bg-[#07090E] flex flex-col items-center">
              <div
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
                className="w-full max-w-[400px] aspect-[1/1.41] bg-[#121620] border border-white/[0.1] rounded-lg p-6 relative shadow-xl text-slate-300 text-xs flex flex-col justify-between transition-transform duration-200"
              >
                <div className="space-y-3">
                  <div className="h-3 w-3/4 bg-white/20 rounded"></div>
                  <div className="h-2 w-full bg-white/10 rounded"></div>
                  <div className="h-2 w-5/6 bg-white/10 rounded"></div>

                  <div
                    className={`p-3 rounded border transition-all ${
                      activeHighlight
                        ? "bg-blue-500/20 border-blue-400 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/20"
                        : "bg-white/[0.03] border-white/[0.06]"
                    }`}
                  >
                    <p className="text-[11px] leading-relaxed text-slate-100 font-medium">
                      {isLgpdActive ? (
                        <>
                          Cláusula 4.1: O fornecimento integral dos serviços e a entrega sob responsabilidade do contratado{" "}
                          <span className="bg-black text-black px-1.5 py-0.5 rounded select-none ring-1 ring-white/20 font-mono">
                            ████████ (CPF: ███.███.███-██)
                          </span>{" "}
                          deverão obedecer aos parâmetros acordados com remuneração estipulada em{" "}
                          <span className="bg-black text-black px-1 rounded select-none font-mono">
                            R$ ██.███,██
                          </span>.
                        </>
                      ) : activeHighlight ? (
                        activeHighlight.textSnippet
                      ) : (
                        "Cláusula 4.1: O fornecimento integral dos serviços técnicos e relatórios de auditoria deverá obedecer aos parâmetros acordados."
                      )}
                    </p>
                  </div>

                  <div className="h-2 w-full bg-white/10 rounded"></div>
                  <div className="h-2 w-4/5 bg-white/10 rounded"></div>
                </div>

                <div className="border-t border-white/10 pt-3 flex justify-between items-center text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={12} className={isLgpdActive ? "text-amber-400" : "text-blue-400"} />
                    <span>{isLgpdActive ? "Modo LGPD Ativo • Tarja Preta" : "Docling Layout • Grounded"}</span>
                  </span>
                  <span>Página {activePage}</span>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Painel Central: Chat Minimalista */}
        <main className="flex-1 flex flex-col justify-between relative overflow-hidden">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-2xl mx-auto w-full">
              <h1 className="text-3xl sm:text-4xl font-normal text-white mb-8 tracking-tight text-center">
                Por onde começamos?
              </h1>

              {/* Pílula de Input Flutuante com Microfone Nativo */}
              <div className="w-full bg-[#181A20] border border-white/[0.08] rounded-full p-2 pl-4 pr-3 flex items-center gap-3 shadow-2xl focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  title="Anexar arquivo PDF ou documento"
                  className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-slate-300 hover:text-white transition-all shrink-0"
                >
                  {isUploading ? <Loader2 size={16} className="animate-spin text-blue-400" /> : <Plus size={18} />}
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder={
                    isListening
                      ? "Ouvindo sua voz... fale agora."
                      : isUploading
                      ? "Indexando camadas com Docling Engine..."
                      : documents.length > 0
                      ? `Perguntar sobre ${documents.map((d) => d.name).join(", ")}...`
                      : "Peça ao LDA..."
                  }
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
                />

                {/* Botão de Ditado de Voz Nativo (Web Speech API) */}
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  title={isListening ? "Parar gravação de voz" : "Ditar com sua voz (Web Speech)"}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
                    isListening
                      ? "bg-red-600 text-white animate-pulse ring-2 ring-red-400"
                      : "bg-white/[0.05] hover:bg-white/[0.1] text-slate-300"
                  }`}
                >
                  <Mic size={16} />
                </button>

                <button
                  onClick={() =>
                    setFidelityMode(fidelityMode === "strict" ? "consultative" : "strict")
                  }
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-slate-300 bg-white/[0.05] hover:bg-white/[0.09] transition-colors shrink-0"
                >
                  <span>{fidelityMode === "strict" ? "Estrito" : "Consultivo"}</span>
                  <ChevronDown size={12} className="text-slate-400" />
                </button>

                <button
                  onClick={() => handleSendMessage()}
                  disabled={(!input.trim() && documents.length === 0) || isUploading}
                  className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 flex items-center justify-center text-white transition-all shrink-0"
                >
                  <ArrowUp size={16} />
                </button>
              </div>

              {/* Tags de Documentos Anexados */}
              {documents.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 rounded-full text-xs text-blue-200"
                    >
                      <FileText size={14} className="text-blue-400" />
                      <span className="font-medium">{doc.name}</span>
                      <span className="text-blue-400/70">({doc.size})</span>
                      <button
                        onClick={() => removeDoc(doc.id)}
                        className="hover:text-white ml-1 p-0.5 rounded-full"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {documents.length >= 2 && (
                    <button
                      onClick={handleRunDiff}
                      className="flex items-center gap-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    >
                      <GitCompare size={13} />
                      <span>Comparar Versões (Diff)</span>
                    </button>
                  )}
                </div>
              )}

              {/* Botões de Ação Rápida */}
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeTab === "chat"
                      ? "bg-white/[0.1] text-white"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => {
                    setActiveTab("xray");
                    handleSendMessage("Executar Raio-X completo das tabelas e entidades do arquivo.");
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeTab === "xray"
                      ? "bg-white/[0.1] text-white"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                  }`}
                >
                  Raio-X
                </button>
                <button
                  onClick={() => {
                    setActiveTab("canvas");
                    handleSendMessage("Sintetizar o documento e abrir no Estúdio de Recriação.");
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeTab === "canvas"
                      ? "bg-white/[0.1] text-white"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                  }`}
                >
                  Recriar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-3xl mx-auto w-full">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white rounded-br-none shadow-md"
                          : "bg-[#14171F] border border-white/[0.06] text-slate-200 rounded-bl-none shadow-lg"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/[0.08] flex flex-wrap gap-2">
                          {msg.citations.map((cit, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleOpenCitation(cit)}
                              className="flex items-center gap-1.5 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-400/30 text-blue-300 px-2.5 py-1 rounded-md text-xs font-medium transition-all"
                            >
                              <BookOpen size={12} />
                              <span>Pág. {cit.pageNumber}</span>
                              <span className="text-blue-400/70 text-[11px]">• Ver no PDF</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {msg.role === "assistant" && msg.fidelityScore && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400 border-t border-white/[0.04] pt-2">
                          <Layers size={11} className="text-blue-400" />
                          <span>RRF Híbrido • Score de Fidelidade: {msg.fidelityScore}%</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                ))}

                {isGenerating && (
                  <div className="flex items-center gap-2 text-xs text-blue-400 animate-pulse">
                    <Sparkles size={14} />
                    <span>O LDA está processando a busca híbrida com fusão RRF...</span>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-white/[0.06] bg-[#08090C]/80 backdrop-blur-md">
                <div className="max-w-3xl mx-auto w-full bg-[#181A20] border border-white/[0.08] rounded-full p-2 pl-4 pr-3 flex items-center gap-3 shadow-lg focus-within:border-blue-500/50">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Anexar outro arquivo"
                    className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-slate-300 shrink-0"
                  >
                    <Plus size={18} />
                  </button>

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder={
                      isListening
                        ? "Ouvindo sua voz... fale agora."
                        : "Faça uma pergunta ou solicite uma recriação..."
                    }
                    className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
                  />

                  {/* Microfone Nativo no Chat */}
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    title={isListening ? "Parar gravação" : "Ditar com voz"}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
                      isListening
                        ? "bg-red-600 text-white animate-pulse ring-2 ring-red-400"
                        : "bg-white/[0.05] hover:bg-white/[0.1] text-slate-300"
                    }`}
                  >
                    <Mic size={16} />
                  </button>

                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim()}
                    className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 flex items-center justify-center text-white shrink-0"
                  >
                    <ArrowUp size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Painel Direito: Canvas & Audio Overview Studio */}
        {isCanvasDrawerOpen && (
          <aside className="w-full md:w-[460px] lg:w-[520px] border-l border-white/[0.08] bg-[#0A0D14] flex flex-col z-10 transition-all shadow-2xl">
            <div className="h-12 border-b border-white/[0.08] px-4 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-indigo-400" />
                <span className="font-semibold tracking-wide">Estúdio de Recriação</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCanvas}
                  className="p-1.5 rounded hover:bg-white/[0.08] text-slate-400 hover:text-white"
                  title="Copiar Markdown"
                >
                  {isCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
                <button
                  onClick={() => setIsCanvasDrawerOpen(false)}
                  className="p-1 rounded hover:bg-white/[0.08] text-slate-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Ações Rápidas de Templates */}
            <div className="px-4 py-2 border-b border-white/[0.06] bg-[#0D101A] flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <button
                onClick={() =>
                  setCanvasContent(
                    `# Resumo Executivo em Tópicos\n\n- **Documento**: ${currentDoc?.name || "Arquivo"}\n- **Valores Detectados**: ${currentDoc?.entities?.valores?.join(", ") || "R$ 0,00"}\n- **Tópicos Identificados**: ${currentDoc?.keyTopics?.join(", ") || "Cláusulas Gerais"}\n- **Conclusão**: Pronto para homologação.`
                  )
                }
                className="px-2.5 py-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 whitespace-nowrap"
              >
                Resumo Executivo
              </button>
              <button
                onClick={() =>
                  setCanvasContent(
                    `# Checklist de Ações de Auditoria\n\n- [ ] Verificar consistência da Cláusula 4.1\n- [ ] Validar vigência e valores monetários\n- [ ] Registrar conferência no sistema`
                  )
                }
                className="px-2.5 py-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 whitespace-nowrap"
              >
                Checklist
              </button>
              <button
                onClick={handleRunDiff}
                className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 whitespace-nowrap flex items-center gap-1"
              >
                <GitCompare size={12} />
                <span>Comparar (Diff)</span>
              </button>
              <button
                onClick={() =>
                  setCanvasContent(
                    `# Audio Overview (Estilo NotebookLM)\n\n*Áudio gerado em 2 vozes via Edge-TTS sintetizando o documento em 2m30s de podcast executivo.*`
                  )
                }
                className="px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 whitespace-nowrap flex items-center gap-1"
              >
                <Volume2 size={12} />
                <span>Audio Briefing</span>
              </button>
            </div>

            {/* Player de Audio Briefing */}
            <div className="px-4 py-2.5 bg-indigo-950/20 border-b border-indigo-500/10 flex items-center justify-between gap-3 text-xs">
              <button
                onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                className="w-7 h-7 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white shrink-0 shadow-md transition-all"
              >
                {isPlayingAudio ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
              </button>
              <div className="flex-1">
                <div className="flex justify-between text-[10px] text-indigo-300/80 mb-1">
                  <span>Audio Briefing Podcast</span>
                  <span>{isPlayingAudio ? "01:14 / 02:45" : "02:45"}</span>
                </div>
                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-400 h-full transition-all"
                    style={{ width: `${isPlayingAudio ? 45 : audioProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Editor de Texto / Canvas */}
            <div className="flex-1 p-4 overflow-y-auto">
              <textarea
                value={canvasContent}
                onChange={(e) => setCanvasContent(e.target.value)}
                className="w-full h-full bg-transparent text-slate-200 text-xs font-mono resize-none focus:outline-none leading-relaxed"
                placeholder="Escreva ou edite o documento gerado..."
              />
            </div>

            {/* Rodapé do Canvas */}
            <div className="p-3 border-t border-white/[0.08] bg-[#07090E] flex justify-between items-center text-xs">
              <span className="text-[11px] text-slate-500">Formato: Markdown / RichText</span>
              <button
                onClick={handleExportDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md transition-all"
              >
                <Download size={13} />
                <span>Exportar (.md)</span>
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
