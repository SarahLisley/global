import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as bcrypt from 'bcrypt';

dotenv.config({ path: resolve(__dirname, '.env') });
import { execute } from './src/db/query';

const OWNER = process.env.ORACLE_USER || 'GLOBALHTESTE';

async function createMockUser() {
  const email = 'teste@portal.com';
  const plainPassword = '123456';
  const cnpj = '17209891000193'; // Santa Casa, só para referência na tabela
  const nome = 'Usuário Teste (Mock)';

  try {
    console.log(`Verificando se o usuário ${email} já existe...`);
    // Delete if already exists
    await execute(`DELETE FROM ${OWNER}.BRLOGINWEB WHERE EMAIL = :email`, { email });

    console.log('Criando hash da senha...');
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    console.log('Inserindo no banco...');
    await execute(
      `INSERT INTO ${OWNER}.BRLOGINWEB (EMAIL, SENHA, CGC, NOME, TIPO) VALUES (:email, :senha, :cgc, :nome, 'C')`,
      { email, senha: hashedPassword, cgc: cnpj, nome }
    );

    console.log('\n✅ Usuário de teste criado com sucesso no banco de dados!');
    console.log(`📧 E-mail: ${email}`);
    console.log(`🔑 Senha: ${plainPassword}`);
    console.log(`🏢 CNPJ Atrelado: ${cnpj}`);
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Erro ao criar usuário de teste:', err.message);
    process.exit(1);
  }
}

createMockUser();
