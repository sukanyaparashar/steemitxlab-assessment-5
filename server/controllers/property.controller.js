const path = require('path');
const fs = require('fs');

const helpers = require('../providers/helper');
const propertyType = require('../models/propertyTypes');
const Property = require('../models/property');

const uploadDir = path.join(__dirname, '..', 'uploads', 'properties');

module.exports = {
  propertyTypeList: (req, res) => {
    propertyType.find({ is_active: true }, (err, result) => {
      if (err) return res.status(400).send(err);
      return res.status(200).json(result);
    });
  },

  addPropertyType: (req, res) => {
    const proptyp = new propertyType({
      title: req.body.title,
      type: req.body.type,
      createdOn: Date.now(),
    });

    proptyp.save((err, result) => {
      if (err) return res.status(400).send(err);
      return res.status(200).json({ message: 'Property type added successfully', id: result._id });
    });
  },

  addNewProperty: async (req, res) => {
    try {
      const imgs = Array.isArray(req.files) ? req.files.map((file) => file.filename) : [];
      const slug = await helpers.slugGenerator(req.body.title, 'title', 'property');

      req.body.slug = slug;
      req.body.type = req.body.Proptype || req.body.type;
      req.body.cornrPlot = req.body.cornrPlot === true || req.body.cornrPlot === 'true';
      req.body.isSociety = req.body.isSociety === true || req.body.isSociety === 'true';
      req.body.images = imgs;
      req.body.imgPath = 'properties';

      if (!req.body.isSociety) {
        req.body.flatNo = '';
        req.body.societyName = '';
      }

      const prop = new Property(req.body);
      const result = await prop.save();

      if (!result || !result._id || !result.slug) {
        throw new Error('Something Went Wrong');
      }

      return res.status(200).json({ result, message: 'Your property has been successfully posted' });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  getUserList: (req, res) => {
    Property.find({ isActive: true, userId: req.params.userId })
      .populate('city', 'name')
      .populate('state', 'name')
      .populate('type', 'title')
      .exec((err, result) => {
        if (err) return res.status(400).send(err);
        return res.status(200).json(result);
      });
  },

  getSingleProperty: async (req, res) => {
    try {
      const result = await Property.findOne({ slug: req.params.propertySlug })
        .populate('city', 'name')
        .populate('state', 'name')
        .populate('type', 'title');

      if (!result) {
        return res.status(404).json({ message: 'Property not found' });
      }

      const files = (result.images || []).map((filename) => ({
        filename,
        url: `/properties/${filename}`,
      }));

      return res.status(200).json({ result, files });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  getFullList: (req, res) => {
    Property.find({ isActive: true })
      .populate('city', 'name')
      .populate('state', 'name')
      .populate('type', 'title')
      .populate('userId', 'fname lname email')
      .exec((err, result) => {
        if (err) return res.status(400).send(err);
        return res.status(200).json(result);
      });
  },

  markAsSold: async (req, res) => {
    try {
      const result = await Property.updateOne(
        { slug: req.params.propertySlug },
        { status: req.body.status, updatedOn: new Date() }
      );

      if (result && result.modifiedCount === 1) {
        return res.status(200).json({ result, message: 'Property has been updated Successfully' });
      }

      throw new Error('Error in updating property');
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  filterProperties: (req, res) => {
    const query = { isActive: true };
    if (req.query.propertyFor) query.propertyFor = { $in: req.query.propertyFor.split(',') };
    if (req.query.type) query.type = { $in: req.query.type.split(',') };
    if (req.query.city) query.city = { $in: req.query.city.split(',') };
    if (req.query.userId) query.userId = req.query.userId;
    if (req.query.notUserId) query.userId = { $ne: req.query.notUserId };
    if (req.query.status) query.status = { $in: req.query.status.split(',') };

    Property.find(query)
      .populate('city', 'name')
      .populate('state', 'name')
      .populate('type', 'title')
      .populate('userId', 'fname lname email')
      .exec((err, result) => {
        if (err) return res.status(400).send(err);
        return res.status(200).json(result);
      });
  },

  testController: async (req, res) => {
    const testData = await Property.find({ updatedOn: { $gte: '2019-04-01' } });
    return res.send(testData);
  },

  showGFSImage: (req, res) => {
    const filePath = path.join(uploadDir, path.basename(req.params.filename));
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ err: 'No file exists' });
    }
    return res.sendFile(filePath);
  },
};
