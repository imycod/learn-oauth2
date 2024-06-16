const yup = require("yup");
const { object, string, number, array, date } = yup;

const ProfileModel = require("../model/profile");

const getProfiles = async (req, res, next) => {
  try {
    const result = await ProfileModel.find();
    res.send(result);
  } catch (error) {
    next(error);
  }
};

const createProfile = async (req, res, next) => {
  const profileSchema = object({
    userId: string().required(),
    // clients: array()
    //   .of(string().oneOf(["berry"]))
    //   .required(),
    clients: array(),
  });

  try {
    const profile = await profileSchema.validate(req.body, {
      abortEarly: false,
    });
    console.log(profile);
    const model = new ProfileModel(profile);
    const result = await model.save();
    res.send(result);
  } catch (error) {
    next(error);
  }
};

const deleteProfileById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await ProfileModel.findByIdAndDelete(id);
    res.send(result);
  } catch (error) {
    next(error);
  }
};

const updateProfileById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await ProfileModel.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.send(result);
  } catch (error) {
    next(error);
  }
};

const updateClientToProfileById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await ProfileModel.findByIdAndUpdate(
      id,
      { $push: { clients: req.body.clientId } },
      { new: true }
    );
    res.send(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfiles,
  createProfile,
  deleteProfileById,
  updateProfileById,
  updateClientToProfileById,
};
