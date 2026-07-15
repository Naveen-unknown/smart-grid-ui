import { useState, useRef, useEffect } from 'react';
import { aiChatAPI } from '../api/services';
import toast from 'react-hot-toast';

const SUGGESTIONS = [
  "How can we reduce grid energy wastage?",
  "What causes low power factor and how to correct it?",
  "Analyze current grid outage recovery performance",
  "Provide safety guidelines for operator technicians during high load"
];

export default function AIChat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am the Smart Grid AI Assistant powered by GitHub AI (GPT-4o). I can answer ANY question — grid operations, fault analysis, general knowledge, or casual conversation. How can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    if (!textToSend) setInput('');

    // Append user message
    const updatedMessages = [...messages, { role: 'user', content: text }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Map history to request DTO shape (role: user/assistant)
      const apiHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await aiChatAPI.sendMessage(text, apiHistory);
      const reply = res.data?.data?.response || "I could not retrieve an answer at this time.";

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      toast.error('Failed to communicate with AI');
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Error: Failed to generate response from AI server. Please verify backend state.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--header-height) - 40px)', padding: '20px' }}>
      <div className="page-header" style={{ position: 'static', padding: '0 0 16px', background: 'transparent', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
        <div>
          <h2>AI Chat Assistant</h2>
          <p>Conversational AI diagnostic and operations help desk</p>
        </div>
        <div className="header-right">
          <span className="live-badge" style={{ background: 'rgba(93, 62, 188, 0.1)', border: '1px solid rgba(93, 62, 188, 0.3)', color: '#a78bfa' }}>
            🤖 GitHub AI Grid Agent
          </span>
        </div>
      </div>

      {/* Main chat window container */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        {/* Messages list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((m, idx) => (
            <div key={idx} style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '75%',
              display: 'flex',
              gap: '12px',
              flexDirection: m.role === 'user' ? 'row-reverse' : 'row'
            }}>
              {/* Avatar */}
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: m.role === 'user' ? 'var(--gradient-blue)' : 'linear-gradient(135deg, #7c3aed, #5d3ebc)',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 'bold', flexShrink: 0
              }}>
                {m.role === 'user' ? 'OP' : 'AI'}
              </div>

              {/* Speech bubble */}
              <div style={{
                background: m.role === 'user' ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '13.5px',
                color: 'var(--text-primary)',
                lineHeight: '1.65',
                whiteSpace: 'pre-wrap',
                boxShadow: 'var(--shadow-sm)'
              }}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #5d3ebc)',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 'bold'
              }}>
                AI
              </div>
              <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 18px' }}>
                <span className="dot" style={{ background: 'var(--text-muted)', animation: 'pulse-green 1.4s infinite 0.2s', width: '6px', height: '6px' }} />
                <span className="dot" style={{ background: 'var(--text-muted)', animation: 'pulse-green 1.4s infinite 0.4s', width: '6px', height: '6px' }} />
                <span className="dot" style={{ background: 'var(--text-muted)', animation: 'pulse-green 1.4s infinite 0.6s', width: '6px', height: '6px' }} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestion Chips */}
        {messages.length === 1 && (
          <div style={{ padding: '0 20px 12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s)}
                className="btn btn-outline btn-sm"
                style={{ borderRadius: '20px', fontSize: '11px', color: 'var(--text-secondary)' }}
              >
                💡 {s}
              </button>
            ))}
          </div>
        )}

        {/* Bottom Input Area */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Ask the AI grid assistant..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={loading}
            style={{ flex: 1, margin: 0 }}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="btn btn-primary"
            style={{ width: '48px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
          >
            ✈️
          </button>
        </div>
      </div>
    </div>
  );
}
