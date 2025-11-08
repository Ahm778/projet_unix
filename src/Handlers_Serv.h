#ifndef HANDLERS_SERV_H
#define HANDLERS_SERV_H

#include "serv_cli_fifo.h"

void hand_reveil(int sig) {
    (void)sig;
    printf("Serveur: Signal SIGUSR1 reçu - Client a lu la réponse\n");
}

void fin_serveur(int sig) {
    (void)sig;
    printf("\nServeur: Arrêt propre en cours...\n");
    unlink(FIFO1);
    unlink(FIFO2);
    printf("Serveur: Nettoyage terminé.\n");
    exit(0);
}

#endif