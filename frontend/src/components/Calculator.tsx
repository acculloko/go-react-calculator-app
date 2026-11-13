import React from 'react';
import { OperationType } from '../types/calculator';
import { ICalculatorClient, defaultCalculatorClient } from '../api/calculatorApi';
import { useCalculator } from '../hooks/useCalculator';
import './Calculator.css';

interface CalculatorProps {
  client?: ICalculatorClient;
}

const OP_SYMBOLS: Record<OperationType, string> = {
  add: '+',
  subtract: '−',
  multiply: '×',
  divide: '÷',
  power: '^',
  sqrt: '√',
  percentage: '%',
};

export const Calculator: React.FC<CalculatorProps> = ({
  client = defaultCalculatorClient,
}) => {
  const {
    displayValue,
    previousValue,
    operation,
    error,
    loading,
    handleDigit,
    handleDecimal,
    handleClear,
    handleToggleSign,
    executeUnaryOperation,
    handleSelectOperation,
    handleEquals,
  } = useCalculator(client);

  return (
    <main className="calculator-container" aria-label="Calculator">
      <div className="calculator-display" role="region" aria-live="polite">
        <div className="calculator-history" data-testid="history-display">
          {previousValue !== null && operation
            ? `${previousValue} ${OP_SYMBOLS[operation]}`
            : ''}
        </div>
        {error ? (
          <div className="calculator-error" role="alert" data-testid="error-display">
            {error}
          </div>
        ) : (
          <div className="calculator-current" data-testid="main-display">
            {displayValue}
          </div>
        )}
      </div>

      <div className="calculator-keypad">
        {/* Row 1: Clear (2 cols), Percentage, Divide */}
        <button
          className="btn btn-action btn-span-2"
          onClick={handleClear}
          disabled={loading}
          aria-label="Clear"
        >
          AC
        </button>
        <button
          className="btn btn-action"
          onClick={() => executeUnaryOperation('percentage')}
          disabled={loading}
          aria-label="Percentage"
        >
          %
        </button>
        <button
          className="btn btn-operator"
          onClick={() => handleSelectOperation('divide')}
          disabled={loading}
          aria-label="Divide"
        >
          ÷
        </button>

        {/* Row 2: Square Root, Exponentiate, Toggle Sign, Multiply */}
        <button
          className="btn btn-action"
          onClick={() => executeUnaryOperation('sqrt')}
          disabled={loading}
          aria-label="Square Root"
        >
          √
        </button>
        <button
          className="btn btn-action"
          onClick={() => handleSelectOperation('power')}
          disabled={loading}
          aria-label="Exponentiate"
        >
          xʸ
        </button>
        <button
          className="btn btn-action"
          onClick={handleToggleSign}
          disabled={loading}
          aria-label="Toggle Sign"
        >
          ±
        </button>
        <button
          className="btn btn-operator"
          onClick={() => handleSelectOperation('multiply')}
          disabled={loading}
          aria-label="Multiply"
        >
          ×
        </button>

        {/* Row 3: 7, 8, 9, Subtract */}
        {['7', '8', '9'].map((d) => (
          <button
            key={d}
            className="btn"
            onClick={() => handleDigit(d)}
            disabled={loading}
          >
            {d}
          </button>
        ))}
        <button
          className="btn btn-operator"
          onClick={() => handleSelectOperation('subtract')}
          disabled={loading}
          aria-label="Subtract"
        >
          −
        </button>

        {/* Row 4: 4, 5, 6, Add */}
        {['4', '5', '6'].map((d) => (
          <button
            key={d}
            className="btn"
            onClick={() => handleDigit(d)}
            disabled={loading}
          >
            {d}
          </button>
        ))}
        <button
          className="btn btn-operator"
          onClick={() => handleSelectOperation('add')}
          disabled={loading}
          aria-label="Add"
        >
          +
        </button>

        {/* Row 5: 1, 2, 3, Equals (spans 2 rows vertically on the right, or sits on row 6) */}
        {['1', '2', '3'].map((d) => (
          <button
            key={d}
            className="btn"
            onClick={() => handleDigit(d)}
            disabled={loading}
          >
            {d}
          </button>
        ))}
        <button
          className="btn btn-equals btn-row-span-2"
          onClick={handleEquals}
          disabled={loading}
          aria-label="Equals"
        >
          =
        </button>

        {/* Row 6: Wide 0 (2 cols), Decimal (Equals occupies col 4 from Row 5) */}
        <button
          className="btn btn-span-2"
          onClick={() => handleDigit('0')}
          disabled={loading}
        >
          0
        </button>
        <button
          className="btn"
          onClick={handleDecimal}
          disabled={loading}
          aria-label="Decimal"
        >
          .
        </button>
      </div>
    </main>
  );
};