const multer = require('multer');
const sharp = require('sharp');
const AppErrorHandler = require('../util/errorHandler');
const User = require('../models/userModel');
const catchAsync = require('../util/catchAsync');
const factory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppErrorHandler('Not an image, please upload only images!', 404),
      false
    );
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

//Middlewares -----------------------------------------------------
exports.getMyProfile = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

//Route handlers
exports.updateMyProfile = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs pwd data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppErrorHandler(
        'This route is not for password updates. Please use /changePassword.',
        400
      )
    );
  }
  // 2) Filtered out unwanted field names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;
  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    message: 'User details updated successfully',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMyAccount = catchAsync(async (req, res, next) => {
  const deletedUser = await User.findByIdAndUpdate(req.user.id, {
    active: false
  });
  res.status(204).json({
    status: 'success',
    message: 'User account deleted',
    data: {
      user: deletedUser
    }
  });
});

exports.getAllUsers = factory.getAll(User);

exports.getUser = factory.getOne(User);

//No Create User function as we have sign up function
exports.createUser = (req, res) => {
  // Send Response
  res.status(500).json({
    status: 'fail',
    message: 'This route is not defined. Please use /v1/users/signup instead.'
  });
};

// Do NOT update passwords with this
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);
