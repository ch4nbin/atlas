'use client';

import { useState, useRef, useEffect } from 'react';
import { useSceneStore } from '@/state/sceneStore';

interface ChatPanelProps {
  onClose?: () => void;
}

export function ChatPanel({ onClose }: ChatPanelProps) {
  const { chatHistory, isChatLoading, focusedElement, sceneGraph, sendChatMessage } = useSceneStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatLoading]);

  const handleSend = () => {
    if (!input.trim() || isChatLoading) return;
    sendChatMessage(input.trim());
    setInput('');
  };

  if (!sceneGraph) return null;

  return (
    <div className="atlas-chat-panel">
      <div className="atlas-chat-header">
        <div className="atlas-chat-title">
          <span className="atlas-chat-icon">◈</span>
          <span>Historical Guide</span>
        </div>
        <div className="atlas-chat-header-right">
          {sceneGraph && (
            <div className="atlas-scene-label">
              {sceneGraph.setting.location}
              <br />
              <span className="atlas-scene-period">{sceneGraph.setting.time_period}</span>
            </div>
          )}
          {onClose && (
            <button className="atlas-chat-close" onClick={onClose} aria-label="Close guide">
              ✕
            </button>
          )}
        </div>
      </div>

      {focusedElement && (
        <div className="atlas-focused-badge">
          <span className="atlas-focused-dot" />
          <span>Focused: <strong>{focusedElement.name}</strong></span>
        </div>
      )}

      <div className="atlas-messages">
        {chatHistory.map((msg) => (
          <div
            key={msg.id}
            className={`atlas-msg atlas-msg-${msg.role}`}
          >
            {msg.role === 'assistant' && (
              <span className="atlas-msg-avatar">◈</span>
            )}
            <p className="atlas-msg-text">{msg.content}</p>
          </div>
        ))}
        {isChatLoading && (
          <div className="atlas-msg atlas-msg-assistant">
            <span className="atlas-msg-avatar">◈</span>
            <div className="atlas-typing">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="atlas-chat-input-row">
        <input
          ref={inputRef}
          className="atlas-chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={focusedElement ? `Ask about ${focusedElement.name}...` : 'Ask about this scene...'}
          disabled={isChatLoading}
        />
        <button
          className="atlas-chat-send"
          onClick={handleSend}
          disabled={isChatLoading || !input.trim()}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
