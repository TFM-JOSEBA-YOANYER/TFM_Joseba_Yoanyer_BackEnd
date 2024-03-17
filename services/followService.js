const Follow = require("../models/followModels");

const followUserIds = async (identityUserID) => {
    //Sacar información de seguimiento
  try {
    const following = await Follow.find({ user: identityUserID })
      .select("-_id -__v -user -created_at")
      .exec();

    const followers = await Follow.find({ followed: identityUserID })
      .select({"user":1, "_id":0})
      .exec();

      //Procesar array de identificadores
      let followingClean = [];
      following.forEach(follow => {
        followingClean.push(follow.followed);
      });

      let followersClean = [];
      followers.forEach(follow => {
        followersClean.push(follow.user);
      });

    return {
      following: followingClean,
      followers: followersClean,
    };
  } catch (error) {
    console.error(error);
    throw new Error("Error al obtener los IDs de los seguidores");
  }
};

const followThisUser = async (identityUserId, profileUserId) => {
    try {

         //Sacar información de seguimiento
         const following = await Follow.findOne({ user: identityUserId , followed: profileUserId })
        //   .select("-_id -__v -user -created_at")
        //   .exec();

        const follower = await Follow.findOne({ user: profileUserId, followed: identityUserId })
        //   .select({"user":1, "_id":0})
        //   .exec();

        return {
            following,
            follower,
        }
    } catch (error) {
        throw new Error("Error al verificar el seguimiento de usuarios");
    }
   
};

module.exports = {
  followUserIds,
  followThisUser,
};
