"use client";

import React, { useState, useRef } from "react";
import {
  Plus,
  Mic,
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
  Volume2
} from "lucide-react";

interface Citation {
  documentId: string;
  documentName: string;
  pageNumber: number;
  textSnippet: string;
  boundingBox?: {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  timestamp: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "xray" | "canvas">("chat");
  const [fidelityMode, setFidelityMode] = useState<"strict" | "consultative">("strict");
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string; rawFile?: File } | null>(null);
  
  // Painéis retráteis (Gavetas)
  const [isPdfDrawerOpen, setIsPdfDrawerOpen] = useState(false);
  const [isCanvasDrawerOpen, setIsCanvasDrawerOpen] = useState(false);
  
  // Estado do PDF Viewer
  const [activePage, setActivePage] = useState(1);
  const [activeHighlight, setActiveHighlight] = useState<Citation | null>(null);
  
  // Estado do Canvas de Recriação
  const [canvasContent, setCanvasContent] = useState(
    "# Minuta Sintetizada de Documento\n\n*Clique em um template ou solicite alterações no chat para preencher o estúdio.*"
  );
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manipular anexo de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setSelectedFile({
        name: file.name,
        size: `${sizeMb} MB`,
        rawFile: file,
      });
    }
  };

  // Enviar mensagem
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() && !selectedFile) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend || `Analisar o arquivo ${selectedFile?.name}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsGenerating(true);

    // Simulação ou chamada ao backend FastAPI
    setTimeout(() => {
      let assistantReply = "";
      let mockCitations: Citation[] = [];

      if (selectedFile) {
        mockCitations = [
          {
            documentId: "doc-1",
            documentName: selectedFile.name,
            pageNumber: 1,
            textSnippet: "Cláusula 4.1: O fornecimento integral dos serviços e a entrega dos relatórios...",
            boundingBox: { page: 1, x: 60, y: 160, width: 480, height: 70 },
          },
        ];
      }

      if (activeTab === "xray") {
        assistantReply = `🔍 **Raio-X de Detecção**: O documento **${selectedFile?.name || "anexado"}** possui 12 páginas, 4 tabelas estruturadas e menção a 3 datas críticas. A taxa de conformidade calculada no modo **${fidelityMode.toUpperCase()}** é de 98.4%.`;
      } else if (activeTab === "canvas") {
        assistantReply = `✨ Documento transferido para o **Estúdio de Recriação**. Você pode visualizar e editar a versão refinada no painel lateral direito.`;
        setCanvasContent(
          `# Síntese Executiva: ${selectedFile?.name || "Documento"}\n\n` +
          `### 1. Resumo dos Pontos Principais\n` +
          `- **Objeto Principal**: Fornecimento e análise de inteligência documental.\n` +
          `- **Prazos**: Execução em ciclos quinzenais com validação por marcos.\n` +
          `- **Valores e Custos**: R$ 45.000,00 divididos em 3 parcelas vinculadas a entregas.\n\n` +
          `### 2. Ações Imediatas (Checklist)\n` +
          `- [x] Validação da assinatura digital das partes.\n` +
          `- [ ] Homologação do ambiente de produção e banco vetorial.\n` +
          `- [ ] Emissão da ordem de serviço inicial.`
        );
        setIsCanvasDrawerOpen(true);
      } else {
        assistantReply = `Analisei o documento ${selectedFile ? `**${selectedFile.name}**` : ""}. ` +
          `No modo **${fidelityMode === "strict" ? "Estrito (Zero Alucinação)" : "Consultivo"}**, ` +
          `as cláusulas contratuais e especificações técnicas foram identificadas com precisão na página 1.\n\n` +
          `Você pode clicar na citação abaixo para visualizar a folha original com o trecho destacado.`;
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: assistantReply,
        citations: mockCitations,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsGenerating(false);
    }, 700);
  };

  // Clicar em uma citação abre o PDF Viewer no ponto exato
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

  return (
    <div className="relative min-h-screen flex flex-col ambient-glow">
      {/* Input de arquivo oculto */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.txt,.md,.docx"
        className="hidden"
      />

      {/* Header Superior Minimalista */}
      <header className="h-14 border-b border-white/[0.06] px-6 flex items-center justify-between z-20 backdrop-blur-md bg-[#08090C]/60">
        <div className="flex items-center gap-3">
          {/* Logo SVG estilizada do LDA */}
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

        {/* Controles de Painéis e Ações do Topo */}
        <div className="flex items-center gap-2">
          {selectedFile && (
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
                setSelectedFile(null);
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

      {/* Área Central de Conteúdo */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Painel Esquerdo: PDF Viewer com Destaques Espaciais (Gaveta) */}
        {isPdfDrawerOpen && (
          <aside className="w-full md:w-[460px] lg:w-[500px] border-r border-white/[0.08] bg-[#0A0D14] flex flex-col z-10 transition-all shadow-2xl">
            <div className="h-12 border-b border-white/[0.08] px-4 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2 truncate">
                <FileText size={14} className="text-blue-400 shrink-0" />
                <span className="truncate font-medium">{selectedFile?.name || "Documento Original"}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-slate-400">Pág. {activePage}</span>
                <button
                  onClick={() => setIsPdfDrawerOpen(false)}
                  className="p-1 rounded hover:bg-white/[0.08] text-slate-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Simulação Visual do PDF com Canvas Overlay */}
            <div className="flex-1 p-6 overflow-y-auto bg-[#07090E] flex flex-col items-center">
              <div className="w-full max-w-[400px] aspect-[1/1.41] bg-[#121620] border border-white/[0.1] rounded-lg p-6 relative shadow-xl text-slate-300 text-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="h-3 w-3/4 bg-white/20 rounded"></div>
                  <div className="h-2 w-full bg-white/10 rounded"></div>
                  <div className="h-2 w-5/6 bg-white/10 rounded"></div>

                  {/* Bounding Box Highlight animado quando clicado */}
                  <div
                    className={`p-3 rounded border transition-all ${
                      activeHighlight
                        ? "bg-blue-500/15 border-blue-400/80 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/10"
                        : "bg-white/[0.03] border-white/[0.06]"
                    }`}
                  >
                    <p className="text-[11px] leading-relaxed text-slate-200">
                      {activeHighlight
                        ? activeHighlight.textSnippet
                        : "Cláusula 4.1: O fornecimento integral dos serviços e a entrega dos relatórios técnicos deverão obedecer estritamente aos parâmetros acordados."}
                    </p>
                  </div>

                  <div className="h-2 w-full bg-white/10 rounded"></div>
                  <div className="h-2 w-4/5 bg-white/10 rounded"></div>
                </div>

                <div className="border-t border-white/10 pt-3 flex justify-between items-center text-[10px] text-slate-500">
                  <span>LDA Layout Inspector • Docling Engine</span>
                  <span>Folha {activePage}</span>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Painel Central: Chat Minimalista Estilo Gemini */}
        <main className="flex-1 flex flex-col justify-between relative overflow-hidden">
          {/* Caso 1: Sem Mensagens (Estado Inicial idêntico à imagem de referência) */}
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-2xl mx-auto w-full">
              <h1 className="text-3xl sm:text-4xl font-normal text-white mb-8 tracking-tight text-center">
                Por onde começamos?
              </h1>

              {/* Pílula de Input Flutuante */}
              <div className="w-full bg-[#181A20] border border-white/[0.08] rounded-full p-2 pl-4 pr-3 flex items-center gap-3 shadow-2xl focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Anexar arquivo PDF ou documento"
                  className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-slate-300 hover:text-white transition-all shrink-0"
                >
                  <Plus size={18} />
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder={selectedFile ? `Perguntar sobre ${selectedFile.name}...` : "Peça ao LDA..."}
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
                />

                {/* Seletor de Modelo / Modo de Fidelidade */}
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
                  disabled={!input.trim() && !selectedFile}
                  className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 flex items-center justify-center text-white transition-all shrink-0"
                >
                  <ArrowUp size={16} />
                </button>
              </div>

              {/* Tag de Arquivo Selecionado */}
              {selectedFile && (
                <div className="mt-3 flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 rounded-full text-xs text-blue-200">
                  <FileText size={14} className="text-blue-400" />
                  <span className="font-medium">{selectedFile.name}</span>
                  <span className="text-blue-400/70">({selectedFile.size})</span>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="hover:text-white ml-1 p-0.5 rounded-full"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              {/* Botões de Ação Rápida abaixo da Barra */}
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
                    handleSendMessage("Executar Raio-X completo das tabelas e dados do arquivo.");
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
            /* Caso 2: Conversa Ativa com Streaming e Citações */
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

                      {/* Citações com Bounding Boxes Interativas */}
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
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                ))}

                {isGenerating && (
                  <div className="flex items-center gap-2 text-xs text-blue-400 animate-pulse">
                    <Sparkles size={14} />
                    <span>O LDA está processando as camadas do documento...</span>
                  </div>
                )}
              </div>

              {/* Barra de Input Inferior no Chat Ativo */}
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
                    placeholder="Faça uma pergunta sobre o documento ou peça uma recriação..."
                    className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
                  />

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

        {/* Painel Direito: Estúdio de Recriação / Canvas (Gaveta) */}
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

            {/* Templates Rápidos (1-Click Actions) */}
            <div className="px-4 py-2 border-b border-white/[0.06] bg-[#0D101A] flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <button
                onClick={() =>
                  setCanvasContent(
                    `# Resumo Executivo em Tópicos\n\n- **Tópico 1**: Requisitos técnicos atendidos.\n- **Tópico 2**: Orçamento aprovado e cronograma estabelecido.\n- **Conclusão**: Pronto para homologação.`
                  )
                }
                className="px-2.5 py-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 whitespace-nowrap"
              >
                Resumo Executivo
              </button>
              <button
                onClick={() =>
                  setCanvasContent(
                    `# Checklist de Ações\n\n- [ ] Assinar aditivo contratual\n- [ ] Configurar credenciais do banco\n- [ ] Enviar relatório final`
                  )
                }
                className="px-2.5 py-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 whitespace-nowrap"
              >
                Checklist
              </button>
              <button
                onClick={() =>
                  setCanvasContent(
                    `# Audio Overview\n\n*Áudio gerado em 2 vozes via Edge-TTS sintetizando as 12 páginas em 3 minutos de podcast.*`
                  )
                }
                className="px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 whitespace-nowrap flex items-center gap-1"
              >
                <Volume2 size={12} />
                <span>Audio Briefing</span>
              </button>
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

            {/* Rodapé do Canvas com Botão de Exportação */}
            <div className="p-3 border-t border-white/[0.08] bg-[#07090E] flex justify-between items-center text-xs">
              <span className="text-[11px] text-slate-500">Formato: Markdown / RichText</span>
              <button
                onClick={() => alert("Documento exportado com sucesso!")}
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
