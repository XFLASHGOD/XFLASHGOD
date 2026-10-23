import React, { useState } from 'react';
import { Copy, Check, Terminal, Play, BookOpen, Layers, CheckCircle2, AlertTriangle } from 'lucide-react';
import { evaluateRule } from '../../utils/ruleEngine';
import { INITIAL_RULES } from '../../data/initialRules';

export const CodeComparison: React.FC = () => {
  const [activeCodeTab, setActiveCodeTab] = useState<'rule' | 'llm' | 'matrix'>('rule');
  const [copied, setCopied] = useState<string | null>(null);

  // Scratchpad test input for rule bot
  const [scratchInput, setScratchInput] = useState('Is it raining outside?');
  const [scratchOutput, setScratchOutput] = useState<any>(null);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRunScratch = () => {
    const res = evaluateRule(scratchInput, INITIAL_RULES);
    setScratchOutput(res);
  };

  const ruleCode = `/**
 * RULE-BASED CHATBOT ARCHITECTURE
 * --------------------------------
 * How it works:
 * 1. Preprocesses user text (lowercase, strip punctuation).
 * 2. Scans against a pre-defined dictionary of keyword rules.
 * 3. Returns the first matching canned answer or a default fallback.
 * 
 * Major Limitations:
 * - Zero conversation memory (stateless across turns).
 * - Fails if the user uses a synonym not in the dictionary.
 * - Cannot reason, generalize, or synthesize new ideas.
 */

// 1. Static Keyword Dictionary (Rule-set)
const RULES = [
  {
    name: "Greetings",
    keywords: ["hello", "hi", "hey", "greetings"],
    reply: "Hello there! I am a rule-based bot. Ask me about weather or jokes."
  },
  {
    name: "Identity",
    keywords: ["who are you", "your name", "what are you"],
    reply: "I am a simple deterministic bot running JavaScript keyword lookups."
  },
  {
    name: "Weather",
    keywords: ["weather", "temperature", "rain"],
    reply: "I don't have sensor data, but it's always sunny in memory!"
  },
  {
    name: "Humor",
    keywords: ["joke", "funny"],
    reply: "Why do programmers prefer dark mode? Because light attracts bugs!"
  }
];

const FALLBACK_RESPONSE = "I am a simple rule-based bot and don't recognize those keywords.";

// 2. Evaluation Engine
function getRuleBasedResponse(userInput) {
  // Step A: Normalize input string
  const cleanInput = userInput.toLowerCase().trim();

  // Step B: Iterate sequentially over dictionary rules
  for (const rule of RULES) {
    for (const kw of rule.keywords) {
      if (cleanInput.includes(kw)) {
        // Keyword hit! Return static canned string immediately
        return {
          reply: rule.reply,
          matchedKeyword: kw,
          ruleName: rule.name,
          type: "rule_match"
        };
      }
    }
  }

  // Step C: Fallback when no keywords match
  return {
    reply: FALLBACK_RESPONSE,
    matchedKeyword: null,
    type: "fallback"
  };
}`;

  const llmCode = `/**
 * LARGE LANGUAGE MODEL (LLM) CLIENT ARCHITECTURE
 * -----------------------------------------------
 * How it works:
 * 1. Manages a "messages" array containing conversation history.
 * 2. Injects a "systemInstruction" defining persona and behavioral guardrails.
 * 3. Dispatches structured context to an LLM endpoint (@google/genai SDK).
 * 4. Model computes probability distributions over tokens and predicts next words.
 * 
 * Key Concepts:
 * - Context Window: The model only remembers turns included in the messages payload!
 * - Tokens: Words/subwords consumed and produced; pricing and limits are token-based.
 * - Temperature: Randomness control (0.0 = deterministic/focused, 1.0 = creative/variable).
 */

import { GoogleGenAI } from "@google/genai";

// 1. Initialize client on backend server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: { "User-Agent": "aistudio-build" }
  }
});

// 2. Stateful Conversation Session Manager
class ChatbotSession {
  constructor(systemInstruction) {
    this.systemInstruction = systemInstruction || 
      "You are a friendly, concise AI tutor explaining technology concepts simply.";
    
    // Conversation history: LLMs are naturally stateless HTTP APIs.
    // To create a dialogue, your application MUST store and resend past turns!
    this.messages = [];
  }

  async sendMessage(userText, temperature = 0.7) {
    // A. Append user prompt to ongoing context history
    this.messages.push({
      role: "user",
      parts: [{ text: userText }]
    });

    try {
      // B. Call Gemini with full context window & system prompt
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: this.messages,
        config: {
          systemInstruction: this.systemInstruction,
          temperature: temperature, // 0.0 (exact) to 1.5 (creative)
        }
      });

      const modelReply = response.text;

      // C. Save model's reply into history so subsequent turns have memory
      this.messages.push({
        role: "model",
        parts: [{ text: modelReply }]
      });

      return {
        reply: modelReply,
        usage: response.usageMetadata, // Token telemetry
        historyLength: this.messages.length
      };
    } catch (error) {
      console.error("LLM Generation error:", error);
      throw error;
    }
  }
}`;

  return (
    <div className="flex-1 flex flex-col gap-6">
      {/* Subtab Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveCodeTab('rule')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeCodeTab === 'rule'
                ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>1. Rule-Based Bot</span>
            <code className="text-[11px] font-mono bg-amber-200/50 px-1.5 py-0.5 rounded text-amber-900">
              rule_bot.js
            </code>
          </button>

          <button
            onClick={() => setActiveCodeTab('llm')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeCodeTab === 'llm'
                ? 'bg-indigo-100 text-indigo-900 border border-indigo-300 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>2. LLM Client Integration</span>
            <code className="text-[11px] font-mono bg-indigo-200/50 px-1.5 py-0.5 rounded text-indigo-900">
              llm_client.js
            </code>
          </button>

          <button
            onClick={() => setActiveCodeTab('matrix')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeCodeTab === 'matrix'
                ? 'bg-violet-100 text-violet-900 border border-violet-300 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-violet-700" />
            <span>3. Architecture Comparison Matrix</span>
          </button>
        </div>

        <span className="text-xs text-slate-500 hidden sm:block">
          Complete, documented architectural implementations
        </span>
      </div>

      {/* Code Display: Rule Bot */}
      {activeCodeTab === 'rule' && (
        <div className="space-y-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-md p-4 sm:p-5 text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed relative">
            <div className="flex justify-between items-center pb-3 mb-3 border-b border-slate-800 text-slate-400 text-xs">
              <span className="font-semibold text-slate-200">
                // rule_based_bot.js — Classical deterministic keyword matching
              </span>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-[11px] bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                  Classical NLP Logic
                </span>
                <button
                  onClick={() => handleCopy(ruleCode, 'rule')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copied === 'rule' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Copy</span>
                </button>
              </div>
            </div>

            <pre className="text-emerald-400/90 whitespace-pre">
              <code>{ruleCode}</code>
            </pre>
          </div>

          {/* Interactive Scratchpad */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Play className="w-3.5 h-3.5 text-amber-600" />
                Live Rule Engine Sandbox
              </h3>
              <span className="text-[11px] text-slate-400">
                Execute the function directly with your own inputs
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={scratchInput}
                onChange={(e) => setScratchInput(e.target.value)}
                placeholder="Type an input to evaluate..."
                className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                onClick={handleRunScratch}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Run getRuleBasedResponse()</span>
              </button>
            </div>

            {scratchOutput && (
              <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto space-y-1">
                <div className="text-[11px] text-slate-400">// Returned Object:</div>
                <pre className="text-amber-300">
                  {JSON.stringify(scratchOutput, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Code Display: LLM Client */}
      {activeCodeTab === 'llm' && (
        <div className="space-y-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-md p-4 sm:p-5 text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed relative">
            <div className="flex justify-between items-center pb-3 mb-3 border-b border-slate-800 text-slate-400 text-xs">
              <span className="font-semibold text-slate-200">
                // llm_client.js — Modern Large Language Model API Connection
              </span>
              <div className="flex items-center gap-2">
                <span className="text-indigo-400 text-[11px] bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/50">
                  Generative AI Architecture
                </span>
                <button
                  onClick={() => handleCopy(llmCode, 'llm')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copied === 'llm' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Copy</span>
                </button>
              </div>
            </div>

            <pre className="text-indigo-300 whitespace-pre">
              <code>{llmCode}</code>
            </pre>
          </div>

          {/* Architectural Notes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Context Window Storage
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Notice that LLMs do NOT inherently have state on the server. Your code must store the array of messages and send it back on every turn.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                System Instruction Persona
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                A top-level system instruction steers formatting, safety guardrails, tone, and knowledge boundaries across all conversational turns.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Token Consumption
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                As the dialogue grows longer, every turn sends more tokens. Eventually, old turns must be pruned or summarized to stay within context limits.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Matrix Table */}
      {activeCodeTab === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Rule-Based vs. Large Language Model (LLM) Feature Matrix
            </h2>
            <p className="text-xs text-slate-500">
              A comprehensive breakdown of system trade-offs, capabilities, and failure modes.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="p-3.5 font-bold">Dimension</th>
                  <th className="p-3.5 font-bold text-amber-800 bg-amber-50/60">
                    ⚙️ Rule-Based Chatbot
                  </th>
                  <th className="p-3.5 font-bold text-indigo-800 bg-indigo-50/60">
                    ✨ Large Language Model (LLM)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-3.5 font-semibold text-slate-900 bg-slate-50/40">
                    Core Mechanism
                  </td>
                  <td className="p-3.5 text-slate-700 bg-amber-50/10">
                    Deterministic substring matching (<code className="font-mono text-[11px]">input.includes(kw)</code>) against static dictionary.
                  </td>
                  <td className="p-3.5 text-slate-700 bg-indigo-50/10">
                    Deep transformer neural network calculating probability distributions over tokens.
                  </td>
                </tr>

                <tr>
                  <td className="p-3.5 font-semibold text-slate-900 bg-slate-50/40">
                    Conversational Memory
                  </td>
                  <td className="p-3.5 text-slate-700 bg-amber-50/10">
                    <strong>Zero memory by default.</strong> Completely stateless; cannot reference facts stated in previous turns.
                  </td>
                  <td className="p-3.5 text-slate-700 bg-indigo-50/10">
                    <strong>Full multi-turn recall</strong> as long as history fits within the input context window.
                  </td>
                </tr>

                <tr>
                  <td className="p-3.5 font-semibold text-slate-900 bg-slate-50/40">
                    Vocabulary & Synonyms
                  </td>
                  <td className="p-3.5 text-slate-700 bg-amber-50/10">
                    Brittle. If user says "precipitation" and rule only has "rain", it fails to fallback.
                  </td>
                  <td className="p-3.5 text-slate-700 bg-indigo-50/10">
                    Semantic embeddings map synonyms, colloquialisms, typos, and 100+ languages effortlessly.
                  </td>
                </tr>

                <tr>
                  <td className="p-3.5 font-semibold text-slate-900 bg-slate-50/40">
                    Determinism & Reliability
                  </td>
                  <td className="p-3.5 text-slate-700 bg-amber-50/10">
                    100% deterministic. The exact same input will always return the exact same canned string.
                  </td>
                  <td className="p-3.5 text-slate-700 bg-indigo-50/10">
                    Probabilistic. Can introduce variations unless temperature = 0.0 with seed pinning.
                  </td>
                </tr>

                <tr>
                  <td className="p-3.5 font-semibold text-slate-900 bg-slate-50/40">
                    Hallucination Risk
                  </td>
                  <td className="p-3.5 text-slate-700 bg-amber-50/10">
                    <strong>Zero hallucination.</strong> Only says strings written by the developer.
                  </td>
                  <td className="p-3.5 text-slate-700 bg-indigo-50/10">
                    <strong>Possible.</strong> May generate plausible-sounding falsehoods if ungrounded.
                  </td>
                </tr>

                <tr>
                  <td className="p-3.5 font-semibold text-slate-900 bg-slate-50/40">
                    Latency & Compute
                  </td>
                  <td className="p-3.5 text-slate-700 bg-amber-50/10">
                    Ultra-fast (~0.1ms). Negligible CPU, zero GPU, runs entirely in client browser memory.
                  </td>
                  <td className="p-3.5 text-slate-700 bg-indigo-50/10">
                    Moderate (~150ms - 800ms). Requires cloud GPU clusters or specialized neural accelerators.
                  </td>
                </tr>

                <tr>
                  <td className="p-3.5 font-semibold text-slate-900 bg-slate-50/40">
                    Authoring & Scaling
                  </td>
                  <td className="p-3.5 text-slate-700 bg-amber-50/10">
                    Hard to scale: Adding 1,000 rules leads to combinatorial conflicts and maintenance nightmare.
                  </td>
                  <td className="p-3.5 text-slate-700 bg-indigo-50/10">
                    Natural scaling: One prompt or RAG pipeline handles millions of unstructured inquiries.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
