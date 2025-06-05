# 🚀 Postman Collection - DevIntest API

Questa cartella contiene i file Postman per testare completamente l'API del DevIntest.

## 📁 **File inclusi:**

1. **`DevIntest-API.postman_collection.json`** - Collection completa con tutte le chiamate API
2. **`DevIntest-Environment.postman_environment.json`** - Environment con variabili predefinite
3. **`README.md`** - Questo file con le istruzioni

## 🔧 **Setup Postman**

### 1. **Importa Collection e Environment**
```
1. Apri Postman
2. Click "Import" (in alto a sinistra)
3. Trascina entrambi i file JSON nella finestra di import
4. Conferma l'importazione
```

### 2. **Seleziona Environment**
```
1. In alto a destra, nel dropdown Environment
2. Seleziona "DevIntest - Development"
3. Verifica che base_url sia impostato su "http://localhost:3000"
```

### 3. **Avvia l'applicazione**
```bash
cd /Users/cristian/Tools/nest-app
docker-compose up --build
```

## 🎯 **Flusso di Test Consigliato**

### **Fase 1: Setup Utente**
```
1. Authentication → Register User
2. Authentication → Login User  (salva automaticamente access_token e user_id)
3. Authentication → Get Profile  (verifica autenticazione)
```

### **Fase 2: Setup Workspace**
```
1. Workspaces → Create Workspace  (salva automaticamente workspace_id)
2. Workspaces → Get All Workspaces
3. Workspaces → Get Workspace by ID
```

### **Fase 3: Setup Canali**
```
1. Channels → Create Channel  (salva automaticamente channel_id)
2. Channels → Get Workspace Channels
3. Channels → Get Channel by ID
```

### **Fase 4: Test Messaggistica**
```
1. Messages → Send Message to Channel  (salva automaticamente message_id)
2. Messages → Get Channel Messages
3. Messages → Update Message
4. Reactions → Add Reaction
5. Reactions → Get Message Reactions
```

### **Fase 5: Test Conversazioni Dirette**
```
1. Direct Conversations → Create Direct Conversation
2. Messages → Send Direct Message
3. Messages → Get Conversation Messages
```

### **Fase 6: Test Social Features**
```
1. Users → Search Users
2. Friendships → Send Friend Request
3. Friendships → Accept Friend Request
4. Friendships → Get User Friends
```

### **Fase 7: Test Notifiche**
```
1. Notifications → Get User Notifications
2. Notifications → Get Unread Count
3. Notifications → Mark Notification as Read
```

## 🔐 **Autenticazione**

La collection è configurata per usare **Bearer Token** automaticamente:
- Dopo il login, l'`access_token` viene salvato automaticamente nell'environment
- Tutte le chiamate successive useranno questo token automaticamente
- Se ricevi errori 401, rifai il login

## 📝 **Variabili Environment**

### **Variabili Manuali (da configurare):**
- `base_url`: http://localhost:3000
- `test_username`: testuser
- `test_email`: test@example.com
- `test_password`: password123
- `friend_user_id`: (ID di un altro utente per test amicizie)

### **Variabili Automatiche (popolate dai test):**
- `access_token`: Token JWT dopo login
- `user_id`: ID utente corrente
- `workspace_id`: ID workspace corrente
- `channel_id`: ID canale corrente
- `message_id`: ID messaggio corrente
- `conversation_id`: ID conversazione corrente
- `friendship_id`: ID amicizia corrente
- `notification_id`: ID notifica corrente
- `attachment_id`: ID allegato corrente

## 🔄 **Test Scripts Automatici**

Molte chiamate hanno **test scripts** che:
- ✅ Salvano automaticamente gli ID nelle variabili environment
- ✅ Verificano che le risposte siano corrette
- ✅ Permettono un flusso di test fluido

## 🐛 **Troubleshooting**

### **Errore 401 Unauthorized**
```
1. Vai su Authentication → Login User
2. Verifica che access_token sia popolato nell'environment
3. Riprova la chiamata
```

### **Errore 404 Not Found**
```
1. Verifica che l'applicazione sia avviata (docker-compose up)
2. Controlla che base_url sia corretto
3. Verifica che gli ID nelle variabili siano popolati
```

### **Errore di Connessione**
```
1. Verifica che Docker sia avviato
2. Controlla i log: docker-compose logs
3. Verifica che la porta 3000 sia libera
```

### **Variabili non popolate**
```
1. Esegui prima le chiamate di setup (Register/Login)
2. Verifica che i test scripts siano abilitati in Postman
3. Controlla la console di Postman per errori
```

## 📊 **Test Workflow Completo**

Per un test completo dell'API:

```
1. Register User → Login User
2. Create Workspace → Create Channel
3. Send Message to Channel → Add Reaction
4. Search Users → Send Friend Request → Accept Friend Request
5. Create Direct Conversation → Send Direct Message
6. Get Notifications → Mark as Read
7. Upload Attachment → Get Message Attachments
```

## 🌐 **WebSocket Testing**

Per testare i WebSocket:
1. Usa un client WebSocket separato (es. Socket.IO client)
2. Connetti a `ws://localhost:3000` con auth token
3. Testa eventi: `send_message`, `typing_start`, `typing_stop`

## 📱 **Prossimi Passi**

Dopo aver testato l'API base:
1. 🔐 Implementa autenticazione JWT reale
2. 📱 Testa WebSocket per real-time messaging
3. 🔔 Verifica push notifications
4. 📸 Testa upload di file/immagini
5. 🎨 Integra con frontend (React/Vue/Angular)

---

💡 **Tip**: Salva questo workspace Postman per riutilizzarlo durante lo sviluppo!
