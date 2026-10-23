import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ChatPlayground } from './components/chat/ChatPlayground';
import { SideBySideArena } from './components/chat/SideBySideArena';
import { CodeComparison } from './components/code/CodeComparison';
import { ConceptLab } from './components/concepts/ConceptLab';
import { RuleDefinition } from './types';
import { INITIAL_RULES } from './data/initialRules';
import { Sparkles, BookOpen, ExternalLink, Cpu } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'arena' | 'code' | 'concepts'>('chat');
  const [rules, setRules] = useState<RuleDefinition[]>(() => {
    const saved = localStorage.getItem('ai_basics_rules');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_RULES;
      }
    }
    return INITIAL_RULES;
  });

  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(true);

  // Check backend server status
  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.hasGeminiKey === 'boolean') {
          setHasGeminiKey(data.hasGeminiKey);
        }
      })
      .catch(() => {
        // Standalone client or offline mode
        setHasGeminiKey(false);
      });
  }, []);

  // Sync rules to localStorage
  useEffect(() => {
    localStorage.setItem('ai_basics_rules', JSON.stringify(rules));
  }, [rules]);

  const handleAddRule = (newRule: Omit<RuleDefinition, 'id'>) => {
    const rule: RuleDefinition = {
      ...newRule,
      id: 'rule-' + Date.now(),
    };
    setRules((prev) => [rule, ...prev]);
  };

  const handleDeleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleResetRules = () => {
    setRules(INITIAL_RULES);
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased">
      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasGeminiKey={hasGeminiKey}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col">
        {activeTab === 'chat' && (
          <ChatPlayground
            rules={rules}
            onAddRule={handleAddRule}
            onDeleteRule={handleDeleteRule}
            onResetRules={handleResetRules}
            hasGeminiKey={hasGeminiKey}
          />
        )}

        {activeTab === 'arena' && (
          <SideBySideArena rules={rules} hasGeminiKey={hasGeminiKey} />
        )}

        {activeTab === 'code' && <CodeComparison />}

        {activeTab === 'concepts' && <ConceptLab />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-medium text-slate-700">AI Basics Laboratory</span>
            <span>—</span>
            <span>Interactive comparison of Rule Matchers vs. Transformer LLMs</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Server: Express + Gemini 3.8 Flash SDK</span>
            <span>•</span>
            <span>Client: React 19 + Tailwind CSS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
