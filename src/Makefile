# Makefile pour le projet Communication Client/Serveur par Tubes Nommés
# Auteurs: [Votre Nom]
# Date: $(shell date +%Y-%m-%d)

CC = gcc
CFLAGS = -Wall -Wextra -std=c99 -g
LDFLAGS = 

# Fichiers sources
SERVER_SRC = serveur.c
CLIENT_SRC = client.c
COMMON_HEADERS = serv_cli_fifo.h Handlers_Serv.h Handlers_Cli.h

# Exécutables
SERVER_EXE = serveur
CLIENT_EXE = client

# Cible par défaut
all: $(SERVER_EXE) $(CLIENT_EXE) documentation

# Compilation du serveur
$(SERVER_EXE): $(SERVER_SRC) $(COMMON_HEADERS)
	@echo "🔨 Compilation du serveur..."
	$(CC) $(CFLAGS) -o $(SERVER_EXE) $(SERVER_SRC) $(LDFLAGS)
	@echo "✅ Serveur compilé: ./$(SERVER_EXE)"

# Compilation du client
$(CLIENT_EXE): $(CLIENT_SRC) $(COMMON_HEADERS)
	@echo "🔨 Compilation du client..."
	$(CC) $(CFLAGS) -o $(CLIENT_EXE) $(CLIENT_SRC) $(LDFLAGS)
	@echo "✅ Client compilé: ./$(CLIENT_EXE)"

# Nettoyage
clean:
	@echo "🧹 Nettoyage..."
	rm -f $(SERVER_EXE) $(CLIENT_EXE) fifo1 fifo2 *.o
	@echo "✅ Nettoyage terminé"

# Installation
install: all
	@echo "🚀 Installation terminée!"
	@echo "📋 Utilisation:"
	@echo "   Terminal 1: ./$(SERVER_EXE)"
	@echo "   Terminal 2: ./$(CLIENT_EXE)"

# Documentation
documentation:
	@echo "📖 Génération de la documentation..."
	@echo "=== PROJET COMMUNICATION CLIENT/SERVEUR ===" > README.txt
	@echo "Date: $(shell date)" >> README.txt
	@echo "" >> README.txt
	@echo "FICHIERS:" >> README.txt
	@echo "- serv_cli_fifo.h: Définitions communes" >> README.txt
	@echo "- Handlers_Serv.h: Gestionnaires serveur" >> README.txt
	@echo "- Handlers_Cli.h: Gestionnaires client" >> README.txt
	@echo "- serveur.c: Programme serveur" >> README.txt
	@echo "- client.c: Programme client" >> README.txt
	@echo "- Makefile: Compilation automatique" >> README.txt
	@echo "" >> README.txt
	@echo "UTILISATION:" >> README.txt
	@echo "1. make          # Compiler" >> README.txt
	@echo "2. ./serveur     # Démarrer serveur" >> README.txt
	@echo "3. ./client      # Démarrer client" >> README.txt
	@echo "4. make clean    # Nettoyer" >> README.txt
	@echo "✅ Documentation générée: README.txt"

# Test automatique
test: all
	@echo "🧪 Test automatique..."
	@./serveur &
	@sleep 2
	@echo "Test client 1..." && ./client < test_input.txt
	@killall serveur 2>/dev/null || true
	@echo "✅ Test terminé"

# Archive pour remise
archive: clean documentation
	@echo "📦 Création archive..."
	@tar -czf projet_unix_$(shell date +%Y%m%d_%H%M).tar.gz \
		$(SERVER_SRC) $(CLIENT_SRC) $(COMMON_HEADERS) \
		Makefile README.txt
	@echo "✅ Archive créée: projet_unix_$(shell date +%Y%m%d_%H%M).tar.gz"

.PHONY: all clean install documentation test archive