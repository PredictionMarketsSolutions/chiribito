/**
 * Jest global setup
 * Configures global mocks for all tests
 */

// Mock global.fetch for all tests
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: async () => ({ success: true }),
  text: async () => "OK",
  headers: new Headers(),
  redirected: false,
  statusText: "OK",
  type: "basic" as ResponseType,
  url: "",
  clone: jest.fn(),
  body: null,
  bodyUsed: false,
  arrayBuffer: jest.fn(),
  blob: jest.fn(),
  formData: jest.fn(),
}) as any;

// Reset mock before each test to keep test isolation
beforeEach(() => {
  (global.fetch as jest.Mock).mockClear();
});
