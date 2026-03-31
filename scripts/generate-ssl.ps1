# ============================================================
# Script: generate-ssl.ps1
# Descricao: Gera certificado SSL para o Portal Global Bravo
# Opcao 1: Let's Encrypt via win-acme (RECOMENDADO)
# Opcao 2: Certificado autoassinado com SAN
# ============================================================

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("letsencrypt", "letsencrypt-dns", "selfsigned")]
    [string]$Mode = "selfsigned",

    [Parameter(Mandatory=$false)]
    [string]$Domain = "globalh.ddns.net",

    [Parameter(Mandatory=$false)]
    [string]$CertDir = "C:\Certs"
)

# Garante que o diretorio existe
if (-not (Test-Path $CertDir)) {
    New-Item -ItemType Directory -Path $CertDir -Force | Out-Null
}

function Generate-SelfSigned {
    Write-Host "=== Gerando Certificado Autoassinado com SAN ===" -ForegroundColor Cyan
    
    # Criar certificado com SAN (Subject Alternative Name) correto
    $cert = New-SelfSignedCertificate `
        -DnsName $Domain, "localhost", "127.0.0.1" `
        -CertStoreLocation "Cert:\LocalMachine\My" `
        -NotAfter (Get-Date).AddYears(2) `
        -FriendlyName "Portal Global Bravo SSL" `
        -KeyAlgorithm RSA `
        -KeyLength 2048 `
        -HashAlgorithm SHA256 `
        -KeyExportPolicy Exportable `
        -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1")

    Write-Host "Certificado gerado: $($cert.Thumbprint)" -ForegroundColor Green

    # Exportar para PEM (cert.pem e key.pem)
    $certPath = Join-Path $CertDir "cert.pem"
    $keyPath = Join-Path $CertDir "key.pem"
    $pfxPath = Join-Path $CertDir "cert.pfx"

    # Exportar PFX primeiro
    $pfxPassword = ConvertTo-SecureString -String "temp-export-pass" -Force -AsPlainText
    Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $pfxPassword | Out-Null

    # Converter PFX para PEM usando certutil
    # Exportar certificado publico
    $certBase64 = [Convert]::ToBase64String($cert.RawData, [System.Base64FormattingOptions]::InsertLineBreaks)
    $certPem = "-----BEGIN CERTIFICATE-----`n$certBase64`n-----END CERTIFICATE-----"
    Set-Content -Path $certPath -Value $certPem -Encoding ASCII

    Write-Host "Certificado publico salvo em: $certPath" -ForegroundColor Green

    # Instalar no Trusted Root para que o Windows confie
    $store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "LocalMachine")
    $store.Open("ReadWrite")
    $store.Add($cert)
    $store.Close()
    Write-Host "Certificado instalado em Trusted Root Certification Authorities" -ForegroundColor Green

    Write-Host ""
    Write-Host "=== CONCLUIDO ===" -ForegroundColor Green
    Write-Host "Certificado (PEM): $certPath"
    Write-Host "Certificado (PFX): $pfxPath (senha de leitura: temp-export-pass)"
    Write-Host "Validade:          2 anos"
    Write-Host "Confiavel:         Sim (instalado no Trusted Root localmente)"
    Write-Host ""
    Write-Host "NOTA: Outros computadores na rede ainda verao aviso de seguranca." -ForegroundColor Yellow
    Write-Host "Para que eles tambem confiem, exporte o cert.pem e instale manualmente." -ForegroundColor Yellow
}

function Generate-LetsEncrypt {
    Write-Host "=== Gerando Certificado Let's Encrypt via win-acme ===" -ForegroundColor Cyan
    
    $wacmePath = Join-Path $CertDir "win-acme"
    $wacmeExe = Get-ChildItem -Path $wacmePath -Filter "wacs.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1

    if (-not $wacmeExe) {
        Write-Host "ERRO: win-acme nao encontrado em $wacmePath" -ForegroundColor Red
        Write-Host "Baixe em: https://www.win-acme.com/" -ForegroundColor Yellow
        return
    }

    Write-Host "Executando win-acme para dominio: $Domain" -ForegroundColor Cyan
    Write-Host "IMPORTANTE: As portas 80 e 443 devem estar livres!" -ForegroundColor Yellow
    
    # Executa win-acme em modo nao-interativo
    & $wacmeExe.FullName `
        --target manual `
        --host $Domain `
        --validation selfhosting `
        --store pemfiles `
        --pemfilespath $CertDir `
        --accepttos `
        --emailaddress "admin@$Domain"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "=== Certificado Let's Encrypt gerado com sucesso! ===" -ForegroundColor Green
    } else {
        Write-Host "ERRO ao gerar certificado. Verifique:" -ForegroundColor Red
        Write-Host "  1. Portas 80/443 estao livres?" -ForegroundColor Yellow
        Write-Host "  2. DNS aponta para este servidor?" -ForegroundColor Yellow
        Write-Host "  3. Firewall permite conexoes de entrada?" -ForegroundColor Yellow
    }
}
function Generate-LetsEncryptDNS {
    Write-Host "=== Gerando Certificado Válido via DNS (Bypass do Roteador) ===" -ForegroundColor Cyan
    
    $wacmePath = Join-Path $CertDir "win-acme"
    $wacmeExe = Get-ChildItem -Path $wacmePath -Filter "wacs.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1

    if (-not $wacmeExe) {
        Write-Host "ERRO: win-acme nao encontrado. Baixe em win-acme.com" -ForegroundColor Red
        return
    }

    Write-Host ""
    Write-Host "--- IMPORTANTE! LEIA ANTES DE CONTINUAR ---" -ForegroundColor Yellow
    Write-Host "A tela preta do gerador (win-acme) vai abrir e fará perguntas. Responda assim:"
    Write-Host "1. Digite 'M' (Create certificate - full options)"
    Write-Host "2. Digite '2' (Manual input)"
    Write-Host "3. Cole seu domínio: $Domain"
    Write-Host "4. Aperte Enter para pular 'Friendly name'"
    Write-Host "5. Escolha a opção [dns-01] Create verification records manually (geralmente opção 6)"
    Write-Host "6. Escolha a opção [RSA key]"
    Write-Host "7. Escolha a opção 'Store in PEM files' (geralmente a 2 ou 3) e cole a pasta: $CertDir"
    Write-Host "8. Aperte '3' para Nao armazenar em mais nenhum lugar."
    Write-Host "9. 'No (additional) installation steps' (geralmente opção 1)."
    Write-Host "-------------------------------------------"
    Write-Host "Em seguida ele te dará um código para você colar no seu DNS do site No-IP!"
    Write-Host "Pressione qualquer tecla para iniciar a tela mágica..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
    & $wacmeExe.FullName
}

# Executar modo escolhido
switch ($Mode) {
    "letsencrypt"     { Generate-LetsEncrypt }
    "letsencrypt-dns" { Generate-LetsEncryptDNS }
    "selfsigned"      { Generate-SelfSigned }
}
