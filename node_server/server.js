const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const WebSocket = require('ws');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Chemins absolus corrigés
const PROJECT_ROOT = path.resolve(__dirname, '..');
const BIN_DIR = path.join(PROJECT_ROOT, 'bin');
const WEB_DIR = path.join(PROJECT_ROOT, 'web');

console.log('📁 Dossier projet:', PROJECT_ROOT);
console.log('📁 Dossier bin:', BIN_DIR);
console.log('📁 Dossier web:', WEB_DIR);

// Middleware
app.use(express.static(WEB_DIR));
app.use(express.json());

let serverProcess = null;
let clients = new Map();

// Fonction pour nettoyer et formater les sorties
function cleanOutput(data, type) {
    const lines = data.toString().split('\n');
    const cleanedLines = [];
    
    for (const line of lines) {
        const cleanLine = line.trim();
        if (cleanLine.length === 0) continue;
        
        // Filtrer les messages système répétitifs
        const skipPatterns = [
            '=== SERVEUR MULTI-CLIENTS (PID:',
            'Nettoyage des anciens FIFOs',
            'Création des tubes nommés',
            'Ouverture des FIFOs',
            '══════════════════════════════════════',
            'SERVEUR ACTIF',
            'Utilisez',
            '=== CLIENT (PID:',
            'Combien de questions?',
            'Connexion au serveur',
            '✅ Connecté! Envoi de'
        ];
        
        const shouldSkip = skipPatterns.some(pattern => cleanLine.includes(pattern));
        
        if (!shouldSkip) {
            cleanedLines.push(cleanLine);
        }
    }
    
    return cleanedLines;
}

// Route principale
app.get('/', (req, res) => {
    res.sendFile(path.join(WEB_DIR, 'index.html'));
});

// Démarrer le serveur C
app.post('/api/start-server', (req, res) => {
    if (serverProcess) {
        return res.json({ success: false, message: 'Serveur déjà en cours d\'exécution' });
    }

    const serverPath = path.join(BIN_DIR, 'serveur.exe');
    console.log(`🎯 Tentative de lancement: ${serverPath}`);
    
    if (!fs.existsSync(serverPath)) {
        console.log('❌ Fichier serveur introuvable');
        return res.json({ success: false, message: 'Fichier serveur introuvable' });
    }

    try {
        serverProcess = spawn(serverPath, [], {
            cwd: PROJECT_ROOT,
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let serverBuffer = '';

        serverProcess.stdout.on('data', (data) => {
            serverBuffer += data.toString();
            
            // Traiter par lignes complètes
            const lines = serverBuffer.split('\n');
            serverBuffer = lines.pop() || '';
            
            const cleanedLines = cleanOutput(lines.join('\n'), 'server');
            
            cleanedLines.forEach(cleanLine => {
                if (cleanLine.length > 0) {
                    console.log(`📨 Serveur: ${cleanLine}`);
                    
                    // Ne broadcaster que les messages importants
                    if (cleanLine.includes('📨 Client') || 
                        cleanLine.includes('📤 Réponse') || 
                        cleanLine.includes('Signal SIGUSR1') ||
                        cleanLine.includes('Serveur:')) {
                        broadcast({ type: 'server_output', data: cleanLine });
                    }
                }
            });
        });

        serverProcess.stderr.on('data', (data) => {
            const error = data.toString().trim();
            if (error.length > 0 && !error.includes('Nettoyage des anciens FIFOs')) {
                console.error(`❌ Serveur (erreur): ${error}`);
                broadcast({ type: 'server_error', data: error });
            }
        });

        serverProcess.on('close', (code) => {
            console.log(`🔌 Serveur terminé avec code: ${code}`);
            serverProcess = null;
            broadcast({ type: 'server_stopped', code });
        });

        serverProcess.on('error', (error) => {
            console.error('❌ Erreur de lancement serveur:', error);
            serverProcess = null;
            broadcast({ type: 'server_error', data: error.message });
        });

        // Confirmer le démarrage après un délai
        setTimeout(() => {
            if (serverProcess && !serverProcess.killed) {
                broadcast({ type: 'server_started' });
                res.json({ success: true, message: 'Serveur démarré', pid: serverProcess.pid });
            }
        }, 2000);

    } catch (error) {
        console.error('❌ Exception lors du lancement:', error);
        res.json({ success: false, message: 'Erreur de lancement: ' + error.message });
    }
});

// Arrêter le serveur C
app.post('/api/stop-server', (req, res) => {
    if (!serverProcess) {
        return res.json({ success: false, message: 'Serveur non démarré' });
    }

    try {
        serverProcess.kill('SIGTERM');
        serverProcess = null;
        res.json({ success: true, message: 'Serveur arrêté' });
    } catch (error) {
        res.json({ success: false, message: 'Erreur lors de l\'arrêt: ' + error.message });
    }
});

// Lancer un client C
app.post('/api/start-client', (req, res) => {
    const { questions = 5, maxNumbers = 10 } = req.body;

    const clientPath = path.join(BIN_DIR, 'client.exe');
    console.log(`🎯 Lancement client: ${clientPath}`);
    
    if (!fs.existsSync(clientPath)) {
        return res.json({ success: false, message: 'Fichier client introuvable' });
    }

    try {
        const clientProcess = spawn(clientPath, [], {
            cwd: PROJECT_ROOT,
            stdio: ['pipe', 'pipe', 'pipe']
        });

        const clientId = Date.now();
        let clientBuffer = '';

        clientProcess.stdout.on('data', (data) => {
            clientBuffer += data.toString();
            
            // Traiter par lignes complètes
            const lines = clientBuffer.split('\n');
            clientBuffer = lines.pop() || '';
            
            const cleanedLines = cleanOutput(lines.join('\n'), 'client');
            
            cleanedLines.forEach(cleanLine => {
                if (cleanLine.length > 0) {
                    console.log(`📨 Client ${clientId}: ${cleanLine}`);
                    
                    // Ne broadcaster que les messages importants
                    if (cleanLine.includes('📤 Q') || 
                        cleanLine.includes('✅ Réçu:') || 
                        cleanLine.includes('📊 Client') ||
                        cleanLine.includes('Signal SIGUSR1')) {
                        broadcast({ 
                            type: 'client_output', 
                            clientId, 
                            data: cleanLine 
                        });
                    }
                }
            });
        });

        clientProcess.stderr.on('data', (data) => {
            const error = data.toString().trim();
            if (error.length > 0) {
                console.error(`❌ Client ${clientId}: ${error}`);
                broadcast({ 
                    type: 'client_error', 
                    clientId, 
                    data: error 
                });
            }
        });

        clientProcess.on('close', (code) => {
            console.log(`🔌 Client ${clientId} terminé (code: ${code})`);
            
            // Envoyer le buffer restant
            if (clientBuffer.trim().length > 0) {
                const cleanedLines = cleanOutput(clientBuffer, 'client');
                cleanedLines.forEach(cleanLine => {
                    broadcast({ 
                        type: 'client_output', 
                        clientId, 
                        data: cleanLine 
                    });
                });
            }
            
            broadcast({ 
                type: 'client_stopped', 
                clientId, 
                code 
            });
            clients.delete(clientId);
        });

        clientProcess.on('error', (error) => {
            console.error(`❌ Erreur client ${clientId}:`, error);
            broadcast({ 
                type: 'client_error', 
                clientId, 
                data: error.message 
            });
        });

        clients.set(clientId, clientProcess);
        
        // Envoyer les paramètres après un court délai
        setTimeout(() => {
            const input = `${questions}\n${maxNumbers}\n`;
            clientProcess.stdin.write(input);
            clientProcess.stdin.end();
        }, 1000);

        broadcast({ 
            type: 'client_started', 
            clientId,
            questions,
            maxNumbers
        });
        
        res.json({ 
            success: true, 
            clientId, 
            message: `Client lancé avec ${questions} questions` 
        });

    } catch (error) {
        console.error('❌ Exception lancement client:', error);
        res.json({ success: false, message: 'Erreur de lancement: ' + error.message });
    }
});

// Lancer plusieurs clients
app.post('/api/start-multiple-clients', (req, res) => {
    const { count = 3, questions = 5, maxNumbers = 10 } = req.body;
    
    const clientPath = path.join(BIN_DIR, 'client.exe');
    
    if (!fs.existsSync(clientPath)) {
        return res.json({ success: false, message: 'Fichier client introuvable' });
    }
    
    const clientIds = [];
    
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            try {
                const clientProcess = spawn(clientPath, [], {
                    cwd: PROJECT_ROOT,
                    stdio: ['pipe', 'pipe', 'pipe']
                });

                const clientId = Date.now() + i;
                let clientBuffer = '';

                clientProcess.stdout.on('data', (data) => {
                    clientBuffer += data.toString();
                    const lines = clientBuffer.split('\n');
                    clientBuffer = lines.pop() || '';
                    
                    const cleanedLines = cleanOutput(lines.join('\n'), 'client');
                    
                    cleanedLines.forEach(cleanLine => {
                        if (cleanLine.length > 0 && 
                            (cleanLine.includes('📤 Q') || 
                             cleanLine.includes('✅ Réçu:') || 
                             cleanLine.includes('📊 Client'))) {
                            broadcast({ 
                                type: 'client_output', 
                                clientId, 
                                data: `[Client ${i+1}] ${cleanLine}` 
                            });
                        }
                    });
                });

                clientProcess.on('close', (code) => {
                    if (clientBuffer.trim().length > 0) {
                        const cleanedLines = cleanOutput(clientBuffer, 'client');
                        cleanedLines.forEach(cleanLine => {
                            if (cleanLine.includes('📊 Client')) {
                                broadcast({ 
                                    type: 'client_output', 
                                    clientId, 
                                    data: `[Client ${i+1}] ${cleanLine}` 
                                });
                            }
                        });
                    }
                    broadcast({ 
                        type: 'client_stopped', 
                        clientId, 
                        code 
                    });
                    clients.delete(clientId);
                });

                clients.set(clientId, clientProcess);
                clientIds.push(clientId);
                
                // Envoyer les paramètres après un délai
                setTimeout(() => {
                    const input = `${questions}\n${maxNumbers}\n`;
                    clientProcess.stdin.write(input);
                    clientProcess.stdin.end();
                }, 500);
                
                broadcast({ 
                    type: 'client_started', 
                    clientId, 
                    clientNumber: i + 1 
                });
                
            } catch (error) {
                console.error(`❌ Erreur client ${i+1}:`, error);
            }
        }, i * 3000);
    }
    
    res.json({ 
        success: true, 
        message: `Lancement de ${count} clients programmé`,
        clientIds 
    });
});

// WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

function broadcast(message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

wss.on('connection', (ws) => {
    console.log('✅ Nouveau client WebSocket connecté');
    
    // Envoyer l'état actuel
    ws.send(JSON.stringify({ 
        type: 'system_status', 
        serverRunning: !!serverProcess,
        clientsCount: clients.size 
    }));
    
    ws.on('close', () => {
        console.log('🔌 Client WebSocket déconnecté');
    });
});

// Démarrer le serveur web
app.listen(PORT, () => {
    console.log(`🌐 Interface web démarrée sur http://localhost:${PORT}`);
    console.log(`📡 WebSocket server sur ws://localhost:8080`);
    console.log('✅ Système prêt - En attente de connexions...');
});