const Review = require('../Model/reviewModel');
const AppError = require('../utils/appError');
const AsyncHandler = require('../utils/asyncHandler');
const factory = require('../utils/handlerFactory');

exports.getAllReviews = factory.getAll(Review);

exports.getReview = factory.getOne(Review);

exports.checkReviewOwnership = AsyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id).select('user');

  if (!review) {
    return next(new AppError('No document found with that ID', 404));
  }

  const reviewUserId = review.user?._id ? review.user._id.toString() : review.user?.toString();
  if (req.user.role !== 'admin' && reviewUserId !== req.user.id) {
    return next(new AppError('You can only modify your own review', 403));
  }

  next();
});

exports.createReview = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  req.body.user = req.user.id; // always override, never trust body
  return factory.createOne(Review)(req, res, next);
};

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);
