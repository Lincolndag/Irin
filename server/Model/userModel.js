const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// User Schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A user must have a name']
    },
    email: {
        type: String,
        required: [true, 'A user must have an email'],
        unique: true,
        lowercase: true
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    photo: String,
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            validator: function(el) {
                return el === this.password;
            },
            message: 'Passwords are not the same'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true
    }
});

userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
});

 //compare password
 userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword)};

    //check if password was changed after the token was issued
    userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
        if (this.passwordChangedAt) {
          const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
          return JWTTimestamp < changedTimestamp;
        }
        return false;
      };
   

// Create password reset token functionality


userSchema.methods.createPasswordResetToken = function() {
    // Generate a random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Save the hashed token on the user document
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expiration 10 minutes from now
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    // Return the plain token to send to user via email
    return resetToken;
};

userSchema.pre(/^find/, function() {
    // 'this' refers to the query
    this.find({ active: { $ne: false } });
});

const User = mongoose.model('User', userSchema);

// Middleware to exclude all users with active: false in queries


module.exports = User;
