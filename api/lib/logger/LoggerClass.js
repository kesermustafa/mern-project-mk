const logger = require("./logger.js");

let instance = null;

class LoggerClass {
    constructor() {
        if (!instance) {
            instance = this;
        }

        return instance;
    }

    #createLogObject( email, location, proc_type, log) {
        return{
            email, location, proc_type, log
        }
    }

    info(email, location, proc_type, log) {
        let logObject = this.#createLogObject(email, location, proc_type, log);
        logger.info(logObject);
    }

    warn( email, location, proc_type, log) {
        let logObject = this.#createLogObject(email, location, proc_type, log);
        logger.warn(logObject);
    }

    error( email, location, proc_type, log) {
        let logObject = this.#createLogObject(email, location, proc_type, log);
        logger.error(logObject);
    }

    verbose( email, location, proc_type, log) {
        let logObject = this.#createLogObject(email, location, proc_type, log);
        logger.verbose(logObject);
    }

    debug( email, location, proc_type, log) {
        let logObject = this.#createLogObject(email, location, proc_type, log);
        logger.debug(logObject);
    }

    http( email, location, proc_type, log) {
        let logObject = this.#createLogObject(email, location, proc_type, log);
        logger.http(logObject);
    }

    stilly( email, location, proc_type, log) {
        let logObject = this.#createLogObject(email, location, proc_type, log);
        logger.silly(logObject);
    }
}

module.exports = new LoggerClass();