import axios from 'axios';
import 'dotenv/config'; 

const BASE_URL = 'https://api.sciener.com';

export const passcodeService = {
    async getRandomPasscode(accessToken, lockId, passcodeType, startDate, endDate) {
        const params = new URLSearchParams({
            clientId: process.env.TTLOCK_CLIENT_ID,
            accessToken: accessToken,
            lockId: lockId,
            keyboardPwdType: passcodeType, 
            startDate: startDate, 
            endDate: endDate,     
            date: Date.now()
        });
        
        const response = await axios.post(`${BASE_URL}/v3/keyboardPwd/get`, params.toString());
        return response.data;
    }
};