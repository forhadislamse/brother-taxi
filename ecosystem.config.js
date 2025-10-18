module.exports = {
    apps: [
        {
            name: 'brenthilvitz_server',
            script: './dist/server.js',
            args: 'start',
            env: {
                NODE_ENV: 'production',
            },
        },
    ],
};