const {Schema, model} = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

const FollowSchema = Schema({
    user: {
        type: Schema.ObjectId,
        ref: "User",
    },
    followed: {
        type: Schema.ObjectId,
        ref: "User",
    },
    created_at: {
        type: Date,
        default: Date.now,
    }
});

// Aplicar el plugin de paginación a tu modelo Follow
FollowSchema.plugin(mongoosePaginate);

module.exports = model("Follow", FollowSchema, "follows");