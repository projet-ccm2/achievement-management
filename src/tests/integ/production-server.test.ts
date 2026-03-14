jest.mock("../../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("../../config/environment", () => ({
  config: {
    nodeEnv: "production",
    port: 3000,
    dbServiceUrl: "http://db.internal",
    notificationHandlerUrl: "http://notify.internal",
  },
}));

describe("Production Server", () => {
  let originalProcessExit: typeof process.exit;
  let originalProcessOn: typeof process.on;
  let mockServer: { close: jest.Mock };
  let mockApp: { listen: jest.Mock };

  beforeEach(() => {
    originalProcessExit = process.exit;
    originalProcessOn = process.on;

    process.exit = jest.fn() as any;
    process.on = jest.fn() as any;

    mockServer = {
      close: jest.fn((callback) => {
        if (callback) callback();
      }),
    };

    mockApp = {
      listen: jest.fn((port, callback) => {
        if (callback) callback();
        return mockServer;
      }),
    };

    jest.doMock("../../app", () => ({
      app: mockApp,
    }));

    jest.clearAllMocks();
  });

  afterEach(() => {
    process.exit = originalProcessExit;
    process.on = originalProcessOn;
    jest.resetModules();
  });

  it("should start server in production environment", () => {
    require("../../index");

    expect(mockApp.listen).toHaveBeenCalledWith(3000, expect.any(Function));
    expect(process.on).toHaveBeenCalledWith("SIGTERM", expect.any(Function));
    expect(process.on).toHaveBeenCalledWith("SIGINT", expect.any(Function));
  });

  it("should handle SIGTERM in production", () => {
    require("../../index");

    const sigtermHandler = (process.on as jest.Mock).mock.calls.find(
      (call) => call[0] === "SIGTERM",
    )?.[1];

    expect(sigtermHandler).toBeDefined();

    if (sigtermHandler) {
      sigtermHandler();
      expect(mockServer.close).toHaveBeenCalled();
      expect(process.exit).toHaveBeenCalledWith(0);
    }
  });

  it("should handle SIGINT in production", () => {
    require("../../index");

    const sigintHandler = (process.on as jest.Mock).mock.calls.find(
      (call) => call[0] === "SIGINT",
    )?.[1];

    expect(sigintHandler).toBeDefined();

    if (sigintHandler) {
      sigintHandler();
      expect(mockServer.close).toHaveBeenCalled();
      expect(process.exit).toHaveBeenCalledWith(0);
    }
  });
});
