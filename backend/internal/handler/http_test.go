package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"calculator-app/backend/internal/calculator"
	"calculator-app/backend/internal/handler"
)

func TestHandleCalculate(t *testing.T) {
	svc := calculator.NewService()
	h := handler.NewHandler(svc)
	mux := http.NewServeMux()
	h.RegisterRoutes(mux)

	serverHandler := handler.CORSMiddleware(mux)

	tests := []struct {
		name           string
		endpoint       string
		method         string
		body           string
		expectedStatus int
		expectedResult *float64
		expectedError  string
	}{
		{
			name:           "Valid Addition via Generic Endpoint",
			endpoint:       "/api/calculate",
			method:         http.MethodPost,
			body:           `{"operation": "add", "operands": [12.5, 7.5]}`,
			expectedStatus: http.StatusOK,
			expectedResult: floatPtr(20.0),
		},
		{
			name:           "Valid Square Root via Specific Endpoint",
			endpoint:       "/api/calculate/sqrt",
			method:         http.MethodPost,
			body:           `{"operands": [81]}`,
			expectedStatus: http.StatusOK,
			expectedResult: floatPtr(9.0),
		},
		{
			name:           "Valid Exponentiation via Specific Endpoint",
			endpoint:       "/api/calculate/power",
			method:         http.MethodPost,
			body:           `{"operands": [2, 10]}`,
			expectedStatus: http.StatusOK,
			expectedResult: floatPtr(1024.0),
		},
		{
			name:           "Valid Binary Percentage via Specific Endpoint",
			endpoint:       "/api/calculate/percentage",
			method:         http.MethodPost,
			body:           `{"operands": [200, 15]}`,
			expectedStatus: http.StatusOK,
			expectedResult: floatPtr(30.0),
		},
		{
			name:           "Reject Extra Operation Field on Specific Endpoint (DTO Separation)",
			endpoint:       "/api/calculate/add",
			method:         http.MethodPost,
			body:           `{"operation": "subtract", "operands": [10, 5]}`,
			expectedStatus: http.StatusBadRequest,
			expectedError:  "invalid JSON payload",
		},
		{
			name:           "Reject Trailing JSON Tokens",
			endpoint:       "/api/calculate/add",
			method:         http.MethodPost,
			body:           `{"operands": [1, 2]} {"extra": "malicious"}`,
			expectedStatus: http.StatusBadRequest,
			expectedError:  "request body must contain only a single JSON object",
		},
		{
			name:           "Missing Operation on Generic Endpoint",
			endpoint:       "/api/calculate",
			method:         http.MethodPost,
			body:           `{"operands": [10, 5]}`,
			expectedStatus: http.StatusBadRequest,
			expectedError:  "operation is required",
		},
		{
			name:           "Empty Operands Slice",
			endpoint:       "/api/calculate/add",
			method:         http.MethodPost,
			body:           `{"operands": []}`,
			expectedStatus: http.StatusBadRequest,
			expectedError:  "at least one operand is required",
		},
		{
			name:           "Division By Zero Error",
			endpoint:       "/api/calculate/divide",
			method:         http.MethodPost,
			body:           `{"operands": [10, 0]}`,
			expectedStatus: http.StatusUnprocessableEntity,
			expectedError:  calculator.ErrDivisionByZero.Error(),
		},
		{
			name:           "Negative Square Root Error",
			endpoint:       "/api/calculate/sqrt",
			method:         http.MethodPost,
			body:           `{"operands": [-9]}`,
			expectedStatus: http.StatusUnprocessableEntity,
			expectedError:  calculator.ErrNegativeSquareRoot.Error(),
		},
		{
			name:           "Unsupported Operation",
			endpoint:       "/api/calculate/modulo",
			method:         http.MethodPost,
			body:           `{"operands": [10, 3]}`,
			expectedStatus: http.StatusBadRequest,
			expectedError:  calculator.ErrUnknownOperation.Error(),
		},
		{
			name:           "Malformed JSON",
			endpoint:       "/api/calculate",
			method:         http.MethodPost,
			body:           `{"operation": "add", "operands": ["invalid"]}`,
			expectedStatus: http.StatusBadRequest,
			expectedError:  "invalid JSON payload",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(tc.method, tc.endpoint, bytes.NewBufferString(tc.body))
			req.Header.Set("Content-Type", "application/json")
			rec := httptest.NewRecorder()

			serverHandler.ServeHTTP(rec, req)

			if rec.Code != tc.expectedStatus {
				t.Fatalf("expected status %d, got %d (body: %s)", tc.expectedStatus, rec.Code, rec.Body.String())
			}

			var resp handler.CalculationResponse
			if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			if tc.expectedError != "" && resp.Error != tc.expectedError {
				t.Errorf("expected error %q, got %q", tc.expectedError, resp.Error)
			}

			if tc.expectedResult != nil {
				if resp.Result == nil || *resp.Result != *tc.expectedResult {
					t.Errorf("expected result %v, got %v", *tc.expectedResult, resp.Result)
				}
			}
		})
	}
}

func TestCORSPreflightAndMethodNotAllowed(t *testing.T) {
	svc := calculator.NewService()
	h := handler.NewHandler(svc)
	mux := http.NewServeMux()
	h.RegisterRoutes(mux)
	serverHandler := handler.CORSMiddleware(mux)

	t.Run("CORS OPTIONS Preflight Returns 204", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodOptions, "/api/calculate/add", nil)
		rec := httptest.NewRecorder()

		serverHandler.ServeHTTP(rec, req)

		if rec.Code != http.StatusNoContent {
			t.Errorf("expected 204 No Content, got %d", rec.Code)
		}
		if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "*" {
			t.Errorf("expected Access-Control-Allow-Origin '*', got %q", got)
		}
	})

	t.Run("GET Request on POST Route Returns 405", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/calculate", nil)
		rec := httptest.NewRecorder()

		serverHandler.ServeHTTP(rec, req)

		if rec.Code != http.StatusMethodNotAllowed {
			t.Errorf("expected 405 Method Not Allowed, got %d", rec.Code)
		}
	})
}

func floatPtr(v float64) *float64 {
	return &v
}