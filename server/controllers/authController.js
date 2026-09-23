const AsyncHandler = require('../utils/asyncHandler');
const jwt = require('jsonwebtoken');
const User = require('../Model/userModel');
const { promisify } = require('util');
const AppError = require('../utils/appError');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const Email = require('../utils/email');


const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    path: '/',
  };
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.cookie('jwt', token, getCookieOptions());
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    data: { user },
  });
};

exports.signup = AsyncHandler(async (req, res) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  await new Email(newUser).sendWelcome();

  createSendToken(newUser, 201, res);
});

exports.login = AsyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    ...getCookieOptions(),
    expires: new Date(Date.now() + 10 * 1000),
  });

  res.status(200).json({ status: 'success' });
};

exports.protect = AsyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401),
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exists.', 401),
    );
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401),
    );
  }

  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };
};

exports.forgotPassword = AsyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/users/resetPassword/${resetToken}`;

  try {
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (error) {
    console.error('EMAIL ERROR:', error);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later.',
        500,
      ),
    );
  }
});

exports.resetPassword = AsyncHandler(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 200, res);
});


const filterBody = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(key => {
    if (allowedFields.includes(key)) newObj[key] = obj[key];
  });
  return newObj;
};

// FIXED: Ensure correct construction of documents for insertMany (removal of double hashing, proper passwordConfirm handling)
// exports.insertMany = AsyncHandler(async (req, res, next) => {
//   let users = req.body;

//   if (!Array.isArray(users) || users.length === 0) {
//     return next(new AppError('Please provide an array of user objects', 400));
//   }

//   // Sanitize and prepare users
//   users = users.map(userObj => filterBody(userObj, 'name', 'email', 'password', 'passwordConfirm', 'role', 'photo'));

//   // Now bulk insert using Mongoose validation (let Mongoose/middleware hash the passwords as in pre('save'))
//   try {
//     const createdUsers = await User.insertMany(users, { ordered: false, rawResult: false });
//     return res.status(201).json({
//       status: 'success',
//       insertedCount: createdUsers.length,
//       failedCount: 0,
//       data: {
//         users: createdUsers
//       }
//     });
//   } catch (err) {
//     // If partial success, extract which users failed & why
//     let insertedCount = 0;
//     let successfulUsers = [];
//     let failedDocs = [];
//     let failedMessages = [];

//     if (err.insertedDocs) {
//       insertedCount = err.insertedDocs.length;
//       successfulUsers = err.insertedDocs;
//     }
//     if (err.writeErrors) {
//       failedDocs = err.writeErrors.map(e => e.getOperation ? e.getOperation() : null).filter(Boolean);
//       failedMessages = err.writeErrors.map(e => e.errmsg || e.message);
//     }

//     return res.status(207).json({
//       status: 'partial success',
//       insertedCount,
//       failedCount: failedDocs.length,
//       data: {
//         users: successfulUsers
//       },
//       failedUsers: failedDocs,
//       errors: failedMessages
//     });
//   }
// });