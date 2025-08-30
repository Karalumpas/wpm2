import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// extends Vitest's expect
expect.extend(matchers);

// cleanup after each test case
afterEach(() => {
  cleanup();
});
