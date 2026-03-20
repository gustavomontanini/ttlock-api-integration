import { Router } from 'express';
import { passcodeService } from '../services/passcode.service.js';

const router = Router();

router.post('/generate-random', async (req, res) => {
    const { accessToken, lockId, passcodeType, startDate, endDate } = req.body;
    
    try {
        const data = await passcodeService.getRandomPasscode(
            accessToken, 
            lockId, 
            passcodeType, 
            startDate, 
            endDate
        );
        res.json(data);
    } catch (error) {
        res.status(500).json(error.response?.data || { errcode: -1, errmsg: "Falha ao tentar criar senha aleatória." });
    }
});

export default router;