import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import type { ChatMessage } from '../types';

interface ChatInterfaceProps {
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    isLoading: boolean;
    placeholder?: string;
    emptyState?: {
        icon?: React.ReactNode;
        title: string;
        suggestions?: string[];
    };
    renderMessage?: (msg: ChatMessage, index: number) => React.ReactNode;
    height?: string;
    className?: string;
}

export function ChatInterface({
    messages,
    onSendMessage,
    isLoading,
    placeholder = 'Type your message...',
    emptyState,
    renderMessage,
    height = '350px',
    className = '',
}: ChatInterfaceProps) {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        onSendMessage(input.trim());
        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const defaultRenderMessage = (msg: ChatMessage, idx: number) => (
        <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
            <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                    ? 'bg-gradient-to-br from-green-600 to-teal-600 text-white rounded-tr-sm'
                    : 'bg-white/10 text-white border border-white/5 rounded-tl-sm'
                    }`}
            >
                {msg.content}
            </div>
        </div>
    );

    const renderer = renderMessage || defaultRenderMessage;

    return (
        <div
            className={`bg-black/20 rounded-2xl border border-white/5 flex flex-col relative overflow-hidden backdrop-blur-sm ${className}`}
            style={{ height }}
        >
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                {messages.length === 0 && emptyState && (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-50">
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                            {emptyState.icon || <MessageSquare className="w-6 h-6 text-white" />}
                        </div>
                        <p className="text-white text-sm font-medium">{emptyState.title}</p>
                        {emptyState.suggestions && emptyState.suggestions.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-2 mt-3">
                                {emptyState.suggestions.map((s, i) => (
                                    <span
                                        key={i}
                                        className="px-2 py-1 rounded-md bg-white/5 text-[10px] text-white/50 border border-white/5"
                                    >
                                        &quot;{s}&quot;
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {messages.map((msg, idx) => renderer(msg, idx))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-3 border border-white/5 flex items-center gap-2">
                            <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white/5 border-t border-white/5 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 transition-all"
                />
                <button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="btn-primary w-12 flex items-center justify-center rounded-xl shadow-lg shadow-green-500/10 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
