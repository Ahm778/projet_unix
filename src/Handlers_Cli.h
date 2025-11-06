#ifndef HANDLERS_CLI_H
#define HANDLERS_CLI_H

#include "serv_cli_fifo.h"

extern volatile sig_atomic_t reponse_recue;
void hand_reveil(int sig);
void fin_client(int sig);

#endif