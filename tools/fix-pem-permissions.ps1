
$pem = "keys\sistema cashout.pem"
# Remove inheritance
icacls $pem /inheritance:r
# Grant current user full control
icacls $pem /grant:r "$($env:USERNAME):(F)"
# Remove all other users explicitly if needed, but inheritance removal should handle most
