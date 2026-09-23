const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');

const reviewRouter = require('./reviewRoutes');
const {
  uploadTourImages,
  resizeTourImages
} = require('../utils/imageUpload');
const { restrictTo } = require('../controllers/authController');

const router = express.Router();

router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-expensive')
  .get(tourController.aliasExpensiveTours, tourController.getAllTours);

router
  .route('/top-rated')
  .get(tourController.aliasTopRated, tourController.getAllTours);

router
  .route('/tour-stats')
  .get(tourController.getTourStats);

router
  .route('/busiest-month/:year')
  .get(tourController.getBusiestMonth);

router
  .route('/tours-within/:distance/center/:latlng/unit{/:unit}')
  .get(tourController.getToursWithin);

router
  .route('/distances/:latlng/unit{/:unit}')
  .get(tourController.getDistances);

// Add insertMany route for tours - restricted to admin


router
  .route('/')
  .get(tourController.getAllTours)
  .post(uploadTourImages, resizeTourImages, tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(uploadTourImages, resizeTourImages, tourController.updateTour)
  .delete(tourController.deleteTour);


  // router.use(authController.protect);
  
  // router
  // .route('/insertmany')
  // .post(restrictTo('admin'), tourController.insertManyTours);
module.exports = router;
