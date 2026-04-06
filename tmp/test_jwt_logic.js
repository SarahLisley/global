const crypto = require('crypto');
const fs = require('fs');
const dotenv = require('dotenv');

// 1. Carregar .env como a API faz
const envPath = 'c:/Users/Sarah Lisley/Documents/Bravo Tecnologia e Inovação/Portal-Global-Bravo-System - Copia/apps/api/.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = dotenv.parse(envContent);

const secret = env.JWT_SECRET;
console.log('JWT_SECRET (length):', secret ? secret.length : 'NULL');
console.log('JWT_SECRET (prefix):', secret ? secret.substring(0, 5) : 'NULL');

// 2. Simular assinatura
const header = { alg: 'HS256', typ: 'JWT' };
const body = { sub: 'teste@bravo.com.br', iat: Math.floor(Date.now() / 1000) };
const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
const data = `${b64(header)}.${b64(body)}`;
const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
const token = `${data}.${sig}`;

console.log('Token Gerado:', token.substring(0, 20) + '...');

// 3. Simular Verificação
const [h, p, s] = token.split('.');
const expected = crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest('base64url');
const ok = crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected));

console.log('Verificação com o mesmo secret:', ok ? 'OK' : 'FALHOU');
