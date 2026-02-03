const API_URL = 'http://localhost:5000/api';

async function test() {
    try {
        // 1. Register a new Contractor
        const username = 'contractor_' + Date.now();
        const email = 'contractor_' + Date.now() + '@test.com';
        const password = 'password123';

        console.log(`1. Registering ${username}...`);
        const regRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, role: 'contractor' })
        });
        const regData = await regRes.json();
        if (!regRes.ok) throw new Error(regData.error || 'Registration failed');

        // 2. Login
        console.log('2. Logging in...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginData.message || 'Login failed');

        const token = loginData.token;
        console.log('   Token received.');

        // 3. Fetch Tenders
        console.log('3. Fetching Tenders...');
        const tendersRes = await fetch(`${API_URL}/tenders`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tendersData = await tendersRes.json();

        console.log(`   Success! Found ${tendersData.length} tenders.`);
        tendersData.forEach(t => {
            console.log(`   - [${t.status}] ${t.title} (Deadline: ${t.deadline})`);
        });

    } catch (err) {
        console.error('ERROR:', err.message);
    }
}

test();
