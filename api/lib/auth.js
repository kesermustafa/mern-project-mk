const passport = require('passport');
const {ExtractJwt, Strategy} = require('passport-jwt');
const Users = require('../db/models/Users');
const UserRoles = require('../db/models/UserRole');
const RolePrivileges = require('../db/models/RolePrivilieges');
const config = require('../config');
const priv = require("../config/role_privileges")
const Response = require("./Response");
const {HTTP_CODES} = require("../config/Enum");
const CustomError = require("./Error");

module.exports = function (){
    let strategy = new Strategy({
        secretOrKey: config.JWT.SECRET_KEY,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    }, async (payload, done) => {
        try {
            let user = await Users.findOne({ _id: payload.id });

            if (!user) {
                return done(new Error('Kullanıcı bulunamadı'), null);
            }

            let userRoles = await UserRoles.find({ user_id: payload.id });

            if (!userRoles || userRoles.length === 0) {
                return done(new Error('Kullanıcıya atanmış rol bulunamadı'), null);
            }

            let rolePrivileges = await RolePrivileges.find({
                role_id: { $in: userRoles.map(ur => ur.role_id) }
            });

            // Yetkileri filtreleyerek sadece geçerli olanları al
            let privileges = rolePrivileges
                .map(privilege =>
                    priv.privileges.find(x => x.key === privilege.permission)
                )
                .filter(priv => priv !== undefined); // undefined değerleri kaldır

            console.log("Kullanıcı Yetkileri:", privileges); // Debug log

            return done(null, {
                id: user._id,
                email: user.email,
                roles: privileges,
                first_name: user.first_name,
                last_name: user.last_name,
                exp: Math.floor(Date.now() / 1000) + config.JWT.EXPIRE_TIME
            });

        } catch (err) {
            console.error("Auth Hatası:", err); // Hata logu
            return done(err, null);
        }
    });

    passport.use(strategy);

    return {
        initialize:function (){
            return passport.initialize();
        },
        authenticate:function (){
            return passport.authenticate('jwt', { session: false });
        },
        checkRoles: (...expectedRoles) => {
            return (req, res, next) => {
                if (!req.user || !req.user.roles) {
                    let response = Response.errorResponse(
                        new CustomError(HTTP_CODES.UNAUTHORIZED, "Kullanıcı yetkileri yüklenemedi", "Auth Error")
                    );
                    return res.status(response.code).json(response);
                }

                // Kullanıcının tüm yetkilerini düzleştir
                const userPrivileges = req.user.roles
                    .filter(priv => priv !== undefined && priv !== null) // undefined/null yetkileri filtrele
                    .map(priv => priv.key);

                // Beklenen rollerden en az birine sahip mi kontrol et
                const hasPermission = expectedRoles.some(role =>
                    userPrivileges.includes(role)
                );

                if (!hasPermission) {
                    let response = Response.errorResponse(
                        new CustomError(HTTP_CODES.UNAUTHORIZED, "Yetkiniz yok", "Permission Denied")
                    );
                    return res.status(response.code).json(response);
                }

                return next();
            };
        }
    }
};