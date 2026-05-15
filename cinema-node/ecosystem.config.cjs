module.exports = {
  apps: [
    {
      name: 'cinema-api',
      script: 'src/server.js',
      instances: 'max', // Chạy chế độ cluster để tận dụng tối đa CPU
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8000,
      },
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      merge_logs: true,
    },
  ],
};
