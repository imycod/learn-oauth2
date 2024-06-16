const yup = require("yup");
const { object, string, number, date } = yup;
const UserModel = require("../model/user");
const ProfileModel = require("../model/profile");

const userSchema = object({
  username: string().required(),
  password: string().required(),
});

const createUser = async (req, res, next) => {
  try {
    const user = await userSchema.validate(req.body);
    const model = new UserModel(user);
    const result = await model.save();
    res.send(result);
  } catch (error) {
    next(error);
  }
};

const findUserById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await UserModel.findOne({
      _id: id,
    });
    res.send(result);
  } catch (error) {
    next(error);
  }
};

const deleteUserById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await UserModel.findByIdAndDelete(id);
    if (result) {
      const profile = await ProfileModel.findOneAndDelete({
        userId: id,
      });
      res.send({
        user: result,
        profile: profile,
      });
    }
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const result = await UserModel.find();
    res.send(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  createUser,
  findUserById,
  deleteUserById,
};
