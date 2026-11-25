# Sobrou

Site e protótipo navegável feitos em HTML, CSS e JavaScript. Não precisam de instalação ou processo de build.

## Abrir

- screenshots/galeria.html: capturas em tamanho real dos slides, cenas da animação, app e landing page.

- index.html: landing page do projeto.
- app.html: demonstração do aplicativo.
- pitch.html: apresentação com roteiro de cinco minutos. Use as setas para navegar (no slide do vídeo, use **Continuar**), Espaço para iniciar ou pausar o cronômetro nos slides sem vídeo e F para alternar tela cheia. Pressione G fora da tela cheia para abrir o guia de ensaio.
- [Apresentação em PDF](output/pdf/Sobrou-Pitch.pdf): oito slides, com links para a animação e para a demo.- [PDF interativo](output/pdf/Sobrou-Apresentacao-Interativa.pdf): vídeos incorporados nas páginas 4 e 5. Baixe e abra no Adobe Acrobat Reader para reproduzir.

No quarto slide, uma animação de 35 segundos acompanha Joaquim enquanto ele encontra, reserva e retira uma sacola de pães. O vídeo abre em tela cheia, e cada cena espera a conclusão de sua fala quando há voz disponível no navegador. No quinto slide, o tour do aplicativo leva 14 segundos até a confirmação da reserva.

## Fluxo demonstrável do app

- Buscar, filtrar e ordenar ofertas ilustrativas.
- Abrir uma oferta, escolher quantidade, simular o pagamento e confirmar a reserva.
- Consultar o código em Pedidos e simular a retirada.
- Salvar ofertas e usar o perfil de estabelecimento para cadastrar e ativar ofertas demonstrativas.

O protótipo não processa pagamentos, não consulta estoques reais e não tem estabelecimentos parceiros conectados. As ofertas, preços, personagem e reservas são dados de demonstração. O navegador guarda o estado localmente; use a opção de reinicialização no Perfil para limpar a demonstração.

## Publicação

O projeto é estático e compatível com GitHub Pages. Envie a pasta mantendo index.html na raiz do repositório e ative Pages em Settings → Pages. Os caminhos são relativos; o suporte básico a PWA funciona quando hospedado por HTTPS.
