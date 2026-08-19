import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('filters falsy values', () => {
    expect(cn('foo', undefined, null, false, 'bar')).toBe('foo bar');
  });

  it('merges tailwind classes (later wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles conditional objects', () => {
    expect(cn({ foo: true, bar: false })).toBe('foo');
  });
});
