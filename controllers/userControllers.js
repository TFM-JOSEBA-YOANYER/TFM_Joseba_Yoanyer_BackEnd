//Importar dependencias y modulos
const bcryp = require('bcrypt');
const mongoosePagination = require('mongoose-paginate-v2');
const fs = require("fs");
const path = require("path");

//Importar Modelos
const User = require('../models/userModels');
const Follow = require("../models/followModels");
const Publication = require("../models/publicationModels");

//Importar servicios
const jwt = require('../services/jwt');
const followService = require("../services/followService");
// const { exit } = require('process');

//Acciones de Prueba
const pruebaUser = (req, res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/user.js",
        usuario: req.user,
    });
};

//REGISTRO DE USUARIOS
const register = (req, res) => {
    
        //Recoger datos de la petición
        let params = req.body;
        
        //Comprobar que llegan 
        if(!params.name || !params.surname || !params.email || !params.nick || !params.password){
            return res.status(400).json({
                status: 'error',
                message: 'Faltan datos por enviar',
            });
        }

        //Control de usuario duplicados
        User.find({ $or: [
            // { email: params.email.toLowerCase()},
            // { nick : params.nick.toLowerCase() },
            { email: params.email},
            { nick : params.nick },
            
        ]}).then(async( users )=>{
            
        
            // si existe un usuario con el mismo nick o email
            if(users && users.length >= 1){
                return res.status(200).send({
                    status: "success",
                    message:"usuario ya existe",
                });
            }
            
            //Cifrar la contraseña 
            let pwd = await bcryp.hash(params.password,10);
            params.password = pwd;

            //Crear Objeto de usuario
            let user_to_save = new User(params);
            
            
            //Error al ingresar usuario en la base de datos 
            user_to_save.save().then(( userSave)=>{
                if(!userSave) return res.status(500).send({
                    status:"error", 
                    message:"Error al guardar Usuario",
                });
               
                //Devolver resultados
                return res.status(200).json({
                    status: 'success',
                    message: 'Usuario registrado correctamente',
                    user: userSave,
                });
              
            });

            
        
        }).catch((error)=>{

        if(error) 
            return res.status(500).json({
                status: "error",
                message:"Error en la colsulta de usuario",
             });
        
        })
}

//Buscar al usuario 
const login = (req, res) =>{

    //Recoger los parametros del body
    let params = req.body;

    if(!params.email || !params.password){
        return res.status(400).send({
            status:"error",
            message: "Faltan datos por enviar",
        });
    }

    //Buscar el la BBDD si existe
    User.findOne({email : params.email})
    .select({ "surname": 0 })  //Quita el surname al hacer la busqueda
    .then(( user )=>{
        
        if(!user) return res.status(400).send({
            status:"Error",
            message:"No existe Usuario",
        });

        //Comprobar su contraseña con bcryp
        const pwd = bcryp.compareSync(params.password, user.password);
       
        if(!pwd){
            return res.status(400).send({
                status:"Error",
                message:"El password No se ha identificado correctamente",
            });
        }

        //Si es correcta devolver token
        const token = jwt.createToken(user);
        
        //Eliminar password del objeto
        // y Devolver datos de usuario


        return res.status(200).send({
            status:"success",
            message:"Te has identificado correctamente",
            user:{
                id:user._id,
                name:user.name,
                surname:user.surname,
                nick: user.nick,
            },
            token
        }); 

    });
    
};

const profile = async( req, res ) =>{
    //Recibir el parámetro del id de usuario por la url
    const id = req.params.id;

    try{

         //Consulta para sacar los datos del usuario
        const userProfile = await User.findById(id)
            .select({ password: 0, role: 0 });

            if(!userProfile){
                return res.status(404).send({
                    status: "Error",
                    message: "No existe usuario",
                });
            }

        // Información de seguimiento
        console.log("Calling followThisUser with IDs:", req.user.id, id);
        const followInfo = await followService.followThisUser(req.user.id, id);
        console.log("FollowInfo:", followInfo);
        //Devolver resultado
        //Posteriormente: devolver información de follow
        return res.status(200).send({
            status: "success",
            user: userProfile,
            following: followInfo.following,
            follower: followInfo.follower,
        });


    }catch(error){
        if (error) return res.status(500).send({
            status:"error",
            message:"Error en la consulta",
        });
    };
   
}

const list = (req, res) =>{
    //Controlar en que página estamos
    let page = 1;
    if(req.params.page){
        page = parseInt(req.params.page);
    }

    
    //Consulta con mongoose paginate
    let itemsPerPage = 4;

    // User.find().sort('_id').paginate(page, itemsPerPage ).then((users)=>{
        User.paginate({}, { page, limit: itemsPerPage, sort: { _id: 1 }, select:"-password -email -role -__v" }, async(error, users ) =>{

        if( error ){
            return res.status(500).send({
                status:"error",
                message: "Error en la consulta paginada",
                error: err,
            });
        };

        if(!users.docs || users.docs.length === 0 ){
            return res.status(404).send({
                status:"Info",
                message:"No hay usuarios disponibles ",
                
            });
        };

        //Sacar un array de los ids de los usuarios que me siguen y los que sigo como yoanyer
        let followUserIds = await followService.followUserIds(req.user.id);

        //Devolver resultado(posteriormente info folow)
        return res.status(200).send({
            status:"success",
            users: users.docs,
            page,
            itemsPerPage,
            total: users.totalDocs,
            pages: Math.ceil(users.totalPages),
            user_following : followUserIds.following,
            user_follow_me : followUserIds.followers,
        });


    });
}

const update = (req, res) =>{

    //Recoger info del usuario a actualizar
    const userIdentity = req.user;
    const userToUpdate = req.body;
    

    //eliminar campos sobrantes
    delete userToUpdate.iat;
    delete userToUpdate.exp;
    delete userToUpdate.role;
    delete userToUpdate.image;

    //Comprobar si el usuario ya existe
    User.find({ $or: [
            // { email: params.email.toLowerCase()},
            // { nick : params.nick.toLowerCase() },
            { email: userToUpdate.email},
            { nick : userToUpdate.nick },
            
        ]}).then(async( users )=>{
            
        
            let userIsset = false;
            users.forEach(user => {
                if(user && user._id != userIdentity.id ) userIsset = true;
            });

            // si existe un usuario con el mismo nick o email
            // if(users && users.length >= 1){
            if(userIsset){
                return res.status(200).send({
                    status: "success",
                    message:"usuario ya existe",
                });
            }
            
            //Cifrar la contraseña 
            if(userToUpdate.password){
                let pwd = await bcryp.hash(userToUpdate.password,10);
                userToUpdate.password = pwd;
            }else{
                delete userToUpdate.password;
            }

            //buscar y actualizar  
            try {
                const userUpdate = await User.findByIdAndUpdate({_id: userIdentity.id}, userToUpdate, { new: true });
                
                    if(!userUpdate){
                        return res.status(400).json({
                            status: "error",
                            message:"Error al actualizar",
                        });
                    }
                    
                    //Devolvcer Repuestas
                    return res.status(200).send({
                        status: "success",
                        message: "Método de actualizar usuario",
                        user: userUpdate,
                    });

                    

            } catch (error) {
                return res.status(500).send({
                    status: "error",
                    message: "Error al actualizar el usuario",
                    // error: error.message  // O cualquier propiedad específica del error que pueda ayudar en la depuración
                });
                
            }
           
    });
}

//Subir Archivo y actulizar los campos 
const upload = async(req, res) =>{

    //Recoger el fichero de imagen y comprobar que existe
    if(!req.file){
        return res.status(404).send({
            status: "error",
            message: "Petición no incluye imagen"
        });
    }


    //Conseguir el nombre del archivo
    let image = req.file.originalname;

    //Sacar la extensión del archivo
    const imageSplit = image.split("\.");
    const extension = imageSplit[1];
    
    //Comprobar extensión
    if( extension != "png" && extension != "jpg" && extension != "jpeg"   && extension != "gif" ){
       
       //Borra archivo subido
        const filePath = req.file.path;
        const fileDeleted = fs.unlinkSync(filePath);

        //Devolver repuesta negativa
        return res.status(400).send({
            status: "error",
            message: "Extensión del fichero invalido"
        });
    }

    //Si si es correcto, guardar imagen en bbdd
    try {
        const userOneUpdate = await User.findByIdAndUpdate({ _id: req.user.id}, { image : req.file.filename }, { new : true });
            
            if(!userOneUpdate){
                return res.status(400).json({
                    status: "error",
                    message:"Error de imagen",
                });
            }
            
            //devolver repuesta
            return res.status(200).send({
                status:"success",
                user: userOneUpdate,
                file: req.file,
            });

            

    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al subir avatar",
            // error: error.message  // O cualquier propiedad específica del error que pueda ayudar en la depuración
        });
        
    }
}

const avatar = (req, res) =>{
    // Sacar el parametro de la URL
    const file = req.params.file;

    // Montar el path real de la imagen
    const filePath = "./upload/avatars/"+file;

    // Comprobar que existe
    fs.stat(filePath, (err, exits) => {

        if(err){
            return res.status(404).send({
                status: "error",
                message: "No existe la imagen",
            });
        } 

        // Devolver un file
        return res.sendFile(path.resolve(filePath));

    });
   
}

const counters = async (req, res) => {

    let userId = req.user.id;

    if (req.params.id) {
        userId = req.params.id;
    }

    try {
        const following = await Follow.count({ "user": userId });

        const followed = await Follow.count({ "followed": userId });

        const publications = await Publication.count({ "user": userId });

        return res.status(200).send({
            userId,
            following: following,
            followed: followed,
            publications: publications
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error en los contadores",
            error
        });
    }
}



//Exportar acciones
module.exports = {
    pruebaUser,
    register,
    login,
    profile,
    list,
    update,
    upload,
    avatar,
    counters,
}