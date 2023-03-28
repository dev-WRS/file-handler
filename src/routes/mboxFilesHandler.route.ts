import express from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import logging from '../config/logging';

import mboxFilesHandlerController from '../controllers/mboxFilesHandler.controller';

const router = express.Router();
const NAMESPACE = 'Mbox File Handler Route';
/** Ping to controller */
router.get('/ping', mboxFilesHandlerController.mboxHealthCheck);

/** Upload mbox files */
const uploadFolder = path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        logging.info(NAMESPACE, `Files uploaded successfully to ${uploadFolder}.`);
        cb(null, uploadFolder);
    },
    filename: (req, file, cb) => {
        logging.info(NAMESPACE, `Files ${file.originalname} uploaded successfully.`);
        cb(null, file.originalname);
    }
});

const option: multer.Options = {
    storage: storage,
    fileFilter: (req, file: Express.Multer.File, cb: FileFilterCallback) => {
        const extName = path.extname(file.originalname);
        if (extName === '.mbox') {
            logging.info(NAMESPACE, `Files ${file.originalname} is allow to upload.`);
            cb(null, true);
        } else {
            logging.error(NAMESPACE, `Files ${file.originalname} is not allow to upload.`);
            cb(null, false);
        }
    }
};
const upload = multer(option);

router.post('/upload', upload.array('files'), mboxFilesHandlerController.mboxFilesUpload);

/** Handle mbox files */
router.post('/handle', mboxFilesHandlerController.mboxFileHandle);

/** Export route */
export = router;
