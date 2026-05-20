import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { UserController } from '../../controllers/UserController';
import { AppDataSource } from '../../config/database';

jest.mock('../../config/database');
jest.mock('../../config/logger');

describe('UserController.getProfile', () => {
  let controller: UserController;
  let mockUserRepository: { findOne: jest.Mock };
  let req: Partial<Request> & { user?: { userId: number } };
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRepository = { findOne: jest.fn() };
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepository);
    controller = new UserController();
    req = { user: { userId: 7 } };
    res = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };
  });

  it('selects and returns the player stats columns', async () => {
    const profile = {
      id: 7, username: 'lucia', email: 'l@x.com', createdAt: new Date('2026-03-01T00:00:00Z'),
      gamesPlayed: 142, gamesWon: 38, totalChipsWon: '18420', lastPlayedAt: new Date('2026-05-19T22:00:00Z'),
    };
    mockUserRepository.findOne.mockResolvedValue(profile);

    await controller.getProfile(req as Request, res as Response);

    expect(mockUserRepository.findOne).toHaveBeenCalledWith({
      where: { id: 7 },
      select: ['id', 'username', 'email', 'createdAt', 'gamesPlayed', 'gamesWon', 'totalChipsWon', 'lastPlayedAt'],
    });
    expect(res.json).toHaveBeenCalledWith(profile);
  });

  it('401s when there is no authenticated user', async () => {
    req.user = undefined;
    await controller.getProfile(req as Request, res as Response);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
