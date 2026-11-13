export type OperationType =
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'divide'
  | 'power'
  | 'sqrt'
  | 'percentage';

export interface CalculationRequest {
  operation: OperationType;
  operands: number[];
}

export interface CalculationResponse {
  result?: number;
  error?: string;
}