
import axios from 'axios';

async function testLoginAndFetch() {
    const loginUrl = 'http://localhost:4000/api/v1/auth/login';
    const statsUrl = 'http://localhost:4000/api/v1/faq-admin/stats';

    try {
        console.log('Attempting login...');
        const loginRes = await axios.post(loginUrl, {
            email: 'admin@thny.sg',
            password: 'password123'
        });

        if (loginRes.data.code === 200 && loginRes.data.data.accessToken) {
            const token = loginRes.data.data.accessToken;
            console.log('Login successful. Token:', token.substring(0, 20) + '...');

            console.log('Fetching stats...');
            const statsRes = await axios.get(statsUrl, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Stats response:', JSON.stringify(statsRes.data, null, 2));

            if (statsRes.data.success || statsRes.data.code === 200) {
                console.log('SUCCESS: API is reachable and returning data with valid token.');
            } else {
                console.log('FAILURE: API returned unexpected response.');
            }

        } else {
            console.error('Login failed or unexpected response:', loginRes.data);
        }
    } catch (e: any) {
        console.error('Error during test:', e.message);
        if (e.response) {
            console.error('Response status:', e.response.status);
            console.error('Response data:', e.response.data);
        }
    }
}

testLoginAndFetch();
