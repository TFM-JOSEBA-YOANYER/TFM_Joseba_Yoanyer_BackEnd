//Importar dependencias 
const { connection } = require('./database/connection');
const express = require('express');
const cors = require('cors');

//Mensaje de Bienvenioda
console.log('API Node para Red Social arrancada !!');

//Conexion de la base de datos bbdd
connection();

//Crear Servidor node
const app = express();
const puerto = 3900;

//Configurar cors
app.use(cors());

//Convertir los datos del body a objetos json
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Cargar conf rutas
const userRoutes = require('./routes/userRoute');
const publicationRoutes = require('./routes/publicationRoute');
const followRoutes = require('./routes/followRoute');

app.use("/api/user", userRoutes );
app.use("/api/publication", publicationRoutes );
app.use("/api/follow", followRoutes );


//Ruta de prueba
app.get('/ruta-prueba',(req,res)=>{

    return res.status(200).json(
        {
            "id":1,
            "nombre": "Yoanyer",
            "web": "MantenimientoBombas.es",
        }
    );
});

//Poner servidor a escuchar peticiones http
app.listen(puerto, ()=>{
    console.log("Servidor de Node corriendo en el puerto: ", puerto);
});