import React, { useState, useRef, useEffect } from 'react';
import {
  ChatMessage,
  EngineType,
  RuleDefinition,
  TelemetryData,
} from '../../types';
import { evaluateRule } from '../../utils/ruleEngine';
import { generateLlmChat, estimateTokens } from '../../utils/llmService';
import { RuleManagerModal } from './RuleManagerModal';
import {
  Send,
  RotateCcw,
  Sparkles,
  Settings2,
  Terminal,
  Cpu,
  Brain,
  Sliders,
  Check,
  Copy,
  Clock,
  Layers,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

interface ChatPlaygroundProps {
  rules: RuleDefinition[];
  onAddRule: (rule: Omit<RuleDefinition, 'id'>) => void;
  onDeleteRule: (id: string) => void;
  onResetRules: () => void;
  hasGeminiKey: boolean;
}

const SYSTEM_PRESETS = [
  {
    name: 'AI Tutor',
    instruction: 'You are an encouraging, concise AI tutor explaining technology concepts simply.',
  },
  {
    name: 'Pirate Captain',
    instruction: 'You are a salty 17th-century pirate captain who speaks in pirate slang and nautical metaphors.',
  },
  {
    name: 'Code Mentor',
    instruction: 'You are a senior software architect providing succinct, production-ready coding guidance.',
  },
  {
    name: 'ELI5 (Explain Like I am 5)',
    instruction: 'Explain everything like the user is 5 years old using relatable childhood analogies.',
  },
];

export const ChatPlayground: React.FC<ChatPlaygroundProps> = ({
  rules,
  onAddRule,
  onDeleteRule,
  onResetRules,
  hasGeminiKey,
}) => {
  const [engine, setEngine] = useState<EngineType>('rule');
  const [useLiveApi, setUseLiveApi] = useState<boolean>(hasGeminiKey);
  const [systemInstruction, setSystemInstruction] = useState<string>(
    'You are a friendly, helpful AI tutor explaining technology concepts simply.'
  );
  const [temperature, setTemperature] = useState<number>(0.7);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Messages per engine so switching preserves tests
  const [ruleMessages, setRuleMessages] = useState<ChatMessage[]>([
    {
      id: 'init-rule',
      sender: 'bot',
      engine: 'rule',
      text: "Hello! I am a classical Rule-Based bot. I match your inputs against pre-defined keywords. Try asking me about 'weather', 'joke', or 'who are you'!",
      timestamp: Date.now(),
      metadata: {
        matchedKeyword: 'init',
        ruleReply: 'Initial greeting',
        elapsedMs: 0.1,
      },
    },
  ]);

  const [llmMessages, setLlmMessages] = useState<ChatMessage[]>([
    {
      id: 'init-llm',
      sender: 'bot',
      engine: 'llm',
      text: "Greetings! I am powered by a Large Language Model (LLM). Unlike a rule-based bot, I process meaning, retain conversational context, and generate new sentences token-by-token.",
      timestamp: Date.now(),
      metadata: {
        tokensEstimated: 35,
        elapsedMs: 320,
        role: 'model',
      },
    },
  ]);

  // Inspector state
  const [inspectorData, setInspectorData] = useState<any>({
    activeEngine: 'rule',
    mode: 'Keyword Pattern Matcher',
    lastEvaluation: {
      type: 'initialization',
      message: 'System ready. Send a message to see how the engine evaluates your text.',
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeMessages = engine === 'rule' ? ruleMessages : llmMessages;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages, isLoading]);

  // Telemetry calculations
  const totalTokens = activeMessages.reduce(
    (acc, m) => acc + (m.metadata?.tokensEstimated || estimateTokens(m.text)),
    0
  );

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleResetChat = () => {
    if (engine === 'rule') {
      setRuleMessages([
        {
          id: 'init-rule-' + Date.now(),
          sender: 'bot',
          engine: 'rule',
          text: "Chat reset. I am a stateless rule-based bot. Ask me about 'weather', 'joke', or 'food'!",
          timestamp: Date.now(),
        },
      ]);
      setInspectorData({
        activeEngine: 'rule',
        mode: 'Reset',
        status: 'Memory cleared. Rule matcher initialized.',
      });
    } else {
      setLlmMessages([
        {
          id: 'init-llm-' + Date.now(),
          sender: 'bot',
          engine: 'llm',
          text: "Context cleared. The LLM's conversation history array has been emptied.",
          timestamp: Date.now(),
        },
      ]);
      setInspectorData({
        activeEngine: 'llm',
        mode: 'Reset',
        systemInstruction,
        messagesPayload: [],
      });
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || isLoading) return;

    setInput('');
    const userMsgId = 'user-' + Date.now();
    const userEstimatedTokens = estimateTokens(text);

    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      engine,
      text,
      timestamp: Date.now(),
      metadata: {
        tokensEstimated: userEstimatedTokens,
        role: 'user',
      },
    };

    if (engine === 'rule') {
      // 1. Process Rule-Based Match
      const newMessages = [...ruleMessages, userMsg];
      setRuleMessages(newMessages);

      const evalResult = evaluateRule(text, rules);

      const botMsg: ChatMessage = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        engine: 'rule',
        text: evalResult.reply,
        timestamp: Date.now(),
        metadata: {
          matchedKeyword: evalResult.matchedKeyword,
          ruleId: evalResult.ruleId || undefined,
          isFallback: evalResult.isFallback,
          elapsedMs: evalResult.elapsedMs,
          tokensEstimated: estimateTokens(evalResult.reply),
        },
      };

      setRuleMessages([...newMessages, botMsg]);

      // Update Inspector for Rule Bot
      setInspectorData({
        activeEngine: 'rule_based',
        rawInput: text,
        normalizedInput: evalResult.normalizedInput,
        evaluationTimeMs: evalResult.elapsedMs,
        scannedRulesCount: evalResult.scannedRulesCount,
        matchedKeyword: evalResult.matchedKeyword,
        isFallback: evalResult.isFallback,
        matchedRuleId: evalResult.ruleId,
        explanation: evalResult.isFallback
          ? 'No keywords found in active dictionary. Triggered canned fallback response.'
          : `Matched keyword "${evalResult.matchedKeyword}". Directly executed canned response.`,
      });
    } else {
      // 2. Process LLM Generation
      const currentHistory = [...llmMessages, userMsg];
      setLlmMessages(currentHistory);
      setIsLoading(true);

      const formattedPayload = currentHistory.map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
        content: m.text,
      }));

      // Update inspector immediately with outgoing payload
      setInspectorData({
        activeEngine: 'llm_transformer',
        status: 'Generating next tokens via attention mechanism...',
        systemInstruction,
        temperature,
        contextWindowTurns: formattedPayload.length,
        messagesPayload: formattedPayload,
      });

      try {
        const response = await generateLlmChat({
          messages: formattedPayload,
          systemInstruction,
          temperature,
          useLiveApi,
        });

        const botMsg: ChatMessage = {
          id: 'bot-' + Date.now(),
          sender: 'bot',
          engine: 'llm',
          text: response.text,
          timestamp: Date.now(),
          metadata: {
            tokensEstimated: response.tokensEstimated,
            elapsedMs: response.elapsedMs,
            isLiveApi: response.isLiveApi,
            role: 'model',
            rawPayload: response.rawPayload,
          },
        };

        setLlmMessages([...currentHistory, botMsg]);

        setInspectorData({
          activeEngine: 'llm_transformer',
          model: response.model,
          isLiveApi: response.isLiveApi,
          latencyMs: response.elapsedMs,
          estimatedTokens: response.tokensEstimated,
          systemInstruction,
          temperature,
          messagesPayload: [
            ...formattedPayload,
            { role: 'model', content: response.text },
          ],
          responseMeta: response.rawPayload,
        });
      } catch (err: any) {
        const errorMsg: ChatMessage = {
          id: 'bot-err-' + Date.now(),
          sender: 'bot',
          engine: 'llm',
          text: 'Error generating response: ' + (err?.message || 'Please try again.'),
          timestamp: Date.now(),
        };
        setLlmMessages([...currentHistory, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6">
      {/* Left Column: Interactive Chat */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden min-h-[600px]">
        {/* Chat Control Bar */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {/* Engine Selector */}
          <div className="flex items-center bg-slate-200/80 p-1 rounded-xl">
            <button
              onClick={() => setEngine('rule')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                engine === 'rule'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ⚙️ Rule-Based Bot
            </button>
            <button
              onClick={() => setEngine('llm')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                engine === 'llm'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ✨ LLM Generator
            </button>
          </div>

          {/* Status badge & Quick Actions */}
          <div className="flex items-center gap-2">
            {engine === 'rule' ? (
              <>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Dictionary Matching ({rules.length} rules)
                </span>
                <button
                  onClick={() => setIsRuleModalOpen(true)}
                  className="px-2.5 py-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium rounded-md hover:bg-indigo-50 border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Edit Rules</span>
                </button>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  {useLiveApi ? 'Gemini 3.8 Flash' : 'Simulated LLM'}
                </span>
                <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={useLiveApi}
                    onChange={(e) => setUseLiveApi(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                  />
                  <span>Live Gemini</span>
                </label>
              </>
            )}

            <button
              onClick={handleResetChat}
              className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
              title="Reset conversation"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Mode Explanation Banner */}
        <div
          className={`px-4 py-2.5 border-b text-xs flex items-start gap-2.5 ${
            engine === 'rule'
              ? 'bg-amber-50/80 border-amber-100 text-amber-900'
              : 'bg-indigo-50/80 border-indigo-100 text-indigo-900'
          }`}
        >
          <div className="font-bold shrink-0 mt-0.5">
            {engine === 'rule' ? '⚙️ Keyword Logic:' : '✨ Transformer Context:'}
          </div>
          <div className="leading-relaxed">
            {engine === 'rule' ? (
              <span>
                Scans input for exact dictionary matches like{' '}
                <code className="bg-amber-100/90 text-amber-800 px-1 py-0.5 rounded font-mono text-[11px]">
                  "weather"
                </code>{' '}
                or{' '}
                <code className="bg-amber-100/90 text-amber-800 px-1 py-0.5 rounded font-mono text-[11px]">
                  "joke"
                </code>
                . It has <strong>no memory</strong> of past turns, cannot handle synonyms (e.g.{' '}
                <em>precipitation</em> fails), and cannot reason.
              </span>
            ) : (
              <span>
                Sends conversation history as a <strong>context window</strong> to the model.
                Tokens are processed through neural attention layers to synthesize new language,
                recall previous statements, and adapt to custom personas.
              </span>
            )}
          </div>
        </div>

        {/* Chat Messages Scroll Container */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-[350px] max-h-[520px] bg-slate-50/30">
          {activeMessages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs text-xs font-bold ${
                    isUser
                      ? 'bg-slate-800 text-white'
                      : msg.engine === 'rule'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white'
                  }`}
                >
                  {isUser ? 'You' : msg.engine === 'rule' ? '⚙️' : <Sparkles className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 space-y-2 relative group shadow-2xs ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                  }`}
                >
                  <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </p>

                  {/* Metadata Tags */}
                  {!isUser && msg.metadata && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                      {msg.metadata.matchedKeyword && (
                        <span
                          className={`px-1.5 py-0.5 rounded font-mono font-medium ${
                            msg.metadata.isFallback
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {msg.metadata.isFallback
                            ? '⚠️ Fallback (No Match)'
                            : `Matched: "${msg.metadata.matchedKeyword}"`}
                        </span>
                      )}

                      {msg.metadata.elapsedMs !== undefined && (
                        <span className="flex items-center gap-0.5 font-mono">
                          <Clock className="w-2.5 h-2.5" />
                          {msg.metadata.elapsedMs}ms
                        </span>
                      )}

                      {msg.metadata.tokensEstimated && (
                        <span className="font-mono">
                          ~{msg.metadata.tokensEstimated} tokens
                        </span>
                      )}

                      {msg.metadata.isLiveApi && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                          Gemini 3.8 Flash
                        </span>
                      )}

                      <button
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-slate-700 cursor-pointer"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 items-center text-xs text-slate-500 italic">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
                <span>Predicting tokens via transformer neural layers...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompt Chips */}
        <div className="px-3 sm:px-4 py-2 bg-slate-50 border-t border-slate-200/80 flex items-center gap-1.5 overflow-x-auto text-xs text-slate-500 whitespace-nowrap">
          <span className="font-medium text-slate-400 shrink-0 text-[11px]">
            Test chips:
          </span>
          <button
            onClick={() => handleSend('Hello! Who are you?')}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-2xs cursor-pointer"
          >
            👋 "Hello! Who are you?"
          </button>
          <button
            onClick={() => handleSend('My favorite food is spicy ramen noodles.')}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-2xs cursor-pointer"
          >
            🍜 "My favorite food is spicy ramen"
          </button>
          <button
            onClick={() => handleSend('What is my favorite food?')}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-2xs cursor-pointer"
          >
            🧠 "What is my favorite food?" (Memory test)
          </button>
          <button
            onClick={() => handleSend('Is there any precipitation today?')}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-2xs cursor-pointer"
          >
            🌧️ "Any precipitation today?" (Synonym test)
          </button>
          <button
            onClick={() => handleSend('What is quantum gravity in simple terms?')}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-2xs cursor-pointer"
          >
            ⚛️ "What is quantum gravity?"
          </button>
        </div>

        {/* Chat Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white border-t border-slate-200 flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              engine === 'rule'
                ? "Type a phrase containing a keyword (e.g. 'hello', 'weather', 'joke')..."
                : 'Type any message or question for the LLM...'
            }
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-medium text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Right Column: Live Diagnostics & Inspector */}
      <div className="w-full lg:w-96 flex flex-col gap-4">
        {/* Live Metrics Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-slate-500" />
              Execution Telemetry
            </h2>
            <span className="text-slate-500 font-mono text-[11px]">
              {activeMessages.length} turns
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] text-slate-500 mb-0.5">Estimated Tokens</div>
              <div className="text-lg font-bold text-indigo-600 font-mono">
                {totalTokens}
              </div>
              <div className="text-[10px] text-slate-400">Total session payload</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] text-slate-500 mb-0.5">Memory State</div>
              <div
                className={`text-xs font-bold font-mono mt-1 ${
                  engine === 'rule' ? 'text-amber-600' : 'text-indigo-600'
                }`}
              >
                {engine === 'rule' ? 'Stateless' : 'Context Window'}
              </div>
              <div className="text-[10px] text-slate-400">
                {engine === 'rule'
                  ? '0 past turns retained'
                  : `${activeMessages.length} turns in payload`}
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Context / Rule Inspector */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex-1 flex flex-col min-h-[260px]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-slate-500" />
              Under The Hood Inspector
            </h2>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                engine === 'rule'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              {engine === 'rule' ? 'Rule Matcher' : 'API Context Payload'}
            </span>
          </div>

          <div className="flex-1 bg-slate-900 rounded-xl p-3 text-slate-200 text-xs font-mono overflow-y-auto max-h-[300px] leading-relaxed relative group">
            <button
              onClick={() =>
                handleCopy(JSON.stringify(inspectorData, null, 2), 'inspector')
              }
              className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Copy JSON payload"
            >
              {copiedId === 'inspector' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            <pre className="text-[11px] text-emerald-400/90 whitespace-pre-wrap break-all">
              {JSON.stringify(inspectorData, null, 2)}
            </pre>
          </div>

          <p className="text-[11px] text-slate-400 mt-2 leading-tight">
            {engine === 'rule'
              ? 'Observe how the rule bot scans for exact keywords in static memory.'
              : 'Observe how the entire conversation array is resent on every prompt.'}
          </p>
        </div>

        {/* System Prompt & Parameter Controls (for LLM mode) */}
        <div
          className={`bg-white rounded-2xl border border-slate-200 p-4 shadow-xs transition-all space-y-3 ${
            engine === 'rule'
              ? 'opacity-40 pointer-events-none select-none'
              : 'opacity-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              System Instruction
            </label>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
              LLM Persona
            </span>
          </div>

          {/* Persona quick buttons */}
          <div className="flex flex-wrap gap-1">
            {SYSTEM_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => setSystemInstruction(p.instruction)}
                className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                  systemInstruction === p.instruction
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          <textarea
            rows={2}
            value={systemInstruction}
            onChange={(e) => setSystemInstruction(e.target.value)}
            className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 font-mono text-slate-700 resize-none"
          />

          {/* Temperature Slider */}
          <div className="pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[11px] font-medium text-slate-600">
                Temperature:{' '}
                <span className="font-mono font-bold text-indigo-600">
                  {temperature.toFixed(2)}
                </span>
              </span>
              <span className="text-[10px] text-slate-400">
                {temperature < 0.4
                  ? 'Deterministic'
                  : temperature > 1.0
                  ? 'Highly Creative'
                  : 'Balanced'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Rule Manager Modal */}
      <RuleManagerModal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        rules={rules}
        onAddRule={onAddRule}
        onDeleteRule={onDeleteRule}
        onResetRules={onResetRules}
      />
    </div>
  );
};
