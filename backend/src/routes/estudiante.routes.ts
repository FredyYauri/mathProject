import { Router } from 'express';
import * as estudianteController from '../controllers/estudiante.controller';
import { requireStudentSession } from '../middleware/auth';

export const estudianteRouter = Router();

estudianteRouter.get('/sesion', requireStudentSession, estudianteController.getSesion);
