#ifndef HANDLERS_CLI_H
#define HANDLERS_CLI_H

#include "serv_cli_fifo.h"

volatile sig_atomic_t reponse_recue = 0;

void hand_reveil(int sig) {
    (void)sig;
    printf("Client: Signal SIGUSR1 reçu - Réponse disponible\n");
    reponse_recue = 1;
}

void fin_client(int sig) {
    (void)sig;
    printf("\n❌ Client %d: Arrêt forcé\n", getpid());
    exit(1);
}

#endif