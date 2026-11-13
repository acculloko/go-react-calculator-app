package calculator

import "math"

type Service interface {
	Calculate(opName string, operands ...float64) (float64, error)
}

type calculatorService struct {
	operations map[string]Operation
}

func NewService() Service {
	return &calculatorService{
		operations: map[string]Operation{
			"add":        AddOperation{},
			"subtract":   SubtractOperation{},
			"multiply":   MultiplyOperation{},
			"divide":     DivideOperation{},
			"power":      ExponentOperation{},
			"sqrt":       SquareRootOperation{},
			"percentage": PercentageOperation{},
		},
	}
}

func (s *calculatorService) Calculate(opName string, operands ...float64) (float64, error) {
	op, exists := s.operations[opName]
	if !exists {
		return 0, ErrUnknownOperation
	}

	result, err := op.Execute(operands...)
	if err != nil {
		return 0, err
	}

	if math.IsNaN(result) || math.IsInf(result, 0) {
		return 0, ErrOverflow
	}

	return result, nil
}