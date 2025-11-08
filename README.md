# Système de Communication Client/Serveur avec Tubes Nommés (FIFO)

## 📋 Description
Ce projet implémente un système de communication client/serveur utilisant des tubes nommés (FIFO) en programmation système Unix. Le serveur génère des nombres aléatoires en réponse aux demandes des clients, avec un mécanisme de synchronisation par signaux.

## 🏗️ Architecture du Système

### Composants
- **Serveur** : Attend les requêtes des clients et génère des nombres aléatoires
- **Client** : Envoie des requêtes au serveur et reçoit des nombres aléatoires
- **Tubes nommés** :
  - `fifo1` : Pour les requêtes des clients vers le serveur
  - `fifo2` : Pour les réponses du serveur vers les clients
- **Signaux** : `SIGUSR1` pour la synchronisation

## 📁 Structure des Fichiers

├── src/
│ ├── serveur.c # Programme serveur
│ ├── client.c # Programme client
│ ├── serv_cli_fifo.h # Définitions communes
│ ├── Handlers_Serv.h # Handlers signaux serveur
│ └── Handlers_Cli.h # Handlers signaux client
├── web/
│ ├── index.html # Interface web
│ └── app.js # Logique JavaScript
├── node_server/
│ ├── server.js # Serveur Node.js
│ └── package.json # Dépendances Node
├── bin/ # Exécutables compilés
├── Makefile # Script de compilation
└── README.md # Documentation


## 🔄 Protocole de Communication

### Requête Client → Serveur
```c
typedef struct {
    pid_t client_pid;        // PID du client
    pid_t serveur_pid;       // PID du serveur
    int n;                   // Nombre de nombres demandés (1-NMAX)
    int question_number;     // Numéro de la question
    int total_questions;     // Total des questions
} Question;

🚀 Installation et Utilisation
Prérequis
Compilateur GCC

Make

Node.js (pour l'interface web)

Compilation
make clean
make all
Utilisation Basique


# Terminal 1 - Démarrer le serveur
make run-server

# Terminal 2 - Démarrer un client
make run-client
Utilisation Multi-Clients


# Démarrer 3 clients simultanément
make run-multi-clients

# Client avec nombre de questions personnalisé
make run-client-args QUESTIONS=10
Interface Web


# Démarrer l'interface web
make run-web

# Puis accéder à: http://localhost:3000
🎯 Fonctionnalités
Version 1 - Communication Basique
✅ Communication client/serveur via tubes FIFO

✅ Génération de nombres aléatoires

✅ Synchronisation par signaux SIGUSR1

✅ Gestion multi-clients basique

Version 2 - Interface Web & Multi-Clients
✅ Interface web temps réel

✅ Support multi-clients simultanés

✅ Communication WebSocket

✅ Logs d'activité en direct

✅ Commandes Makefile étendues