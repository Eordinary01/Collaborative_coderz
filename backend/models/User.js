const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const shortid = require("shortid");

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    collaborationCode: {
      type: String,
      default: shortid.generate,
      unique: true
  }

});

userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
      this.password = await bcrypt.hash(this.password, 8);
    }
    next();
  });

module.exports = mongoose.model('User',userSchema)