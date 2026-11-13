import { OperationType, CalculationResponse } from '../types/calculator';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/calculate';

export interface ICalculatorClient {
  calculate(operation: OperationType, operands: number[]): Promise<number>;
}

export class HttpCalculatorClient implements ICalculatorClient {
  async calculate(operation: OperationType, operands: number[]): Promise<number> {
    const response = await fetch(`${API_BASE_URL}/${operation}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ operands }),
    });

    const data: CalculationResponse = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error || 'An unexpected calculation error occurred.');
    }

    if (typeof data.result !== 'number') {
      throw new Error('Invalid response received from server.');
    }

    return data.result;
  }
}

export const defaultCalculatorClient = new HttpCalculatorClient();