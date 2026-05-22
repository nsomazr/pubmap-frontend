/** PM2 process for production static hosting (after npm run build). */
const path = require("path");

const root = __dirname;
const serve = path.join(root, "bin", "run-serve.sh");

module.exports = {
  apps: [
    {
      name: process.env.PM2_APP_NAME || "gre-frontend",
      cwd: root,
      script: serve,
      interpreter: "bash",
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || "3099",
      },
      max_memory_restart: "300M",
      exp_backoff_restart_delay: 100,
    },
  ],
};
