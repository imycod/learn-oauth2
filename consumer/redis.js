const { Redis } = require('ioredis');
const RedisStore = require('connect-redis').default;
const redis = new Redis();

// Initialize store.
const redisStore = new RedisStore({
  client: redis,
  prefix: 'consumer:',
});

module.exports = {
  redis,
  redisStore,
}