const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const routes = fs.readdirSync(__dirname);

for (let route of routes) {
  if (route.endsWith(".js") && route !== "index.js") {
    const routeModule = require(path.join(__dirname, route));

    router.use("/" + route.replace(".js", ""), routeModule);
  }
}

module.exports = router;
