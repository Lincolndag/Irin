const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const {
  uploadUserPhoto,
  resizeUserPhoto
} = require('../utils/imageUpload');
const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.use(authController.protect); // protects everything below

router.get('/', userController.getAllUsers);

router.get('/me', userController.getMe);
router.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, userController.updateMe);
// router.post('/insertMany', authController.restrictTo('admin'), authController.insertMany);

router.delete('/deleteMe', userController.deleteMe);

router
  .route('/:id')
  .get(userController.getUser)
  .delete(authController.restrictTo('admin'), userController.deleteUser)
  .patch(authController.restrictTo('admin'), userController.updateUser),

module.exports = router;
