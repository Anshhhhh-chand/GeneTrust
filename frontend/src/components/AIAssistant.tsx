import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Bot, Send, User, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import type { ChatMessage, PredictionResult } from '../types';

interface Props {
  predictionContext?: PredictionResult | null;
  ncbiContext?: any;
}

const renderMarkdown = (text: string) => {
  const lines = text.split('\n');
  return lines.map((line, i) => {

    if (line.startsWith('## ')) return <h4 key={i} style={{ margin: '0.6rem 0 0.2rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{line.slice(3)}</h4>;
    if (line.startsWith('# ')) return <h3 key={i} style={{ margin: '0.6rem 0 0.2rem', fontSize: '1rem', color: 'var(--text-primary)' }}>{line.slice(2)}</h3>;

    if (line.startsWith('- ') || line.startsWith('* ')) {
      return <div key={i} style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
        <span style={{ color: 'var(--accent-blue)', flexShrink: 0 }}>•</span>
        <span>{renderInline(line.slice(2))}</span>
      </div>;
    }

    if (line.trim() === '') return <div key={i} style={{ height: '0.4rem' }} />;

    return <div key={i} style={{ marginTop: '0.1rem' }}>{renderInline(line)}</div>;
  });
};

const renderInline = (text: string) => {

  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} style={{ color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} style={{ background: 'rgba(79,142,247,0.15)', color: 'var(--accent-blue)', padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.85em' }}>{part.slice(1, -1)}</code>;
    return part;
  });
};

const SUGGESTED_QUESTIONS = [
  'What does high GC content mean for CRISPR efficiency?',
  'Explain the mutation result above',
  'What is the seed region and why does it matter?',
  'How do I interpret off-target risk scores?',
];

export const AIAssistant: React.FC<Props> = ({ predictionContext, ncbiContext }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `👋 Hi! I'm **GeneTrust AI**, your CRISPR research assistant powered by Groq.\n\nI can help you:\n- Interpret sequence analysis results\n- Explain mutation predictions and off-target risks\n- Answer questions about CRISPR, guide RNA design, and genomics\n\n${predictionContext || ncbiContext ? "I can see you have an active context loaded — ask me to explain it!" : "Run a sequence analysis first, then ask me about the results!"}`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: messageText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

      // Pass last 10 messages as history (excluding the initial greeting)
      const history = newMessages.slice(1, -1).slice(-10);

      const res = await axios.post(
        `${apiUrl}/api/chat`,
        {
          message: messageText,
          history,
          prediction_context: predictionContext ?? null,
          ncbi_context: ncbiContext ?? null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ ${err.response?.data?.detail || 'Failed to get a response. Please try again.'}`,
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      height: isCollapsed ? 'auto' : '520px',
      transition: 'height 0.3s cubic-bezier(0.16,1,0.3,1)',
    }}>
      {}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        padding: '1rem 1.25rem',
        background: 'linear-gradient(135deg, rgba(79,142,247,0.12) 0%, rgba(139,92,246,0.12) 100%)',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}>
        <div style={{
          width: '30px', height: '30px', borderRadius: '50%',
          background: 'var(--gradient-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-glow-blue)',
        }}>
          <Bot size={15} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>GeneTrust AI</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
            Powered by Groq
          </div>
        </div>
        {(predictionContext || ncbiContext) && (
          <span style={{
            fontSize: '0.68rem', padding: '0.15rem 0.5rem', borderRadius: '100px',
            background: 'rgba(52,211,153,0.15)', color: 'var(--accent-green)', fontWeight: 600,
          }}>
            <Sparkles size={10} style={{ display: 'inline', marginRight: '3px' }} />
            Context loaded
          </span>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem' }}
        >
          <ChevronDown size={16} style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
        </button>
      </div>

      {!isCollapsed && (
        <>
          {}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                display: 'flex', gap: '0.6rem',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
              }}>
                {}
                <div style={{
                  width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
                  background: msg.role === 'user' ? 'var(--gradient-primary)' : 'rgba(139,92,246,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${msg.role === 'user' ? 'transparent' : 'rgba(139,92,246,0.3)'}`,
                }}>
                  {msg.role === 'user'
                    ? <User size={12} color="white" />
                    : <Bot size={12} color="var(--accent-violet)" />
                  }
                </div>
                {}
                <div style={{
                  maxWidth: '80%',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, rgba(79,142,247,0.2), rgba(139,92,246,0.2))'
                    : 'var(--bg-base)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(79,142,247,0.3)' : 'var(--border-subtle)'}`,
                  borderRadius: msg.role === 'user' ? '14px 2px 14px 14px' : '2px 14px 14px 14px',
                  padding: '0.65rem 0.9rem',
                  fontSize: '0.84rem',
                  lineHeight: 1.6,
                  color: 'var(--text-secondary)',
                }}>
                  {msg.role === 'assistant'
                    ? <div>{renderMarkdown(msg.content)}</div>
                    : <div>{msg.content}</div>
                  }
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(139,92,246,0.3)' }}>
                  <Bot size={12} color="var(--accent-violet)" />
                </div>
                <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '2px 14px 14px 14px', padding: '0.65rem 1rem' }}>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: 'var(--accent-violet)', display: 'inline-block',
                        animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {}
          {messages.length <= 1 && (
            <div style={{ padding: '0 1rem 0.5rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                  style={{
                    fontSize: '0.72rem', padding: '0.3rem 0.7rem',
                    background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.2)',
                    borderRadius: '100px', color: 'var(--text-muted)', cursor: 'pointer',
                    transition: 'var(--transition-default)',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {}
          <div style={{
            padding: '0.75rem 1rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex', gap: '0.5rem', alignItems: 'flex-end',
            flexShrink: 0,
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about CRISPR, sequences, mutations… (Enter to send)"
              disabled={loading}
              rows={1}
              style={{
                flex: 1, resize: 'none', border: '1px solid var(--border-default)',
                borderRadius: '10px', padding: '0.6rem 0.9rem',
                background: 'var(--bg-base)', color: 'var(--text-primary)',
                fontSize: '0.84rem', lineHeight: 1.5, fontFamily: 'inherit',
                outline: 'none', maxHeight: '100px', overflowY: 'auto',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent-blue)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-default)'; }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: input.trim() && !loading ? 'var(--gradient-primary)' : 'var(--bg-elevated)',
                border: `1px solid ${input.trim() && !loading ? 'transparent' : 'var(--border-subtle)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                flexShrink: 0, transition: 'var(--transition-default)',
                boxShadow: input.trim() && !loading ? 'var(--shadow-glow-blue)' : 'none',
              }}
            >
              {loading
                ? <Loader2 size={15} color="var(--text-muted)" className="animate-spin" />
                : <Send size={15} color={input.trim() ? 'white' : 'var(--text-muted)'} />
              }
            </button>
          </div>
        </>
      )}
    </div>
  );
};
