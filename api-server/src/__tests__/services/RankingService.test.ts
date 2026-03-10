import { getTopWinners } from "../../services/RankingService";
import { User } from "../../models/User";

describe("RankingService.getTopWinners", () => {
  it("returns cached ranking when available", async () => {
    const cached = JSON.stringify([
      { id: 1, username: "alice", gamesPlayed: 10, gamesWon: 5 },
    ]);
    const redisClient = {
      get: jest.fn().mockResolvedValue(cached),
      set: jest.fn(),
    } as any;

    const userRepository = {
      createQueryBuilder: jest.fn(),
    } as any;

    const result = await getTopWinners(redisClient, userRepository);

    expect(redisClient.get).toHaveBeenCalled();
    expect(userRepository.createQueryBuilder).not.toHaveBeenCalled();
    expect(result).toEqual([{ id: 1, username: "alice", gamesPlayed: 10, gamesWon: 5 }]);
  });

  it("queries database and writes cache when no cached ranking", async () => {
    const redisClient = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue("OK"),
    } as any;

    const qb: any = {
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        Object.assign(new User(), {
          id: 1,
          username: "alice",
          gamesPlayed: 10,
          gamesWon: 5,
        }),
      ]),
    };

    const userRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    } as any;

    const result = await getTopWinners(redisClient, userRepository);

    expect(userRepository.createQueryBuilder).toHaveBeenCalledWith("user");
    expect(redisClient.set).toHaveBeenCalled();
    expect(result).toEqual([{ id: 1, username: "alice", gamesPlayed: 10, gamesWon: 5 }]);
  });
});

