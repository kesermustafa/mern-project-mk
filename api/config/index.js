module.exports = {
  PORT: process.env.PORT || "3000",
  LOG_LEVEL: process.env.LOG_LEVEL || "debug",
  CONNECTION_STRING:
    process.env.CONNECTION_STRING ||
    "mongodb://localhost:27017/mern_api_project",

  "JWT": {
    "SECRET_KEY": process.env.JWT_SECRET || "01JXDT4SVSDRV8NTQJQHXH4JE8",
    "EXPIRE_TIME": !isNaN(parseInt(process.env.TOKEN_EXPIRE_TIME)) ? parseInt(process.env.TOKEN_EXPIRE_TIME) : 24 * 60 * 60 // 86400
  },
};
