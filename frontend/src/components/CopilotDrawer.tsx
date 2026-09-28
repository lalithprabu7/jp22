import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, Send, Loader, RotateCcw } from 'lucide-react';
import { copilotChat } from '../services/contractService';
import type { CopilotResponse, Contract, Vendor } from '../types';
import StatusBadge from './StatusBadge';
import { formatDate, getDaysLabel, getUrgencyColor } from '../utils/formatters';

interface Message {
  role: 'user' | 'bot';
  content: string;
  data?: CopilotResponse;
  loading?: boolean;
}

const SUGGESTED_PROMPTS = [
  "What's expiring in 30 days?",
  "Show renewal risks",
  "Summarize my contracts",
  "Which vendor has the most contracts?",
  "Show urgent contracts",
];

interface CopilotDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CopilotDrawer({ open, onClose }: CopilotDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      content: "👋 Hi! I'm **ContractWatch Copilot**. Ask me anything about your contracts — expiring contracts, renewal risks, vendor summaries, and more.",
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
      content: "Chat cleared. How can I help you with your contracts?",
    }]);
  };

  if (!open) return null;

  const renderMessageContent = (msg: Message) => {
    if (msg.loading) {
      return (
        <div className="typing-indicator">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      );
    }

    // Render markdown-like bold text
    const renderText = (text: string) => {
      const parts = text.split(/\*\*(.*?)\*\*/g);
      return parts.map((part, i) =>
        i % 2 === 1
          ? <strong key={i}>{part}</strong>
          : part.split('\n').map((line, j) => (
              <span key={j}>{line}{j < part.split('\n').length - 1 && <br />}</span>
            ))
      );
    };

    const response = msg.data;

    return (
      <div className="copilot-bubble">
        <div>{renderText(msg.content)}</div>

        {/* Insight Card */}
        {response?.insight && (
          <div className={`copilot-insight ${response.insight.severity}`}>
            <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{response.insight.title}</div>
            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
              {response.insight.description}
            </div>
          </div>
        )}

        {/* Contract Cards */}
        {response?.data && response.data.length > 0 && (
          <div className="copilot-result-cards">
            {(response.data as Contract[]).slice(0, 5).map((item: Contract) => (
              'contractNumber' in item ? (
                <div
                  key={item.id}
                  className="copilot-contract-card"
                  onClick={() => { navigate(`/contracts/${item.id}`); onClose(); }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{item.title}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        {item.vendorName} · Expires {formatDate(item.endDate)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                      <StatusBadge status={item.status} />
                      {item.daysUntilExpiry >= 0 && (
                        <span style={{ fontSize: '0.65rem', color: getUrgencyColor(item.daysUntilExpiry) }}>
                          {getDaysLabel(item.daysUntilExpiry)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  key={(item as Vendor).id}
                  className="copilot-contract-card"
                  onClick={() => { navigate('/vendors'); onClose(); }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{(item as Vendor).name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    {(item as Vendor).totalContracts} contracts · {(item as Vendor).activeContracts} active
                  </div>
                </div>
              )
            ))}
            {response.data.length > 5 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '0.5rem' }}>
                +{response.data.length - 5} more — view in Contracts
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="copilot-drawer">
      {/* Header */}
      <div className="copilot-header">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>ContractWatch Copilot</h3>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Ask me anything about your contracts
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm btn-icon" onClick={clearChat} title="Clear chat">
            <RotateCcw size={14} />
          </button>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Suggestions */}
      <div className="copilot-suggestions">
        {SUGGESTED_PROMPTS.map(p => (
          <button key={p} className="suggestion-chip" onClick={() => sendMessage(p)}>
            {p}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="copilot-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`copilot-msg copilot-msg-${msg.role}`}>
            {msg.role === 'user' ? (
              <div className="copilot-bubble">{msg.content}</div>
            ) : (
              renderMessageContent(msg)
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="copilot-input-area">
        <input
          ref={inputRef}
          className="form-input"
          placeholder="Ask about your contracts…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
          disabled={loading}
        />
        <button
          className="btn btn-primary btn-icon"
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
        >
          {loading ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}
