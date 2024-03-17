const express = require('express');
const router = express.Router();
const multer = require("multer");

const userController = require('../controllers/userControllers');
const authMiddle = require('../middlewares/auth');

//Configuración de Subida
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./upload/avatars/");
    },
    filename: (req, file, cb) => {
        cb( null, "avatar-" + Date.now() + "-" + file.originalname );
    },
});

const uploads = multer({ storage });

//definir las rutas
router.get('/prueba-usuario', authMiddle.auth , userController.pruebaUser );
router.post('/register', userController.register );
router.post('/login', userController.login );
router.get('/profile/:id', authMiddle.auth , userController.profile);
router.get('/list/:page?', authMiddle.auth, userController.list );
router.put('/update/', authMiddle.auth, userController.update );
router.post('/upload', [authMiddle.auth, uploads.single("file0")], userController.upload );
router.get('/avatar/:file', userController.avatar );
router.get('/counters/:id', authMiddle.auth, userController.counters );

//Exportar router
module.exports = router;
