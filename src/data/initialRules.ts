import { RuleDefinition } from '../types';

export const INITIAL_RULES: RuleDefinition[] = [
  {
    id: 'rule-greeting',
    name: 'Greeting & Hello',
    category: 'Social',
    keywords: ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon'],
    reply: "Hello there! I am a deterministic rule-based bot. Ask me about weather, jokes, or who I am.",
  },
  {
    id: 'rule-identity',
    name: 'Identity & Architecture',
    category: 'System',
    keywords: ['who are you', 'your name', 'what are you', 'bot identity'],
    reply: "I am a simple rule-based bot. I don't use AI or neural networks; I just test if your message contains words in my dictionary!",
  },
  {
    id: 'rule-weather',
    name: 'Weather Inquiry',
    category: 'Utilities',
    keywords: ['weather', 'temperature', 'rain', 'sunny', 'forecast'],
    reply: "I don't have real-time sensor data connected, but it's always 72°F and sunny in computer memory!",
  },
  {
    id: 'rule-joke',
    name: 'Humor & Jokes',
    category: 'Entertainment',
    keywords: ['joke', 'funny', 'laugh', 'make me laugh'],
    reply: "Why do programmers prefer dark mode? Because light attracts bugs!",
  },
  {
    id: 'rule-food',
    name: 'Food Preference',
    category: 'Lifestyle',
    keywords: ['food', 'pizza', 'ramen', 'burger', 'hungry'],
    reply: "I am programmed to recommend pizza, but as a program I only consume electrical current.",
  },
  {
    id: 'rule-help',
    name: 'Help & Capabilities',
    category: 'System',
    keywords: ['help', 'what can you do', 'commands', 'options'],
    reply: "You can ask me about: hello, who are you, weather, joke, food, or math. Anything else will trigger my fallback response!",
  },
  {
    id: 'rule-math',
    name: 'Math Capability',
    category: 'Logic',
    keywords: ['math', 'calculate', 'sum', 'plus', 'multiply'],
    reply: "I cannot compute arbitrary math expressions dynamically unless an explicit calculator parser was programmed for it!",
  },
  {
    id: 'rule-sentience',
    name: 'Sentience & Feelings',
    category: 'Philosophy',
    keywords: ['alive', 'conscious', 'feel', 'sentient', 'human'],
    reply: "No feelings here! I am just a loop of `if (input.includes(keyword))` statements running on your browser.",
  },
];

export const FALLBACK_REPLY =
  "I am a simple rule-based bot and don't recognize those keywords. Try asking 'hello', 'who are you', or 'joke'.";
