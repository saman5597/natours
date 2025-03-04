const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const User = require('./../models/userModel');
const catchAsync = require('./../util/catchAsync');
const AppErrorHandler = require('./../util/errorHandler');
const Email = require('./../util/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createAndSendToken = (user, statusCode, message, req, res) => {
  const token = signToken(user._id);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    httpOnly: true
  });
  // Remove pwd from output
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    message,
    token,
    data: {
      user
    }
  });
};

// Middlewares ---------------------------------------------------
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it exists
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
      new AppErrorHandler(
        'You are not logged in. Please login to get access.',
        401
      )
    );
  }
  // 2) Validate token (Verification)
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppErrorHandler(
        'The user belonging to the token does no longer exist.',
        401
      )
    );
  }
  // 4) If user change password after token was issued
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppErrorHandler(
        'User recently changed password. Please login again.',
        401
      )
    );
  }
  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser; //Passing user variable in pug templates
  next();
});

// Only for rendered pages and there will be no error
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) Verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      // 3) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      // 4) If user change password after token was issued
      if (currentUser.changePasswordAfter(decoded.iat)) {
        return next();
      }
      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser; //Passing user variable in pug templates
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // Roles is an Array (admin , lead-guide)
    if (!roles.includes(req.user.role)) {
      next(
        new AppErrorHandler(
          'You do not have permission to perform this action.',
          403
        )
      );
    }
    next();
  };
};

// Route Handlers -----------------------------------------------
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  createAndSendToken(newUser, 201, 'User signed up successfully.', req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1) Check if email n password exist
  if (!email || !password) {
    return next(new AppErrorHandler('Please provide email and password.', 400));
  }
  // 2) Check if email n password is correct
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppErrorHandler('Incorrect email or password.', 401));
  }
  // 3) If everything is ok, send the token back to client
  createAndSendToken(user, 200, 'User logged in successfully.', req, res);
});

exports.logout = (req, res) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 10 * 1000),
    secure: false,
    httpOnly: true
  };
  res.cookie('jwt', 'loggedout', cookieOptions);
  res.status(200).json({ status: 'success' });
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppErrorHandler('There is no user with that email address.', 404)
    );
  }
  // 2) Generate the random user token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // 3) Send it to user's mail
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/resetPassword?rt=${resetToken}`;

    await new Email(user, resetURL, resetToken).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to mail'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppErrorHandler(
        'There was an error sending the mail. Try again later.',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  // 2) If token is expired , and there is user , set the new pwd
  if (!user) {
    return next(new AppErrorHandler('Token is invalid or has expired.', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3) Update changePasswordAt property for the user - Done in middleware (model)
  // 4) Log the user in , send token (JWT)
  createAndSendToken(user, 200, 'User logged in with new password.', req, res);
});

exports.changePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from the collection
  const user = await User.findById(req.user.id).select('+password');
  // 2) Check if the POSTed pwd is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(
      new AppErrorHandler('Your current password is incorrect.', 401)
    );
  }
  // 3) If the pwd is correct, update the pwd
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // 4) Log user in , send jwt (token)
  createAndSendToken(
    user,
    200,
    'User logged in with updated password.',
    req,
    res
  );
});
