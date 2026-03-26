import { useEffect, useMemo, useRef, useState } from 'react';

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  const wsUrl = useMemo(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${window.location.host}/ws`;
  }, []);

  useEffect(() => {
    // Load recent history
    fetch('/api/messages?limit=50')
      .then((r) => r.json())
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch(() => {});

    const connect = () => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // no-op; server will send a hello
      };

      ws.onmessage = (event) => {
        const data = safeJsonParse(event.data);
        if (!data || data.type !== 'message') return;
        setMessages((prev) => [...prev, data.message]);
      };

      ws.onerror = () => {
        // let the close handler schedule reconnect
      };

      ws.onclose = () => {
        if (reconnectTimerRef.current) return;
        reconnectTimerRef.current = window.setTimeout(() => {
          reconnectTimerRef.current = null;
          connect();
        }, 1000);
      };
    };

    connect();

    return () => {
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
      if (wsRef.current) wsRef.current.close();
    };
  }, [wsUrl]);

  const sendMessage = (e) => {
    e.preventDefault();
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const t = text.trim();
    if (!t) return;

    ws.send(JSON.stringify({ type: 'chat', text: t }));
    setText('');
  };

  return (
    <div
      style={{
        maxWidth: 900,
        margin: '40px auto',
        padding: 16,
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: 0 }}>Chatroom</h1>
        <a
          href="/viewer.html"
          style={{
            padding: '8px 12px',
            borderRadius: 10,
            border: '1px solid #ddd',
            background: '#f8f8f8',
            color: '#111',
            textDecoration: 'none',
            fontSize: 14,
            whiteSpace: 'nowrap',
          }}
        >
          Open WebSocket Viewer
        </a>
      </div>

      <div
        style={{
          border: '1px solid #e5e5e5',
          borderRadius: 8,
          height: 420,
          overflowY: 'auto',
          padding: 12,
          background: '#fff',
        }}
      >
        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
              {m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : ''}
            </div>
            <div style={{ fontSize: 15, whiteSpace: 'pre-wrap' }}>{m.text}</div>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 8,
            border: '1px solid #ddd',
          }}
          placeholder="Type a message..."
        />
        <button
          type="submit"
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            border: '1px solid #ddd',
            background: '#111',
            color: '#fff',
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

