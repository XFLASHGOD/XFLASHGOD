import React, { useState, useMemo } from 'react';
import {
  Sliders,
  HelpCircle,
  Sparkles,
  Dice5,
  Brain,
  Layers,
  ArrowRight,
  Flame,
  Lightbulb,
  Check,
  RotateCcw,
} from 'lucide-react';

const SAMPLE_TEXTS = [
  'Language models do not read words; they read tokens.',
  'Supercalifragilisticexpialidocious is an unbelievable word.',
  'function calculateArea(radius) { return Math.PI * radius ** 2; }',
  'Prompt engineering: few-shot vs zero-shot prompting 🚀',
];

interface NextTokenScenario {
  prefix: string;
  tokens: { token: string; logit: number; color: string }[];
}

const NEXT_TOKEN_SCENARIOS: NextTokenScenario[] = [
  {
    prefix: 'The quick brown fox jumps over the',
    tokens: [
      { token: ' lazy', logit: 3.8, color: 'bg-indigo-500' },
      { token: ' sleeping', logit: 2.1, color: 'bg-violet-500' },
      { token: ' wooden', logit: 1.4, color: 'bg-emerald-500' },
      { token: ' red', logit: 0.9, color: 'bg-amber-500' },
      { token: ' moon', logit: -0.2, color: 'bg-rose-500' },
    ],
  },
  {
    prefix: 'Artificial intelligence will transform how we',
    tokens: [
      { token: ' work', logit: 3.5, color: 'bg-indigo-500' },
      { token: ' learn', logit: 3.1, color: 'bg-violet-500' },
      { token: ' live', logit: 2.7, color: 'bg-emerald-500' },
      { token: ' communicate', logit: 2.2, color: 'bg-amber-500' },
      { token: ' write', logit: 1.8, color: 'bg-rose-500' },
    ],
  },
  {
    prefix: 'In JavaScript, declaring a variable with const means it cannot be',
    tokens: [
      { token: ' reassigned', logit: 4.2, color: 'bg-indigo-500' },
      { token: ' changed', logit: 2.3, color: 'bg-violet-500' },
      { token: ' deleted', logit: 1.1, color: 'bg-emerald-500' },
      { token: ' hoisted', logit: 0.4, color: 'bg-amber-500' },
      { token: ' overwritten', logit: 0.1, color: 'bg-rose-500' },
    ],
  },
];

// Helper to simulate subword tokenization
function tokenizeSimulated(text: string): string[] {
  if (!text) return [];
  // Split on words, whitespace, and punctuation while preserving delimiters
  const matches = text.match(/[\w]+|[^\s\w]+|\s+/g) || [];
  const tokens: string[] = [];

  for (const part of matches) {
    if (part.length > 7 && /^[a-zA-Z]+$/.test(part)) {
      // Split long words into subwords to demonstrate BPE
      const mid = Math.floor(part.length / 2);
      tokens.push(part.slice(0, mid));
      tokens.push(part.slice(mid));
    } else {
      tokens.push(part);
    }
  }
  return tokens;
}

const TOKEN_COLORS = [
  'bg-indigo-100 text-indigo-900 border-indigo-300',
  'bg-emerald-100 text-emerald-900 border-emerald-300',
  'bg-amber-100 text-amber-900 border-amber-300',
  'bg-violet-100 text-violet-900 border-violet-300',
  'bg-rose-100 text-rose-900 border-rose-300',
  'bg-cyan-100 text-cyan-900 border-cyan-300',
];

export const ConceptLab: React.FC = () => {
  const [activeConcept, setActiveConcept] = useState<
    'tokens' | 'temperature' | 'context' | 'prompts'
  >('tokens');

  // Tokenizer state
  const [inputText, setInputText] = useState(SAMPLE_TEXTS[0]);

  // Temperature & Next-Token state
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [temperature, setTemperature] = useState(0.7);
  const [accumulatedSentence, setAccumulatedSentence] = useState(
    NEXT_TOKEN_SCENARIOS[0].prefix
  );
  const [lastSampled, setLastSampled] = useState<string | null>(null);

  // Context window simulation state
  const [contextTurns, setContextTurns] = useState(4);
  const maxContextCapacity = 16;

  // Token calculation
  const tokenList = useMemo(() => tokenizeSimulated(inputText), [inputText]);
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const charCount = inputText.length;

  // Softmax with temperature calculation
  const currentScenario = NEXT_TOKEN_SCENARIOS[scenarioIdx];
  const tokenProbabilities = useMemo(() => {
    const temp = Math.max(temperature, 0.01);
    // Logits / T
    const expValues = currentScenario.tokens.map((t) =>
      Math.exp(t.logit / temp)
    );
    const sumExp = expValues.reduce((a, b) => a + b, 0);

    return currentScenario.tokens.map((t, idx) => ({
      ...t,
      probability: Math.max(0.001, expValues[idx] / sumExp),
    }));
  }, [currentScenario, temperature]);

  // Sample token based on probability distribution
  const handleSampleToken = () => {
    const rand = Math.random();
    let cumulative = 0;
    let chosen = tokenProbabilities[0].token;

    for (const item of tokenProbabilities) {
      cumulative += item.probability;
      if (rand <= cumulative) {
        chosen = item.token;
        break;
      }
    }

    setLastSampled(chosen);
    setAccumulatedSentence((prev) => prev + chosen);
  };

  const handleResetSentence = () => {
    setAccumulatedSentence(currentScenario.prefix);
    setLastSampled(null);
  };

  return (
    <div className="flex-1 flex flex-col gap-6">
      {/* Concept Tab Switcher */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-2">
        <button
          onClick={() => setActiveConcept('tokens')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeConcept === 'tokens'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>1. Tokenization & Subwords</span>
        </button>

        <button
          onClick={() => setActiveConcept('temperature')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeConcept === 'temperature'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>2. Next-Token Probabilities & Temperature</span>
        </button>

        <button
          onClick={() => setActiveConcept('context')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeConcept === 'context'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>3. Context Window & Memory Limits</span>
        </button>

        <button
          onClick={() => setActiveConcept('prompts')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeConcept === 'prompts'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>4. Prompt Engineering Principles</span>
        </button>
      </div>

      {/* MODULE 1: INTERACTIVE TOKENIZER */}
      {activeConcept === 'tokens' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Interactive Tokenizer Visualizer
              </h2>
              <p className="text-xs text-slate-500">
                Large Language Models do not process characters or whole words directly.
                Text is sliced into <strong>tokens</strong> (subwords, symbols, spaces) via Byte-Pair Encoding.
              </p>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium text-[11px]">Presets:</span>
              {SAMPLE_TEXTS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputText(sample)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-[11px] truncate max-w-xs cursor-pointer"
                >
                  {sample.slice(0, 32)}...
                </button>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type any sentence to see how it splits into tokens..."
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all resize-none"
            />

            {/* Tokenized Output Chips */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="text-[11px] uppercase tracking-wider font-mono text-slate-400 flex items-center justify-between">
                <span>Token Stream ({tokenList.length} tokens)</span>
                <span className="text-[10px] text-slate-500">
                  Spaces denoted by ␣
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950/60 rounded-lg min-h-[70px] items-center">
                {tokenList.map((tok, idx) => {
                  const colorClass = TOKEN_COLORS[idx % TOKEN_COLORS.length];
                  const displayTok = tok.replace(/ /g, '␣');
                  return (
                    <span
                      key={idx}
                      className={`px-2 py-1 rounded-md text-xs font-mono font-medium border shadow-2xs ${colorClass}`}
                      title={`Token #${idx + 1}: "${tok}" (${tok.length} chars)`}
                    >
                      {displayTok}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Telemetry Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <div className="text-[11px] text-slate-500">Characters</div>
                <div className="text-base sm:text-lg font-bold text-slate-800 font-mono">
                  {charCount}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <div className="text-[11px] text-slate-500">Words</div>
                <div className="text-base sm:text-lg font-bold text-slate-800 font-mono">
                  {wordCount}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-center">
                <div className="text-[11px] text-indigo-700 font-medium">Tokens</div>
                <div className="text-base sm:text-lg font-bold text-indigo-700 font-mono">
                  {tokenList.length}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <div className="text-[11px] text-slate-500">Ratio (Chars/Token)</div>
                <div className="text-base sm:text-lg font-bold text-slate-800 font-mono">
                  {tokenList.length ? (charCount / tokenList.length).toFixed(1) : 0}
                </div>
              </div>
            </div>

            {/* Educational Insight Card */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-1.5 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                Why Subwords? The BPE (Byte-Pair Encoding) Advantage
              </div>
              <p>
                If a model used entire words in its dictionary, it would need billions of words to cover every typo, conjugate, and compound word.
                If it used characters, sequences would be too long for attention.
                Subwords hit the sweet spot: common words are 1 token (e.g.{' '}
                <code className="bg-white px-1 py-0.5 rounded font-mono">"apple"</code>), while rare words split naturally (e.g.{' '}
                <code className="bg-white px-1 py-0.5 rounded font-mono">"un"</code> +{' '}
                <code className="bg-white px-1 py-0.5 rounded font-mono">"believable"</code>).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 2: NEXT-TOKEN PROBABILITY & TEMPERATURE */}
      {activeConcept === 'temperature' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  Next-Token Probabilities & Temperature Slider
                </h2>
                <p className="text-xs text-slate-500">
                  LLMs calculate logits (raw scores) for every word in their dictionary, then apply Softmax with a Temperature divider.
                </p>
              </div>

              {/* Scenario Picker */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                {NEXT_TOKEN_SCENARIOS.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setScenarioIdx(idx);
                      setAccumulatedSentence(s.prefix);
                      setLastSampled(null);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      scenarioIdx === idx
                        ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Prompt {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Accumulated Sentence View */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 space-y-2">
              <div className="text-[10px] uppercase tracking-wider font-mono text-slate-400 flex items-center justify-between">
                <span>Active Generation Context</span>
                {lastSampled && (
                  <span className="text-emerald-400 font-mono">
                    Last sampled: "{lastSampled}"
                  </span>
                )}
              </div>
              <div className="text-sm sm:text-base font-mono text-white leading-relaxed">
                <span>{accumulatedSentence}</span>
                <span className="inline-block w-2 h-4 bg-indigo-500 animate-pulse ml-1 align-middle"></span>
              </div>
            </div>

            {/* Temperature Slider */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-800">
                    Sampling Temperature (T):{' '}
                    <span className="font-mono text-indigo-600 text-sm">
                      {temperature.toFixed(2)}
                    </span>
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {temperature < 0.3
                    ? '🎯 Greedy / Deterministic (Argmax)'
                    : temperature > 1.2
                    ? '🎨 High Entropy / Creative / Hallucinatory'
                    : '⚖️ Standard Natural Balance'}
                </span>
              </div>

              <input
                type="range"
                min="0.05"
                max="2.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[11px] text-slate-400">
                <span>T=0.1 (Exact, repetitive)</span>
                <span>T=0.7 (Standard default)</span>
                <span>T=2.0 (High randomness)</span>
              </div>
            </div>

            {/* Probability Distribution Bar Chart */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Predicted Next Token Candidates (Softmax Distribution)
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  Formula: P(token) = exp(logit / T) / Σ
                </span>
              </div>

              <div className="space-y-2">
                {tokenProbabilities.map((item, idx) => {
                  const pct = (item.probability * 100).toFixed(1);
                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          "{item.token}"
                        </span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-400 text-[11px]">
                            logit: {item.logit}
                          </span>
                          <span className="font-bold text-indigo-600 w-12 text-right">
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} transition-all duration-300 rounded-full`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={handleSampleToken}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Dice5 className="w-4 h-4" />
                <span>Roll / Sample Next Token</span>
              </button>

              <button
                onClick={handleResetSentence}
                className="px-3.5 py-2 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Prefix</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 3: CONTEXT WINDOW SIMULATOR */}
      {activeConcept === 'context' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-600" />
                Context Window & Memory Simulator
              </h2>
              <p className="text-xs text-slate-500">
                Unlike human long-term memory, an LLM only knows what fits in its current context buffer.
                Watch how multi-turn conversation payloads fill memory.
              </p>
            </div>

            {/* Visual Context Capacity Bar */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Active Context Capacity: {contextTurns} / {maxContextCapacity} Turns</span>
                <span className="font-mono text-indigo-600">
                  {Math.round((contextTurns / maxContextCapacity) * 100)}% Utilized
                </span>
              </div>

              <div className="h-6 w-full bg-slate-200 rounded-xl overflow-hidden flex shadow-inner">
                {/* System instruction chunk */}
                <div
                  style={{ width: '15%' }}
                  className="bg-indigo-600 h-full flex items-center justify-center text-[10px] text-white font-mono font-bold"
                  title="System Prompt: ~15% of buffer"
                >
                  System
                </div>
                {/* Dialogue turns */}
                {Array.from({ length: contextTurns }).map((_, i) => (
                  <div
                    key={i}
                    style={{ width: `${(85 / maxContextCapacity)}%` }}
                    className={`h-full border-r border-white/20 flex items-center justify-center text-[9px] text-white font-mono ${
                      i % 2 === 0 ? 'bg-violet-500' : 'bg-emerald-500'
                    }`}
                    title={`Turn #${i + 1}`}
                  >
                    T{i + 1}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-indigo-600"></span>
                  <span>System Instruction</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-violet-500"></span>
                  <span>User Queries</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500"></span>
                  <span>Model Answers</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-slate-200"></span>
                  <span>Remaining Available Tokens</span>
                </div>
              </div>
            </div>

            {/* Control buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setContextTurns((prev) => Math.min(prev + 1, maxContextCapacity))}
                disabled={contextTurns >= maxContextCapacity}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                + Add Conversation Turn
              </button>
              <button
                onClick={() => setContextTurns((prev) => Math.max(prev - 1, 1))}
                disabled={contextTurns <= 1}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                - Remove Oldest Turn (Sliding Window)
              </button>
              <button
                onClick={() => setContextTurns(2)}
                className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 underline transition-colors cursor-pointer ml-auto"
              >
                Reset
              </button>
            </div>

            {/* Explanation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-indigo-600" />
                  What happens when context fills up?
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  In a long conversation, older turns must be evicted (FIFO sliding window) or summarized.
                  If the user mentioned their name in turn 1, and the window slides past turn 1, the LLM will genuinely "forget" it because it is no longer present in the input token tensor!
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-600" />
                  Token Cost Compounds
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  Notice that in turn 10, you re-send all 9 preceding turns! This is why chat apps consume quadratically more tokens over time unless summarized or stored with vector databases (RAG).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 4: PROMPT ENGINEERING PRINCIPLES */}
      {activeConcept === 'prompts' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                Prompt Engineering: Techniques & Patterns
              </h2>
              <p className="text-xs text-slate-500">
                How we frame the text controls the statistical trajectory of the LLM's transformer attention layers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Zero-Shot */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 uppercase tracking-wide">
                    Pattern 1
                  </span>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Zero-Shot Prompting
                  </h3>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Giving the task directly with no examples. The model relies entirely on its pre-trained semantic priors.
                  </p>
                  <div className="p-2.5 rounded-lg bg-slate-900 font-mono text-[11px] text-slate-300">
                    "Classify sentiment of: 'The package arrived 3 days late.' Return POSITIVE or NEGATIVE."
                  </div>
                </div>
                <div className="text-[10px] text-slate-500">
                  Best for: Standard everyday tasks with clear vocabulary.
                </div>
              </div>

              {/* Few-Shot */}
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wide">
                    Pattern 2
                  </span>
                  <h3 className="font-bold text-indigo-950 text-xs sm:text-sm">
                    Few-Shot In-Context Learning
                  </h3>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Providing 2-3 input/output examples within the prompt to establish exact desired syntax and domain tone.
                  </p>
                  <div className="p-2.5 rounded-lg bg-slate-900 font-mono text-[11px] text-indigo-300">
                    "Input: Great battery life -&gt; Tag: #battery<br />
                    Input: Screen flickers -&gt; Tag: #display<br />
                    Input: Lost connection -&gt; Tag:"
                  </div>
                </div>
                <div className="text-[10px] text-indigo-700 font-medium">
                  Best for: Custom JSON output, specialized formatting, unusual tags.
                </div>
              </div>

              {/* Chain of Thought */}
              <div className="p-4 rounded-xl border border-violet-200 bg-violet-50/40 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-100 text-violet-700 uppercase tracking-wide">
                    Pattern 3
                  </span>
                  <h3 className="font-bold text-violet-950 text-xs sm:text-sm">
                    Chain of Thought (CoT)
                  </h3>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Instructing the model to "think step by step". This forces the model to emit reasoning tokens before the final answer.
                  </p>
                  <div className="p-2.5 rounded-lg bg-slate-900 font-mono text-[11px] text-violet-300">
                    "Roger has 5 tennis balls. He buys 2 cans of 3 balls each. Think step-by-step before answering."
                  </div>
                </div>
                <div className="text-[10px] text-violet-700 font-medium">
                  Best for: Math, logic puzzles, multi-step debugging, and code analysis.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
