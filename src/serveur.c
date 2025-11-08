#define _POSIX_C_SOURCE 200809L
#include "serv_cli_fifo.h"
#include "Handlers_Serv.h"
#include <sys/wait.h>

int main() {
    int fd_fifo1;
    Question question;
    
    printf("=== SERVEUR MULTI-CLIENTS (PID: %d) ===\n", getpid());
    
    masquer_signaux_clavier();
    signal(SIGTERM, fin_serveur);
    signal(SIGUSR1, hand_reveil);
    signal(SIGCHLD, SIG_IGN);
    
    printf("Nettoyage des anciens FIFOs...\n");
    unlink(FIFO1);
    unlink(FIFO2);
    
    printf("Création des tubes nommés...\n");
    if (mkfifo(FIFO1, 0666) == -1) {
        perror("mkfifo FIFO1");
        exit(1);
    }
    if (mkfifo(FIFO2, 0666) == -1) {
        perror("mkfifo FIFO2");
        unlink(FIFO1);
        exit(1);
    }
    
    printf("Ouverture des FIFOs...\n");
    fd_fifo1 = open(FIFO1, O_RDONLY);
    if (fd_fifo1 == -1) {
        perror("open FIFO1");
        exit(1);
    }
    
    printf("╔══════════════════════════════════════╗\n");
    printf("║         SERVEUR ACTIF (PID: %d)      ║\n", getpid());
    printf("║  Utilisez 'kill %d' pour arrêter     ║\n", getpid());
    printf("╚══════════════════════════════════════╝\n\n");
    
    while(1) {
        int bytes_read = read(fd_fifo1, &question, sizeof(Question));
        
        if(bytes_read == sizeof(Question)) {
            printf("📨 Client %d: Question %d/%d (%d nombres)\n", 
                   question.client_pid, question.question_number, 
                   question.total_questions, question.n);
            
            if (fork() == 0) {
                Reponse reponse;
                int fd_fifo2_child = open(FIFO2, O_WRONLY);
                if (fd_fifo2_child == -1) {
                    perror("open FIFO2");
                    exit(1);
                }
                
                srand((unsigned int)time(NULL) ^ (unsigned int)getpid());
                
                // ⭐ LE SERVEUR ENVOIE SON PID AU CLIENT
                reponse.client_pid = question.client_pid;
                reponse.serveur_pid = getpid();  // ⭐ PID du serveur
                reponse.question_number = question.question_number;
                reponse.total_questions = question.total_questions;
                
                for(int i = 0; i < question.n; i++) {
                    reponse.numbers[i] = rand() % NMAX + 1;
                }
                
                sleep(1);
                write(fd_fifo2_child, &reponse, sizeof(Reponse));
                close(fd_fifo2_child);
                
                printf("📤 Réponse à client %d (Q%d/%d)\n", 
                       question.client_pid, question.question_number, question.total_questions);
                
                kill(question.client_pid, SIGUSR1);
                exit(0);
            }
        } else if (bytes_read == -1) {
            perror("read FIFO1");
            sleep(1);
        }
    }
    
    close(fd_fifo1);
    unlink(FIFO1);
    unlink(FIFO2);
    return 0;
}