
// Importar modelo
const Follow = require("../models/followModels");
const User = require("../models/userModels");

//Importyar Servicios
const followService = require("../services/followService");

//Importar dependencias
const mongoosePaginate = require("mongoose-paginate-v2");

//Acciones de Prueba
const pruebaFollow = (req, res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/follow.js"
    });
};

//Accion de guardar un follow (acción de seguir)
const save = async (req, res) =>{
    //Consdeguir datos por body
    const params = req.body;

    //Sacar id del usuario identioficado
    const identity = req.user;

    //Crear objeto con modelo folow
    let userToFollow = new Follow({
        user: identity.id,
        followed: params.followed,
    });
    // userToFollow.user = identity.id;
    // userToFollow.followed = params.followed;

    //Guardar objeto en BBDD
    try {
        const followStored = await userToFollow.save();

            return res.status(200).send({
                status: "success",
                identity: req.user,
                follow: followStored,
            });
    
       
        
    } catch (error) {
        if( error ){
            return res.status(500).send({
                status: "error",
                message: "No se ha podido seguir al usuario",
            });
        }
    }
    
    
}

//Accion de borrar un follow (acción dejar de seguir)
const deleteFollow = async(req, res) => {

    //Recoger el id del usuario identificado
    const userId = req.user.id;

    //Recoger el id del usuario que sigo y quiero dejar de seguir
    const followedId = req.params.id;

    try {
        // Buscar el seguimiento
        const follow = await Follow.findOneAndDelete({
            user: userId,
            followed: followedId,
        });

        if (!follow) {
            return res.status(404).send({
                status: "error",
                message: "El seguimiento no existe",
            });
        }

        return res.status(200).send({
            status: "success",
            message: "Follow eliminado correctamente",
        });

    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al intentar dejar de seguir al usuario",
        });
    }

    //Find de las coincidencias y hacer remove
    // Follow.find({
    //     "user": userId,
    //     "followed" : followedId,
    // },(error, followStored)=>{
    //     return res.status(200).send({
    //         status: "success",
    //         identity: req.user,
    //         followStored,
    //     });
    // });

   
}

// Acción listado de usuarios que cualquier usuario está siguiendo (siguiendo)
const following = async(req,res) =>{

    try {
        //Sacar el id del usuario identificado
        let userId = req.user.id;

        //Comprobar si me llega el id por parametros en url
        if(req.params.id){
            userId = req.params.id;
        }

        //Comprobar si me llega la página, si no la pagina 1
        let page = 1;

        if(req.params.page){
            page = req.params.page;
        }

        //Usuarios por páginas quiero mostrar
        const itemsPerPage = 5;

        // Utilizar mongoosePaginate
        Follow.paginate(
            { user: userId }, 
            { page, limit: itemsPerPage, populate: {path: "user followed", select:"-password -role -__v -email "} }, 
            async(error, follows) => {
            if (error) {
                return res.status(500).send({
                    status: "error",
                    message: "Error al obtener los usuarios seguidos",
                });
            }

             //Listado de usuarios de yoanyer, y soy cristian
            //Sacar un array de los ids de los usuarios que me siguen y los que sigo como yoanyer
            let followUserIds = await followService.followUserIds(req.user.id);


            return res.status(200).send({
                status: "success",
                message:"Listado de usuarios que estoy siguiendo",
                follows,
                total: follows.totalDocs,
                pages: Math.ceil(follows.totalPages),
                user_following : followUserIds.following,
                user_follow_me : followUserIds.followers,
            });
        });

    } catch (error) {

        return res.status(500).send({
            status: "error",
            message: "Error al obtener los usuarios seguidos",
        });

    }
    

    

    

    //Find a follow, popular datos del usuario y paginar con mongoose paginate
    // Follow.find({user: userId }).exec((error, follows)=>{
       

    //     return res.status(200).send({
    //         status: "success",
    //         message: "Listado de usuario que estoy siguiendo",
    //     });
    // });

    
}

// Acción listado de usuarios que siguen a cualquier otro usuario.(soy seguido)
const followers = (req,res) =>{

    try {
        //Sacar el id del usuario identificado
        let userId = req.user.id;

        //Comprobar si me llega el id por parametros en url
        if(req.params.id){
            userId = req.params.id;
        }

        //Comprobar si me llega la página, si no la pagina 1
        let page = 1;

        if(req.params.page){
            page = req.params.page;
        }

        //Usuarios por páginas quiero mostrar
        const itemsPerPage = 5;

        // Utilizar mongoosePaginate
        Follow.paginate(
            { followed: userId }, 
            { page, limit: itemsPerPage, populate: {path: "user", select:"-password -role -__v -email "} }, 
            async(error, follows) => {
            if (error) {
                return res.status(500).send({
                    status: "error",
                    message: "Error al obtener los usuarios seguidos",
                });
            }

            let followUserIds = await followService.followUserIds(req.user.id);

            return res.status(200).send({
                status: "success",
                message:"Listado de usuarios que me siguen",
                follows,
                total: follows.totalDocs,
                pages: Math.ceil(follows.totalPages),
                user_following : followUserIds.following,
                user_follow_me : followUserIds.followers,
            });
        });

    } catch (error) {

        return res.status(500).send({
            status: "error",
            message: "Error al obtener los usuarios que me siguen",
        });

    }
}

//Acción del listado de usuario que me sigue

//Exportar acciones
module.exports = {
    pruebaFollow,
    save,
    deleteFollow,
    following,
    followers
}