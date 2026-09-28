import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, Send, Loader, RotateCcw, AlertTriangle, ArrowRight } from 'lucide-react';
import { copilotChat } from '../services/contractService';
import type { CopilotResponse, Contract, Vendor } from '../types';
import StatusBadge from './StatusBadge';
import { formatDate, getDaysLabel, getUrgencyColor, formatCurrency } from '../utils/formatters';

interface Message {
  role: 'user' | 'bot';
  content: string;
  data?: CopilotResponse;
  loading?: boolean;
}

const MOCK_QUESTIONS = [
  "Which contracts expire in the next 30 days?",
  "What should I review today?",
  "Show high risk contracts",
  "Give me today's contract priorities",
  "Show contracts worth more than ₹5 lakh",
  "Which vendor has the most contracts?",
  "Summarize my renewal risks",
  "Show renewal due contracts"
];

interface CopilotDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CopilotDrawer({ open, onClose }: CopilotDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      content: "👋 Hi! I'm **ContractWatch Copilot**, your intelligent contract management assistant. I query real-time database contracts, calculate dynamic risk scores, and highlight urgent renewal decisions.\n\nClick any of the **Demo Mock-up Questions** below or type your own query!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg = text.trim();
    setInput('');
    setMessages(prev => [
      ...prev,
      { role: 'user', content: userMsg },
      { role: 'bot', content: '', loading: true },
    ]);
    setLoading(true);

    try {
      const response = await copilotChat(userMsg);
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'bot', content: response.message, data: response },
      ]);
    } catch {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'bot', content: "I'm having trouble connecting to the backend. Please ensure the server is running." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'bot',
      content: "Chat cleared. Feel free to ask another contract question or select one of the suggested demo prompts below!",
    }]);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 text-sm">ContractWatch Copilot</h3>
                <p className="text-[11px] text-slate-400">Intelligent contract & renewal intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Clear Chat"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Demo Mock-up Questions Carousel/Chips */}
          <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800 overflow-x-auto no-scrollbar">
            <div className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Demo Mock-up Questions:
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {MOCK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                  className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-indigo-600/20 hover:border-indigo-500/40 border border-slate-700/60 text-slate-300 text-xs whitespace-nowrap transition-all duration-150 active:scale-95"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl p-4 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                      : 'bg-slate-800/80 border border-slate-700/60 text-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.loading ? (
                    <div className="flex items-center gap-2 text-slate-400 py-1">
                      <Loader className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>Consulting contract database...</span>
                    </div>
                  ) : (
                    <div>
                      {/* Markdown-style simple renderer */}
                      <div className="whitespace-pre-line text-sm leading-relaxed">
                        {msg.content}
                      </div>

                      {/* Insight Card */}
                      {msg.data?.insight && (
                        <div className={`mt-3 p-3 rounded-xl border flex items-start gap-2.5 ${
                          msg.data.insight.severity === 'HIGH_RISK'
                            ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                            : msg.data.insight.severity === 'WARNING'
                            ? 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                            : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                        }`}>
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-xs">{msg.data.insight.title}</div>
                            <div className="text-xs opacity-90 mt-0.5">{msg.data.insight.description}</div>
                          </div>
                        </div>
                      )}

                      {/* Contract Result Cards */}
                      {msg.data?.data && msg.data.data.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {msg.data.data.slice(0, 5).map((item, itemIdx) => {
                            const isContract = 'contractNumber' in item;
                            if (isContract) {
                              const c = item as Contract;
                              return (
                                <div
                                  key={itemIdx}
                                  className="p-3 bg-slate-900/90 border border-slate-700/80 rounded-xl space-y-2 hover:border-slate-600 transition-colors"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="font-semibold text-slate-100 text-xs leading-snug">
                                        {c.title}
                                      </div>
                                      <div className="text-[11px] text-slate-400 mt-0.5">
                                        {c.contractNumber} • {c.vendorName}
                                      </div>
                                    </div>
                                    <StatusBadge status={c.status} />
                                  </div>

                                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                                    <span>Expires: {formatDate(c.endDate)}</span>
                                    <span className={`font-semibold ${getUrgencyColor(c.daysUntilExpiry)}`}>
                                      {getDaysLabel(c.daysUntilExpiry)}
                                    </span>
                                  </div>

                                  {/* Risk & Value info */}
                                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                                    <span>Value: <strong className="text-slate-300">{formatCurrency(c.contractValue)}</strong></span>
                                    {c.riskLevel && (
                                      <span className={`px-1.5 py-0.5 rounded font-semibold ${
                                        c.riskLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' :
                                        c.riskLevel === 'HIGH' ? 'bg-orange-500/20 text-orange-300' :
                                        c.riskLevel === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300' :
                                        'bg-emerald-500/20 text-emerald-300'
                                      }`}>
                                        {c.riskLevel} Risk ({c.riskScore})
                                      </span>
                                    )}
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex items-center gap-1.5 pt-1">
                                    <button
                                      onClick={() => {
                                        navigate(`/contracts/${c.id}`);
                                        onClose();
                                      }}
                                      className="flex-1 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors flex items-center justify-center gap-1"
                                    >
                                      View Contract <ArrowRight className="w-3 h-3" />
                                    </button>
                                    {c.status !== 'TERMINATED' && (
                                      <button
                                        onClick={() => {
                                          navigate(`/contracts/${c.id}`);
                                          onClose();
                                        }}
                                        className="py-1 px-2.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[11px] font-medium transition-colors"
                                      >
                                        Renew / Action
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            } else {
                              const v = item as Vendor;
                              return (
                                <div
                                  key={itemIdx}
                                  onClick={() => {
                                    navigate(`/vendors?id=${v.id}`);
                                    onClose();
                                  }}
                                  className="p-2.5 bg-slate-900 border border-slate-700 rounded-lg hover:border-slate-600 cursor-pointer text-xs"
                                >
                                  <div className="font-medium text-slate-200">{v.name}</div>
                                  <div className="text-[11px] text-slate-400 mt-0.5">
                                    {v.activeContracts} active contracts • {v.contactPerson || v.email}
                                  </div>
                                </div>
                              );
                            }
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/70">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about contracts, renewals, risks..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="btn-primary p-2.5 rounded-xl disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
