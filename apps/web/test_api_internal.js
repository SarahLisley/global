const { Agent, setGlobalDispatcher } = require('undici');

// Simular as configurações de lib/api.ts
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
setGlobalDispatcher(new Agent({ connect: { rejectUnauthorized: false } }));

async function testApi() {
  const API_BASE = 'https://127.0.0.1:4001';
  const path = '/entregas';
  
  console.log(`[Diagnostic] Calling: ${API_BASE}${path}`);
  
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'GET',
    });
    
    console.log(`[Diagnostic] Status: ${res.status}`);
    const text = await res.text();
    console.log(`[Diagnostic] Response: ${text.substring(0, 200)}...`);
  } catch (err) {
    console.error('[Diagnostic] Fetch Error:');
    console.error(err);
  }
}

testApi();
