import React, { useState, useEffect, useRef } from "react";
import { queryRag, getChatHistory } from "../services/api";

export default function RagChatDrawer({ isOpen, onClose, patientId, patientName }) {
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const samplePrompts = [
    "Why did my cholesterol increase by 2 mg/dL?",
    "What is my 10-year cardiovascular risk?",
    "What are my diabetes and glucose risk factors?",
    "How is my kidney and eGFR function?",
    "What diet and foods should I eat based on my report?"
  ];

  useEffect(() => {
    if (patientId && isOpen) {
      loadHistory();
    }
  }, [patientId, isOpen]);

  const loadHistory = async () => {
    try {
      const res = await getChatHistory(patientId);
      if (res.data && res.data.length > 0) {
        setMessages(res.data);
      } else {
        setMessages([
          {
            id: 0,
            sender: "assistant",
            message: `Hello! I'm your HealthLens AI Clinical Assistant. I can answer questions grounded directly in ${patientName || "your"}'s uploaded medical reports, historical biomarker trends, and clinical reference guidelines. What would you like to know?`,
            citations: []
          }
        ]);
      }
    } catch (e) {
      console.error("Failed to load chat history", e);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (queryText) => {
    const text = queryText || inputQuery;
    if (!text.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: "user",
      message: text,
      citations: []
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const res = await queryRag(patientId, text);
      const aiMsg = {
        id: Date.now() + 1,
        sender: "assistant",
        message: res.data.answer,
        citations: res.data.citations || []
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        sender: "assistant",
        message: "Sorry, I encountered an error searching your medical report records. Please ensure the backend server is active.",
        citations: []
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="position-fixed top-0 end-0 h-100 bg-white shadow-lg d-flex flex-column border-start"
      style={{ width: "420px", maxWidth: "95vw", zIndex: 1050 }}
    >
      {/* Header */}
      <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-light">
        <div className="d-flex align-items-center gap-2">
          <div className="brand-badge" style={{ width: "32px", height: "32px", fontSize: "1rem" }}>
            <i className="bi bi-robot"></i>
          </div>
          <div>
            <h6 className="fw-bold mb-0 text-dark">HealthLens AI Assistant</h6>
            <small className="text-muted" style={{ fontSize: "0.75rem" }}>
              Contextual RAG with Medical Report Citations
            </small>
          </div>
        </div>
        <button className="btn-close" onClick={onClose}></button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-grow-1 p-3 overflow-auto d-flex flex-column gap-3" style={{ background: "#f8fafc" }}>
        {messages.map((m, idx) => (
          <div key={idx} className={m.sender === "user" ? "chat-bubble-user" : "chat-bubble-ai"}>
            <div style={{ whiteSpace: "pre-wrap" }}>{m.message}</div>

            {/* Citations */}
            {m.citations && m.citations.length > 0 && (
              <div className="mt-2 pt-2 border-top">
                <small className="fw-bold text-primary d-block mb-1" style={{ fontSize: "0.75rem" }}>
                  <i className="bi bi-bookmark-check me-1"></i> Medical Report Citations:
                </small>
                {m.citations.map((c, cIdx) => (
                  <div key={cIdx} className="citation-card">
                    <div className="d-flex align-items-center justify-content-between">
                      <strong className="text-dark">{c.report_title}</strong>
                      <span className="badge bg-light text-muted border">{c.report_date}</span>
                    </div>
                    <p className="text-muted mb-0 mt-1" style={{ fontSize: "0.75rem" }}>
                      "{c.snippet}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="chat-bubble-ai d-flex align-items-center gap-2">
            <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
            <span className="text-muted" style={{ fontSize: "0.8125rem" }}>
              Searching medical records & synthesizing response...
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-2 border-top bg-white">
        <small className="text-muted d-block mb-1 ps-1" style={{ fontSize: "0.7rem", textTransform: "uppercase" }}>
          Suggested Inquiries:
        </small>
        <div className="d-flex flex-wrap gap-1">
          {samplePrompts.slice(0, 3).map((prompt, idx) => (
            <button
              key={idx}
              className="btn btn-sm btn-light border text-dark text-start"
              style={{ fontSize: "0.75rem", borderRadius: "12px", whiteSpace: "nowrap" }}
              onClick={() => handleSend(prompt)}
              disabled={loading}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-3 border-top bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="d-flex gap-2"
        >
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Ask about your lab report, trends, or diet..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn btn-sm btn-primary px-3" disabled={loading || !inputQuery.trim()}>
            <i className="bi bi-send-fill"></i>
          </button>
        </form>
      </div>
    </div>
  );
}
