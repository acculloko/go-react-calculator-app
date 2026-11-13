package calculator_test

import (
	"errors"
	"math"
	"testing"

	"calculator-app/backend/internal/calculator"
)

func TestCalculatorService(t *testing.T) {
	svc := calculator.NewService()

	tests := []struct {
		name      string
		op        string
		operands  []float64
		expected  float64
		expectErr error
	}{
		// Happy paths
		{"Addition", "add", []float64{10, 5}, 15, nil},
		{"Subtraction", "subtract", []float64{10, 5}, 5, nil},
		{"Multiplication", "multiply", []float64{10, 5}, 50, nil},
		{"Division", "divide", []float64{10, 5}, 2, nil},
		{"Exponentiation", "power", []float64{2, 3}, 8, nil},
		{"Square Root", "sqrt", []float64{16}, 4, nil},
		{"Percentage Unary", "percentage", []float64{50}, 0.5, nil},
		{"Percentage Binary", "percentage", []float64{200, 15}, 30, nil},

		// Domain errors & overflow
		{"Division By Zero", "divide", []float64{10, 0}, 0, calculator.ErrDivisionByZero},
		{"Negative Square Root", "sqrt", []float64{-4}, 0, calculator.ErrNegativeSquareRoot},
		{"Exponent Overflow", "power", []float64{10, 1000}, 0, calculator.ErrOverflow},
		{"Multiplication Overflow in Service", "multiply", []float64{math.MaxFloat64, 2}, 0, calculator.ErrOverflow},
		{"Unknown Operation", "modulo", []float64{10, 3}, 0, calculator.ErrUnknownOperation},

		// Invalid operand counts per operation
		{"Invalid Operands Add", "add", []float64{10}, 0, calculator.ErrInvalidOperands},
		{"Invalid Operands Subtract", "subtract", []float64{10}, 0, calculator.ErrInvalidOperands},
		{"Invalid Operands Multiply", "multiply", []float64{10}, 0, calculator.ErrInvalidOperands},
		{"Invalid Operands Divide", "divide", []float64{10}, 0, calculator.ErrInvalidOperands},
		{"Invalid Operands Power", "power", []float64{10}, 0, calculator.ErrInvalidOperands},
		{"Invalid Operands Sqrt", "sqrt", []float64{10, 2}, 0, calculator.ErrInvalidOperands},
		{"Invalid Operands Percentage", "percentage", []float64{10, 2, 3}, 0, calculator.ErrInvalidOperands},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			res, err := svc.Calculate(tc.op, tc.operands...)
			if tc.expectErr != nil {
				if !errors.Is(err, tc.expectErr) {
					t.Fatalf("expected error %v, got %v", tc.expectErr, err)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if res != tc.expected {
				t.Errorf("expected %v, got %v", tc.expected, res)
			}
		})
	}
}