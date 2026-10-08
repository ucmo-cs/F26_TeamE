export const MOCK_FORCE_ERROR = false;

/**
 * Simulates network latency (default 350ms, within 300-700ms spec range)
 */
export async function fakeDelay(ms: number = 350): Promise<void> {
  if (MOCK_FORCE_ERROR) {
    throw new Error('Simulated network failure (MOCK_FORCE_ERROR is true)');
  }
  return new Promise((resolve) => setTimeout(resolve, ms));
}
