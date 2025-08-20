module.exports = {
  apps: [
    {
      name: 'instagram-backend',
      script: '/var/www/muksta/backend/start.sh',
      interpreter: '/bin/bash',
      cwd: '/var/www/muksta/backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PATH: '/home/ec2-user/.local/bin:/usr/local/bin:/usr/bin:/bin',
        PYTHONPATH: '/var/www/muksta/backend'
      },
      error_file: '/var/www/muksta/logs/backend-error.log',
      out_file: '/var/www/muksta/logs/backend-out.log',
      log_file: '/var/www/muksta/logs/backend-combined.log',
      time: true
    }
  ]
};