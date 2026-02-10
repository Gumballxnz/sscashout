# 🎰 Sistema Cashout - Clone Local

Clone funcional do site de sinais Aviator/Cashout para desenvolvimento e testes.

## ⚠️ AVISO IMPORTANTE

Este projeto é apenas para fins **EDUCACIONAIS**. Não use para:
- ❌ Apostas reais
- ❌ Fraude ou enganar pessoas
- ❌ Violação de direitos autorais
- ❌ Qualquer atividade ilegal

## 📦 O que está incluído

- ✅ Sistema de sinais simulados (81.4% de acerto)
- ✅ Notificações do navegador
- ✅ Estatísticas em tempo real
- ✅ Histórico de sinais
- ✅ Interface completa e responsiva

## 🚀 Instalação Rápida

### Passo 1: Baixar o site

1. Acesse: https://saveweb2zip.com/
2. Cole a URL: `https://app.sscashout.online/`
3. Clique em "Salvar"
4. Baixe o arquivo ZIP

### Passo 2: Extrair arquivos

```bash
# Windows
Clique com direito > Extrair tudo

# Linux/Mac
unzip app.sscashout.online.zip -d site-cashout
```

### Passo 3: Adicionar arquivos funcionais

Copie estes arquivos para a pasta extraída:

```
site-cashout/
├── js/
│   ├── sinais-mock.js          ← NOVO (copie daqui)
│   └── notificacoes-local.js   ← NOVO (copie daqui)
```

### Passo 4: Modificar o index.html

Adicione antes de `</body>`:

```html
<!-- Sistema de Sinais Mock -->
<script src="js/sinais-mock.js"></script>

<!-- Sistema de Notificações -->
<script src="js/notificacoes-local.js"></script>
```

### Passo 5: Rodar servidor local

#### Opção A: Python (Recomendado)

```bash
cd site-cashout
python3 -m http.server 8000
```

Acesse: http://localhost:8000

#### Opção B: Node.js

```bash
cd site-cashout
npx http-server -p 8000
```

Acesse: http://localhost:8000

#### Opção C: XAMPP/WAMP

1. Instale XAMPP: https://www.apachefriends.org/
2. Copie pasta para `C:\xampp\htdocs\site-cashout`
3. Acesse: http://localhost/site-cashout

## 🎮 Como Usar

1. **Abra o site no navegador**
   ```
   http://localhost:8000
   ```

2. **Ative as notificações**
   - Clique em "Ativar Notificações"
   - Permita quando o navegador pedir

3. **Aguarde os sinais**
   - Sinais aparecem a cada 3-8 minutos
   - Você receberá notificação sonora e visual

4. **Veja as estatísticas**
   - Taxa de acerto: ~81.4%
   - Histórico completo de sinais
   - Gráfico de desempenho

## 🛠️ Comandos de Debug

Abra o Console do navegador (F12) e use:

```javascript
// Gerar sinal imediatamente
sinaisMock.gerarSinal()

// Pausar geração de sinais
sinaisMock.parar()

// Retomar geração de sinais
sinaisMock.iniciar()

// Resetar estatísticas
sinaisMock.resetar()

// Ver status das notificações
notificacoes.getStatus()

// Testar notificação
notificacoes.enviar('Teste', 'Mensagem de teste')
```

## 📁 Estrutura de Arquivos

```
site-cashout/
├── index.html                    # Página principal
├── css/
│   ├── style.css                # Estilos originais
│   └── custom.css               # Seus estilos (opcional)
├── js/
│   ├── app.js                   # JavaScript original
│   ├── sinais-mock.js           # ⭐ Sistema de sinais
│   ├── notificacoes-local.js    # ⭐ Sistema de notificações
│   └── utils.js                 # Utilitários
├── images/
│   └── ...                      # Imagens do site
├── sounds/
│   └── alert.mp3                # Som de alerta (opcional)
├── .claude_rules                # ⭐ Regras para IA
└── README.md                    # Este arquivo
```

## 🔧 Problemas Comuns

### ❌ Vídeo não carrega

**Problema**: "Erro 153 - Erro de configuração do player"

**Solução**: 
1. Certifique-se de estar usando `http://localhost` (não `file://`)
2. Limpe o cache: Ctrl+Shift+Delete
3. Tente outro navegador

### ❌ Sinais não aparecem

**Problema**: Área de sinais fica vazia

**Solução**:
1. Abra o Console (F12)
2. Veja se há erros JavaScript
3. Verifique se adicionou `sinais-mock.js` corretamente
4. Recarregue a página (F5)

### ❌ Notificações não funcionam

**Problema**: Não recebe alertas de novos sinais

**Solução**:
1. Verifique permissões do navegador
2. Clique em "Ativar Notificações"
3. Teste: `notificacoes.enviar('Teste', 'OK')`

### ❌ Estatísticas zeradas

**Problema**: Sempre mostra 0% acertos

**Solução**:
1. Aguarde pelo menos 2 sinais serem resolvidos
2. Verifique se os seletores CSS estão corretos
3. Abra Console e rode: `sinaisMock.atualizarStats()`

## 🎨 Personalização

### Mudar cores

Edite `css/custom.css`:

```css
/* Cor primária */
:root {
  --cor-principal: #00ff00;
  --cor-secundaria: #ff6600;
}

/* Fundo */
body {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
}
```

### Ajustar taxa de acerto

Edite `js/sinais-mock.js` linha ~89:

```javascript
// Mudar de 81.4% para 75%
let chanceGreen = 0.75;
```

### Mudar frequência de sinais

Edite `js/sinais-mock.js` linha ~298:

```javascript
// Mudar de 3-8min para 1-3min
const intervalo = Math.floor(Math.random() * 120000) + 60000;
```

## 🤖 Trabalhando com Claude AI

Se for pedir ajuda ao Claude, use este formato:

```markdown
CONTEXTO:
- Clonei o site app.sscashout.online
- Usando servidor local Python
- Problema: [descrever]

PRECISO:
- [objetivo específico]

NÃO FAÇA:
- Não altere cores/design
- Não adicione frameworks
- Não mude estrutura

APENAS:
- [tarefa específica]
```

**Arquivo de regras**: Já está incluído em `.claude_rules`

## 📊 Estatísticas Esperadas

Após 20-30 sinais, você deve ver:

- Taxa de acerto: 75-85%
- Média de 1 sinal a cada 5 minutos
- Multiplicadores entre 1.5x e 20x
- Maioria dos sinais entre 2.0x e 4.0x

## 🔐 Segurança

⚠️ **IMPORTANTE**:

1. ❌ Nunca adicione informações pessoais reais
2. ❌ Não conecte a APIs de apostas reais
3. ❌ Não use para enganar outras pessoas
4. ✅ Use apenas para aprender desenvolvimento web

## 📚 Aprendizado

Este projeto ensina:

- ✅ WebSockets e comunicação em tempo real
- ✅ Notification API do navegador
- ✅ Manipulação de DOM com JavaScript
- ✅ LocalStorage e persistência de dados
- ✅ Criação de interfaces responsivas
- ✅ Trabalho com servidores HTTP

## 🆘 Suporte

**Problemas?**

1. Leia a seção "Problemas Comuns" acima
2. Verifique o Console do navegador (F12)
3. Revise se seguiu todos os passos

**Recursos úteis:**
- MDN Web Docs: https://developer.mozilla.org/
- Stack Overflow: https://stackoverflow.com/
- Console do navegador: Pressione F12

## 📝 Changelog

### Versão 1.0 (Fevereiro 2026)
- ✅ Sistema de sinais mock funcional
- ✅ Notificações do navegador
- ✅ Estatísticas em tempo real
- ✅ Histórico de sinais
- ✅ Interface responsiva
- ✅ Documentação completa

## 📄 Licença

Este projeto é apenas para fins educacionais. Não possui licença para uso comercial.

## ✍️ Autor

Criado com ajuda do Claude AI (Anthropic) para fins educacionais.

---

**Última atualização**: Fevereiro 2026  
**Versão**: 1.0.0  
**Status**: ✅ Funcional
