module.exports = {
  apps: [
    {
      name: 'backend',
      script: './backend/index.js',
      cwd: '/root/Cartoshcka/Anechka_solnce',
      
      // Режим работы
      instances: 1,
      exec_mode: 'fork',
      
      // Watch и reload
      watch: ['backend'],
      ignore_watch: [
        'backend/uploads',    // ← Не отслеживаем загруженные файлы!
        'backend/node_modules',
        'node_modules',
        '.git',
        'dist'
      ],
      
      // Переменные окружения
      env: {
        NODE_ENV: 'production'
      },
      
      // Логирование
      output: '/root/.pm2/logs/backend-out.log',
      error: '/root/.pm2/logs/backend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Автоперезагрузка
      max_memory_restart: '500M',
      
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000
    }
  ]
};
