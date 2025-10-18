module.exports = {
    apps: [
        {
            name: 'brother-taxi',
            script: './dist/server.js',
            args: 'start',
            env: {
                NODE_ENV: 'production',
            },
        },
    ],
};