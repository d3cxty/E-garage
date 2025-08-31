import path from 'path';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import env from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN } || '*'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const __root = path.resolve();
app.use('/uploads', express.static(path.join(__root, 'uploads')));

app.use('/', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
