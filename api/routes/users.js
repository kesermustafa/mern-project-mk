const express = require('express');
const Response = require("../lib/Response");
const router = express.Router();
const Users = require("../db/models/Users");
const Roles = require("../db/models/Roles");
const UserRoles = require("../db/models/UserRole");
const CustomError = require("../lib/Error");
const Enum = require("../config/Enum");
const bcrypt = require("bcrypt-nodejs")
const is = require("is_js")
const config = require("../config");
const jwt = require('jsonwebtoken');
const auth = require("../lib/auth")();


router.post('/register', async (req, res, next) => {

    let body = req.body;
    try {

        const user = await Users.findOne({ });

        if (user) {
            return res.sendStatus(Enum.HTTP_CODES.NOT_FOUND)
        }

        if (!body.email) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "Please enter a valid email");
        if (!is.email(body.email)) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "not in email format");
        if (!body.password) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "Please enter a valid password");

        if(body.password.length < 8) {
            throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "Password must be at least 8 characters");
        }

        let password = bcrypt.hashSync(body.password, bcrypt.genSaltSync(8), null);

        const createdUser = await Users.create({
            email: body.email,
            password:password,
            first_name: body.first_name,
            last_name: body.last_name,
            is_active: true,
            phone_number: body.phone_number,
        })

        let role = await Roles.create({
            role_name: Enum.USER_ROLES.SUPER_ADMIN,
            is_active: true,
            created_by: createdUser._id
        })

        await UserRoles.create({
            role_id: role._id,
            user_id: createdUser._id
        });

        res.status(Enum.HTTP_CODES.CREATED).json(Response.successResponse(createdUser, Enum.HTTP_CODES.CREATED ));

    }catch(error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.post('/auth', async (req, res, next) => {
    try {

        let {email, password} = req.body;

        Users.validateFieldsBeforeAuth(email, password);

        let user = await Users.findOne({email: email});

        if (!user) throw new CustomError(Enum.HTTP_CODES.UNAUTHORIZED, "User Not Found", "No registered users found");

        if(!user.validPassword(password)) throw new CustomError(Enum.HTTP_CODES.UNAUTHORIZED, "Validation Error", "Email or Password wrong")

        let payload = {
            id: user.id,
            email: user.email,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + config.JWT.EXPIRE_TIME,
        }

        let token = jwt.sign(payload, config.JWT.SECRET_KEY);

        let userData = {
            _id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
        }

        res.json(Response.successResponse({token, user:userData}));

    }catch(error) {
        const errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code || 500).json(errorResponse);
    }
})


router.use(auth.authenticate());

router.get('/', auth.checkRoles("user_view"),  async (req, res, next) => {
    try {
        const { active, first_name, last_name, email, sortBy, order } = req.query;

        // Filtreleme için bir nesne oluştur
        let filter = {};

        // "active" parametresi varsa, is_active değerine göre filtrele
        if (active !== undefined) {
            if (active !== "true" && active !== "false") {
                throw new CustomError(
                    Enum.HTTP_CODES.BAD_REQUEST,
                    "Validation Error",
                    "Query param 'active' must be 'true' or 'false'"
                );
            }
            filter.is_active = active === "true";
        }

        // first_name filtreleme
        if (first_name) {
            filter.first_name = { $regex: first_name, $options: 'i' };
        }

        // last_name filtreleme
        if (last_name) {
            filter.last_name = { $regex: last_name, $options: 'i' };
        }

        // email filtreleme
        if (email) {
            filter.email = { $regex: email, $options: 'i' };
        }

        // Geçerli sıralama alanları
        const validSortFields = ['email', 'first_name', 'last_name', 'createdAt', 'updatedAt'];

        // Sıralama nesnesi
        let sort = {};

        if (sortBy) {
            if (!validSortFields.includes(sortBy)) {
                throw new CustomError(
                    Enum.HTTP_CODES.BAD_REQUEST,
                    "Validation Error",
                    `Invalid sortBy field. Valid fields are: ${validSortFields.join(', ')}`
                );
            }

            // Sıralama yönü: desc → -1, asc veya yoksa → 1
            sort[sortBy] = order === 'desc' ? -1 : 1;
        }

        // Kullanıcıları filtrele ve sırala
        const users = await Users.find(filter).sort(sort);

        res.status(Enum.HTTP_CODES.OK).json(
            Response.successResponse(users, Enum.HTTP_CODES.OK)
        );

    } catch (error) {
        const errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code || 500).json(errorResponse);
    }
});

router.get('/pages', auth.checkRoles("user_view"),  async (req, res, next) => {
    try {
        const {
            active,
            first_name,
            last_name,
            email,
            sortBy,
            order,
            page = 1,
            limit = 10
        } = req.query;

        // Sayı dönüşümü ve negatif kontrolü
        const pageNumber = Math.max(parseInt(page), 1);
        const limitNumber = Math.max(parseInt(limit), 1);
        const skip = (pageNumber - 1) * limitNumber;

        let filter = {};

        if (active !== undefined) {
            if (active !== "true" && active !== "false") {
                throw new CustomError(
                    Enum.HTTP_CODES.BAD_REQUEST,
                    "Validation Error",
                    "Query param 'active' must be 'true' or 'false'"
                );
            }
            filter.is_active = active === "true";
        }

        if (first_name) {
            filter.first_name = { $regex: first_name, $options: 'i' };
        }

        if (last_name) {
            filter.last_name = { $regex: last_name, $options: 'i' };
        }

        if (email) {
            filter.email = { $regex: email, $options: 'i' };
        }

        const validSortFields = ['email', 'first_name', 'last_name', 'createdAt', 'updatedAt'];
        let sort = {};

        if (sortBy) {
            if (!validSortFields.includes(sortBy)) {
                throw new CustomError(
                    Enum.HTTP_CODES.BAD_REQUEST,
                    "Validation Error",
                    `Invalid sortBy field. Valid fields are: ${validSortFields.join(', ')}`
                );
            }

            sort[sortBy] = order === 'desc' ? -1 : 1;
        }

        const users = await Users.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limitNumber);

        const total = await Users.countDocuments(filter);
        const totalPages = Math.ceil(total / limitNumber);

        res.status(Enum.HTTP_CODES.OK).json(
            Response.successResponse({
                data: users,
                pagination: {
                    totalItems: total,
                    totalPages,
                    currentPage: pageNumber,
                    perPage: limitNumber
                }
            }, Enum.HTTP_CODES.OK)
        );

    } catch (error) {
        const errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code || 500).json(errorResponse);
    }
});

router.get('/:id', auth.checkRoles("user_view"),  async (req, res, next) => {

    let id = req.params.id;

    try {
        const user = await Users.findById(id);
        if (!user) {
            throw new CustomError(Enum.HTTP_CODES.NOT_FOUND, "User Not Found", "No user with the given ID");
        }

        res.status(Enum.HTTP_CODES.OK).json(
            Response.successResponse({
                message: "User successfully",
                user
            })
        );

    }catch(error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.post('/add', auth.checkRoles("user_add"),  async (req, res, next) => {

  let body = req.body;
    let password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10), null);
  try {

    if (!body.email) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "Please enter a valid email");
    if (!is.email(body.email)) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "not in email format");
    if (!body.password) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "Please enter a valid password");

    if(body.password.length < 8) {
        throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "Password must be at least 8 characters");
    }

    const existingUser = await Users.findOne({ email: body.email });
    if (existingUser) {
          throw new CustomError(Enum.HTTP_CODES.CONFLICT, "Validation Error!", "Email is already registered");
    }

    if (!body.roles || body.roles.length < 1 || !Array.isArray(body.roles)) {
        throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "Roles field must be an array!")
    }

    let roles = await Roles.find({_id: {$in: body.roles}});

    if(roles.length === 0){
        throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error!", "Roles field must be an array!")
    }

   const createdUser = await Users.create({
      email: body.email,
      password:password,
      first_name: body.first_name,
      last_name: body.last_name,
      is_active: true,
      phone_number: body.phone_number,
    })

     for (let i=0; i < roles.length; i++) {
         await UserRoles.create({
             role_id: roles[i]._id,
             user_id: createdUser._id,
         })
     }

    res.status(Enum.HTTP_CODES.CREATED).json(Response.successResponse(createdUser, Enum.HTTP_CODES.CREATED ));


  }catch(error) {
    let errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.put("/update/:id", auth.checkRoles("user_update"), async (req, res, next) => {
    let id = req.params.id;
    let body = req.body;

    try {
        const user = await Users.findById(id);
        if (!user) {
            throw new CustomError(Enum.HTTP_CODES.NOT_FOUND, "User Not Found", "No user with the given ID");
        }

        let updatedUser = {};

        if (body.email && body.email.toLowerCase() !== user.email.toLowerCase()) {
            const existingEmailUser = await Users.findOne({ email: body.email.toLowerCase() });
            if (existingEmailUser) {
                throw new CustomError(Enum.HTTP_CODES.CONFLICT, "Validation Error", "Email is already registered");
            }
            updatedUser.email = body.email.toLowerCase();
        }


        if(body.password && body.password.length >= 8) {
            updatedUser.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10), null);
        }

        if(body.first_name) {
            updatedUser.first_name = body.first_name;
        }
        if(body.last_name) {
            updatedUser.last_name = body.last_name;
        }
        if(body.phone_number) {
            updatedUser.phone_number = body.phone_number;
        }
        if(typeof body.is_active === "boolean"){
            updatedUser.is_active = Boolean(body.is_active);
        }

        if (Array.isArray(body.roles) && body.roles.length > 0) {

            let userRoles = await UserRoles.find({ user_id: id });

            let removedRoles = userRoles.filter(x => !body.roles.includes(x.role_id));
            let newRoles = body.roles.filter(x => !userRoles.map(r => r.role_id).includes(x));

            if (removedRoles.length > 0) {
                await UserRoles.deleteMany({ _id: { $in: removedRoles.map(x => x._id.toString()) } });
            }

            if (newRoles.length > 0) {
                for (let i = 0; i < newRoles.length; i++) {
                    let userRole = new UserRoles({
                        role_id: newRoles[i],
                        user_id: id
                    });

                    await userRole.save();
                }
            }
        }

        const result = await Users.findByIdAndUpdate(id, updatedUser, { new: true });

        res.status(Enum.HTTP_CODES.OK).json(Response.successResponse(result, Enum.HTTP_CODES.OK));

    }catch (err) {

        const errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code || 500).json(errorResponse);

    }

})

router.delete("/delete/:id", auth.checkRoles("user_delete"), async (req, res, next) => {
    let id = req.params.id;

    try {
        const user = await Users.findById(id);
        if (!user) {
            throw new CustomError(Enum.HTTP_CODES.NOT_FOUND, "User Not Found", "No user with the given ID");
        }

        const deletedUser = await Users.findByIdAndDelete(id);

        await UserRoles.deleteMany({user_id: id});

        res.status(Enum.HTTP_CODES.OK).json(
            Response.successResponse({
                message: "User deleted successfully",
                deletedUser
            })
        );

    }catch(error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }

})


module.exports = router;
