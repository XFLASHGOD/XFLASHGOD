import React, { useState } from 'react';
import { RuleDefinition } from '../../types';
import { X, Plus, Trash2, Key, MessageSquare, BookOpen } from 'lucide-react';

interface RuleManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: RuleDefinition[];
  onAddRule: (rule: Omit<RuleDefinition, 'id'>) => void;
  onDeleteRule: (id: string) => void;
  onResetRules: () => void;
}

export const RuleManagerModal: React.FC<RuleManagerModalProps> = ({
  isOpen,
  onClose,
  rules,
  onAddRule,
  onDeleteRule,
  onResetRules,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Custom');
  const [keywordsStr, setKeywordsStr] = useState('');
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a rule name.');
      return;
    }
    const keywords = keywordsStr
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    if (keywords.length === 0) {
      setError('Please provide at least one keyword (comma-separated).');
      return;
    }
    if (!reply.trim()) {
      setError('Please provide a reply message.');
      return;
    }

    onAddRule({
      name: name.trim(),
      category: category.trim() || 'Custom',
      keywords,
      reply: reply.trim(),
      isCustom: true,
    });

    setName('');
    setKeywordsStr('');
    setReply('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Rule-Based Bot Keyword Dictionary
              </h2>
              <p className="text-xs text-slate-500">
                Deterministic matching list: The engine checks these sequentially.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Rules List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Active Rules ({rules.length})
              </h3>
              <button
                onClick={onResetRules}
                className="text-xs text-slate-500 hover:text-slate-800 underline transition-colors cursor-pointer"
              >
                Restore Defaults
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {rules.map((rule, idx) => (
                <div
                  key={rule.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        #{idx + 1} {rule.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 text-slate-700">
                        {rule.category}
                      </span>
                      {rule.isCustom && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-medium">
                          Custom
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="text-slate-400 text-[11px]">Keywords:</span>
                      {rule.keywords.map((kw) => (
                        <code
                          key={kw}
                          className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60 font-mono text-[11px]"
                        >
                          "{kw}"
                        </code>
                      ))}
                    </div>
                    <div className="text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100">
                      "{rule.reply}"
                    </div>
                  </div>
                  {rules.length > 1 && (
                    <button
                      onClick={() => onDeleteRule(rule.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add New Rule Form */}
          <form onSubmit={handleSubmit} className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-3">
            <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 uppercase tracking-wide">
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              Add Custom Rule
            </h4>

            {error && (
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Rule Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Favorite Sport"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="soccer, football, basketball"
                  value={keywordsStr}
                  onChange={(e) => setKeywordsStr(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Canned Bot Reply
              </label>
              <textarea
                rows={2}
                placeholder="I love watching soccer games on high refresh rate displays!"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Rule to Memory</span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close Dictionary
          </button>
        </div>
      </div>
    </div>
  );
};
