const express = require('express');

const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');
// const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.use(viewController.alerts);

router.get('/me', authController.protect, viewController.getAccount);
router.get('/signup', viewController.getSignupForm);
router.get('/forgotPassword', viewController.getForgotPasswordForm);
router.get('/resetPassword', viewController.getResetPasswordForm);
router.get(
  '/my-tours',
  // bookingController.createBookingCheckout,
  authController.protect,
  viewController.getMyTours
);

router.post(
  '/submit-user-data',
  authController.protect,
  viewController.updateUserData
); // For URL Encoding

router.use(authController.isLoggedIn);

router.get('/', viewController.getOverview);
router.get('/tour/:tourSlug', viewController.getTour);
router.get('/login', viewController.getLoginForm);

module.exports = router;
