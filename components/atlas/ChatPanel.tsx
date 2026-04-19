'use client';

import { useState, useRef, useEffect } from 'react';
import { useSceneStore } from '@/state/sceneStore';
import { fetchTTS } from '@/lib/atlas/api';

interface ChatPanelProps {
  onClose?: () => void;
}

export function ChatPanel({ onClose }: ChatPanelProps) {
  const { chatHistory, isChatLoading, focusedElement, sceneGraph, sendChatMessage } = useSceneStore();
  const [input, setInput] = useState('');
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Cache fetched audio per message id so repeat taps are instant
  const audioCacheRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatLoading]);

  const playAudio = (base64: string, msgId: string) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
      audioRef.current = audio;
      audio.play().catch(() => {});
      audio.onended = () => setSpeakingId(null);
      audio.onerror = () => setSpeakingId(null);
      setSpeakingId(msgId);
    } catch {
      setSpeakingId(null);
    }
  };

  const handleSpeak = async (msgId: string, content: string, cachedAudio?: string) => {
    // If already speaking this message, stop it
    if (speakingId === msgId) {
      audioRef.current?.pause();
      audioRef.current = null;
      setSpeakingId(null);
      return;
    }

    const cached = cachedAudio || audioCacheRef.current.get(msgId);
    if (cached) {
      playAudio(cached, msgId);
      return;
    }

    setSpeakingId(msgId);
    setErrorId(null);
    try {
      const base64 = await fetchTTS(content);
      audioCacheRef.current.set(msgId, base64);
      playAudio(base64, msgId);
    } catch (err) {
      console.error('[TTS] playback failed:', err);
      setSpeakingId(null);
      setErrorId(msgId);
      setTimeout(() => setErrorId(null), 2000);
    }
  };

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
            {msg.role === 'assistant' && (
              <button
                className={`atlas-msg-speak${speakingId === msg.id ? ' atlas-msg-speak--active' : ''}${errorId === msg.id ? ' atlas-msg-speak--error' : ''}`}
                aria-label={speakingId === msg.id ? 'Stop audio' : 'Play audio'}
                onClick={() => handleSpeak(msg.id, msg.content, msg.audioBase64)}
                disabled={speakingId !== null && speakingId !== msg.id}
              >
                {errorId === msg.id ? '!' : speakingId === msg.id ? '■' : '▶'}
              </button>
            )}
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
