const express = require('express');
const multer = require('multer');
const Router = express.Router()
const mergeFiles = require('../controller/mergeFiles')
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname); // Store file with unique name
    }
  });
const upload = multer({ storage: storage });

Router.post('/uploadfiles', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]),mergeFiles.mergeFiles)

module.exports = Router