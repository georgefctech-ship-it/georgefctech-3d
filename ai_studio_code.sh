# 1. Inicializa o repositório local do Git
git init

# 2. Adiciona todos os arquivos do projeto para o estágio de准备 (staging zone)
# O arquivo .gitignore já impedirá o envio da pasta pesada node_modules
git add .

# 3. Cria o primeiro commit local com o seu código
git commit -m "feat: setup inicial do gestor de suprimentos e precificação"

# 4. Renomeia a branch padrão local para "main" (padrão do GitHub)
git branch -M main

# 5. Vincula a sua pasta local com o seu novo repositório hospedado no GitHub
# (Substitua a URL abaixo pela URL exata gerada no seu GitHub após criar o repositório!)
git remote add origin https://github.com/SEU_USUARIO_GITHUB/SEU_REPOSITORIO.git

# 6. Envia todo o seu código para o servidor do GitHub pela primeira vez de forma manual e segura
git push -u origin main