import { useState, useCallback } from 'react';
import { OperationType } from '../types/calculator';
import { ICalculatorClient } from '../api/calculatorApi';

export const useCalculator = (client: ICalculatorClient) => {
  const [displayValue, setDisplayValue] = useState<string>('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<OperationType | null>(null);
  const [resetNext, setResetNext] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleDigit = useCallback(
    (digit: string) => {
      setError(null);
      if (resetNext) {
        setDisplayValue(digit);
        setResetNext(false);
        return;
      }
      setDisplayValue((prev) => (prev === '0' ? digit : prev + digit));
    },
    [resetNext]
  );

  const handleDecimal = useCallback(() => {
    setError(null);
    if (resetNext) {
      setDisplayValue('0.');
      setResetNext(false);
      return;
    }
    setDisplayValue((prev) => (prev.includes('.') ? prev : prev + '.'));
  }, [resetNext]);

  const handleClear = useCallback(() => {
    setDisplayValue('0');
    setPreviousValue(null);
    setOperation(null);
    setResetNext(false);
    setError(null);
  }, []);

  const handleToggleSign = useCallback(() => {
    setError(null);
    setDisplayValue((prev) => {
      if (prev === '0') return prev;
      return prev.startsWith('-') ? prev.slice(1) : '-' + prev;
    });
  }, []);

  const executeUnaryOperation = useCallback(
    async (unaryOp: 'sqrt' | 'percentage') => {
      setError(null);
      const current = Number(displayValue);

      setLoading(true);
      try {
        const operands =
          unaryOp === 'percentage' && previousValue !== null
            ? [previousValue, current]
            : [current];

        const result = await client.calculate(unaryOp, operands);
        setDisplayValue(String(result));
        setResetNext(true);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Calculation error');
      } finally {
        setLoading(false);
      }
    },
    [client, displayValue, previousValue]
  );

  const handleSelectOperation = useCallback(
    async (nextOp: OperationType) => {
      setError(null);
      const current = Number(displayValue);

      if (previousValue !== null && operation && !resetNext) {
        setLoading(true);
        try {
          const result = await client.calculate(operation, [previousValue, current]);
          setPreviousValue(result);
          setDisplayValue(String(result));
          setOperation(nextOp);
          setResetNext(true);
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'Calculation error');
        } finally {
          setLoading(false);
        }
        return;
      }

      setPreviousValue(current);
      setOperation(nextOp);
      setResetNext(true);
    },
    [client, displayValue, operation, previousValue, resetNext]
  );

  const handleEquals = useCallback(async () => {
    if (!operation || previousValue === null) return;

    const current = Number(displayValue);
    setLoading(true);
    setError(null);
    try {
      const result = await client.calculate(operation, [previousValue, current]);
      setDisplayValue(String(result));
      setPreviousValue(null);
      setOperation(null);
      setResetNext(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Calculation error');
    } finally {
      setLoading(false);
    }
  }, [client, displayValue, operation, previousValue]);

  return {
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
  };
};