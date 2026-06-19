# Gestor de Suprimentos 3D - Guia de Deploy Pro (TrueNAS + Docker + Cloudflare)

Este guia prático e profissional orienta você no processo passo a passo de configuração, publicação e implantação contínua da sua aplicação de gestão de suprimentos e inventário 3D. O fluxo foi planejado sob a perspectiva de um desenvolvedor fullstack avançado: inicialização limpa de código, versionamento, deploy seguro via contêineres e publicação através de um túnel seguro do Cloudflare.

---

## 🛠️ Visão Geral da Arquitetura

```
[ Máquina Local / VSCode ] ──(Git Push)──> [ GitHub (Privado/Público) ]
                                                     │
                                                 (Git Clone)
                                                     ▼
                  [ TrueNAS Community Edition / Servidor Local ]
                      Dataset: /mnt/tank/appweb (Dono: root:apps)
                                         │
                             (Docker Compose / Porta 8090)
                                         ▼
                               [ Container Nginx (SPA) ]
                                         ▲
                               (Cloudflare Tunnel)
                                         │
                 [ Domínio: georgefctech-3d.georgefctech.com.br ]
```

---

## 📂 Visão Geral da Estrutura de Arquivos

Para garantir o sucesso da montagem da imagem de Docker, a estrutura na raiz do seu projeto local (`GEORGEFCTECH-3D-MANAGER`) deve conter os seguintes arquivos de infraestrutura essenciais:

1. **`Dockerfile`**: Compila a aplicação React no primeiro estágio (`node:20-alpine`) e serve os arquivos gerados em produção no segundo estágio usando `nginx:alpine`.
2. **`compose.yaml`**: Coordena a criação do contêiner na porta local `8090`.
3. **`nginx.conf`**: Configura o servidor interno do contêiner para gerenciar as rotas do tipo SPA (Single Page Application) e o cache inteligente de recursos.
4. **`.gitignore`**: Impede que arquivos pesados/específicos da sua máquina (`node_modules`, builds locais `.dist`, arquivos de credenciais `.env`) vazem para o repositório público ou privado.

> **Pergunta sobre a pasta `.github`**: Você precisa adicionar a pasta `.github`?  
> **Resposta:** Somente se você desejar configurar **CI/CD** automatizado (*GitHub Actions*) para compilar a imagem e enviá-la para o registro de pacotes (como o GHCR). Como faremos a compilação local de forma extremamente profissional em seu servidor de forma manual (Opção A no docker-compose), **não é estritamente necessário** para esse cenário.

---

## 🚀 Passo a Passo Completo do Deploy

### Passo 1: Inicializando o Repositório do Zero no VSCode e enviando ao GitHub

Abra o terminal do VSCode na raiz da pasta do seu projeto local (`GEORGEFCTECH-3D-MANAGER`) para subir os novos arquivos limpos após a limpeza dos repositórios antigos:

```bash
# 1. Inicialize um novo repositório local
git init

# 2. Adicione todos os arquivos ao versionamento (garantindo que o .gitignore esteja ativo para ocultar node_modules)
git add .

# 3. Crie o commit inicial de infraestrutura
git commit -m "feat: setup initial 3D inventory app & docker configuration"

# 4. Configure a branch principal para 'main'
git branch -M main

# 5. Adicione o endereço do seu repositório novo do GitHub (Crie o repo vazio no GitHub primeiro)
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git

# 6. Envie o seu código limpo e estruturado para o GitHub
git push -u origin main
```

---

### Passo 2: Configurando o Dataset `appweb` no TrueNAS

Como verificado nas configurações do seu **TrueNAS Core / Scale Community Edition**:
* Seu dataset está localizado no caminho físico: **`/mnt/tank/appweb`**
* O dataset está com as permissões configuradas para o grupo **`apps`** (`Owner: root:apps` com permissão de leitura, escrita e execução).

Certifique-se de que o usuário utilizado para acessar o terminal via SSH pertença ao grupo `apps` ou possua privilégio de `sudo` para gerenciar a pasta.

---

### Passo 3: Conectando ao Servidor TrueNAS e Clonando o Repositório

Acesse o terminal do seu servidor TrueNAS via SSH a partir de sua estação de trabalho:

```bash
# 1. SSH no servidor local (substitua com seu IP ou HostName e usuário)
ssh seu_usuario@ip_do_truenas

# 2. Navegue até a pasta montada do dataset
cd /mnt/tank/appweb

# 3. Clone o repositório diretamente dentro da pasta atual (utilizando o ponto "." no final)
# Importante: O diretório '/mnt/tank/appweb' deve estar vazio para que o clone funcione direto nele.
git clone https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git .
```

---

### Passo 4: Criando o Arquivo de Credenciais de Produção (`.env`)

Para que sua aplicação se conecte corretamente aos serviços externos (como Supabase, Firestore ou banco de dados), você **deve criar o arquivo de variáveis de ambiente diretamente no seu servidor**. Como o `.env` está no seu `.gitignore`, ele não foi enviado ao GitHub para garantir a segurança dos dados.

Ainda no terminal do seu TrueNAS, dentro da pasta `/mnt/tank/appweb`:

```bash
# 1. Crie o arquivo .env usando o nano ou outro editor de sua preferência
nano .env
```

No editor de texto que se abrirá, cole suas variáveis de produção desejadas. Por exemplo:

```env
# Configurações de Conexão com o Supabase/Banco de Dados
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

*Dica: Salve o arquivo pressionando `Ctrl + O`, depois `Enter`, e saia com `Ctrl + X`.*

---

### Passo 5: Executando o Container via Docker Compose

A configuração no arquivo `compose.yaml` que deixamos pronta possui a instrução `build: .` e mapeia o arquivo `.env` para o contexto de build caso necessário. Isso indica que o Docker lerá o nosso `Dockerfile` e realizará a compilação local da aplicação em tempo de execução no TrueNAS.

Para iniciar seu contêiner de forma silenciosa e rodando em plano de fundo:

```bash
# 1. Execute o comando de compilação e inicialização na pasta /mnt/tank/appweb
docker compose up -d --build
```

O Docker baixará a imagem leve do `Node` e do `Nginx`, compilará os arquivos estáticos de produção empacotando-os e disponibilizará o servidor interno na porta **`8090`**.

---

### Passo 6: Configurando o Acesso Seguro via Cloudflare Tunnel

Como você já criou o túnel do Cloudflare apontando para o subdomínio `https://georgefctech-3d.georgefctech.com.br/`, agora só precisa direcionar o tráfego do túnel para a porta interna do contêiner.

No painel do **Cloudflare Zero Trust** (em *Access -> Tunnels*):
1. Selecione o túnel que você criou.
2. Nas configurações do **Public Hostname**, configure:
   * **Subdomain**: `georgefctech-3d`
   * **Domain**: `georgefctech.com.br`
   * **Path**: Deixe vazio (`/`)
   * **Service Type**: **`HTTP`**
   * **URL/IP**: **`ip_local_do_seu_truenas:8090`** (Ex: `192.168.1.100:8090` ou `localhost:8090` se o Cloudflare Tunnel (cloudflared) estiver rodando dentro do próprio servidor em rede de host comum).
3. Salve as alterações.

Pronto! Seu tráfego HTTPS criptografado do Cloudflare agora se comunica diretamente com o Nginx na porta local `8090` de forma segura, sem exposição de portas no roteador residencial ou firewall local.

---

## 📈 Comandos Úteis de Manutenção e Logs

Sempre que precisar atualizar seu sistema ou debugar os acessos à aplicação, utilize estes comandos diretamente na pasta `/mnt/tank/appweb`:

### 1. Monitorar Logs em Tempo Real
Verifique quem está acessando ou se houver falha de inicialização:
```bash
docker compose logs -f --tail=100
```

### 2. Atualizar a Aplicação com Nova Versão do GitHub
Sempre que você fizer alterações locais no seu VSCode, subir commits para o GitHub e desejar aplicar as mudanças no seu servidor:
```bash
# Puxe os arquivos mais recentes do GitHub
git pull

# Pare, remonte o container compilando o novo build de produção e starte novamente
docker compose up -d --build
```

### 3. Verificar Status do Container
Confirme se o contêiner está rodando sem instabilidades:
```bash
docker compose ps
```

### 4. Parar ou Excluir o Container Temporariamente
```bash
docker compose down
```
