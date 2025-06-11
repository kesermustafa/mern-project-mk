const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const routes = fs.readdirSync(__dirname);

for (let route of routes) {
  if (route.endsWith(".js") && route !== "index.js") {


    try {
      const routeModule = require(path.join(__dirname, route));
      // Clean route name: remove .js extension only
      const routeName = route.replace(".js", "");

      router.use(`/${routeName}`, routeModule);

    } catch (error) {
      console.error(`Error loading route ${route}:`, error.message);
    }
  }
}

module.exports = router;