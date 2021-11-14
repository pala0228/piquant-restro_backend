const multer = require('multer'); // Package to parse file content

// Valid mime types to be validated at server while parsing file content
const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg"
};

// To control where file gets stored and required file name that we want
const storage = multer.diskStorage({
  /**
   * Accept req, file and call back function which we will call back
   * once we are done.
   */
  destination: (req, file, cb) => {
    cb(null, "images"); // null means destination is found no error, and destinatin folder is 'images'
  },
  filename: (req, file, cb) => { // how file name be saved
    const name = file.originalname
      .toLowerCase()
      .split(" ")
      .join("-");
    const ext = MIME_TYPE_MAP[file.mimetype]; // getting file extension
    cb(null, name + "-" + Date.now() + "." + ext); // same as above,,explained.
  }
});

// To check file extension
const fileFilter = (req, file, cb) => {
  const validMimeType = MIME_TYPE_MAP[file.mimetype];
  if (validMimeType) {
    cb(null, true); // if valid file extension call back return true
  } else {
    cb(null, false); // if invalid file extension call back return false
  }
}

/**
 * exporting multer function to save file in declared destination and with required filename
 * and to check file extension
 *
 * To access single file saved with name of variable called 'image'
 */
module.exports = multer({ storage: storage, fileFilter: fileFilter }).single('image');
