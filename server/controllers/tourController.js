const Tour = require('../Model/tourModel');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const factory = require('../utils/handlerFactory');
const slugify = require('slugify');

// const filterObj = (obj, ...allowedFields) => {
//   const newObj = {};
//   Object.keys(obj).forEach(el => {
//     if (allowedFields.includes(el)) newObj[el] = obj[el];
//   });
//   return newObj;
// };

exports.aliasExpensiveTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-price';
  req.query.fields = 'name,price,difficulty,duration';
  next();
};

exports.aliasTopRated = (req, res, next) => {
  req.query.limit = '10';
  req.query.sort = '-ratingsAverage,-ratingsQuantity';
  req.query.fields = 'name,ratingsAverage,ratingsQuantity,price';
  next();
};

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, [
  { path: 'guides', select: '-__v -passwordChangedAt' },
  { path: 'reviews', populate: { path: 'user', select: 'name photo' } }
]);
exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = asyncHandler(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 0 } }
    },
    {
      $group: {
        _id: '$difficulty',
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: stats
  });
});

exports.getBusiestMonth = asyncHandler(async (req, res, next) => {
  const year = parseInt(req.params.year, 10);
  if (Number.isNaN(year)) return next(new AppError('Invalid year parameter', 400));

  const stats = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numTourStarts: -1 }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: stats
  });
});

exports.getToursWithin = asyncHandler(async (req, res, next) => {
  const { distance, latlng } = req.params;
  const unit = req.params.unit || 'mi';
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    return next(new AppError('Please provide latitude and longitude in format lat,lng', 400));
  }

  if (unit !== 'mi' && unit !== 'km')
    return next(new AppError('Unit must be either km or mi', 400));

  const radius = unit === 'mi'
    ? parseInt(distance, 10) / 3963.2
    : parseInt(distance, 10) / 6378.1;

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[parseFloat(lng), parseFloat(lat)], radius]
      }
    }
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { data: tours }
  });
});

exports.getDistances = asyncHandler(async (req, res, next) => {
  const { latlng } = req.params;
  const unit = req.params.unit || 'mi';
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    return next(new AppError('Please provide latitude and longitude in format lat,lng', 400));
  }

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        distanceField: 'distance',
        spherical: true
      }
    },
    {
      $project: {
        distance: { $multiply: ['$distance', multiplier] },
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: distances
  });
});

// Improved bulk insert with better partial error handling and accurate insertedCount
// exports.insertManyTours = asyncHandler(async (req, res, next) => {
//   let tours = req.body;

//   if (!Array.isArray(tours) || tours.length === 0) {
//     return next(
//       new AppError('Please provide an array of tour objects', 400)
//     );
//   }

//   tours = tours.map((tour) => {
//     const filtered = filterObj(
//       tour,
//       'name',
//       'duration',
//       'durations',
//       'maxGroupSize',
//       'difficulty',
//       'price',
//       'priceDiscount',
//       'summary',
//       'description',
//       'imageCover',
//       'images',
//       'ratingsAverage',
//       'ratingsQuantity',
//       'startDates',
//       'secretTour',
//       'startLocation',
//       'locations',
//       'guides'
//     );

//     // Keep the schema's required field name consistent.
//     // Accept both "duration" and "durations" so bulk imports don't fail on older payloads.
//     if (filtered.duration != null && filtered.durations == null) {
//       filtered.durations = filtered.duration;
//     }
//     delete filtered.duration;

//     // Only add slug if we actually have a name
//     if (filtered.name) {
//       filtered.slug = slugify(filtered.name, {
//         lower: true,
//         strict: true
//       });
//     }

//     return filtered;
//   });

//   // Uncomment these lines if needed for debugging:
//   // console.log('BODY:', JSON.stringify(req.body, null, 2));
//   // console.log('TOURS:', JSON.stringify(tours, null, 2));

//   const settled = await Promise.allSettled(
//     tours.map(tour => new Tour(tour).save())
//   );

//   const insertedTours = settled
//     .filter(result => result.status === 'fulfilled')
//     .map(result => result.value);

//   const failedTours = settled
//     .map((result, index) => ({
//       tour: tours[index],
//       error: result.status === 'rejected' ? result.reason?.message || String(result.reason) : null
//     }))
//     .filter(item => item.error);

//   if (insertedTours.length === 0) {
//     return res.status(400).json({
//       status: 'fail',
//       insertedCount: 0,
//       errors: failedTours.map(item => item.error),
//       data: {
//         tours: []
//       }
//     });
//   }

//   return res.status(failedTours.length ? 207 : 201).json({
//     status: failedTours.length ? 'partial success' : 'success',
//     insertedCount: insertedTours.length,
//     failedCount: failedTours.length,
//     data: {
//       tours: insertedTours
//     },
//     errors: failedTours.map(item => item.error)
//   });


// });
