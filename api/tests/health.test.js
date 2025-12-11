const healthRouter = require("../src/routes/health");

const healthHandler =
  healthRouter.stack.find(
    (layer) => layer.route?.path === "/health" && layer.route?.methods.get
  )?.route.stack[0].handle;

const createMockRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
};

describe("GET /api/health", () => {
  it("returns 200 and service payload", async () => {
    const response = createMockRes();
    await healthHandler({}, response);
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({ ok: true, service: "api" });
  });
});
