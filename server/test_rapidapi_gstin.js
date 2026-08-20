import https from 'https';

const gstin = '27AAJCM9929L1ZM';
const apiKey = '1e38b9522emshda3844315527afdp155538jsncefd3eff1830';
const apiHost = 'gst-return-status.p.rapidapi.com';

const options = {
  method: 'GET',
  hostname: apiHost,
  port: null,
  path: `/free/gstin/${gstin}`,
  headers: {
    'x-rapidapi-key': apiKey,
    'x-rapidapi-host': apiHost,
    'Content-Type': 'application/json'
  }
};

console.log(`Testing RapidAPI GSTIN verification for ${gstin}...`);

const req = https.request(options, function (res) {
  const chunks = [];

  res.on('data', function (chunk) {
    chunks.push(chunk);
  });

  res.on('end', function () {
    const body = Buffer.concat(chunks).toString();
    console.log('Status Code:', res.statusCode);
    try {
      const parsed = JSON.parse(body);
      console.log('API Response Success:', parsed.success);
      if (parsed.data) {
        console.log('Company Legal Name:', parsed.data.lgnm);
        console.log('Company Trade Name:', parsed.data.tradeName);
        console.log('GSTIN Status:', parsed.data.sts);
        console.log('Company Type:', parsed.data.ctb);
        console.log('Registered Address:', parsed.data.adr);
      }
    } catch (e) {
      console.error('Raw Body:', body);
    }
  });
});

req.on('error', function (err) {
  console.error('Request Error:', err);
});

req.end();
