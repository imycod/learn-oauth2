const { object, string, number, date } = require("yup");
const ClientModel = require("../model/client");
const ProfileModel = require("../model/profile");

const getClients = async (req, res, next) => {
  try {
    const result = await ClientModel.find();
    res.send(result);
  } catch (error) {
    next(error);
  }
};

const createClient = async (req, res, next) => {
  const clientSchema = object({
    name: string().required(),
    secret: string().required(),
    redirect_url: string().required(),
  });
  try {
    const client = await clientSchema.validate(req.body);
    const model = new ClientModel(client);
    const result = await model.save();
    res.send(result);
  } catch (error) {
    next(error);
  }
};

const updateClientById = async (req, res, next) => {
  const clientSchema = object({
    name: string().required(),
    secret: string().required(),
    redirect_url: string().required(),
  });
  try {
    const { id } = req.params;
    const client = await clientSchema.validate(req.body);
    const result = await ClientModel.findByIdAndUpdate(
      id,
      {
        // merge
        $set: client,
      },
      {
        new: true,
      }
    );
    res.send(result);
  } catch (error) {
    next(error);
  }
};

const deleteClientById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await ClientModel.findByIdAndDelete(id);
    // 如果找到并删除了 Client
    if (result) {
      // 查找所有包含该 Client 的 Profile
      // 查找所有 clients 数组中包含 clientId 的文档。
      // 从这些文档的 clients 数组中删除 clientId。
      const profiles = await ProfileModel.updateMany(
        { clients: id },
        { $pull: { clients: id } }
      );

      res.send({
        result,
        relate: {
          profiles,
        },
      });
    } else {
      res.status(404).send({ message: "Client not found" });
    }
  } catch (error) {
    next(error);
  }
};

const findClientById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await ClientModel.findOne({
      id: id,
    });
    res.send(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClients,
  createClient,
  updateClientById,
  deleteClientById,
  findClientById,
};
