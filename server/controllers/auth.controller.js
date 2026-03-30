const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userM = require('../models/users');
const { secretKey } = require('../config/config');

module.exports = {
  userLogin: async (req, res) => {
    try {
      const { emailPhone, password } = req.body || {};

      if (!emailPhone || !password) {
        return res.status(400).json({ message: 'Provide all credentials' });
      }

      const loginType = Number.isNaN(Number(emailPhone)) ? 'email' : 'phoneNo';
      const data = await userM.findOne({ [loginType]: emailPhone.trim() }).exec();

      if (!data) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const passMatch = await bcrypt.compare(password, data.password);
      if (!passMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const jwtData = {
        _id: data._id,
        fname: data.fname,
        lname: data.lname,
        email: data.email,
        isAdmin: data.isAdmin,
      };

      const token = jwt.sign({ user: jwtData }, process.env.JWT_SECRET || secretKey, {
        expiresIn: '7d',
      });

      return res.status(200).json({ message: 'Login Successful', token });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  userRegistration: async (req, res) => {
    try {
      const userPayload = {
        fname: req.body.fname,
        lname: req.body.lname || req.body.lName,
        email: req.body.email,
        phoneNo: req.body.phoneNo,
        state: req.body.state,
        city: req.body.city,
        pincode: req.body.pincode,
        userType: req.body.userType || req.body.user_type,
        createdOn: new Date(),
      };

      if (!userPayload.fname || !userPayload.lname || !userPayload.email || !userPayload.phoneNo || !req.body.password) {
        return res.status(400).json({ message: 'Missing required registration fields' });
      }

      const existingUser = await userM.findOne({
        $or: [{ email: userPayload.email }, { phoneNo: userPayload.phoneNo }],
      }).lean();

      if (existingUser) {
        return res.status(409).json({ message: 'User already exists' });
      }

      userPayload.password = await bcrypt.hash(req.body.password, 10);
      const user = new userM(userPayload);
      const data = await user.save();

      return res.status(201).json({ message: 'User Added Successfully', id: data._id });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  userList: async (req, res) => {
    try {
      const data = await userM.find().exec();
      return res.status(200).json({ message: 'Success', data });
    } catch (err) {
      return res.status(400).json({ message: 'Something Went Wrong', data: err.message });
    }
  },

  changePass: async (req, res) => {
    try {
      if (!req.body._id || !req.body.password) {
        return res.status(400).json({ message: 'User id and password are required' });
      }

      const user = await userM.findOne({ _id: req.body._id }).exec();
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const hash = await bcrypt.hash(req.body.password, 10);
      await userM.updateOne({ _id: req.body._id }, { password: hash }).exec();

      return res.status(200).json({ message: 'Password Changed Successfully' });
    } catch (err) {
      return res.status(400).json({ message: 'Something Went Wrong', data: err.message });
    }
  },
};
