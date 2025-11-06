#ifndef SERV_CLI_FIFO_H
#define SERV_CLI_FIFO_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#include <time.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <signal.h>

#define NMAX 100
#define FIFO1 "fifo1"
#define FIFO2 "fifo2"
#define MAX_QUESTIONS 10

typedef struct {
    pid_t client_pid;
    int n;  // Nombre de nombres aléatoires demandés
    int question_number;
    int total_questions;
} Question;

typedef struct {
    pid_t client_pid;
    int numbers[NMAX];
    int question_number;
    int total_questions;
} Reponse;

static inline void masquer_signaux_clavier(void) {
    signal(SIGINT, SIG_IGN);
    signal(SIGQUIT, SIG_IGN);
    signal(SIGTSTP, SIG_IGN);
}

static inline void retablir_signaux_clavier(void) {
    signal(SIGINT, SIG_DFL);
    signal(SIGQUIT, SIG_DFL);
    signal(SIGTSTP, SIG_DFL);
}

#endif