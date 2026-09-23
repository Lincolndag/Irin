const User = require('../Model/userModel');
const AppError = require('../utils/appError');
const AsyncHandler = require('../utils/asyncHandler');
const factory = require('../utils/handlerFactory');

exports.getAllUsers = factory.getAll(User);

exports.getUser = factory.getOne(User);

exports.deleteUser = factory.deleteOne(User);

const filterBody = (obj, ...allowedFields) => {
  const filtered = {};
  allowedFields.forEach(field => {
    if (obj[field] !== undefined) filtered[field] = obj[field];
  });
  return filtered;
};

exports.updateMe = AsyncHandler(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm)
    return next(new AppError('This route is not for password updates.', 400));

  const filteredBody = filterBody(req.body, 'name', 'email', 'photo');
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  if (!updatedUser) {
    return next(new AppError('User not found for updating', 404));
  }

  res.status(200).json({ status: 'success', data: { user: updatedUser } });
});

exports.updateUser = factory.updateOne(User);

exports.getMe = AsyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  res.status(200).json({
    status: 'success',
    data: { user }
  });
});

exports.deleteMe = AsyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user.id, { active: false });
  if (!user) {
    return next(new AppError('User not found for deletion', 404));
  }
  res.status(204).json({ status: 'success', data: null });
});


