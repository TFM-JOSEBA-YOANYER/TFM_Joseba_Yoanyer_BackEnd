//Importar modulos
const jwt = require('jwt-simple');
const moment = require('moment');

//Importar clave secreta
const libJwt = require('../services/jwt');
const secret = libJwt.secret;

//MIDDLEWARE de autenticación 
exports.auth = ( req, res, next ) =>{

    //Comprobar si me llega la cabecera de auth
    if(!req.headers.authorization){
        return res.status(403).send({
            status: "error",
            message: "La petición no tiene cabecera de autenticación",
        });
    }
    //Limpiar el token
    let token = req.headers.authorization.replace(/['"]+/g, '');

    //Decodificar token
    try{
        let payload = jwt.decode(token, secret);


        //Comprobar expiración del token
        if(payload.exp <= moment().unix()){
            return res.status(401).send({
                status:"error",
                message: "Token expirado",
            });
        }

        //Agregar datos de usuario o request
        req.user = payload;

    }catch(error){
        return res.status(404).send({
            status:"error",
            message:"Token invalido",
            error
        });
    }

   

    //Pasar a ejecución de acción
    next();
};

