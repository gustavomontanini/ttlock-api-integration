import { Router } from 'express';
import { ttlockService } from '../services/ttlock.service.js';

const router = Router();

router.post('/auth/token', async (req, res) => {
    try {
        const data = await ttlockService.authenticate(req.body);
        res.json(data);
    } catch (error) {
        res.status(500).json(error.response?.data || { error: "Falha na autenticação com a TTLock" });
    }
});

router.post('/lock/list', async (req, res) => {
    const { clientId, accessToken } = req.body;
    try {
        const data = await ttlockService.fetchLocks(clientId, accessToken);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Falha ao buscar a lista de fechaduras" });
    }
});

export default router;