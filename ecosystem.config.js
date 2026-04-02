module.exports = {
  apps: [{
    name: 'hivon-blog',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
