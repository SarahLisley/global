const { Agent, setGlobalDispatcher } = require('undici');
const http = require('http');
const https = require('https');

// Simular as configurações de lib/api.ts
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
setGlobalDispatcher(new Agent({ connect: { rejectUnauthorized: false } }));

async function testApi() {
  const API_BASE = 'https://127.0.0.1:4001';
  const path = '/entregas';
  
  console.log(`Testando chamada para: ${API_BASE}${path}`);
  
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'GET',
      headers: {
        // Sem token primeiro para ver se pelo menos alcança a API
      },
    });
    
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Resposta: ${text}`);
  } catch (err) {
    console.error('Erro na chamada fetch:');
    console.error(err);
  }
}

testApi();
