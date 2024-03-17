const express = require('express');
const router = express.Router();
const followController = require('../controllers/followControllers');
const authMiddle = require('../middlewares/auth');

//definir las rutas
router.get('/prueba-follow', followController.pruebaFollow );
router.post("/save", authMiddle.auth, followController.save );
router.delete("/deleteFollow/:id", authMiddle.auth, followController.deleteFollow );
router.get('/following/:id?/:page?', authMiddle.auth, followController.following );
router.get('/followers/:id?/:page?', authMiddle.auth, followController.followers );

//Exportar router
module.exports = router;
