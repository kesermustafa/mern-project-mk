// models/RolePrivilege.js (veya dosya adı neyse)
const mongoose = require("mongoose");

const schema = mongoose.Schema(
    {
        role_id: { type: mongoose.SchemaTypes.ObjectId, required: true, ref: 'roles' },
        permission: { type: String, required: true },
        created_by: { type: mongoose.SchemaTypes.ObjectId, ref: 'users' },
    },
    {
        versionKey: false,
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

class RolePrivileges extends mongoose.Model {}

schema.loadClass(RolePrivileges);


module.exports = mongoose.model("RolePrivilege", schema);