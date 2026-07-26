const User = require('../models/User.model');
const logger = require('../config/logger');

const demoUsers = [
  {
    name: 'Owner',
    email: 'owner@svr.com',
    username: 'owner',
    password: 'owner123',
    role: 'User',
    isActive: 1,
  },
  {
    name: 'Supervisor',
    email: 'supervisor@svr.com',
    username: 'supervisor',
    password: 'supervisor123',
    role: 'User',
    isActive: 1,
  },
  {
    name: 'Accountant',
    email: 'accountant@svr.com',
    username: 'accountant',
    password: 'accountant123',
    role: 'User',
    isActive: 1,
  },
];

const seedDemoUsers = async () => {
  if (process.env.NODE_ENV === 'production') {
    logger.info('Skipping demo seeding in production.');
    return;
  }

  try {
    const existingUsers = await User.getAll();
    const existingUsernames = existingUsers.map((user) => user.username);

    for (const demoUser of demoUsers) {
      const existingUser = existingUsers.find((user) => user.username === demoUser.username);

      if (existingUser) {
        if (!existingUser.role || existingUser.role === '') {
          await User.update(existingUser.id, { role: demoUser.role });
          logger.info(`Updated role for demo user: ${demoUser.username}`);
        }
        continue;
      }

      await User.create(demoUser);
      logger.info(`Seeded demo user: ${demoUser.username}`);
    }

    logger.info('Demo user seeding complete.');
  } catch (error) {
    logger.error('Failed to seed demo users:', error);
  }
};

module.exports = {
  seedDemoUsers,
};
