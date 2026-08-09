# PitStop COHAB - Gerador PIX

App estático pronto para GitHub Pages.

## Recursos
- Chave PIX CNPJ fixa: `64.712.625/0001-69`
- Digite o valor e o QR Code é gerado automaticamente
- PIX Copia e Cola
- Histórico salvo no navegador (localStorage)
- Ao clicar em **Novo pagamento**, o pagamento atual é salvo e a tela é limpa
- Botão para marcar manualmente como **Pago** / **Aguardando**
- Exportação do histórico em CSV
- Logo PitStop COHAB como marca d'água
- Responsivo para celular e computador

## Publicar no GitHub Pages
1. Crie um repositório no GitHub.
2. Envie todos os arquivos desta pasta para a raiz do repositório.
3. No GitHub, abra **Settings > Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**.
5. Selecione a branch `main` e a pasta `/ (root)`.
6. Clique em **Save**.

## Primeiro uso
Ao abrir, informe o **nome do titular/recebedor** e a **cidade**. Esses dados são necessários para montar o BR Code PIX. O CNPJ já fica fixo.

## Importante sobre confirmação de pagamento
Esta versão não consulta banco e não consegue saber automaticamente se o PIX foi pago. O status é manual. Para confirmação automática é necessário integrar uma API PIX de um PSP/banco e usar backend seguro; não coloque segredo/token bancário no JavaScript público do GitHub Pages.
