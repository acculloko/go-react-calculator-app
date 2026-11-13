package calculator

import (
	"errors"
	"math"
)

var (
	ErrDivisionByZero     = errors.New("division by zero is not allowed")
	ErrNegativeSquareRoot = errors.New("square root of a negative number is not allowed")
	ErrInvalidOperands    = errors.New("invalid number of operands for operation")
	ErrOverflow           = errors.New("calculation resulted in numeric overflow or NaN")
	ErrUnknownOperation   = errors.New("unsupported operation")
)

// Operation defines the contract for all calculator operations (Interface Segregation / Open-Closed).
type Operation interface {
	Execute(operands ...float64) (float64, error)
}

type AddOperation struct{}

func (a AddOperation) Execute(operands ...float64) (float64, error) {
	if len(operands) != 2 {
		return 0, ErrInvalidOperands
	}
	return operands[0] + operands[1], nil
}

type SubtractOperation struct{}

func (s SubtractOperation) Execute(operands ...float64) (float64, error) {
	if len(operands) != 2 {
		return 0, ErrInvalidOperands
	}
	return operands[0] - operands[1], nil
}

type MultiplyOperation struct{}

func (m MultiplyOperation) Execute(operands ...float64) (float64, error) {
	if len(operands) != 2 {
		return 0, ErrInvalidOperands
	}
	return operands[0] * operands[1], nil
}

type DivideOperation struct{}

func (d DivideOperation) Execute(operands ...float64) (float64, error) {
	if len(operands) != 2 {
		return 0, ErrInvalidOperands
	}
	if operands[1] == 0 {
		return 0, ErrDivisionByZero
	}
	return operands[0] / operands[1], nil
}

type ExponentOperation struct{}

func (e ExponentOperation) Execute(operands ...float64) (float64, error) {
	if len(operands) != 2 {
		return 0, ErrInvalidOperands
	}
	res := math.Pow(operands[0], operands[1])
	if math.IsNaN(res) || math.IsInf(res, 0) {
		return 0, ErrOverflow
	}
	return res, nil
}

type SquareRootOperation struct{}

func (sq SquareRootOperation) Execute(operands ...float64) (float64, error) {
	if len(operands) != 1 {
		return 0, ErrInvalidOperands
	}
	if operands[0] < 0 {
		return 0, ErrNegativeSquareRoot
	}
	return math.Sqrt(operands[0]), nil
}

// PercentageOperation supports unary (a / 100) or binary ((a * b) / 100) evaluation.
type PercentageOperation struct{}

func (p PercentageOperation) Execute(operands ...float64) (float64, error) {
	if len(operands) == 1 {
		return operands[0] / 100.0, nil
	}
	if len(operands) == 2 {
		return (operands[0] * operands[1]) / 100.0, nil
	}
	return 0, ErrInvalidOperands
}