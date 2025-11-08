#define _POSIX_C_SOURCE 200809L
#include "serv_cli_fifo.h"
#include "Handlers_Serv.h"
#include <sys/wait.h>

int main() {
    int fd_fifo1, fd_fifo2;
    Question question;
    
    printf("=== SERVEUR SEQUENTIEL (PID: %d) ===\n", getpid());
    
    masquer_signaux_clavier();
    signal(SIGTERM, fin_serveur);
    signal(SIGUSR1, hand_reveil);
    
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
    
    printf("Ouverture des FIFOs (le serveur ouvre les deux en premier)...\n");
    
    // ⭐ OUVERTURE SIMULTANÉE des deux FIFOs pour éviter les blocages
    fd_fifo1 = open(FIFO1, O_RDONLY);
    if (fd_fifo1 == -1) {
        perror("open FIFO1");
        exit(1);
    }
    
    fd_fifo2 = open(FIFO2, O_WRONLY);
    if (fd_fifo2 == -1) {
        perror("open FIFO2");
        close(fd_fifo1);
        exit(1);
    }
    
    printf("╔══════════════════════════════════════╗\n");
    printf("║     SERVEUR ACTIF (PID: %d)          ║\n", getpid());
    printf("║  Prêt à recevoir des requêtes...     ║\n");
    printf("╚══════════════════════════════════════╝\n\n");
    
    srand((unsigned int)time(NULL) ^ (unsigned int)getpid());
    
    while(1) {
        printf("🕐 En attente de requête...\n");
        int bytes_read = read(fd_fifo1, &question, sizeof(Question));
        
        if(bytes_read == sizeof(Question)) {
            Reponse reponse;
            
            printf("📨 Requête reçue du client %d\n", question.client_pid);
            printf("   Question %d/%d (%d nombres)\n", 
                   question.question_number, question.total_questions, question.n);
            
            // Préparation de la réponse
            reponse.client_pid = question.client_pid;
            reponse.serveur_pid = getpid();
            reponse.question_number = question.question_number;
            reponse.total_questions = question.total_questions;
            
            // Génération des nombres aléatoires
            for(int i = 0; i < question.n; i++) {
                reponse.numbers[i] = rand() % NMAX + 1;
            }
            
            // Simulation du traitement
            sleep(1);
            
            // Envoi de la réponse
            printf("📤 Envoi réponse au client %d...\n", question.client_pid);
            write(fd_fifo2, &reponse, sizeof(Reponse));
            
            printf("✅ Réponse envoyée (Q%d/%d)\n", 
                   question.question_number, question.total_questions);
            
            // Réveil du client
            kill(question.client_pid, SIGUSR1);
            printf("🔔 Signal SIGUSR1 envoyé au client %d\n\n", question.client_pid);
            
        } else if (bytes_read == -1) {
            perror("❌ Erreur read FIFO1");
            sleep(1);
        } else if (bytes_read == 0) {
            printf("⚠️  FIFO1 fermé, réouverture...\n");
            close(fd_fifo1);
            close(fd_fifo2);
            
            // Réouverture
            fd_fifo1 = open(FIFO1, O_RDONLY);
            fd_fifo2 = open(FIFO2, O_WRONLY);
            if (fd_fifo1 == -1 || fd_fifo2 == -1) {
                perror("Réouverture FIFOs");
                break;
            }
        }
    }
    
    close(fd_fifo1);
    close(fd_fifo2);
    unlink(FIFO1);
    unlink(FIFO2);
    return 0;
}