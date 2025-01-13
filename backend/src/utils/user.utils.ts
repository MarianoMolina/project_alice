import mongoose from 'mongoose';
import { UserTier, IUserStats } from '../interfaces/user.interface';
import Logger from '../utils/logger';
import User from '../models/user.model';

class UserStatsError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'UserStatsError';
    }
}

// Default stats object for initialization
const DEFAULT_STATS: IUserStats = {
    user_tier: UserTier.FREE,
    log_in_attempts: 0,
    last_log_in_attempt: null,
    log_in_successes: 0,
    last_log_in_success: null,
    actions_taken: 0
};
/**
 * Checks if there are any existing users and creates a new user with appropriate role
 */
export async function createUserWithRole(userData: {
    name: string,
    email: string,
    password?: string,
    creationMethod: 'password' | 'google'
}) {
    // Count all users - this is fast as it uses collection metadata
    const userCount = await User.countDocuments({});

    // Create the user with appropriate role
    const user = new User({
        ...userData,
        role: userCount === 0 ? 'admin' : 'user'
    });

    await user.save();
    return user;
}
export class UserStatsManager {
    /**
     * Updates the user's tier, initializing stats if needed
     * @param userId - The ID of the user
     * @param newTier - The new tier to set
     * @throws {UserStatsError} If the user is not found or update fails
     */
    static async updateUserTier(userId: string | mongoose.Types.ObjectId, newTier: UserTier): Promise<void> {
        try {
            const User = mongoose.model('User');
            const result = await User.updateOne(
                { _id: userId },
                {
                    $set: { 'stats.user_tier': newTier },
                    $setOnInsert: {
                        'stats.log_in_attempts': DEFAULT_STATS.log_in_attempts,
                        'stats.last_log_in_attempt': DEFAULT_STATS.last_log_in_attempt,
                        'stats.log_in_successes': DEFAULT_STATS.log_in_successes,
                        'stats.last_log_in_success': DEFAULT_STATS.last_log_in_success,
                        'stats.actions_taken': DEFAULT_STATS.actions_taken
                    }
                },
                { upsert: true }
            );

            Logger.info('Updated user tier', {
                userId,
                newTier,
                success: true,
                wasInitialized: result.upsertedCount > 0
            });
        } catch (error) {
            Logger.error('Failed to update user tier', {
                userId,
                newTier,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new UserStatsError(`Failed to update user tier: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Records a login attempt, initializing stats if needed
     * @param userId - The ID of the user
     * @throws {UserStatsError} If the user is not found or update fails
     */
    static async recordLoginAttempt(userId: string | mongoose.Types.ObjectId): Promise<void> {
        try {
            const User = mongoose.model('User');
            const result = await User.updateOne(
                { _id: userId },
                {
                    $inc: { 'stats.log_in_attempts': 1 },
                    $set: { 'stats.last_log_in_attempt': new Date() },
                    $setOnInsert: {
                        'stats.user_tier': DEFAULT_STATS.user_tier,
                        'stats.log_in_successes': DEFAULT_STATS.log_in_successes,
                        'stats.last_log_in_success': DEFAULT_STATS.last_log_in_success,
                        'stats.actions_taken': DEFAULT_STATS.actions_taken
                    }
                },
                { upsert: true }
            );

            Logger.info('Recorded login attempt', {
                userId,
                success: true,
                wasInitialized: result.upsertedCount > 0
            });
        } catch (error) {
            Logger.error('Failed to record login attempt', {
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new UserStatsError(`Failed to record login attempt: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Records a successful login, initializing stats if needed
     * @param userId - The ID of the user
     * @throws {UserStatsError} If the user is not found or update fails
     */
    static async recordLoginSuccess(userId: string | mongoose.Types.ObjectId): Promise<void> {
        try {
            const User = mongoose.model('User');
            const result = await User.updateOne(
                { _id: userId },
                {
                    $inc: { 'stats.log_in_successes': 1 },
                    $set: { 'stats.last_log_in_success': new Date() },
                    $setOnInsert: {
                        'stats.user_tier': DEFAULT_STATS.user_tier,
                        'stats.log_in_attempts': DEFAULT_STATS.log_in_attempts,
                        'stats.last_log_in_attempt': DEFAULT_STATS.last_log_in_attempt,
                        'stats.actions_taken': DEFAULT_STATS.actions_taken
                    }
                },
                { upsert: true }
            );

            Logger.info('Recorded login success', {
                userId,
                success: true,
                wasInitialized: result.upsertedCount > 0
            });
        } catch (error) {
            Logger.error('Failed to record login success', {
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new UserStatsError(`Failed to record login success: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Increments the actions taken counter, initializing stats if needed
     * @param userId - The ID of the user
     * @throws {UserStatsError} If the user is not found or update fails
     */
    static async incrementActionsTaken(userId: string | mongoose.Types.ObjectId): Promise<void> {
        try {
            const User = mongoose.model('User');
            const result = await User.updateOne(
                { _id: userId },
                {
                    $inc: { 'stats.actions_taken': 1 },
                    $setOnInsert: {
                        'stats.user_tier': DEFAULT_STATS.user_tier,
                        'stats.log_in_attempts': DEFAULT_STATS.log_in_attempts,
                        'stats.last_log_in_attempt': DEFAULT_STATS.last_log_in_attempt,
                        'stats.log_in_successes': DEFAULT_STATS.log_in_successes,
                        'stats.last_log_in_success': DEFAULT_STATS.last_log_in_success
                    }
                },
                { upsert: true }
            );

            Logger.info('Incremented actions taken', {
                userId,
                success: true,
                wasInitialized: result.upsertedCount > 0
            });
        } catch (error) {
            Logger.error('Failed to increment actions taken', {
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new UserStatsError(`Failed to increment actions taken: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Gets the current stats for a user, initializing if needed
     * @param userId - The ID of the user
     * @returns The user's current stats
     * @throws {UserStatsError} If the user is not found
     */
    static async getUserStats(userId: string | mongoose.Types.ObjectId): Promise<IUserStats> {
        try {
            const User = mongoose.model('User');
            const result = await User.findOneAndUpdate(
                { _id: userId },
                {
                    $setOnInsert: {
                        stats: DEFAULT_STATS
                    }
                },
                {
                    upsert: true,
                    new: true,
                    select: 'stats'
                }
            );

            return result.stats;
        } catch (error) {
            Logger.error('Failed to get user stats', {
                userId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new UserStatsError(`Failed to get user stats: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}