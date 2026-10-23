export type EngineType = 'rule' | 'llm';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  engine: EngineType;
  text: string;
  timestamp: number;
  metadata?: {
    matchedKeyword?: string | null;
    ruleId?: string;
    isFallback?: boolean;
    ruleReply?: string;
    elapsedMs?: number;
    tokensEstimated?: number;
    role?: 'user' | 'model' | 'system';
    rawPayload?: any;
    confidence?: number;
    isLiveApi?: boolean;
  };
}

export interface RuleDefinition {
  id: string;
  name: string;
  category: string;
  keywords: string[];
  reply: string;
  isCustom?: boolean;
}

export interface TelemetryData {
  totalTokens: number;
  turnsCount: number;
  memoryState: 'Stateless' | 'Stateful (Context Window)';
  lastLatencyMs: number;
  activeEngine: EngineType;
  modelName: string;
  isLiveApi: boolean;
}

export interface TokenCandidate {
  token: string;
  rawProbability: number;
  adjustedProbability: number;
  color: string;
}
