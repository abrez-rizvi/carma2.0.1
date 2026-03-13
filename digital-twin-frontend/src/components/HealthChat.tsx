import React, { useState } from 'react';
import { API_BASE_URL } from '../config';
import { MessageSquare } from 'lucide-react';
import type { ChatMessage } from '../types';
import type { AQIData } from '../types';
import { ChatInterface } from './ChatInterface';

interface HealthChatProps {
  aqiContext: AQIData & { risk_summary?: string };
}

export function HealthChat({ aqiContext }: HealthChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (userMsg: string) => {
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-health`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          context: {
            aqi: aqiContext?.aqi || 0,
            city: aqiContext?.city || 'Delhi',
            risk_summary: aqiContext?.risk_summary || 'Unknown'
          }
        })
      });

      if (!response.ok) throw new Error('API Error');

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (e) {
      console.error("Health Chat Error:", e);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't reach the health expert right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-white/10">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-1.5 bg-secondary/10 rounded-lg">
          <MessageSquare className="w-4 h-4 text-secondary" />
        </div>
        <h4 className="font-bold text-white text-sm uppercase tracking-widest opacity-80">
          AI Health Consultant
        </h4>
      </div>

      <ChatInterface
        messages={messages}
        onSendMessage={sendMessage}
        isLoading={loading}
        placeholder="Type your health question..."
        emptyState={{
          icon: <MessageSquare className="w-6 h-6 text-white" />,
          title: 'Ask about your health safety',
          suggestions: ['Can I go jogging?', 'Risks for asthma?'],
        }}
      />
    </div>
  );
}
