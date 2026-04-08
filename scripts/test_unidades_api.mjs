import fetch from 'node-fetch';

async function testApi() {
    try {
        const response = await fetch('http://localhost:3000/api/admin/unidades');
        const data = await response.json();
        console.log('API Response Status:', response.status);
        console.log('API Data type:', typeof data);
        console.log('Is Array?', Array.isArray(data));
        if (Array.isArray(data)) {
            console.log('First 2 items:', data.slice(0, 2));
        } else {
            console.log('Data:', data);
        }
    } catch (error) {
        console.error('Error fetching API:', error);
    }
}

testApi();
