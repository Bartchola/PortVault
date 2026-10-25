# 🕹️ PortVault

**Launcher de jogos portados e recompilados para PC.**

O PortVault organiza os ports e recomps que você baixa da comunidade em um só lugar: ele acha seus jogos, monta uma biblioteca bonita e baixa/instala novos jogos direto pelo launcher. Feito pensando na galera que vive de port de jogo no PC.

> Projeto em desenvolvimento ativo — feito pela comunidade, para a comunidade.

---

## ✨ Funcionalidades

- 🎮 **Biblioteca de jogos** — adiciona seus `.exe` manualmente ou escaneando pastas; abre o jogo com um clique.
- ⬇️ **Download integrado** — cola o link direto de um port (`.zip`/`.exe`), ele baixa, extrai e adiciona à biblioteca sozinho.
- 📁 **Pastas monitoradas** — aponte onde estão seus jogos e escaneie para encontrar novos ports automaticamente.
- 🏆 **Conquistas estilo Steam** — desbloqueie manualmente e acompanhe o progresso de cada jogo, com resumo geral.
- 🕹️ **RetroAchievements integrado** — vincule o jogo ao RA por busca ou link e importe as conquistas oficiais, com badges e pontos. Com o usuário do RA configurado, você também **sincroniza seus desbloqueios** e leva a data real em que cada um foi ganho no emulador.
- 🌐 **Português e inglês** — troque o idioma do launcher nas Configurações; as conquistas do RA são **traduzidas automaticamente** para o português (e o texto original continua disponível em inglês).
- 🔄 **Atualização automática** — o launcher detecta a versão nova, baixa com barra de progresso e instala sozinho, sem abrir instalador.
- 🎨 **Interface escura** estilo launcher, com capas e botão de jogar.

---

## 🚀 Rodando o projeto (para quem vai contribuir)

Pré-requisito: [Node.js](https://nodejs.org) (versão LTS, 20 ou superior).

```bash
# 1. Baixe os códigos e entre na pasta
git clone https://github.com/Bartchola/PortVault.git
cd PortVault

# 2. Instale as dependências
npm install

# 3. Rode em modo desenvolvimento (abre a janela do launcher)
npm run dev
```

## 📦 Gerando o instalador

```bash
# Gera o instalador .exe na pasta dist/
npm run dist

# Gera a versão portátil (roda sem instalar)
npm run dist:portable
```

---

## 📢 Publicando uma versão para a comunidade

O projeto já vem com uma **GitHub Action** que faz o trabalho pesado. Para publicar:

1. Suba o código para o GitHub:
   ```bash
   git add .
   git commit -m "Lançando a versão 0.1.0"
   git push
   ```
2. Crie uma **tag** e envie:
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```
3. Pronto! O GitHub Actions compila o instalador automaticamente e publica numa **Release**, com o `.exe` pronto para a comunidade baixar.

Basta repetir o passo 2 com uma tag nova (ex: `v0.2.0`) a cada versão.

---

## 🗺️ Roadmap (ideias para os próximos passos)

- [ ] Catálogo comunitário de ports/recomps (descoberta de jogos novos)
- [ ] Ícones/capas extraídos automaticamente dos `.exe`
- [ ] Detecção de emuladores (recomps de N64, PS1, etc.)
- [ ] Disparo **automático** de conquistas durante o jogo (mexe com engenharia reversa, port por port)
- [ ] Configurações por jogo (resolução, mods, saves)
- [ ] Sistema de favoritos e últimas jogadas
- [ ] Temas de cor

Contribuições, ideias e issues são super bem-vindas! 🎮

---

## 📄 Licença

MIT — use, modifique e distribua livremente.
