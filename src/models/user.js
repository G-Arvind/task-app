const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('../models/task')

// User Schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim:true,
        required: true
    },
    email: {
        type:String,
        unique:true,
        trim:true,
        required:true,
        lowercase:true,
        validate(value) {
            if(!validator.isEmail(value)) {
                throw new Error('Invalid email ID');
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value) {
            if(value.toLowerCase().includes('password')) {
                throw new Error('password should not contain password');
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if(value < 0) {
                throw new Error('Age should be greater than 0')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true,
        }
    }],
    avatar : {
        type: Buffer
    }
}, {
    timestamps: true
});

//Relation between Task & User model
userSchema.virtual('tasks', {
    ref: 'Tasks',
    localField: '_id',
    foreignField: 'owner'
});

//Mongoose custom Methods
//Generate auth token
userSchema.methods.getAuthToken = async function () {
        
    const user = this;

    const token = jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET_KEY);

    user.tokens = user.tokens.concat({token});

    await user.save();

    return token;
}

//Format data before sending (remove password and token array)
userSchema.methods.toJSON = function() {

    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;

    return userObject;
}

// Method for validating user credentials
userSchema.statics.findUserByCredentials = async (email, password) => {
        
    const user = await User.findOne({email});
        
        if(!user) {
            throw new Error('Unable to login');
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch) {
            throw new Error('Unable to login');
        }

        return user;
}

// Mongoose Middleware
// Hash the password before it is saved
userSchema.pre('save', async function(next) {
    const user = this;

    // Check if user password is changed before hashing
    if(user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    next();
});

// Remove all tasks of a user before removing user
userSchema.pre('remove', async function (next) {

    const user = this;

    await Task.deleteMany({ owner: user._id });

    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
