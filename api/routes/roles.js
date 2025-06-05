const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Roles = require("../db/models/Roles");
const RolePrivileges = require("../db/models/RolePrivilieges");
const Response = require("../lib/Response");
const CustomError = require("../lib/Error");
const Enum = require("../config/Enum");
const role_privileges = require("../config/role_privileges");

/* GET users listing. */
router.get("/", async (req, res, next) => {
  try {
    let roles = await Roles.find({});

    res.json(Response.successResponse(roles));
  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/add", async (req, res) => {
  let body = req.body;

  try {
    if (!body.role_name)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validation Error!",
        Enum.MESSAGE.NOT_EMPTY
      );

    // Enhanced check for permissions: make sure it's an array and not empty
    if (
      !body.permission ||
      !Array.isArray(body.permission) ||
      body.permission.length === 0
    ) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Validation Error!",
        "Permission field is required and must be a non-empty array!"
      );
    }

    // Check for an existing role with the same name
    const existingRole = await Roles.findOne({ role_name: body.role_name });
    if (existingRole) {
      throw new CustomError(
        Enum.HTTP_CODES.CONFLICT, // 409
        "Conflict Error!",
        `${Enum.MESSAGE.CONFLICT_ROLE} : ${body.role_name}`
      );
    }

    let roles = new Roles({
      role_name: body.role_name,
      is_active: body.is_active,
      created_by: req.user?.id
    });

    const addRole = await roles.save();

    // Add permissions for the role
    for (let i = 0; i < body.permission.length; i++) {
      let priv = new RolePrivileges({
        role_id: roles._id,
        permission: body.permission[i],
        created_by: req.user?.id
      });

      await priv.save();
    }

    res.json(Response.successResponse(addRole));
  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.put("/update/:id", async (req, res) => {
  const body = req.body;
  const roleId = req.params.id;

  try {
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Invalid ID Format",
        `Provided ID: ${roleId} is not a valid MongoDB ObjectId`
      );
    }

    const role = await Roles.findById(roleId);

    if (!role) {
      throw new CustomError(
        Enum.HTTP_CODES.NOT_FOUND,
        "Not Found",
        `Role with ID ${roleId} not found`
      );
    }

    if (
      body.permission &&
      Array.isArray(body.permission) &&
      body.permission.length > 0
    ) {
      let permissions = await RolePrivileges.find({ role_id: role._id });

      // Identify permissions to remove
      let removedPermissions = permissions.filter(
        (x) => !body.permission.includes(x.permission)
      );
      let newPermissions = body.permission.filter(
        (x) => !permissions.map((p) => p.permission).includes(x)
      );

      // Delete removed permissions
      if (removedPermissions.length > 0) {
        await RolePrivileges.deleteMany({
          _id: { $in: removedPermissions.map((p) => p._id) }
        });
      }

      // Add new permissions
      if (newPermissions.length > 0) {
        for (let i = 0; i < newPermissions.length; i++) {
          let priv = new RolePrivileges({
            role_id: role._id,
            permission: newPermissions[i],
            created_by: req.user?.id
          });

          await priv.save();
        }
      }
    }

    role.role_name = body.role_name ?? role.role_name;
    role.is_active = body.is_active ?? role.is_active;

    const updatedRole = await role.save();

    res.json(Response.successResponse(updatedRole));
  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.delete("/delete/:id", async (req, res) => {
  const roleId = req.params.id;

  try {
    console.log("Gelen ID:", roleId);

    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Invalid ID Format",
        `Provided ID: ${roleId} is not a valid MongoDB ObjectId`
      );
    }

    // Use the custom 'remove' method to ensure related 'RolePrivileges' are deleted
    const deleted = await Roles.remove({ _id: roleId });

    res.json(
      Response.successResponse({
        message: "Role and related privileges deleted successfully."
      })
    );
  } catch (error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.get("/role_privileges", async (req, res) => {
  res.json(role_privileges);
});

module.exports = router;
