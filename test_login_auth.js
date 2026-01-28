const axios = require('axios');

const url = 'https://delhiveryway-backend-1.onrender.com/api/auth/google';
const payload = {
    email: 'test_google_login_' + Date.now() + '@example.com',
    name: 'Test User',
    googleId: '1234567890' + Date.now(),
    role: 'customer'
};

const runTests = async () => {
    try {
        console.log('Test 1: Normal Request (No Auth Header)');
        const res1 = await axios.post(url, payload);
        console.log('✅ Test 1 Success:', res1.status, res1.data.success);
    } catch (err) {
        console.log('❌ Test 1 Failed:', err.response ? err.response.status : err.message);
        if (err.response) console.log(err.response.data);
    }

    try {
        console.log('\nTest 3: Request with "Origin: https://localhost"');
        const res3 = await axios.post(url, payload, {
            headers: { 'Origin': 'https://localhost' }
        });
        console.log('✅ Test 3 Success:', res3.status, res3.data.success);
    } catch (err) {
        console.log('❌ Test 3 Failed:', err.response ? err.response.status : err.message);
        if (err.response) console.log('Response:', err.response.data);
    }
};

runTests();
