import log4js from "log4js";

const getLogger = (level = 'debug') => {
    const logger = log4js.getLogger();
    logger.level = level;
    return logger;
}

export default {getLogger};
