import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { estimateFareController } from './estimateFare.controller';
import { estimateFareValidation } from './estimateFare.validation';
import { USER_ROLE } from '../../../enums/enums';

const router = express.Router();

router.post(
'/calculate-fare',
auth(USER_ROLE.RIDER),
estimateFareController.estimateFare,
);

router.get('/getMyEstimatelist', auth(USER_ROLE.RIDER), estimateFareController.getMyEstimateFareList);
// router.get('/', auth(), estimateFareController.getEstimateFareList);

// router.get('/:id', auth(), estimateFareController.getEstimateFareById);

// router.put(
// '/:id',
// auth(),
// estimateFareController.updateEstimateFare,
// );

// router.delete('/:id', auth(), estimateFareController.deleteEstimateFare);

export const estimateFareRoutes = router;