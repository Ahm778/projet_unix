# Compilation des programmes C
CC = gcc
CFLAGS = -Wall -Wextra -std=c99 -D_POSIX_C_SOURCE=200809L -g

# Répertoires
SRC_DIR = src
WEB_DIR = web
NODE_DIR = node_server
BUILD_DIR = bin

# Programmes C
SERVER_SRC = $(SRC_DIR)/serveur.c
CLIENT_SRC = $(SRC_DIR)/client.c

SERVER_EXE = $(BUILD_DIR)/serveur.exe
CLIENT_EXE = $(BUILD_DIR)/client.exe

.PHONY: all clean run-server run-client run-multi-clients run-web help

all: $(SERVER_EXE) $(CLIENT_EXE)

$(BUILD_DIR):
	@mkdir -p $(BUILD_DIR)

$(SERVER_EXE): $(SERVER_SRC) | $(BUILD_DIR)
	@echo "🔨 Compilation du serveur..."
	$(CC) $(CFLAGS) -o $(SERVER_EXE) $(SERVER_SRC)

$(CLIENT_EXE): $(CLIENT_SRC) | $(BUILD_DIR)
	@echo "🔨 Compilation du client..."
	$(CC) $(CFLAGS) -o $(CLIENT_EXE) $(CLIENT_SRC)

# ✅ NOUVELLES COMMANDES
run-server: $(SERVER_EXE)
	@echo "🚀 Lancement du serveur C..."
	./$(SERVER_EXE)

run-client: $(CLIENT_EXE)
	@echo "🚀 Lancement d'un client C..."
	./$(CLIENT_EXE)

# ✅ Lancer plusieurs clients
run-multi-clients: $(CLIENT_EXE)
	@echo "🚀 Lancement de 3 clients simultanés..."
	@for i in 1 2 3; do \
		echo "Client $$i..."; \
		./$(CLIENT_EXE) & \
	done
	@echo "✅ 3 clients lancés en arrière-plan"

# ✅ Interface web
run-web:
	@echo "🌐 Lancement de l'interface web..."
	@cd $(NODE_DIR) && node server.js

# ✅ Tout lancer
run-all: $(SERVER_EXE) $(CLIENT_EXE)
	@echo "🚀 Lancement complet du système..."
	@echo "📝 Ouvrez un nouveau terminal pour: make run-web"
	./$(SERVER_EXE) &

clean:
	@echo "🧹 Nettoyage..."
	@rm -rf $(BUILD_DIR) fifo1 fifo2
	@echo "✅ Nettoyage terminé"

help:
	@echo "=== SYSTÈME CLIENT/SERVEUR MULTI-CLIENTS ==="
	@echo "Cibles disponibles:"
	@echo "  all              - Compile serveur et client"
	@echo "  run-server       - Lance le serveur C"
	@echo "  run-client       - Lance un client C"
	@echo "  run-multi-clients - Lance 3 clients simultanés"
	@echo "  run-web          - Lance l'interface web"
	@echo "  run-all          - Lance le serveur (en arrière-plan)"
	@echo "  clean            - Nettoie les fichiers générés"
	@echo "  help             - Affiche cette aide"

.DEFAULT_GOAL := help