import { describe, afterEach, beforeEach, vi } from 'vitest';

describe('greeter function', () => {

  beforeEach(() => {
    // Read more about fake timers
    // https://vitest.dev/api/vi.html#vi-usefaketimers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

});
