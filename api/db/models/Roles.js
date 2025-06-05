const mongoose = require("mongoose");
const RolePrivileges = require("../models/RolePrivilieges"); 

const schema = mongoose.Schema(
    {
        role_name: { type: String, required: true },
        is_active: { type: Boolean, default: true },
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false
        }
    },
    {
        versionKey: false,
        timestamps: {
            createAt: "create_at",
            updateAt: "update_at"
        }
    }
);

class Roles extends mongoose.Model {

    static async remove(query) {
     
        if (query._id) {
            await RolePrivileges.deleteMany({ role_id: query._id }); 
        }      
        await this.deleteOne(query);  
    };
}

schema.loadClass(Roles);

module.exports = mongoose.model("roles", schema);
