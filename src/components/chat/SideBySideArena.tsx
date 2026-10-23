import React, { useState } from 'react';
import { RuleDefinition, ChatMessage } from '../../types';
import { evaluateRule } from '../../utils/ruleEngine';
import { generateLlmChat, estimateTokens } from '../../utils/llmService';
import {
  Send,
  Sparkles,
  GitCompare,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

interface SideBySideArenaProps {
  rules: RuleDefinition[];
  hasGeminiKey: boolean;
}

const PRESET_CHALLENGES = [
  {
    title: '🧠 Memory & Context Test',
    description: 'Tell a personal fact, then ask the bot to recall it.',
    turn1: 'My pet dog is a golden retriever named Rusty.',
    turn2: "What kind of pet do I have and what is its name?",
  },
  {
    title: '🌧️ Synonym & Vocabulary Test',
    description: 'Use words like "precipitation" instead of "weather" or "rain".',
    turn1: 'What is the current atmospheric precipitation outside?',
  },
  {
    title: '⚛️ Reasoning & Explanation',
    description: 'Ask for a dynamic explanation of physics or science.',
    turn1: 'Why does ice float on liquid water?',
  },
  {
    title: '📝 Creative Synthesis',
    description: 'Request a custom poem or code snippet.',
    turn1: 'Write a 3-line haiku about debugging JavaScript.',
  },
];

export const SideBySideArena: React.FC<SideBySideArenaProps> = ({
  rules,
  hasGeminiKey,
}) => {
  const [ruleHistory, setRuleHistory] = useState<ChatMessage[]>([]);
  const [llmHistory, setLlmHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [verdict, setVerdict] = useState<string | null>(
    'Select a preset challenge or type your own question below to witness both engines in real-time.'
  );

  const handleSendBoth = async (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || isLoading) return;

    setInput('');
    setIsLoading(true);

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      engine: 'rule',
      text,
      timestamp: Date.now(),
    };

    // 1. Evaluate Rule-based bot
    const ruleEval = evaluateRule(text, rules);
    const ruleBotMsg: ChatMessage = {
      id: 'bot-rule-' + Date.now(),
      sender: 'bot',
      engine: 'rule',
      text: ruleEval.reply,
      timestamp: Date.now(),
      metadata: {
        matchedKeyword: ruleEval.matchedKeyword,
        isFallback: ruleEval.isFallback,
        elapsedMs: ruleEval.elapsedMs,
      },
    };

    const newRuleHistory = [...ruleHistory, userMsg, ruleBotMsg];
    setRuleHistory(newRuleHistory);

    // 2. Evaluate LLM
    const formattedMessages = [
      ...llmHistory.map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
        content: m.text,
      })),
      { role: 'user' as const, content: text },
    ];

    try {
      const llmRes = await generateLlmChat({
        messages: formattedMessages,
        systemInstruction:
          'You are a knowledgeable AI assistant participating in a side-by-side comparison with a classical rule-based bot. Be concise, precise, and helpful.',
        temperature: 0.7,
        useLiveApi: hasGeminiKey,
      });

      const llmBotMsg: ChatMessage = {
        id: 'bot-llm-' + Date.now(),
        sender: 'bot',
        engine: 'llm',
        text: llmRes.text,
        timestamp: Date.now(),
        metadata: {
          tokensEstimated: llmRes.tokensEstimated,
          elapsedMs: llmRes.elapsedMs,
          isLiveApi: llmRes.isLiveApi,
        },
      };

      setLlmHistory([
        ...llmHistory,
        { ...userMsg, engine: 'llm' },
        llmBotMsg,
      ]);

      // Formulate educational commentary
      if (ruleEval.isFallback) {
        setVerdict(
          `Notice: The rule-based bot failed with a fallback response because no keyword in your sentence matched its dictionary. Meanwhile, the LLM understood your semantic meaning.`
        );
      } else if (text.toLowerCase().includes('what is my') || text.toLowerCase().includes('what kind of pet')) {
        setVerdict(
          `Memory Verdict: The rule bot is stateless—it had no record of your past turns. The LLM maintained your facts in its context window and correctly answered!`
        );
      } else {
        setVerdict(
          `Comparison: The rule bot returned static canned string #${ruleEval.ruleId} in ${ruleEval.elapsedMs}ms. The LLM synthesized dynamic text using probability distributions in ${llmRes.elapsedMs}ms.`
        );
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setRuleHistory([]);
    setLlmHistory([]);
    setVerdict(
      'Arena reset. Send a message to compare both architectures side-by-side.'
    );
  };

  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* Top Banner & Preset Challenges */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-indigo-600" />
              Side-by-Side Dual Engine Arena
            </h2>
            <p className="text-xs text-slate-500">
              Broadcast the exact same prompt to both systems simultaneously to witness the architectural divide.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Arena</span>
          </button>
        </div>

        {/* Challenge chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {PRESET_CHALLENGES.map((ch, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="font-semibold text-xs text-slate-800 mb-0.5">
                  {ch.title}
                </div>
                <div className="text-[11px] text-slate-500 mb-2 leading-tight">
                  {ch.description}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleSendBoth(ch.turn1)}
                  disabled={isLoading}
                  className="text-left text-[11px] px-2 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-indigo-700 font-medium rounded-lg transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span className="truncate">Prompt 1: "{ch.turn1.slice(0, 24)}..."</span>
                  <ArrowRight className="w-3 h-3 shrink-0" />
                </button>
                {ch.turn2 && (
                  <button
                    onClick={() => handleSendBoth(ch.turn2)}
                    disabled={isLoading}
                    className="text-left text-[11px] px-2 py-1 bg-white hover:bg-violet-50 border border-slate-200 hover:border-violet-200 text-violet-700 font-medium rounded-lg transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span className="truncate">Prompt 2 (Follow-up)</span>
                    <ArrowRight className="w-3 h-3 shrink-0" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Verdict Banner */}
      {verdict && (
        <div className="p-3 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-start gap-2 shadow-2xs">
          <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed font-medium">{verdict}</span>
        </div>
      )}

      {/* Arena Split Columns */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[460px]">
        {/* Left Column: Rule-Based Bot */}
        <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3.5 bg-amber-50/70 border-b border-amber-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">⚙️</span>
              <div>
                <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                  Rule-Based Chatbot
                </h3>
                <span className="text-[10px] text-amber-700">
                  Deterministic keyword lookup & Canned strings
                </span>
              </div>
            </div>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-mono px-2 py-0.5 rounded font-medium">
              Stateless
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 max-h-[440px] bg-slate-50/20">
            {ruleHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center text-xl mb-2">
                  ⚙️
                </div>
                <p className="text-xs font-medium text-slate-600">No messages yet</p>
                <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                  Type a prompt or choose a preset test above to observe keyword matching.
                </p>
              </div>
            ) : (
              ruleHistory.map((msg, i) => (
                <div
                  key={msg.id || i}
                  className={`p-3 rounded-xl text-xs space-y-1 ${
                    msg.sender === 'user'
                      ? 'bg-slate-800 text-white ml-6'
                      : 'bg-white border border-slate-200 text-slate-800 mr-6 shadow-2xs'
                  }`}
                >
                  <div className="text-[10px] font-semibold opacity-60">
                    {msg.sender === 'user' ? 'User' : 'Rule Bot Output'}
                  </div>
                  <div className="leading-relaxed whitespace-pre-wrap">{msg.text}</div>
                  {msg.metadata && (
                    <div className="pt-1 border-t border-slate-100 text-[10px] flex items-center gap-2 text-slate-400">
                      {msg.metadata.isFallback ? (
                        <span className="text-rose-600 font-semibold flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Keyword Miss (Fallback)
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Hit: "{msg.metadata.matchedKeyword}"
                        </span>
                      )}
                      {msg.metadata.elapsedMs !== undefined && (
                        <span>{msg.metadata.elapsedMs}ms</span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: LLM */}
        <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3.5 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">✨</span>
              <div>
                <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                  Large Language Model (LLM)
                </h3>
                <span className="text-[10px] text-indigo-700">
                  Transformer Attention & Dynamic Token Sampling
                </span>
              </div>
            </div>
            <span className="text-[10px] bg-indigo-100 text-indigo-800 font-mono px-2 py-0.5 rounded font-medium">
              Context Window
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 max-h-[440px] bg-slate-50/20">
            {llmHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center text-xl mb-2">
                  <Sparkles className="w-6 h-6" />
                </div>
                <p className="text-xs font-medium text-slate-600">No messages yet</p>
                <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                  Type a prompt or choose a preset test above to observe contextual reasoning.
                </p>
              </div>
            ) : (
              llmHistory.map((msg, i) => (
                <div
                  key={msg.id || i}
                  className={`p-3 rounded-xl text-xs space-y-1 ${
                    msg.sender === 'user'
                      ? 'bg-slate-800 text-white ml-6'
                      : 'bg-white border border-slate-200 text-slate-800 mr-6 shadow-2xs'
                  }`}
                >
                  <div className="text-[10px] font-semibold opacity-60">
                    {msg.sender === 'user' ? 'User' : 'LLM Generated Output'}
                  </div>
                  <div className="leading-relaxed whitespace-pre-wrap">{msg.text}</div>
                  {msg.metadata && (
                    <div className="pt-1 border-t border-slate-100 text-[10px] flex items-center gap-2 text-slate-400">
                      <span className="text-indigo-600 font-medium">
                        {msg.metadata.tokensEstimated} tokens
                      </span>
                      {msg.metadata.elapsedMs !== undefined && (
                        <span>{msg.metadata.elapsedMs}ms</span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}

            {isLoading && (
              <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-indigo-700 text-xs flex items-center gap-2 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generating tokens across multi-turn context...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Common Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendBoth();
        }}
        className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter a prompt to test both engines simultaneously..."
          className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 text-white font-medium text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
        >
          <span>Send to Both</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
