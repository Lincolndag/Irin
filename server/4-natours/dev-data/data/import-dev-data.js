const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const Tour = require('../../../Model/tourModel');

// Load environment variables from the project root config.env
dotenv.config({ path: path.join(__dirname, '../../../config.env') });
const DB = process.env.DATABASE_LOCAL;

mongoose.connect(DB)
  .then(() => console.log('DB connection successful!'))
  .catch(err => console.log('ERROR:', err));


  const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'));

  const toursInsert = async () => {
    try {
        await Tour.create(tours);
        console.log('Tours inserted successfully');
    } catch (err) {
        console.log('ERROR:', err);
    }
  }




  const toursDelete = async () => {
    try {
        await Tour.deleteMany();
        console.log('Tours deleted successfully');
    } catch (err) {
        console.log('ERROR:', err);
    }
  }


   if (process.argv[2] === '--import') {
    toursInsert();
    console.log('Importing data...');
   } else if (process.argv[2] === '--delete') {
    toursDelete();
    console.log('Deleting data...');
   }
     