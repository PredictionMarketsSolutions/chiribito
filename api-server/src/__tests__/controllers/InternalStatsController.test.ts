import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import type { Request, Response } from "express";
import { InternalStatsController } from "../../controllers/InternalStatsController";
import { AppDataSource } from "../../config/database";

jest.mock("../../config/database");
jest.mock("../../config/logger", () => ({
  __esModule: true,
  default: { warn: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn() }
}));

describe("InternalStatsController", () => {
  let controller: InternalStatsController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.INTERNAL_API_SECRET = "test-secret";

    controller = new InternalStatsController(null as any);

    req = {
      body: {},
      header: jest.fn().mockReturnValue("") as any,
    };

    res = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };

    (AppDataSource.transaction as unknown as jest.Mock).mockImplementation(async (cb: any) => {
      const manager = {
        createQueryBuilder: () => ({
          update: () => ({
            set: () => ({
              whereInIds: () => ({ execute: jest.fn().mockResolvedValue(undefined) }),
              where: () => ({ execute: jest.fn().mockResolvedValue(undefined) }),
            }),
          }),
        }),
      };
      return cb(manager);
    });
  });

  it("rejects when internal secret is missing/invalid", async () => {
    (req.header as jest.Mock).mockReturnValue("wrong");
    await controller.gameEnded(req as Request, res as Response);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("rejects invalid payload", async () => {
    (req.header as jest.Mock).mockReturnValue("test-secret");
    req.body = { championUserId: "x", participantUserIds: [] } as any;
    await controller.gameEnded(req as Request, res as Response);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("updates stats and returns ok for valid payload", async () => {
    (req.header as jest.Mock).mockReturnValue("test-secret");
    req.body = { championUserId: 1, participantUserIds: [1, 2, 2] };

    await controller.gameEnded(req as Request, res as Response);

    expect(AppDataSource.transaction).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });
});

