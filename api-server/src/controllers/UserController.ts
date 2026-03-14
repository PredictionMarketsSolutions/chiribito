import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import logger from '../config/logger';

/** Request with user set by auth middleware */
interface AuthenticatedRequest extends Request {
  user?: { userId: number; username: string; email: string };
}

export class UserController {
  private userRepository = AppDataSource.getRepository(User);

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as AuthenticatedRequest).user?.userId;
      if (userId == null) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const user = await this.userRepository.findOne({ where: { id: userId } });
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Delete the user
      await this.userRepository.remove(user);
      
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error deleting user', { message: error.message });
      } else {
        logger.error('An unknown error occurred while deleting user');
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as AuthenticatedRequest).user?.userId;
      if (userId == null) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const user = await this.userRepository.findOne({ 
        where: { id: userId },
        select: ['id', 'username', 'email', 'createdAt'] 
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json(user);
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Profile error', { message: error.message });
      } else {
        logger.error('An unknown error occurred while fetching profile');
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
