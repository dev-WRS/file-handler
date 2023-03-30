import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';

import logging from './config/logging';
import config from './config/config';
import sampleRoute from './routes/sample.route';
import mboxFilesHandlerRoute from './routes/mboxFilesHandler.route';

const NAMESPACE = 'Server';

const router = express();

/** Logging the request */
router.use((req, res, next) => {
    logging.info(`METHOD - [${req.method}], URL - [${req.url}], IP - [${req.socket.remoteAddress}]`, { label: NAMESPACE });

    res.on('finish', () => {
        logging.info(`METHOD - [${req.method}], URL - [${req.url}], IP - [${req.socket.remoteAddress}], STATUS - [${res.statusCode}]`, { label: NAMESPACE });
    });

    next();
});

/**Parse the request */
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

/** Rules of our API */
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    if (req.method == 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'GET PATCH DELETE POST PUT');
        return res.status(200).json({});
    }

    next();
});

/** Routes */
router.use('/sample', sampleRoute);
router.use('/mbox', mboxFilesHandlerRoute);

/**Error Handling */
router.use((req, res, next) => {
    const error = new Error('Router not found');

    logging.error('Router not found.', { label: NAMESPACE, message: error.message });

    return res.status(404).json({
        message: error.message
    });
});

/** Create the server */
const httpServer = http.createServer(router);
httpServer.listen(config.server.port, () => {
    logging.info(`Server running on ${config.server.hostname}:${config.server.port}`, { label: NAMESPACE });
});
