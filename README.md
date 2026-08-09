# Gerador PIX - Pit Stop

App simples, estático e pronto para GitHub Pages.

## O que faz
- Chave PIX/CNPJ fixa: `64.712.625/0001-69`
- Basta digitar o valor
- Gera QR Code PIX automaticamente
- Mostra PIX Copia e Cola
- Botão para copiar
- Funciona em celular e computador

## Antes de usar em produção
Abra `app.js` e confirme estes dados:

```js
const RECEIVER_NAME = 'PIT STOP COHAB';
const RECEIVER_CITY = 'SAO PAULO';
```

O nome e a cidade precisam corresponder aos dados do recebedor PIX. O QR Code segue o padrão BR Code/PIX estático com valor definido.

## Colocar no GitHub Pages
1. Crie um repositório no GitHub, por exemplo `pix-pitstop`.
2. Envie `index.html`, `style.css` e `app.js` para a raiz do repositório.
3. Entre em **Settings > Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**.
5. Selecione a branch `main` e a pasta `/root`.
6. Salve. O GitHub mostrará o endereço do site.

Não precisa instalar Node.js nem rodar build.
