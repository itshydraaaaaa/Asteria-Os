import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { DEFAULT_THEME, THEMES, THEME_META, THEME_STORAGE_KEY, THEME_INIT_SCRIPT, isTheme, nextTheme, resolveInitialTheme } from '@/lib/theme';

describe('theme registry', () => {
  test('eight pickable themes, asteria-dark first as the default identity', () => {
    expect(DEFAULT_THEME).toBe('asteria-dark');
    expect(THEMES[0]).toBe(DEFAULT_THEME);
    expect(THEMES).toEqual(['asteria-dark', 'asteria-midnight', 'mono', 'mono-light', 'dark', 'light', 'midnight', 'ember']);
    expect(new Set(THEMES).size).toBe(THEMES.length);
    expect(THEME_STORAGE_KEY).toBe('alex-theme');
  });

  test('every theme carries picker metadata: name, blurb, 3 swatch colors', () => {
    for (const t of THEMES) {
      const meta = THEME_META[t];
      expect(meta.name.length, t).toBeGreaterThan(0);
      expect(meta.blurb.length, t).toBeGreaterThan(0);
      expect(meta.swatch).toHaveLength(3);
      for (const c of meta.swatch) expect(c, `${t} swatch`).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  test('isTheme guards arbitrary strings', () => {
    expect(isTheme('asteria-dark')).toBe(true);
    expect(isTheme('dark')).toBe(true);
    expect(isTheme('midnight')).toBe(true);
    expect(isTheme('sepia')).toBe(false);
    expect(isTheme(null)).toBe(false);
  });

  test('resolveInitialTheme honors any valid stored value, else falls back to asteria-dark', () => {
    expect(resolveInitialTheme('ember')).toBe('ember');
    expect(resolveInitialTheme('dark')).toBe('dark');
    expect(resolveInitialTheme(null)).toBe('asteria-dark');
    expect(resolveInitialTheme('garbage')).toBe('asteria-dark');
  });

  test('nextTheme cycles the whole ring', () => {
    const seen: string[] = [];
    let t: (typeof THEMES)[number] = THEMES[0];
    for (let i = 0; i < THEMES.length; i++) {
      seen.push(t);
      t = nextTheme(t);
    }
    expect(seen).toEqual([...THEMES]);
    expect(t).toBe(THEMES[0]); // full circle
  });

  test('the pre-paint init script accepts every registered theme id and falls back to asteria-dark', () => {
    for (const t of THEMES) expect(THEME_INIT_SCRIPT).toContain(t);
    expect(THEME_INIT_SCRIPT).toContain(THEME_STORAGE_KEY);
    expect(THEME_INIT_SCRIPT).toContain(`t="asteria-dark"`);
    expect(THEME_INIT_SCRIPT).not.toContain(`t="dark"`);
  });

  test('globals.css groups the bare :root with asteria-dark', () => {
    const css = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');
    expect(css).toMatch(/:root,\s*\n:root\[data-theme='asteria-dark'\]/);
  });

  test('every registered theme has its own token block in app/globals.css', () => {
    const css = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');
    for (const t of THEMES) expect(css, t).toContain(`data-theme='${t}'`);
  });
});
