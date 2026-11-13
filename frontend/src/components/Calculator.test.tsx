import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { Calculator } from './Calculator';
import { ICalculatorClient } from '../api/calculatorApi';
import { OperationType } from '../types/calculator';

class MockCalculatorClient implements ICalculatorClient {
  async calculate(operation: OperationType, operands: number[]): Promise<number> {
    if (operation === 'divide' && operands[1] === 0) {
      throw new Error('division by zero is not allowed');
    }
    if (operation === 'sqrt' && operands[0] < 0) {
      throw new Error('square root of a negative number is not allowed');
    }
    switch (operation) {
      case 'add':
        return operands[0] + operands[1];
      case 'subtract':
        return operands[0] - operands[1];
      case 'multiply':
        return operands[0] * operands[1];
      case 'divide':
        return operands[0] / operands[1];
      case 'power':
        return Math.pow(operands[0], operands[1]);
      case 'sqrt':
        return Math.sqrt(operands[0]);
      case 'percentage':
        return operands.length === 2
          ? (operands[0] * operands[1]) / 100
          : operands[0] / 100;
    }
  }
}

const clickDigit = (digit: string) => {
  fireEvent.click(screen.getByRole('button', { name: digit }));
};

describe('Calculator Component & useCalculator Integration', () => {
  let mockClient: ICalculatorClient;

  beforeEach(() => {
    mockClient = new MockCalculatorClient();
  });

  test('renders App wrapper with default calculator client', () => {
    render(<App />);
    expect(screen.getByRole('main', { name: 'Calculator' })).toBeInTheDocument();
  });

  test('performs addition, subtraction, multiplication, and division', async () => {
    render(<Calculator client={mockClient} />);

    // 8 + 5 = 13
    clickDigit('8');
    fireEvent.click(screen.getByLabelText('Add'));
    clickDigit('5');
    fireEvent.click(screen.getByLabelText('Equals'));
    await waitFor(() => {
      expect(screen.getByTestId('main-display')).toHaveTextContent('13');
    });

    // 13 - 3 = 10
    fireEvent.click(screen.getByLabelText('Subtract'));
    clickDigit('3');
    fireEvent.click(screen.getByLabelText('Equals'));
    await waitFor(() => {
      expect(screen.getByTestId('main-display')).toHaveTextContent('10');
    });

    // 10 * 4 = 40
    fireEvent.click(screen.getByLabelText('Multiply'));
    clickDigit('4');
    fireEvent.click(screen.getByLabelText('Equals'));
    await waitFor(() => {
      expect(screen.getByTestId('main-display')).toHaveTextContent('40');
    });

    // 40 / 8 = 5
    fireEvent.click(screen.getByLabelText('Divide'));
    clickDigit('8');
    fireEvent.click(screen.getByLabelText('Equals'));
    await waitFor(() => {
      expect(screen.getByTestId('main-display')).toHaveTextContent('5');
    });
  });

  test('performs exponentiation (x^y)', async () => {
    render(<Calculator client={mockClient} />);

    clickDigit('2');
    fireEvent.click(screen.getByLabelText('Exponentiate'));
    clickDigit('3');
    fireEvent.click(screen.getByLabelText('Equals'));

    await waitFor(() => {
      expect(screen.getByTestId('main-display')).toHaveTextContent('8');
    });
  });

  test('executes square root immediately and handles negative square root error', async () => {
    render(<Calculator client={mockClient} />);

    // Pressing Toggle Sign on '0' should keep '0'
    fireEvent.click(screen.getByLabelText('Toggle Sign'));
    expect(screen.getByTestId('main-display')).toHaveTextContent('0');

    clickDigit('9');
    fireEvent.click(screen.getByLabelText('Square Root'));

    await waitFor(() => {
      expect(screen.getByTestId('main-display')).toHaveTextContent('3');
    });

    // Toggle sign to -3 and back to 3, then -3
    fireEvent.click(screen.getByLabelText('Toggle Sign'));
    expect(screen.getByTestId('main-display')).toHaveTextContent('-3');
    fireEvent.click(screen.getByLabelText('Toggle Sign'));
    expect(screen.getByTestId('main-display')).toHaveTextContent('3');
    fireEvent.click(screen.getByLabelText('Toggle Sign'));

    fireEvent.click(screen.getByLabelText('Square Root'));
    await waitFor(() => {
      expect(screen.getByTestId('error-display')).toHaveTextContent(
        'square root of a negative number is not allowed'
      );
    });
  });

  test('supports both unary and binary percentage calculations', async () => {
    render(<Calculator client={mockClient} />);

    // Unary: 50% -> 0.5
    clickDigit('5');
    clickDigit('0');
    fireEvent.click(screen.getByLabelText('Percentage'));

    await waitFor(() => {
      expect(screen.getByTestId('main-display')).toHaveTextContent('0.5');
    });

    fireEvent.click(screen.getByLabelText('Clear'));

    // Binary: 200 + 15% -> 15% of 200 evaluates to 30, then = gives 230
    clickDigit('2');
    clickDigit('0');
    clickDigit('0');
    fireEvent.click(screen.getByLabelText('Add'));
    clickDigit('1');
    clickDigit('5');
    fireEvent.click(screen.getByLabelText('Percentage'));

    await waitFor(() => {
      expect(screen.getByTestId('main-display')).toHaveTextContent('30');
    });

    fireEvent.click(screen.getByLabelText('Equals'));
    await waitFor(() => {
      expect(screen.getByTestId('main-display')).toHaveTextContent('230');
    });
  });

  test('handles chained operations and chained operation errors', async () => {
    render(<Calculator client={mockClient} />);

    // 5 + 5 + 2 = 12
    clickDigit('5');
    fireEvent.click(screen.getByLabelText('Add'));
    clickDigit('5');
    fireEvent.click(screen.getByLabelText('Add'));

    await waitFor(() => {
      expect(screen.getByTestId('main-display')).toHaveTextContent('10');
    });

    clickDigit('2');
    fireEvent.click(screen.getByLabelText('Equals'));

    await waitFor(() => {
      expect(screen.getByTestId('main-display')).toHaveTextContent('12');
    });

    // Chained division by zero: 12 / 0 + -> triggers error during chain
    fireEvent.click(screen.getByLabelText('Divide'));
    clickDigit('0');
    fireEvent.click(screen.getByLabelText('Add'));

    await waitFor(() => {
      expect(screen.getByTestId('error-display')).toHaveTextContent(
        'division by zero is not allowed'
      );
    });
  });

  test('handles decimal inputs, resetNext decimal, and AC clear', async () => {
    render(<Calculator client={mockClient} />);

    // Pressing Equals before selecting an operation does nothing
    fireEvent.click(screen.getByLabelText('Equals'));
    expect(screen.getByTestId('main-display')).toHaveTextContent('0');

    clickDigit('3');
    fireEvent.click(screen.getByLabelText('Decimal'));
    fireEvent.click(screen.getByLabelText('Decimal'));
    clickDigit('1');
    expect(screen.getByTestId('main-display')).toHaveTextContent('3.1');

    // Pressing Decimal immediately after selecting an operator starts '0.'
    fireEvent.click(screen.getByLabelText('Add'));
    fireEvent.click(screen.getByLabelText('Decimal'));
    clickDigit('4');
    expect(screen.getByTestId('main-display')).toHaveTextContent('0.4');

    fireEvent.click(screen.getByLabelText('Clear'));
    expect(screen.getByTestId('main-display')).toHaveTextContent('0');
  });

  test('displays error on division by zero and recovers on next digit press', async () => {
    render(<Calculator client={mockClient} />);

    clickDigit('9');
    fireEvent.click(screen.getByLabelText('Divide'));
    clickDigit('0');
    fireEvent.click(screen.getByLabelText('Equals'));

    await waitFor(() => {
      expect(screen.getByTestId('error-display')).toHaveTextContent(
        'division by zero is not allowed'
      );
    });

    clickDigit('7');
    expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();
    expect(screen.getByTestId('main-display')).toHaveTextContent('7');
  });
});