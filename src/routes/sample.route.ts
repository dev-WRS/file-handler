import express from 'express';
import sampleController from '../controllers/sample.controller';

const sampleRouter = express.Router();

sampleRouter.get('/ping', sampleController.sampleHealthCheck);

export = sampleRouter;
