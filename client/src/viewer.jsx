import ReactDOM from 'react-dom/client';
import { useEffect, useMemo, useRef, useState } from 'react';

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function WebSocketViewer() {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('connecting'); // connecting | connected | disconnected
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  const wsUrl = useMemo(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${window.location.host}/ws`;
  }, []);

  useEffect(() => {
    // Load recent history so the viewer isn't empty.
    fetch('/api/messages?limit=50')
      .then((r) => r.json())
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch(() => {});

    const connect = () => {
      setStatus('connecting');
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
      };

      ws.onmessage = (event) => {
        const data = safeJsonParse(event.data);
        if (!data || data.type !== 'message') return;
        setMessages((prev) => [...prev, data.message]);
      };

      ws.onerror = () => {
        // close handler will schedule reconnect
      };

      ws.onclose = () => {
        setStatus('disconnected');
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

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 24,
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
        background: 'linear-gradient(135deg, #0f172a 0%, #5b21b6 100%)',
        color: '#fff',
      }}
    >
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 22 }}>WebSocket Viewer</h1>
            <div style={{ opacity: 0.85, marginTop: 6 }}>
              Status:{' '}
              <span style={{ color: status === 'connected' ? '#34d399' : '#fbbf24' }}>{status}</span>
              {' · '}
              Live messages: <span style={{ fontWeight: 600 }}>{messages.length}</span>
            </div>
          </div>

          <a
            href="/"
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.25)',
              color: '#fff',
              textDecoration: 'none',
              background: 'rgba(0,0,0,0.15)',
              whiteSpace: 'nowrap',
            }}
          >
            Back to chat
          </a>
        </div>

        <div
          style={{
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 14,
            background: 'rgba(255,255,255,0.06)',
            height: 520,
            overflowY: 'auto',
            padding: 14,
          }}
        >
          {messages.length === 0 ? (
            <div style={{ opacity: 0.8 }}>Waiting for messages…</div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  background: 'rgba(0,0,0,0.18)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  marginBottom: 10,
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
                  {m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : ''}
                </div>
                <div style={{ fontSize: 15, whiteSpace: 'pre-wrap' }}>{m.text}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<WebSocketViewer />);

