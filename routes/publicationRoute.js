const express = require('express');
const router = express.Router();
const multer = require("multer");

const publicationController = require('../controllers/publicationControllers');
const authMiddle = require('../middlewares/auth'); 

//Configuración de Subida
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./upload/publications/");
    },
    filename: (req, file, cb) => {
        cb( null, "pub-" + Date.now() + "-" + file.originalname );
    },
});

const uploads = multer({ storage });

//definir las rutas
router.get('/prueba-publication', publicationController.pruebaPublication );
router.post("/save", authMiddle.auth, publicationController.save );
router.get("/detail/:id", authMiddle.auth, publicationController.detail );
router.delete("/remove/:id", authMiddle.auth, publicationController.removePublic );
router.get("/user/:id/:page?", authMiddle.auth, publicationController.user );
router.post("/upload/:id", [authMiddle.auth, uploads.single("file0")], publicationController.upload );
router.get("/media/:file", publicationController.media );
router.get("/feed/:page?", authMiddle.auth, publicationController.feed );
//Exportar router
module.exports = router;
