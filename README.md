# Sobrou — Site e demonstração do aplicativo

Projeto estático com duas páginas em HTML, CSS e JavaScript, sem backend, dependências de instalação ou processo de build.

## Abrir

- Abra `index.html` em um navegador para acessar a landing page.
- Clique em “Explorar o app” para abrir a demonstração interativa.
- A área do estabelecimento também fica disponível no menu Perfil do app.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie todos os arquivos desta pasta mantendo a estrutura de diretórios (index.html deve ficar na raiz).
3. Abra Settings → Pages no repositório.
4. Em Build and deployment, escolha Deploy from a branch, a branch principal e a pasta / (root). Salve.
5. Após o deploy, abra o endereço indicado em Settings → Pages.

Todos os caminhos são relativos, compatíveis com um projeto GitHub Pages em subdiretório. O manifesto e service worker oferecem suporte básico a PWA quando hospedado por HTTPS. Não é preciso instalar o aplicativo para usar a demonstração.

## Funcionalidades da demonstração

- Exploração, busca, categorias e ordenação de ofertas fictícias.
- Detalhes, quantidade, seleção simulada de pagamento, confirmação e código de retirada.
- Favoritos, pedidos, perfil demo e simulação de retirada.
- Área do estabelecimento com cadastro e ativação/desativação de ofertas fictícias.
- Estado persistido no navegador via localStorage; opção de reinicializar no Perfil.

Não há cadastro real, cobrança, conexão com estabelecimentos ou dados de localização em tempo real. Imagens e dados são ilustrativos.
