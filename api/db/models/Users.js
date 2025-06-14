const mongoose = require("mongoose");
const {compareSync} = require("bcrypt-nodejs");
const CustomError = require("../../lib/Error");
const {HTTP_CODES, PASS_LENGTH} = require("../../config/Enum");
const is = require("is_js")


const schema = mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    is_active: { type: Boolean, required: true },
    first_name: String,
    last_name: String,
    phone_number: String,
  },
  {
      versionKey: false,
    timestamps: {
      createAt: "create_at",
      updateAt: "update_at",
    },
  }
);

class Users extends mongoose.Model {

    validPassword(password) {
        return compareSync(password, this.password);
    }

    static validateFieldsBeforeAuth(email, password) {
        if (typeof password !== "string" || password.length < PASS_LENGTH || is.not.email(email))
            throw new CustomError(HTTP_CODES.UNAUTHORIZED, "Validation Error", "email or password wrong");

        return null;
    }

}

schema.loadClass(Users);

module.exports = mongoose.model("users", schema);
