class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // 1) Basic filtering
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // 2) Advanced filtering: turn "price[lte]=1000" into { price: { $lte: 1000 } }
    const filters = {};
    Object.entries(queryObj).forEach(([key, value]) => {
      const match = key.match(/^(.+)\[(gte|gt|lte|lt)\]$/);
      if (match) {
        const field = match[1];
        const operator = `$${match[2]}`;
        if (!filters[field]) filters[field] = {};
        filters[field][operator] = value;
      } else {
        filters[key] = value;
      }
    });

    this.query = this.query.find(filters);
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;


