import express from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import logging from '../config/logging';
import fs from 'fs';

import mboxFilesHandlerController from '../controllers/mboxFilesHandler.controller';

const router = express.Router();
const NAMESPACE = 'Mbox File Handler Route';
/** Ping to controller */
router.get('/ping', mboxFilesHandlerController.mboxHealthCheck);

/** Upload mbox files */

const uploadFolder = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder);
    logging.info(`Folder upload created successfully on.`);
}

const outputFolder = path.join(__dirname, '../../output');
if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder);
    logging.info(`Folder output created successfully on.`);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        logging.info(`Files uploaded successfully to ${uploadFolder}.`, { label: NAMESPACE });
        cb(null, uploadFolder);
    },
    filename: (req, file, cb) => {
        logging.info(`Files ${file.originalname} uploaded successfully.`, { label: NAMESPACE });
        cb(null, file.originalname);
    }
});

const option: multer.Options = {
    storage: storage,
    fileFilter: (req, file: Express.Multer.File, cb: FileFilterCallback) => {
        const extName = path.extname(file.originalname);
        if (extName === '.mbox') {
            logging.info(`Files ${file.originalname} is allow to upload.`, { label: NAMESPACE });
            cb(null, true);
        } else {
            logging.error(`Files ${file.originalname} is not allow to upload.`, { label: NAMESPACE });
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
