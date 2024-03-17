const { Schema, model } = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const userSchema = Schema({
    name:{
        type: String,
        require: true,
    },
    surname:{
        type: String,
        require: true,
    },
    bio: {
        type: String,
    },
    nick:{
        type: String,
        require: true,
    },
    email:{
        type: String,
        require: true,
    },
    password:{
       type: String,
       require: true, 
    },
    role:{
        type: String,
        default: 'role_user',
    },
    image:{
        type: String,
        default: 'default.png',
    },
    create_at: {
        type: Date,
        default: Date.now,
    },
});

// Aplicar el plugin de paginación al esquema
userSchema.plugin(mongoosePaginate);


module.exports = model('User', userSchema, 'users' );