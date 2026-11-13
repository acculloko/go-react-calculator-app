import { HttpCalculatorClient } from './calculatorApi';

describe('HttpCalculatorClient', () => {
  const client = new HttpCalculatorClient();
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  test('sends POST request with operands and returns numeric result', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 42 }),
    });

    const result = await client.calculate('add', [20, 22]);

    expect(global.fetch).toHaveBeenCalledWith('/api/calculate/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operands: [20, 22] }),
    });
    expect(result).toBe(42);
  });

  test('throws backend error message when response is not ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({ error: 'division by zero is not allowed' }),
    });

    await expect(client.calculate('divide', [10, 0])).rejects.toThrow(
      'division by zero is not allowed'
    );
  });

  test('throws fallback error when response is not ok and error field is missing', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    await expect(client.calculate('multiply', [2, 3])).rejects.toThrow(
      'An unexpected calculation error occurred.'
    );
  });

  test('throws validation error when response result is not a number', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await expect(client.calculate('sqrt', [9])).rejects.toThrow(
      'Invalid response received from server.'
    );
  });
});