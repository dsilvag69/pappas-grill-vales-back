const jwt = require('jsonwebtoken');

let autorizado = (req, res, next) => {

    let token = req.get('token');
    jwt.verify(token, process.env.SEED, (err, decoded) => {

        if (err) return res.status(401).json({error:  'Token no válido'});
        req.usuario = decoded.user;
        if (req.usuario.role.range > 0){
            next()
        }else{
            return res.status(401).json({error:  'Usuario no autorizado'});
        }
    });
};

let esSupervisor = (req, res, next) => {

    if (req.usuario.role.range > 1) {
        next();
    } else {
        return res.status(401).json({error:  'Usuario no es supervisor'});
    }
};


module.exports = { autorizado, esSupervisor}