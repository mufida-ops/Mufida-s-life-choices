import type { LifeDomain } from '../types/models';

export const DOMAIN_LABEL: Record<LifeDomain, string> = {
  work: 'Work',
  university: 'University',
  creative: 'Creative',
  home: 'Home',
  spiritual: 'Spiritual',
  physical: 'Physical',
  personal: 'Personal',
};

export const DOMAINS: LifeDomain[] = [
  'work',
  'university',
  'creative',
  'home',
  'spiritual',
  'physical',
  'personal',
];

export const CAPTURE_PLACEHOLDERS = [
  "Tell me what's on your mind…",
  'Remember something…',
  'What should I do?',
  'I need to…',
  'Remind me…',
];
