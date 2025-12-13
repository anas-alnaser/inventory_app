// Simple script to call the seedAITestData function
const https = require('https');

const PROJECT_ID = 'anas-9f395';
const FUNCTION_URL = `https://us-central1-${PROJECT_ID}.cloudfunctions.net/seedAITestData`;

console.log('🚀 Calling seedAITestData function...');
console.log('URL:', FUNCTION_URL);

const data = JSON.stringify({ data: {} });

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
  },
};

const req = https.request(FUNCTION_URL, options, (res) => {
  let body = '';
  
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const result = JSON.parse(body);
      console.log('Response:', JSON.stringify(result, null, 2));
      
      if (result.result && result.result.success) {
        console.log('\n✅ Seeding complete!');
        console.log('Stats:', result.result.stats);
      }
    } catch (e) {
      console.log('Raw response:', body);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.write(data);
req.end();

