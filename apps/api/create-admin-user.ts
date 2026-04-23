import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as bcrypt from 'bcrypt';

dotenv.config({ path: resolve(__dirname, '.env') });
import { execute } from './src/db/query';

const OWNER = process.env.ORACLE_USER || 'GLOBALHTESTE';

async function createAdminUser() {
  const email = 'gestaodedados@globalhospitalar.com.br';
  const plainPassword = 'Global@m1e2';
  const nome = 'Gestão de Dados Global';
  const tipo = 'A'; // Admin
  // CGC pode ser o CNPJ da própria Global se necessário, ou nulo para admin geral
  const cgc = '00000000000100'; 

  try {
    console.log(`Verificando se o usuário ${email} já existe...`);
    // Delete if already exists
    await execute(`DELETE FROM ${OWNER}.BRLOGINWEB WHERE UPPER(EMAIL) = UPPER(:email)`, { email });

    console.log('Criando hash da senha...');
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    console.log('Inserindo no banco...');
    await execute(
      `INSERT INTO ${OWNER}.BRLOGINWEB (EMAIL, SENHA, CGC, NOME, TIPO) VALUES (:email, :senha, :cgc, :nome, :tipo)`,
      { email, senha: hashedPassword, cgc, nome, tipo }
    );

    console.log('\n✅ Usuário ADMINISTRADOR criado com sucesso no banco de dados!');
    console.log(`📧 E-mail: ${email}`);
    console.log(`🔑 Senha: ${plainPassword}`);
    console.log(`👑 Perfil: Administrador (TIPO ${tipo})`);
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Erro ao criar usuário administrador:', err.message);
    process.exit(1);
  }
}

createAdminUser();
