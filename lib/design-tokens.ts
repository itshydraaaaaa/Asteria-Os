export const COLOR_TOKENS = {
  accent: {
    50: '#ecfeff',
    100: '#cffaff',
    500: '#06b6d4',
    900: '#164e63',
  },
  surface: {
    0: '#070a12',
    1: '#0d121e',
    2: '#131a2a',
    3: '#1a2338',
  },
  ok: {
    100: '#d1fae5',
    500: '#10b981',
    900: '#064e3b',
  },
  warn: {
    100: '#fef3c7',
    500: '#f59e0b',
    900: '#78350f',
  },
  error: {
    100: '#fee2e2',
    500: '#ef4444',
    900: '#7f1d1d',
  },
} as const;

export const MOTION_TOKENS = {
  easeStandard: 'cubic-bezier(0.22, 1, 0.36, 1)',
  easeSnap: 'cubic-bezier(0.4, 0, 0.2, 1)',
  durationFast: '120ms',
  durationBase: '220ms',
  durationSlow: '400ms',
} as const;
