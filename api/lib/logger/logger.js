const { format, createLogger, transports } = require('winston');

const { LOG_LEVEL } = require('../../config');

const formats = format.combine(
    format.timestamp({format: 'YYYY-MM-DD HH:mm:ss.SSS'}),
    format.simple(),
    format.splat(),
    format.printf(info => {
        const { email, location, proc_type, log } = info.message || {};
        return `${info.timestamp} ${info.level.toUpperCase()}` +
            ` [email:${email || 'N/A'}]` +
            ` [location:${location || 'N/A'}]` +
            ` [procType:${proc_type || 'N/A'}]` +
            ` [log:${log || 'N/A'}]`;
    })
)

const logger = createLogger({
    level: LOG_LEVEL,
    transports: [
        new transports.Console({ format: formats })
    ]
});

module.exports = logger;