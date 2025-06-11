const passport = require('passport');
const {ExtractJwt, Strategy} = require('passport-jwt');
const Users = require('../db/models/Users');
const UserRoles = require('../db/models/UserRole');
const RolePrivilieges = require('../db/models/RolePrivilieges');
const config = require('../config');

module.exports = function (){
    let strategy = new Strategy({
        secretOrKey:config.JWT.SECRET_KEY,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    }, async (payload,done) => {

        try {

            let user = await Users.findOne({_id: payload.id});

            if(user){
                let userRoles = await UserRoles.findOne({user_id: payload.id});
                let rolePrivilieges = await RolePrivilieges.find({role_id: {$in: userRoles.map(ur=>ur.role_id)}});

                done(null, {
                    id: user._id,
                    email: user.email,
                    roles: rolePrivilieges,
                    first_name: user.first_name,
                    last_name: user.last_name,

                });

            }else {
                done(new Error('User already exists'), {})
            }

        }catch(err){
            done(err, null);
        }

    });

    passport.use(strategy);

    return {
        initialize:function (){
            return passport.initialize();
        },
        authenticate:function (){
            return passport.authenticate('jwt', { session: false });
        }
    }
};