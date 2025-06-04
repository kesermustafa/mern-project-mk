const mongoose = require("mongoose");

let instance = null;

class Database {
  constructor() {
    if (!instance) {
      this.mongoConnection = null;
      instance = this;
    }
    return instance;
  }

  async connect(connectionString) {
    try {
      console.log("DB Bağlanıyor...");
      const db = await mongoose.connect(connectionString); // sadeleştirildi
      this.mongoConnection = db;
      console.log("DB Bağlandı");
    } catch (error) {
      console.error("MongoDB bağlantı hatası:", error.message);
    }
  }
}

module.exports = Database;
