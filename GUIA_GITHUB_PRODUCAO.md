# Guia Completo de Desenvolvimento, Git/GitHub e Docker para Produção 🚀

Este guia prático foi criado sob medida para você aplicar em seus projetos futuros. Ele ensina as melhores práticas do mercado usadas por desenvolvedores seniores para estruturar uma aplicação, versionar no GitHub, configurar build automático e publicar em servidores de produção como **TrueNAS, Dockge, Portainer ou Docker CLI puro**.

Além disso, explicamos exatamente **como corrigir o erro `denied`** que você teve ao tentar baixar uma imagem do GitHub Container Registry (GHCR).

---

## 📂 1. Estrutura Profissional de um Projeto Web Moderno

Para projetos simples ou SPAs (Single Page Applications) sem frameworks complexos, divida seus arquivos de forma organizada:

```text
meu-projeto/
├── .env.example              # Exemplo de variáveis de ambiente (sem segredos)
├── .gitignore                # Arquivos ignorados pelo Git (ex: .env, node_modules)
├── Dockerfile                # Receita para criar a imagem Docker otimizada
├── docker-compose.yml        # Configuração para rodar tudo com um único comando
├── index.html                # Página principal (Template profissional abaixo)
├── nginx.conf                # Configurações de performance/rotas do servidor web
├── assets/                   # Arquivos estáticos
│   ├── css/
│   │   └── style.css         # Seus estilos customizados
│   ├── js/
│   │   └── app.js            # Lógica interativa JavaScript
│   └── imgs/                 # Imagens e logotipos
└── .github/
    └── workflows/
        └── build-image.yml   # Automatização (CI/CD) para o GitHub Actions
```

---

## 📄 2. Template HTML5 Profissional para o Futuro (`index.html`)

Aqui está um boilerplate de alta qualidade que inclui suporte a **Modo Escuro (Dark Mode)**, fontes premium do Google Fonts, o framework CSS **Tailwind CSS v4** integrado profissionalmente via CDN oficial, tags de acessibilidade, metatags de SEO e compatibilidade com dispositivos móveis.

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nome do Seu Projeto - Subtítulo</title>
    
    <!-- Metatags para SEO e Compartilhamento -->
    <meta name="description" content="Descrição chamativa e otimizada do seu projeto para aparecer no Google.">
    <meta name="author" content="GeorgeFctech 3D">
    <meta property="og:title" content="Nome do Seu Projeto">
    <meta property="og:description" content="Visualizador e Gestor inteligente.">
    <meta property="og:type" content="website">
    
    <!-- Favicon / Ícone da Aba -->
    <link rel="icon" type="image/png" href="assets/imgs/favicon.png">
    
    <!-- Google Fonts Premium (Inter e Space Grotesk) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
    
    <!-- Script de Tailwind CSS v4 CDN (Para desenvolvimento rápido e limpo) -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        // Configuração do Tailwind para usar suas fontes customizadas
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        display: ['Space Grotesk', 'sans-serif'],
                    }
                }
            }
        }
    </script>
    
    <!-- Script para detectar a preferência de tema do navegador imediatamente sem flickering -->
    <script>
        if (localStorage.getItem('theme') === 'dark' || 
            (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    </script>
</head>
<body class="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans min-h-screen flex flex-col transition-colors duration-300">

    <!-- Header / Barra de Navegação -->
    <header class="border-b border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <span class="font-display font-bold text-xl tracking-tight text-indigo-600 dark:text-indigo-400">
                    SuaMarca 3D
                </span>
            </div>
            
            <div class="flex items-center gap-4">
                <!-- Botão de Alternar Modo Escuro -->
                <button id="theme-toggle" class="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer transition">
                    <!-- Ícone de Sol (Fica visível no tema dark) -->
                    <svg id="theme-toggle-light-icon" class="hidden w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464a1 1 0 10-1.414-1.414l-.707.707a1 1 0 101.414 1.414l.707-.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 111.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
                    <!-- Ícone de Lua (Fica visível no tema light) -->
                    <svg id="theme-toggle-dark-icon" class="hidden w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
                </button>
                <a href="#contato" class="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition shadow-sm">
                    Começar
                </a>
            </div>
        </div>
    </header>

    <!-- Conteúdo Principal com Layout Bento Grid Exemplo -->
    <main class="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="text-center max-w-3xl mx-auto mb-16">
            <h1 class="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">
                Inove no fluxo de <span class="text-indigo-600 dark:text-indigo-400">suprimentos</span>
            </h1>
            <p class="text-slate-500 dark:text-slate-400 text-lg">
                Gerencie seus processos de ponta a ponta com uma interface de alta performance.
            </p>
        </div>

        <!-- Grid de Cards de Alta Fidelidade -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Card 1 -->
            <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition">
                <div class="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-5">
                    🚀
                </div>
                <h3 class="font-display font-semibold text-lg text-slate-900 dark:text-white mb-2">Pronto para Docker</h3>
                <p class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Totalmente otimizado para rodar em containers leves e rápidos utilizando Nginx.
                </p>
            </div>

            <!-- Card 2 -->
            <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition">
                <div class="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-5">
                    🎨
                </div>
                <h3 class="font-display font-semibold text-lg text-slate-900 dark:text-white mb-2">Tailwind Integrado</h3>
                <p class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Fácil customização com classes utilitárias para construir interfaces incríveis sem folhas CSS bagunçadas.
                </p>
            </div>

            <!-- Card 3 -->
            <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition">
                <div class="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-5">
                    ⚙️
                </div>
                <h3 class="font-display font-semibold text-lg text-slate-900 dark:text-white mb-2">Automático (CI/CD)</h3>
                <p class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    O GitHub Actions compila sua imagem automaticamente a cada commit enviado.
                </p>
            </div>
        </div>
    </main>

    <!-- Rodapé -->
    <footer class="border-t border-slate-200/80 dark:border-slate-800 py-8 bg-white dark:bg-slate-950">
        <div class="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500 dark:text-slate-450">
            &copy; 2026 GeorgeFctech 3D. Desenvolvido com as melhores práticas de produção.
        </div>
    </footer>

    <!-- Script de Lógica Interativa e Alternância de Tema -->
    <script>
        const themeToggleBtn = document.getElementById('theme-toggle');
        const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
        const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

        function updateIcons() {
            if (document.documentElement.classList.contains('dark')) {
                themeToggleLightIcon.classList.remove('hidden');
                themeToggleDarkIcon.classList.add('hidden');
            } else {
                themeToggleLightIcon.classList.add('hidden');
                themeToggleDarkIcon.classList.remove('hidden');
            }
        }

        // Inicializa ícones corretos
        updateIcons();

        // Escuta clique
        themeToggleBtn.addEventListener('click', function() {
            if (document.documentElement.classList.contains('dark')) {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            } else {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            }
            updateIcons();
        });
    </script>
</body>
</html>
```

---

## 🐋 3. Preparando para Produção com Docker

Para servir esses arquivos estáticos de modo ultra performático, usamos um servidor **Nginx** dentro de um container Docker super enxuto de apenas ~10MB.

### Criando o arquivo `Dockerfile` na raiz:

```dockerfile
# Estágio Único: Servidor Web Nginx de Produção Leve
FROM nginx:alpine

# Copia os arquivos do projeto para o diretório padrão de publicação do Nginx
COPY . /usr/share/nginx/html/

# Informa a porta em que o container ficará escutando
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Criando o gerenciador `docker-compose.yml` de fácil controle:

```yaml
services:
  meu-app-web:
    build: .
    container_name: meu_projeto_web
    restart: unless-stopped
    ports:
      - "8080:80" # Acesse abrindo: http://IP-DO-SEU-SERVIDOR:8080
    networks:
      - rede-aplicativos

networks:
  rede-aplicativos:
    driver: bridge
```

---

## 📦 4. Publicando a Imagem Pronta no GitHub (E Como Resolver o Erro "Denied" no TrueNAS)

No seu último comando, você se deparou com isto no TrueNAS:
`✘ error: Head "https://ghcr.io/v2/.../manifests/latest": denied`

### 💡 Por que isso aconteceu?
Por motivos de privacidade e segurança, o GitHub configura por padrão qualquer nova imagem gerada no seu repositório como **Privada**. Quando o seu servidor TrueNAS ou Dockge tentou realizar o download público da imagem sem que você estivesse autenticado, o GitHub barrou o acesso com o erro `denied`.

### ✅ Como Resolver e Deixar Público para o TrueNAS Sem Precisar de Login no Servidor:

1. Acesse o seu Github em um navegador.
2. Acesse o seu perfil e vá em **Packages** (Pacotes) ou navegue para o repositório do seu projeto.
3. Clique em **Packages** no canto direito para ver pacotes vinculados à sua conta.
4. Clique no seu pacote (ex: `georgefctech-3d-manager`).
5. Role até o fim e busque pela opção **Package settings** (Configurações do pacote) no painel esquerdo.
6. Localize a área **Danger Zone** (Zona de perigo).
7. Clique na opção **Change visibility** (Alterar visibilidade).
8. Mude a visibilidade do pacote de **Private** para **Public** e digite o nome do pacote para confirmar.
9. Pronto! Agora qualquer servidor Docker poderá puxar a imagem sem precisar autenticar de forma pública no TrueNAS.

---

## 🤖 5. Automação Inteligente com GitHub Actions (CI/CD)

Não faça compilações manuais! Crie o arquivo `.github/workflows/deploy.yml` para compilar e salvar a imagem automaticamente no GitHub sempre que fizer um `git push`.

```yaml
name: Publicar Imagem de Produção

on:
  push:
    branches: [ "main" ] # Executa ao enviar commits para a branch principal

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write # Dá permissão de salvar a imagem Docker

    steps:
      - name: Baixar código fonte
        uses: actions/checkout@v4

      - name: Conectar ao GitHub Container Registry (GHCR)
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Gerar Letras Minúsculas no Nome do Repositório (Evita erros)
        id: prep
        run: |
          echo "REPO_NAME=${GITHUB_REPOSITORY,,}" >> $GITHUB_OUTPUT

      - name: Compilar e Enviar Imagem Docker
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ghcr.io/${{ steps.prep.outputs.REPO_NAME }}:latest
```

---

## 💻 6. Comandos Git Iniciais Essenciais (Para o Dia a Dia)

Quando você for iniciar um repositório local e subir para o GitHub pela primeira vez:

```bash
# 1. Entre na pasta do seu projeto localmente
cd /caminho/do/seu/projeto

# 2. Inicia o repositório Git
git init

# 3. Adicione todos os arquivos do projeto
git add .

# 4. Crie o seu primeiro commit
git commit -m "feat: estrutura inicial profissional para produçao"

# 5. Crie a branch principal correta
git branch -M main

# 6. Conecte com seu repositório no GitHub (Troque pelo LINK real do seu repositório)
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_PROJETO.git

# 7. Faça o envio definitivo para o GitHub
git push -u origin main
```

Seguindo este método em qualquer projeto web futuro, você garante que sua infraestrutura estará configurada de modo sustentável, limpo e à prova de falhas!
