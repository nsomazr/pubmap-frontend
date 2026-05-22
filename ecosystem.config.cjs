/** PM2 process for production static hosting (after npm run build). */
const path = require("path");

const port = process.env.PORT || 3099;

module.exports = {
  apps: [
    {
      name: process.env.PM2_APP_NAME || "gre-frontend",
      cwd: __dirname,
      interpreter: "node",
      script: path.join(__dirname, "node_modules", "serve", "build", "main.js"),
      args: ["-s", "dist", "-l", String(port)],
      env: {
        NODE_ENV: "production",
      },
      max_memory_restart: "300M",
      exp_backoff_restart_delay: 100,
    },
  ],
};
