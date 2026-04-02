# 🚀 Portal Global Bravo - Guia Rápido de Inicialização

## 📍 Informações da Sua Rede

- **IP Pública**: `168.232.12.158`
- **IP Local (Interna)**: `192.168.0.9`
- **DDNS**: `globalh.ddns.net`

## ⚡ Iniciar a Aplicação

### Opção 1: Clique duplo (Mais fácil)

1. Abra a pasta do projeto
2. **Clique duplo** em `start-dev.bat`
3. Aguarde até aparecer:
   ```
   ✓ Ready in 7.1s
   ```

### Opção 2: Terminal PowerShell

```powershell
cd "C:\Users\Sarah Lisley\Documents\Bravo Tecnologia e Inovação\Portal-Global-Bravo-System - Copia"
$env:NODE_OPTIONS="--max-old-space-size=8192"
pnpm dev
```

## 🌐 Acessar a Aplicação

### Local (Sua Máquina)

- **Web**: http://localhost:3200
- **API**: http://localhost:4001
- **Docs Swagger**: http://localhost:4001/docs
- **Status API**: http://localhost:4001/health

### Rede Local (Seu Computador na LAN)

- **Web**: http://192.168.0.9:3200
- **API**: http://192.168.0.9:4001

### Acesso Remoto via IP Público

- **Web**: http://168.232.12.158:3200
- **API**: http://168.232.12.158:4001
- **OBS**: Requer port forwarding configurado!

### Acesso Remoto via DDNS

- **Web**: http://globalh.ddns.net:3200
- **API**: http://globalh.ddns.net:4001
- **OBS**: Requer port forwarding configurado!

## 🔧 Configurar Port Forwarding (Para acesso remoto)

### No Seu Roteador (TP-Link, ASUS, Intelbras, etc.)

1. **Acessar painel do roteador**

   ```
   URL: http://192.168.0.1 (padrão)
   ou http://192.168.1.1
   Usuário: admin
   Senha: admin (ou sua senha)
   ```

2. **Procurar por** (varia conforme modelo):
   - "Port Forwarding"
   - "Virtual Server"
   - "Port Mapping"
   - "UPnP"

3. **Criar as regras:**

   | Nome    | Porta Externa | IP Local    | Porta Interna | Protocolo | Status     |
   | ------- | ------------- | ----------- | ------------- | --------- | ---------- |
   | Web Dev | 3200          | 192.168.0.9 | 3200          | TCP       | Habilitado |
   | API Dev | 4001          | 192.168.0.9 | 4001          | TCP       | Habilitado |

4. **Alternativa (mais segura):** Usar portas padrão

   | Nome         | Porta Externa | IP Local    | Porta Interna | Protocolo |
   | ------------ | ------------- | ----------- | ------------- | --------- |
   | Web (HTTP)   | 80            | 192.168.0.9 | 3200          | TCP       |
   | API (Custom) | 8080          | 192.168.0.9 | 4001          | TCP       |

   Acesse como: `http://globalh.ddns.net` (web) e `http://globalh.ddns.net:8080` (api)

5. **Salve e reinicie o roteador**

## ⏹️ Parar a Aplicação

### Opção 1: Clique duplo

Clique duplo em `stop.bat`

### Opção 2: Terminal

Pressione `CTRL + C` no terminal onde pnpm está rodando

### Opção 3: Task Manager

1. Abra Task Manager (CTRL + SHIFT + ESC)
2. Procure por "node.exe"
3. Clique com botão direito → "End Task"

## 🛠️ Comandos Úteis

```powershell
# Modo desenvolvimento (watch mode)
pnpm dev

# Compilar para produção
pnpm build

# Rodar versão compilada
pnpm start

# Limpar cache
pnpm clean

# Atualizar dependências
pnpm install
```

## 📊 Status da Aplicação

- **API Memoria**: max 8GB (ajustável em start-dev.bat)
- **Node Version**: 22.22.1+
- **Banco de Dados**: Oracle DB (conexão testada em /health/db)

## ❓ Troubleshooting

### "Porta já em uso"

```powershell
# Passe todas as portas antes de iniciar
taskkill /F /IM node.exe
```

### "Sem memória (Z_MEM_ERROR)"

Aumente em `start-dev.bat`:

```batch
set NODE_OPTIONS=--max-old-space-size=16384
```

### "DDNS não funciona"

1. Verifique se DDNS está configurado no roteador
2. Teste o domínio: `nslookup globalh.ddns.net`
3. Verifique firewall (portas 3200 e 4001 abertas)

### "Firewall bloqueia conexão"

Já foi configurado de forma automática! Se ainda tiver problemas:

```powershell
# Verificar regras
Get-NetFirewallRule -DisplayName "*Node*"

# Remover se necessário
Remove-NetFirewallRule -DisplayName "Allow Node Dev 3200" -Confirm:$false
```

## 📝 Notas

- Firewall foi configurado para liberar portas 3200 e 4001
- A aplicação roda em **modo desenvolvimento** (hot-reload ativo)
- TypeScript é compilado em tempo real (não precisa de build)
- Swagger está em `/docs` (não em /documentation)

---

**Última configuração**: 2 de Abril de 2026
**IP Público**: 168.232.12.158
**IP Local**: 192.168.0.9
