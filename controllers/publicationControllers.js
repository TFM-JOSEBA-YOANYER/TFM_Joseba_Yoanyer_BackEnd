//Importar modilos
const fs = require("fs");
const path = require("path");

//Importar modelos
const Publication = require("../models/publicationModels");
const User = require('../models/userModels');

//Importar Servicios
const followService = require("../services/followService");


//Acciones de Prueba
const pruebaPublication = (req, res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/publication.js"
    });
};

//Guardar Publicaciones
const save = async(req,res) =>{

    try{
        //Recoger datos del body
        const params = req.body;

        //Si no me llegan dar repuestas negativas
        if(!params.text) {
            return res.status(404).send({
                status:"Error",
                message:"Debes enviar el texto de la publicación",
            });
        }

         // Crear y rellenar el objeto del modelo
         const newPublication = new Publication({
            user: req.user.id,
            text: params.text,
            // agregar otros campos
        });

        //Guardar oobjeto en BBDD
        const publicationStored = await newPublication.save();
   
        //Devolver una repuesta
        return res.status(200).send({
            status:"success",
            message: "Publicación Guardada",
            publicationStored,
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al guardar la publicación",
        });
    
    }
}

//Sacar una publicación en concreto
const detail = async(req,res) =>{
    try {

        //Sacar id de publicación de la url
        const publicationId = req.params.id;

        //Find con la condición del id
        const publicationStored = await Publication.findById(publicationId);
        
        // Verificar si la publicación existe
        if (!publicationStored) {
            return res.status(404).send({
                status: "Error",
                message: "No existe la publicación",
            });
        }

        //Devolver una repuesta
        return res.status(200).send({
            status:"success",
            message: "Mostrar publicación",
            publication: publicationStored,
        });
     

        

    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al Mostrar la publicación",
        });
    }
}

//Eliminar publicaciones
const removePublic = async(req,res) =>{
    try {

        //Sacar el id de la publicación a eliminar
        const publicationId = req.params.id;

        // Verificar si la publicación existe y pertenece al usuario actual
        const publicationRemove = await Publication.findOneAndDelete({
            user: req.user.id,
            _id: publicationId,
        });

         // Verificar si la publicación no existe o no pertenece al usuario actual
         if (!publicationRemove) {
            return res.status(404).send({
                status: "Error",
                message: "No se puede eliminar la publicación",
            });
        }

            //Devolver una repuesta
            return res.status(200).send({
                status:"success",
                message: "Publicación Eliminada",
                publication: publicationId,
            });
       
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al Eliminar la publicación",
        });
    }
}

//Listar publicaciones de un usuario
const user = async(req, res) =>{
try {

    //Sacar el Id del usuario
    let userId = req.params.id;


    //Controlar la pagina
    let page = 1;
    
    if(req.params.page){
        page = req.params.page;
    }


    const itemsPerPage = 5;

    //Find, populate, ordenar, paginar
    // 
    // Utilizar mongoosePaginate
    const publications = await Publication.paginate(
        { user: userId }, 
        {   page, 
            limit: itemsPerPage, 
            sort:{created_at: -1 }, 
            populate: {path: "user", select:"-password -role -__v -email "} 
        }, 
    );

    // Verificar si hay publicaciones
    if (!publications.docs || publications.docs.length === 0) {
        return res.status(404).send({
            status: "error",
            message: "No hay publicaciones para este usuario",
        });
    }
        
        //Devolver una repuesta
        return res.status(200).send({
            status: "success",
            message:"Publicaciones del Perfil de un usuario",
            page,
            total: publications.totalDocs,
            pages: publications.totalPages,
            publications,
        });
    
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al obtener las publicaciones del usuario",
        });
    }
}


//Subir ficheros
//Subir Archivo y actulizar los campos 
const upload = async(req, res) =>{
    //Sacar publicationId
    const publicationId = req.params.id;

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
        const publicationUpdate = await Publication.findByIdAndUpdate({ user: req.user.id, _id: publicationId }, { file: req.file.filename }, { new : true });
            
            if(!publicationUpdate){
                return res.status(400).json({
                    status: "error",
                    message:"Error de imagen",
                });
            }
            
            //devolver repuesta
            return res.status(200).send({
                status:"success",
                publication: publicationUpdate,
                file: req.file,
            });

            

    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error al subir avatar",
        });
        
    }
}

//Devolver archivos multimedia imagenes
const media = (req, res) =>{
    // Sacar el parametro de la URL
    const file = req.params.file;

    // Montar el path real de la imagen
    const filePath = "./upload/publications/"+file;

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

//Listar todas las publicaciones(FEED)
const feed = async(req, res) =>{
    try {

        //Sacar la página actual
        let page = 1;

        if(req.params.page){
            page = req.params.page;
        }
    
        //Establecer numero de elementos por pagina
        const itemsPerPage = 5;

        //Sacar un Array de identificadores de usuarios que yo sigo como usuario identificado
        let myFollows = await followService.followUserIds(req.user.id);

         // Configurar opciones para la paginación
         const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(itemsPerPage, 10) || 5,
            sort: { created_at: -1 },
            populate: {
                path: 'user',
                select: '-password -role -__v -email',
            },
        };

        //Find a publicaciones con el operador in, ordenar, popular y paginar
        const publications = await Publication.paginate(
            { user: { $in: myFollows.following } },
            options
        );


        //devolver repuesta
        return res.status(200).send({
            status:"success",
            message: "Feed de publicaciones",
            following: myFollows.following,
            publications,
            total: publications.totalDocs,
            pages: publications.totalPages,
        });

    } catch (error) {
         return res.status(500).send({
            status: "error",
            message: "No se han listados las publicaciones del feed",
        });
    }
}

//Exportar acciones
module.exports = {
    pruebaPublication,
    save,
    detail,
    removePublic,
    user,
    upload,
    media,
    feed,
}