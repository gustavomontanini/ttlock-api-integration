import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());

const BASE_URL = 'https://api.sciener.com';

app.post('/api/auth/token', async (req, res) => {
    const { clientId, clientSecret, username, password } = req.body;
    try {
        const params = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            username: username,
            password: password,
            grant_type: 'password'
        });
        const response = await axios.post(`${BASE_URL}/oauth2/token`, params.toString());
        res.json(response.data);
    } catch (error) {
        res.status(500).json(error.response?.data || { error: "Auth failed" });
    }
});

app.post('/api/lock/list', async (req, res) => {
    const { clientId, accessToken } = req.body;
    try {
        const response = await axios.get(`${BASE_URL}/v3/lock/list`, {
            params: { clientId, accessToken, pageNo: 1, pageSize: 50, date: Date.now() }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch locks" });
    }
});

app.listen(3001, () => console.log('Proxy running on http://localhost:3001'));