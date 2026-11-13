package handler

import (
	"calculator-app/backend/internal/calculator"
	"encoding/json"
	"errors"
	"io"
	"net/http"
)

const maxBodyBytes = 1 << 20 // 1 MB

type GenericCalculationRequest struct {
	Operation string    `json:"operation"`
	Operands  []float64 `json:"operands"`
}

type OperandsRequest struct {
	Operands []float64 `json:"operands"`
}

type CalculationResponse struct {
	Result *float64 `json:"result,omitempty"`
	Error  string   `json:"error,omitempty"`
}

type Handler struct {
	service calculator.Service
}

func NewHandler(service calculator.Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/calculate", h.handleCalculate)
	mux.HandleFunc("POST /api/calculate/{op}", h.handleSpecificOp)
}

func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (h *Handler) handleSpecificOp(w http.ResponseWriter, r *http.Request) {
	op := r.PathValue("op")

	var req OperandsRequest
	if err := decodeStrictJSON(w, r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, CalculationResponse{Error: err.Error()})
		return
	}

	h.executeAndRespond(w, op, req.Operands)
}

func (h *Handler) handleCalculate(w http.ResponseWriter, r *http.Request) {
	var req GenericCalculationRequest
	if err := decodeStrictJSON(w, r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, CalculationResponse{Error: err.Error()})
		return
	}

	if req.Operation == "" {
		writeJSON(w, http.StatusBadRequest, CalculationResponse{Error: "operation is required"})
		return
	}

	h.executeAndRespond(w, req.Operation, req.Operands)
}

func (h *Handler) executeAndRespond(w http.ResponseWriter, op string, operands []float64) {
	if len(operands) == 0 {
		writeJSON(w, http.StatusBadRequest, CalculationResponse{Error: "at least one operand is required"})
		return
	}

	res, err := h.service.Calculate(op, operands...)
	if err != nil {
		status := http.StatusBadRequest
		if errors.Is(err, calculator.ErrDivisionByZero) ||
			errors.Is(err, calculator.ErrNegativeSquareRoot) ||
			errors.Is(err, calculator.ErrOverflow) {
			status = http.StatusUnprocessableEntity
		}
		writeJSON(w, status, CalculationResponse{Error: err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, CalculationResponse{Result: &res})
}

func decodeStrictJSON(w http.ResponseWriter, r *http.Request, dst any) error {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()

	if err := dec.Decode(dst); err != nil {
		return errors.New("invalid JSON payload")
	}
	// Ensure no trailing data exists after the first JSON object
	if err := dec.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return errors.New("request body must contain only a single JSON object")
	}
	return nil
}

func writeJSON(w http.ResponseWriter, status int, payload CalculationResponse) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}