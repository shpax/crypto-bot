module.exports = {
  apps: [
    {
      name: 'crypto-bot',
      script: 'dist/main.js',

      max_memory_restart: '128M',
    },
  ],
};
