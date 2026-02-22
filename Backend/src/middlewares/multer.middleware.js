import multer from "multer";

const myStorage = multer.memoryStorage();

const upload = multer({ storage: myStorage });

export default upload;
