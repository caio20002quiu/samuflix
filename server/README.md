# Configuração MongoDB Atlas - SamuFlix

## Passo a Passo para Criar Cluster no MongoDB Atlas

### 1. Criar Conta no MongoDB Atlas
1. Acesse: https://www.mongodb.com/cloud/atlas
2. Clique em **"Try Free"** ou **"Sign Up"**
3. Faça o registro (pode usar Google/GitHub)

### 2. Criar Projeto
1. No dashboard, clique em **"New Project"**
2. Dê um nome (ex: "samuflix")
3. Clique em **"Create Project"**

### 3. Criar Cluster Gratuito
1. Clique em **"Build a Database"**
2. Escolha **"M0 FREE"** (Shared - Gratuito)
3. Escolha a região (recomendado: **São Paulo (AWS sa-east-1)**)
4. Dê um nome ao cluster (ex: "Cluster0")
5. Clique em **"Create"** (pode levar alguns minutos)

### 4. Criar Usuário do Banco de Dados
1. No menu lateral, vá em **"Database Access"**
2. Clique em **"Add New Database User"**
3. Authentication Method: **"Password"**
4. Crie um **username** e **password** (ANOTE EM LOCAL SEGURO!)
5. Database User Privileges: **"Read and write to any database"**
6. Clique em **"Add User"**

### 5. Configurar Acesso de Rede
1. No menu lateral, vá em **"Network Access"**
2. Clique em **"Add IP Address"**
3. Para testes: escolha **"Allow Access from Anywhere"** (0.0.0.0/0)
   - ⚠️ Em produção, adicione apenas IPs específicos!
4. Clique em **"Confirm"**

### 6. Obter String de Conexão
1. No dashboard, clique em **"Connect"** no seu cluster
2. Escolha **"Connect your application"**
3. Driver: **"Node.js"**, Version: **mais recente**
4. Copie a string de conexão que aparece
   - Formato: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

### 7. Configurar no Projeto
1. Crie o arquivo `.env` na pasta `server/`
2. Cole a string de conexão substituindo `<username>` e `<password>`:

```env
MONGODB_URI=mongodb+srv://seu-usuario:sua-senha@cluster0.xxxxx.mongodb.net/samuflix?retryWrites=true&w=majority
PORT=4000
```

**IMPORTANTE:**
- Substitua `seu-usuario` e `sua-senha` pelas credenciais que você criou
- Substitua `cluster0.xxxxx.mongodb.net` pela URL do seu cluster
- Adicione o nome do banco de dados na URL: `/samuflix` (antes do `?`)

### 8. Instalar Dependências e Rodar

```bash
cd server
npm install
npm run dev
```

A API estará rodando em `http://localhost:4000`

## Estrutura da API

### Vídeos
- `GET /videos` - Lista todos os vídeos
- `POST /videos` - Cria um vídeo (metadados)
- `POST /videos/upload` - Upload de arquivo de vídeo (multipart/form-data, campo: `video`)
- `POST /videos/upload-thumb` - Upload de thumbnail (multipart/form-data, campo: `thumb`)

### Favoritos
- `GET /favorites/:userId` - Lista favoritos do usuário
- `POST /favorites` - Adiciona favorito
- `DELETE /favorites/:userId/:videoId` - Remove favorito

### Mensagens
- `GET /messages/:userId` - Lista mensagens do usuário
- `POST /messages` - Cria mensagem

### Outros
- `GET /health` - Health check

## Upload de Arquivos

Os arquivos (vídeos e thumbnails) são salvos no diretório `server/uploads/`:
- Vídeos: `server/uploads/videos/`
- Thumbnails: `server/uploads/thumb/`

Os arquivos são servidos estaticamente através da rota `/uploads/*`.

**Importante:** 
- Certifique-se de que o diretório `uploads` existe e tem permissões de escrita
- Em produção, considere usar um serviço de armazenamento em nuvem (AWS S3, Cloudinary, etc.)

