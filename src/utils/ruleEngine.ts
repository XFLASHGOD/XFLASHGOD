import { RuleDefinition } from '../types';
import { FALLBACK_REPLY } from '../data/initialRules';

export interface RuleEvaluationResult {
  reply: string;
  matchedKeyword: string | null;
  ruleId: string | null;
  isFallback: boolean;
  elapsedMs: number;
  scannedRulesCount: number;
  normalizedInput: string;
}

export function evaluateRule(
  rawInput: string,
  rules: RuleDefinition[]
): RuleEvaluationResult {
  const t0 = performance.now();
  const normalized = rawInput.toLowerCase().trim();

  let scannedCount = 0;

  for (const rule of rules) {
    scannedCount++;
    for (const kw of rule.keywords) {
      const lowerKw = kw.toLowerCase().trim();
      if (normalized.includes(lowerKw)) {
        const elapsed = Math.round((performance.now() - t0) * 100) / 100;
        return {
          reply: rule.reply,
          matchedKeyword: kw,
          ruleId: rule.id,
          isFallback: false,
          elapsedMs: elapsed,
          scannedRulesCount: scannedCount,
          normalizedInput: normalized,
        };
      }
    }
  }

  const elapsed = Math.round((performance.now() - t0) * 100) / 100;
  return {
    reply: FALLBACK_REPLY,
    matchedKeyword: null,
    ruleId: null,
    isFallback: true,
    elapsedMs: elapsed,
    scannedRulesCount: scannedCount,
    normalizedInput: normalized,
  };
}
