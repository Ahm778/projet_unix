#define _POSIX_C_SOURCE 200809L
#include "serv_cli_fifo.h"
#include "Handlers_Cli.h"

volatile sig_atomic_t reponse_recue = 0;

void hand_reveil(int sig) {
    (void)sig;
    reponse_recue = 1;
}

void fin_client(int sig) {
    printf("\n❌ Client %d: Arrêt forcé\n", getpid());
    exit(1);
}

int main() {
    int fd_fifo1, fd_fifo2;
    Question question;
    Reponse reponse;
    int total_questions;
    
    printf("\n=== CLIENT (PID: %d) ===\n", getpid());
    
    // Masquer signaux clavier
    masquer_signaux_clavier();
    
    // Installer handlers
    signal(SIGTERM, fin_client);
    signal(SIGUSR1, hand_reveil);
    
    printf("Combien de questions? (1-%d): ", MAX_QUESTIONS);
    if (scanf("%d", &total_questions) != 1 || total_questions < 1 || total_questions > MAX_QUESTIONS) {
        printf("❌ Erreur! Choisissez 1-%d\n", MAX_QUESTIONS);
        return 1;
    }
    
    // Vider buffer
    int c;
    while ((c = getchar()) != '\n' && c != EOF);
    
    printf("🔗 Connexion au serveur...\n");
    
    // Ouverture FIFOs
    fd_fifo1 = open(FIFO1, O_WRONLY);
    if (fd_fifo1 == -1) {
        perror("❌ FIFO1");
        printf("💡 Démarrez le serveur d'abord avec: ./serveur\n");
        return 1;
    }
    
    fd_fifo2 = open(FIFO2, O_RDONLY | O_NONBLOCK);
    if (fd_fifo2 == -1) {
        perror("❌ FIFO2");
        close(fd_fifo1);
        return 1;
    }
    
    printf("✅ Connecté! Envoi de %d questions...\n\n", total_questions);
    
    srand((unsigned int)time(NULL) ^ (unsigned int)getpid());
    question.client_pid = getpid();
    question.total_questions = total_questions;
    
    int succes = 0;
    
    for(int i = 1; i <= total_questions; i++) {
        question.question_number = i;
        question.n = (rand() % 10) + 1;
        
        printf("📤 Q%d/%d: %d nombres → ", i, total_questions, question.n);
        fflush(stdout);
        
        // Envoi question
        write(fd_fifo1, &question, sizeof(Question));
        
        // Attente réponse
        reponse_recue = 0;
        int timeout = 0;
        
        while (!reponse_recue && timeout < 15) {
            sleep(1);
            timeout++;
            
            // Vérification non-bloquante
            int bytes_read = read(fd_fifo2, &reponse, sizeof(Reponse));
            if (bytes_read == sizeof(Reponse) && reponse.client_pid == getpid()) {
                reponse_recue = 1;
            }
        }
        
        if (reponse_recue) {
            printf("✅ Réçu: ");
            for(int j = 0; j < question.n; j++) {
                printf("%d ", reponse.numbers[j]);
            }
            printf("\n");
            succes++;
        } else {
            printf("⏰ Timeout\n");
        }
    }
    
    printf("\n📊 Client %d: %d/%d questions traitées avec succès\n", 
           getpid(), succes, total_questions);
    
    close(fd_fifo1);
    close(fd_fifo2);
    retablir_signaux_clavier();
    return 0;
}