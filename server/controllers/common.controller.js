const state_model = require('../models/state');
const city_model = require('../models/city');
const users = require('../models/users');

module.exports = {
  getStateList: async (req, res) => {
    try {
      const data = await state_model.find({ is_active: true }).exec();
      return res.status(200).send(data);
    } catch (err) {
      return res.status(400).send(err);
    }
  },

  addState: async (req, res) => {
    try {
      const state = new state_model({ name: req.body.name });
      await state.save();
      return res.json({ message: 'State added successfully' });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  getAllCities: async (req, res) => {
    try {
      const data = await city_model.find({ is_active: true }).populate('state_id', 'name').exec();
      return res.status(200).json(data);
    } catch (err) {
      return res.status(400).send(err);
    }
  },

  getCityList: async (req, res) => {
    try {
      const data = await city_model.find({ state_id: req.params.state_id, is_active: true }).populate('state_id', 'name').exec();
      return res.status(200).json(data);
    } catch (err) {
      return res.status(400).send(err);
    }
  },

  addCity: async (req, res) => {
    try {
      const city = new city_model(req.body);
      const result = await city.save();
      if (!result) throw new Error('Something Went Wrong');
      return res.status(200).json({ message: 'City added successfully' });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  removeCity: async (req, res) => {
    try {
      const result = await city_model.deleteOne({ _id: req.params.cityId });
      return res.status(200).json({ message: 'City removed successfully', data: result });
    } catch (err) {
      return res.status(400).send(err);
    }
  },

  checkemailAvailability: async (req, res) => {
    try {
      const email = req.params.email;
      const result = await users.find({ email }).exec();
      return res.status(200).json({ response: result.length > 0 });
    } catch (err) {
      return res.status(400).send(err);
    }
  },
};
