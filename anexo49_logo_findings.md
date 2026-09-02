# Diagnóstico do logotipo REMA — Anexo 49

A referência de produção em `client/src/components/REMAFooter.tsx` aponta para `/manus-storage/rema-logo-transparent-clean_a9363c1f.png`.

A imagem original `rema-logo-source.png` tem fundo branco e proporção horizontal de 1586 × 992. A versão actualmente preparada `rema-logo-transparent-clean.png` tem proporção vertical de 908 × 1200, o símbolo ocupa quase toda a caixa e a pré-visualização mostra bandas/halo cinzento no fundo. Esta proporção é incompatível com a caixa do rodapé (`width=72`, `height=48`) e pode fazer o logotipo parecer cortado, comprimido ou com fundo visível.

A correcção deve preservar o símbolo REMA, gerar um activo horizontal com transparência real e margem segura, substituir a referência do rodapé pelo activo publicado e validar o carregamento em desktop/mobile.
