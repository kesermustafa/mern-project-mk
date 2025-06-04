const mongoose = require("mongoose");

const schema = mongoose.Schema(
  {
    is_active: { type: Boolean, default: true },
    created_by: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: {
      createAt: "create_at",
      updateAt: "update_at",
    },
  }
);

class Categories extends mongoose.Model {}

schema.loadClass(Categories);

module.exports = mongoose.model("categories", schema);
