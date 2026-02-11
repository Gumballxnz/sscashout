
# Script para Configurar AWS (PowerShell)

$pem = "keys\sistema cashout.pem"
$ip = "51.20.9.165"
$user = "ubuntu" # Tentar ubuntu ou ec2-user

# 1. Ajustar permissões da chave (Windows precisa de ACLs específicas)
# icacls $pem /reset
# icacls $pem /grant:r "$($env:USERNAME):(R)"
# icacls $pem /inheritance:r

# 2. Testar conexão SSH
Write-Host "Testando conexão com $ip..."
ssh -i $pem -o StrictHostKeyChecking=no $user@$ip "echo 'Conexão OK!'"

# 3. Instalar Node.js e Git no Servidor
$installScript = @"
sudo apt update
sudo apt install -y nodejs npm git
sudo npm install -g pm2
node -v
npm -v
"@

ssh -i $pem $user@$ip $installScript
