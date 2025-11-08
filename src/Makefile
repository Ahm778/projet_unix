CC = gcc
CFLAGS = -Wall -Wextra -std=c99 -g
LDFLAGS = 

SERVER_SRC = serveur.c
CLIENT_SRC = client.c
COMMON_HEADERS = serv_cli_fifo.h Handlers_Serv.h Handlers_Cli.h

SERVER_EXE = serveur
CLIENT_EXE = client

all: $(SERVER_EXE) $(CLIENT_EXE)

$(SERVER_EXE): $(SERVER_SRC) $(COMMON_HEADERS)
	@echo "🔨 Compilation du serveur..."
	$(CC) $(CFLAGS) -o $(SERVER_EXE) $(SERVER_SRC) $(LDFLAGS)
	@echo "✅ Serveur compilé: ./$(SERVER_EXE)"

$(CLIENT_EXE): $(CLIENT_SRC) $(COMMON_HEADERS)
	@echo "🔨 Compilation du client..."
	$(CC) $(CFLAGS) -o $(CLIENT_EXE) $(CLIENT_SRC) $(LDFLAGS)
	@echo "✅ Client compilé: ./$(CLIENT_EXE)"

# Cibles pour lancer directement
run-serveur: $(SERVER_EXE)
	@echo "🚀 Lancement du serveur..."
	./$(SERVER_EXE)

run-client: $(CLIENT_EXE)
	@echo "🚀 Lancement du client..."
	./$(CLIENT_EXE)

clean:
	@echo "🧹 Nettoyage..."
	rm -f $(SERVER_EXE) $(CLIENT_EXE) fifo1 fifo2 *.o
	@echo "✅ Nettoyage terminé"

.PHONY: all clean run-serveur run-client