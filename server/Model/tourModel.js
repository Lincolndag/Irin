const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
    unique: true,
    trim: true,
    maxlength: [40, 'A tour name must have less or equal than 40 characters'],
    minlength: [10, 'A tour name must have more or equal than 10 characters'],
  },
  slug: String,
  durations: {
    type: Number,
    required: [true, 'A tour must have a duration']
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'A tour must have a group size']
  },
  difficulty: {
    type: String,
    required: [true, 'A tour must have a difficulty']
  },
  rating: {
    type: Number,
    default: 4.5
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'A tour rating must be greater or equal than 1'],
    max: [5, 'A tour rating must be less or equal than 5']
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price']
  },
  priceDiscount: Number,
  summary: {
    type: String,
    trim: true,
    required: [true, 'A tour must have a summary']
  },
  description: {
    type: String,
    trim: true,
    required: [true, 'A tour must have a description']
  },
  imageCover: {
    type: String,
    // required: [true, 'A tour must have a cover image']
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  startDates: [Date],
  secretTour: {
    type: Boolean,
    default: false
  },

  startLocation: {
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: [Number], // [longitude, latitude]
    address: String,
    description: String
  },
  
  // locations - array of embedded sub-documents
  locations: [
    {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String,
      day: Number
    }
  ],

  guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }]
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


tourSchema.virtual('reviews', {
  ref: 'Review', 
  foreignField: 'tour', 
  localField: '_id' 
});

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ difficulty: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// Document middleware: runs before .save() and .create()
tourSchema.pre('save', async function() {
  this.slug = slugify(this.name, { lower: true });
});
// Query middleware: filter out secret tours on all find queries
tourSchema.pre(/^find/, function() {
  this.find({ secretTour: { $ne: true } });
  // Populate reviews with their tour id (using virtual population)
  this.populate({ path: 'reviews' });
});
// Aggregation middleware: filter out secret tours from aggregate operations
tourSchema.pre('aggregate', function() {
  // Ensure the first pipeline stage filters out secret tours
  const matchStage = { $match: { secretTour: { $ne: true } } };
  // Only prepend if it's not already filtering secretTour
  if (
    !this.pipeline().length ||
    JSON.stringify(this.pipeline()[0]) !== JSON.stringify(matchStage)
  ) {
    this.pipeline().unshift(matchStage);
  }
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
