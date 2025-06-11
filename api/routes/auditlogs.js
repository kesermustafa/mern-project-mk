const express = require("express");
const router = express.Router();
const moment = require("moment");

const AuditLogs = require("../db/models/AuditLogs");
const Response = require("../lib/Response");
const auth = require("../lib/auth")();

router.use(auth.authenticate());

router.post("/", auth.checkRoles("auditLogs_view"), async (req, res) => {
  try {
    const body = req.body || {};

    let skip = typeof body.skip === "number" ? body.skip : 0;
    let limit = typeof body.limit === "number" && body.limit <= 500 ? body.limit : 500;

    let query = {};

    if (body.begin_date && body.end_date) {
      query.created_at = {
        $gte: moment(body.begin_date),
        $lte: moment(body.end_date),
      };
    } else {
      query.created_at = {
        $gte: moment().subtract(1, "day").startOf("day"),
        $lte: moment(),
      };
    }

    const auditLogs = await AuditLogs.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit);

    res.json(Response.successResponse(auditLogs));
  } catch (err) {
    const errorResponse = Response.errorResponse(err, req.user?.language);
    res.status(errorResponse.code || 500).json(errorResponse);
  }
});

module.exports = router;
