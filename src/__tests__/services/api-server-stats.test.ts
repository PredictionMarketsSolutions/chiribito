import { reportTournamentGameEnded } from "../../services/api-server-stats";

describe("reportTournamentGameEnded", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("skips when missing apiUrl or internalSecret", async () => {
    global.fetch = jest.fn() as any;
    await reportTournamentGameEnded("", "secret", { championUserId: 1, participantUserIds: [1, 2] });
    await reportTournamentGameEnded("http://x", "", { championUserId: 1, participantUserIds: [1, 2] });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("posts payload to api-server internal endpoint", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "",
    }) as any;

    await reportTournamentGameEnded("http://api", "secret", {
      championUserId: 10,
      participantUserIds: [10, 11],
    });

    expect(global.fetch).toHaveBeenCalledWith("http://api/api/internal/game-ended", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({
        "Content-Type": "application/json",
        "x-internal-secret": "secret",
      }),
    }));
  });

  it("logs warn and returns when response is not ok (reads body text best-effort)", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "boom",
    }) as any;

    await reportTournamentGameEnded("http://api", "secret", {
      championUserId: 10,
      participantUserIds: [10, 11],
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("handles fetch throwing (logs warn and does not throw)", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("network down")) as any;

    await expect(
      reportTournamentGameEnded("http://api", "secret", {
        championUserId: 10,
        participantUserIds: [10, 11],
      })
    ).resolves.toBeUndefined();
  });
});

