class FIFOSystem {
    constructor() {
        this.serverRunning = false;
        this.clientsConnected = 0;
        this.requestsProcessed = 0;
        this.activeClients = 0;
        this.serverPid = null;
        this.ws = null;
        
        this.connectWebSocket();
        this.updateDisplay();
        this.addLog('Système initialisé. En attente de connexion WebSocket...', 'info');
        
        this.setupInputs();
    }

    setupInputs() {
        const totalQuestions = document.getElementById('totalQuestions');
        const maxNumbers = document.getElementById('maxNumbers');
        
        totalQuestions.addEventListener('change', function() {
            let value = parseInt(this.value);
            if (value < 1) this.value = 1;
            if (value > 100) this.value = 100;
        });
        
        maxNumbers.addEventListener('change', function() {
            let value = parseInt(this.value);
            if (value < 1) this.value = 1;
            if (value > 100) this.value = 100;
        });
    }

    connectWebSocket() {
        this.ws = new WebSocket('ws://localhost:8080');
        
        this.ws.onopen = () => {
            this.addLog('✅ Connecté au serveur WebSocket', 'success');
            this.updateSystemStatus('🟢 Système connecté', 'connected');
        };
        
        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleWebSocketMessage(message);
            } catch (error) {
                console.error('Erreur parsing message:', error);
            }
        };
        
        this.ws.onerror = (error) => {
            this.addLog('❌ Erreur de connexion WebSocket', 'error');
            this.updateSystemStatus('🔴 Erreur de connexion', 'disconnected');
        };
        
        this.ws.onclose = () => {
            this.addLog('🔌 Déconnecté du serveur WebSocket', 'warning');
            this.updateSystemStatus('🔴 Déconnecté', 'disconnected');
            
            setTimeout(() => {
                this.addLog('🔄 Tentative de reconnexion...', 'info');
                this.connectWebSocket();
            }, 5000);
        };
    }

    handleWebSocketMessage(message) {
        switch (message.type) {
            case 'server_output':
                if (this.isImportantServerMessage(message.data)) {
                    this.addLog(`🖥️ ${message.data}`, 'info');
                    this.requestsProcessed++;
                }
                break;
                
            case 'server_error':
                this.addLog(`❌ Serveur: ${message.data}`, 'error');
                break;
                
            case 'server_started':
                this.serverRunning = true;
                this.addLog('✅ Serveur C démarré avec succès', 'success');
                this.updateDisplay();
                break;
                
            case 'server_stopped':
                this.serverRunning = false;
                this.serverPid = null;
                this.addLog('🛑 Serveur C arrêté', 'warning');
                this.updateDisplay();
                break;
                
            case 'client_output':
                if (this.isImportantClientMessage(message.data)) {
                    this.addLog(`👤 ${message.data}`, 'success');
                    this.requestsProcessed++;
                }
                this.updateDisplay();
                break;
                
            case 'client_started':
                this.clientsConnected++;
                this.activeClients++;
                const clientNum = message.clientNumber ? `#${message.clientNumber}` : '';
                this.addLog(`🚀 Client ${clientNum} démarré (${message.questions} questions)`, 'info');
                this.updateDisplay();
                break;
                
            case 'client_stopped':
                this.activeClients = Math.max(0, this.activeClients - 1);
                this.addLog(`🔌 Client terminé`, 'warning');
                this.updateDisplay();
                break;
                
            case 'system_status':
                this.serverRunning = message.serverRunning;
                this.clientsConnected = message.clientsCount;
                this.updateDisplay();
                break;
        }
    }

    // Filtrer uniquement les messages serveur importants
    isImportantServerMessage(message) {
        const importantPatterns = [
            '📨 Client',
            '📤 Réponse',
            'Signal SIGUSR1',
            'Serveur:'
        ];
        return importantPatterns.some(pattern => message.includes(pattern));
    }

    // Filtrer uniquement les messages client importants
    isImportantClientMessage(message) {
        const importantPatterns = [
            '📤 Q',
            '✅ Réçu:',
            '📊 Client'
        ];
        return importantPatterns.some(pattern => message.includes(pattern));
    }

    addLog(message, type = 'info') {
        const log = document.getElementById('activityLog');
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        
        const timestamp = new Date().toLocaleTimeString();
        entry.innerHTML = `<strong>[${timestamp}]</strong> ${message}`;
        
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;
        
        // Limiter le nombre d'entrées
        if (log.children.length > 50) {
            log.removeChild(log.firstChild);
        }
    }

    updateDisplay() {
        document.getElementById('clientsConnected').textContent = this.clientsConnected;
        document.getElementById('requestsProcessed').textContent = this.requestsProcessed;
        document.getElementById('activeClients').textContent = this.activeClients;
        
        document.getElementById('serverPid').textContent = this.serverPid || '-';
        
        const serverStatus = document.getElementById('serverStatus');
        if (this.serverRunning) {
            serverStatus.innerHTML = '🟢 Serveur C en cours d\'exécution';
            serverStatus.className = 'status connected';
        } else {
            serverStatus.innerHTML = '🔴 Serveur C arrêté';
            serverStatus.className = 'status disconnected';
        }
    }

    updateSystemStatus(message, type) {
        const systemStatus = document.getElementById('systemStatus');
        systemStatus.innerHTML = message;
        systemStatus.className = `status ${type}`;
    }

    async startServer() {
        try {
            this.addLog('🚀 Démarrage du serveur C...', 'info');
            const response = await fetch('/api/start-server', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.addLog(`✅ ${data.message}`, 'success');
                if (data.pid) {
                    this.serverPid = data.pid;
                    this.updateDisplay();
                }
            } else {
                this.addLog(`❌ ${data.message}`, 'error');
            }
        } catch (error) {
            this.addLog('❌ Erreur de connexion au serveur web', 'error');
        }
    }

    async stopServer() {
        try {
            this.addLog('🛑 Arrêt du serveur C...', 'warning');
            const response = await fetch('/api/stop-server', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.addLog(`✅ ${data.message}`, 'success');
            } else {
                this.addLog(`❌ ${data.message}`, 'error');
            }
        } catch (error) {
            this.addLog('❌ Erreur de connexion au serveur web', 'error');
        }
    }

    async startClient() {
        if (!this.serverRunning) {
            this.addLog('❌ Le serveur doit être démarré avant de lancer un client', 'error');
            return;
        }

        const questions = parseInt(document.getElementById('totalQuestions').value) || 5;
        const maxNumbers = parseInt(document.getElementById('maxNumbers').value) || 10;

        try {
            this.addLog(`👤 Lancement d'un client (${questions} questions)...`, 'info');
            const response = await fetch('/api/start-client', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questions, maxNumbers })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.addLog(`✅ ${data.message}`, 'success');
            } else {
                this.addLog(`❌ ${data.message}`, 'error');
            }
        } catch (error) {
            this.addLog('❌ Erreur de lancement du client', 'error');
        }
    }

    async startMultipleClients() {
        if (!this.serverRunning) {
            this.addLog('❌ Le serveur doit être démarré avant de lancer des clients', 'error');
            return;
        }

        const questions = parseInt(document.getElementById('totalQuestions').value) || 5;
        const maxNumbers = parseInt(document.getElementById('maxNumbers').value) || 10;

        try {
            this.addLog(`👥 Lancement de 3 clients (${questions} questions chacun)...`, 'info');
            const response = await fetch('/api/start-multiple-clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    count: 3,
                    questions, 
                    maxNumbers 
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.addLog(`✅ ${data.message}`, 'success');
            } else {
                this.addLog(`❌ ${data.message}`, 'error');
            }
        } catch (error) {
            this.addLog('❌ Erreur de lancement des clients', 'error');
        }
    }
}

// Initialisation globale
const fifoSystem = new FIFOSystem();

// Fonctions globales pour les boutons HTML
function startServer() { fifoSystem.startServer(); }
function stopServer() { fifoSystem.stopServer(); }
function startClient() { fifoSystem.startClient(); }
function startMultipleClients() { fifoSystem.startMultipleClients(); }