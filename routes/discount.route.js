import express from 'express';
import { verifyDiscountAuthorization, createDiscountUser, getDiscountUsers, getDiscountReport, changeDiscountUserPassword, getServiceChargeReport } from '../controllers/discount.controller.js';
import { verifyToken } from '../middleware/jwt.js';

const router = express.Router();

// Verify discount authorization
router.post('/verify', verifyDiscountAuthorization);
router.post('/createUser', verifyToken, createDiscountUser);
router.get('/getUsers', getDiscountUsers);
router.get("/service-charge-report", verifyToken, getServiceChargeReport);
router.get("/report", verifyToken, getDiscountReport);
router.put("/pwd", verifyToken, changeDiscountUserPassword);

// Get discount logs
//router.get('/logs', authenticate, getDiscountLogs);

export default router;