# 🚀 Guia: Usando Antigravity (Claude no VS Code) com o Projeto

## 📖 O que é Antigravity?

**Antigravity** é uma extensão do VS Code que integra o Claude AI diretamente no editor, funcionando como um agente de IA que pode:
- Ler e editar arquivos
- Executar comandos
- Criar código
- Debugar problemas
- Automatizar tarefas

## 🔧 Configuração Inicial

### 1. Instalar Antigravity

1. Abra VS Code
2. Vá em Extensions (Ctrl+Shift+X)
3. Busque por "Anthropic Antigravity"
4. Clique em "Install"
5. Recarregue o VS Code

### 2. Configurar API Key (se necessário)

1. Vá em Settings (Ctrl+,)
2. Busque "Antigravity"
3. Adicione sua API key da Anthropic
4. Salve as configurações

### 3. Adicionar Arquivo de Regras

**IMPORTANTE:** Copie o arquivo `.clinerules` para a raiz do seu projeto:

```
seu-projeto/
├── .clinerules          ← ESTE ARQUIVO É ESSENCIAL!
├── pagina do sistema/
│   └── sscashout/
│       ├── index.html
│       └── ...
```

O Antigravity vai ler este arquivo automaticamente e seguir as regras!

## 🎯 Como Usar o Antigravity com Regras

### ✅ FORMA CORRETA - Com Instruções Claras

#### Exemplo 1: Adicionar Funcionalidade
```
Você: Preciso adicionar o sistema de sinais mock no projeto.
      Os arquivos sinais-mock.js e notificacoes-local.js 
      estão prontos. Onde devo colocá-los e como incluir no HTML?

Antigravity: 
📝 ENTENDI O PEDIDO

ARQUIVOS A ADICIONAR:
- sinais-mock.js → em /js/
- notificacoes-local.js → em /js/

MODIFICAÇÃO NECESSÁRIA:
- index.html (adicionar tags <script>)

CÓDIGO A ADICIONAR (antes de </body>):
```html
<!-- Sistema de Sinais Mock -->
<script src="js/sinais-mock.js"></script>

<!-- Sistema de Notificações -->
<script src="js/notificacoes-local.js"></script>
```

Posso prosseguir?
```

#### Exemplo 2: Corrigir Bug
```
Você: O vídeo do YouTube não está carregando. 
      Erro no console: "Refused to display in a frame"

Antigravity:
🔍 PROBLEMA IDENTIFICADO

CAUSA:
YouTube bloqueia iframe em file://
Você precisa usar http://localhost

SOLUÇÕES:
A) Usar servidor local Python
B) Substituir iframe por link direto
C) Usar XAMPP

Qual solução você prefere?
```

#### Exemplo 3: Modificar Estilo
```
Você: Quero mudar a cor do botão "Apostar" 
      de verde para azul

Antigravity:
📝 PROPOSTA DE ALTERAÇÃO

ARQUIVO: css/style.css
LINHA: ~145

CÓDIGO ATUAL:
```css
.btn-apostar {
  background: #00ff00;
}
```

CÓDIGO NOVO:
```css
.btn-apostar {
  background: #0066ff;
}
```

Posso aplicar esta mudança?
```

### ❌ FORMA ERRADA - Comandos Vagos

```
❌ "Melhore o código"
   → Vago demais, Antigravity não sabe o que fazer

❌ "Adicione React"
   → Quebra as regras do projeto

❌ "Corrija todos os bugs"
   → Não especifica quais bugs

❌ "Faça funcionar"
   → Não diz o que não está funcionando
```

## 📝 Templates de Comandos Úteis

### Para Adicionar Funcionalidade
```
Preciso adicionar [FUNCIONALIDADE].

Contexto:
- [Onde vai ser usado]
- [Que arquivo já existe]
- [Comportamento esperado]

Não altere:
- [Arquivos que não devem mudar]
```

### Para Corrigir Bug
```
Problema: [DESCRIÇÃO]

Erro no console:
[COPIAR MENSAGEM DE ERRO]

O que já tentei:
- [Ação 1]
- [Ação 2]

Resultado esperado:
[O que deveria acontecer]
```

### Para Modificar Design
```
Quero mudar [ELEMENTO] de [ESTADO ATUAL] para [ESTADO DESEJADO]

Arquivo provável: [css/style.css]
Elemento: [.classe ou #id]

Não altere outras cores/estilos.
```

### Para Debugar
```
[FUNCIONALIDADE] não está funcionando.

Console mostra: [ERRO]

Servidor rodando: [Sim/Não]
Navegador: [Chrome/Firefox/etc]
URL acessada: [http://localhost:8000]

Pode me ajudar a debugar?
```

## 🎮 Comandos do Antigravity

### Atalhos de Teclado (padrão):
- `Ctrl + L` - Abrir chat com Antigravity
- `Ctrl + Shift + L` - Nova conversa
- `Ctrl + K` - Comando rápido

### Comandos Úteis:

#### 1. Analisar Arquivo
```
@arquivo index.html
Pode me explicar a estrutura deste arquivo?
```

#### 2. Buscar em Todo Projeto
```
@workspace
Onde está a função que gera sinais?
```

#### 3. Executar Comando
```
/terminal
python3 -m http.server 8000
```

#### 4. Criar Arquivo
```
Crie um arquivo config.js com estas configurações:
[especificar configurações]
```

## 🛡️ Sistema de Proteção (Regras)

Com o arquivo `.clinerules`, o Antigravity vai:

### ✅ SEMPRE:
1. **Perguntar antes de modificar** arquivos
2. **Mostrar o código** que vai adicionar/mudar
3. **Explicar** o que vai fazer
4. **Listar riscos** possíveis
5. **Aguardar aprovação** antes de continuar

### ❌ NUNCA (sem sua permissão):
1. Deletar arquivos
2. Instalar pacotes
3. Fazer commits
4. Mudar estrutura do projeto
5. Adicionar frameworks
6. Modificar design

## 📊 Fluxo de Trabalho Ideal

```
1. VOCÊ FAZ PEDIDO
   ↓
2. ANTIGRAVITY ANALISA
   ↓
3. ANTIGRAVITY PROPÕE SOLUÇÃO
   ↓
4. MOSTRA CÓDIGO/MUDANÇAS
   ↓
5. VOCÊ APROVA OU REJEITA
   ↓
6. ANTIGRAVITY IMPLEMENTA (se aprovado)
   ↓
7. VOCÊ TESTA
   ↓
8. FEEDBACK/AJUSTES (se necessário)
```

## 🎯 Exemplos Práticos

### Cenário 1: Site Não Abre Vídeo

**Você:**
```
O vídeo do YouTube não carrega.
Console mostra: "Refused to display in a frame"
Estou acessando via file:///caminho/index.html
```

**Antigravity:**
```
🔍 PROBLEMA: CORS do YouTube

CAUSA:
file:// não é permitido pelo YouTube

SOLUÇÃO:
Você precisa usar servidor HTTP local.

COMANDOS:
1. Abra terminal (Ctrl+`)
2. Navegue até a pasta: cd pagina\ do\ sistema/sscashout
3. Execute: python3 -m http.server 8000
4. Acesse: http://localhost:8000

Quer que eu execute estes comandos agora?
```

### Cenário 2: Adicionar Sistema de Sinais

**Você:**
```
Tenho os arquivos sinais-mock.js e notificacoes-local.js
Preciso integrá-los ao projeto.
Onde colocar e como incluir?
```

**Antigravity:**
```
📝 PLANO DE INTEGRAÇÃO

PASSO 1: Mover arquivos
- sinais-mock.js → js/sinais-mock.js
- notificacoes-local.js → js/notificacoes-local.js

PASSO 2: Modificar index.html
Adicionar antes de </body>:
```html
<script src="js/sinais-mock.js"></script>
<script src="js/notificacoes-local.js"></script>
```

PASSO 3: Testar
1. Recarregar página
2. Abrir console (F12)
3. Verificar: "Sistema de sinais iniciado"

Posso executar estes passos?
```

### Cenário 3: Mudar Cores

**Você:**
```
Quero mudar:
- Botão "Apostar": verde → azul
- Fundo: escuro → mais claro
- Texto: branco → cinza claro

Apenas estas mudanças, nada mais.
```

**Antigravity:**
```
📝 ALTERAÇÕES DE ESTILO

ARQUIVO: css/style.css

MUDANÇA 1 - Botão Apostar (linha ~145):
ANTES:
```css
.btn-apostar {
  background: #00ff00;
}
```
DEPOIS:
```css
.btn-apostar {
  background: #0066ff;
}
```

MUDANÇA 2 - Fundo (linha ~12):
ANTES:
```css
body {
  background: #0a0a0a;
}
```
DEPOIS:
```css
body {
  background: #1a1a1a;
}
```

MUDANÇA 3 - Texto (linha ~25):
ANTES:
```css
.text {
  color: #ffffff;
}
```
DEPOIS:
```css
.text {
  color: #e0e0e0;
}
```

Aplicar estas 3 mudanças?
```

## 🚨 Troubleshooting

### Problema: Antigravity não segue regras

**Solução:**
1. Verifique se `.clinerules` está na raiz do projeto
2. Reinicie VS Code
3. Abra nova conversa (Ctrl+Shift+L)

### Problema: Antigravity faz mudanças sem pedir

**Solução:**
1. Adicione no chat: "SEMPRE me pergunte antes de modificar"
2. Referencie: "Siga as regras em .clinerules"
3. Seja específico no que NÃO quer

### Problema: Respostas muito genéricas

**Solução:**
```
Seja mais específico no pedido:

❌ "Melhore o código"
✅ "Otimize a função gerarSinal() no arquivo sinais-mock.js 
    para usar menos memória, sem mudar comportamento"
```

## 💡 Dicas de Ouro

### 1. Use @menções
```
@arquivo index.html
O que este arquivo faz?

@workspace
Onde está definida a classe SinaisMock?
```

### 2. Seja Específico
```
❌ "Corrija bugs"
✅ "A função calcularTaxa() retorna NaN quando total=0. 
    Adicione validação para evitar divisão por zero"
```

### 3. Referencie as Regras
```
"Antes de fazer qualquer mudança, lembre-se das regras 
em .clinerules e me mostre o que vai fazer"
```

### 4. Use Passos Incrementais
```
Ao invés de: "Implemente todo o sistema"

Faça:
1. "Crie a estrutura básica da classe"
2. "Adicione o método gerarSinal()"
3. "Implemente notificações"
4. "Adicione estatísticas"
```

### 5. Sempre Teste Antes
```
Após cada mudança:
"Antes de continuar, vou testar isso.
Aguarde meu feedback."
```

## 📋 Checklist Antes de Começar

- [ ] Antigravity instalado no VS Code
- [ ] Arquivo `.clinerules` na raiz do projeto
- [ ] VS Code aberto na pasta do projeto
- [ ] Servidor local rodando (se necessário)
- [ ] Console do navegador aberto para ver erros
- [ ] Backup do projeto feito (se for fazer mudanças grandes)

## 🎓 Recursos Adicionais

### Documentação Oficial:
- VS Code: https://code.visualstudio.com/docs
- Antigravity: [Documentação da extensão]
- Claude AI: https://docs.anthropic.com/

### Atalhos Úteis VS Code:
- `Ctrl + P` - Abrir arquivo rápido
- `Ctrl + Shift + P` - Paleta de comandos
- `Ctrl + `` - Terminal
- `Ctrl + B` - Toggle sidebar
- `F12` - Ver console do navegador

## 🎯 Resumo Final

**COM REGRAS (.clinerules):**
- ✅ Antigravity pergunta antes de mudar
- ✅ Mostra código completo
- ✅ Explica riscos
- ✅ Aguarda aprovação
- ✅ Não faz mudanças surpresa

**SEM REGRAS:**
- ❌ Pode mudar arquivos livremente
- ❌ Pode adicionar dependências
- ❌ Pode reorganizar projeto
- ❌ Pode "melhorar" sem pedir
- ❌ Você perde controle

**SEMPRE use o arquivo `.clinerules` para ter controle total sobre o que o Antigravity faz!**

---

**Versão**: 1.0  
**Para**: Projeto Sistema Cashout Clone  
**Ferramenta**: Anthropic Antigravity + VS Code  
**Data**: Fevereiro 2026
