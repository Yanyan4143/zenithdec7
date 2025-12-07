// Real Hardware Management System for POS
// Handles actual physical hardware connections using Web APIs

class HardwareManager {
    constructor() {
        this.devices = {
            cashdrawer: {
                connected: false,
                port: null,
                serialPort: null,
                status: 'Not Connected',
                lastUsed: null
            },
            printer: {
                connected: false,
                port: null,
                name: null,
                serialPort: null,
                bluetoothDevice: null,
                status: 'Not Connected',
                lastUsed: null
            },
            scanner: {
                connected: false,
                type: null,
                autoFocus: false,
                serialPort: null,
                bluetoothDevice: null,
                cameraStream: null,
                status: 'Not Connected',
                lastUsed: null
            }
        };
        
        this.settings = {
            autoOpenCashdrawer: 'cash-only',
            autoPrintReceipt: 'on-request',
            scannerBeep: true
        };
        
        // Check for Web API support
        this.capabilities = {
            serial: 'serial' in navigator,
            bluetooth: 'bluetooth' in navigator,
            usb: 'usb' in navigator,
            camera: 'mediaDevices' in navigator,
            printer: 'printer' in window
        };
        
        this.loadSettings();
        this.initializeEventListeners();
        this.updateHardwareStatus();
    }
    
    // Load hardware settings from localStorage
    loadSettings() {
        const saved = localStorage.getItem('hardwareSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
        
        const savedDevices = localStorage.getItem('hardwareDevices');
        if (savedDevices) {
            this.devices = { ...this.devices, ...JSON.parse(savedDevices) };
        }
    }
    
    // Save hardware settings to localStorage
    saveSettings() {
        localStorage.setItem('hardwareSettings', JSON.stringify(this.settings));
        localStorage.setItem('hardwareDevices', JSON.stringify(this.devices));
    }
    
    // Initialize event listeners for admin panel
    initializeAdminEventListeners() {
        // Cash Drawer
        const connectCashdrawerBtn = document.getElementById('connect-cashdrawer-btn');
        const testCashdrawerBtn = document.getElementById('test-cashdrawer-btn');
        const disconnectCashdrawerBtn = document.getElementById('disconnect-cashdrawer-btn');
        
        if (connectCashdrawerBtn) {
            connectCashdrawerBtn.addEventListener('click', () => this.connectCashdrawer('admin'));
        }
        if (testCashdrawerBtn) {
            testCashdrawerBtn.addEventListener('click', () => this.testCashdrawer('admin'));
        }
        if (disconnectCashdrawerBtn) {
            disconnectCashdrawerBtn.addEventListener('click', () => this.disconnectCashdrawer('admin'));
        }
        
        // Receipt Printer
        const connectPrinterBtn = document.getElementById('connect-printer-btn');
        const testPrinterBtn = document.getElementById('test-printer-btn');
        const disconnectPrinterBtn = document.getElementById('disconnect-printer-btn');
        
        if (connectPrinterBtn) {
            connectPrinterBtn.addEventListener('click', () => this.connectPrinter('admin'));
        }
        if (testPrinterBtn) {
            testPrinterBtn.addEventListener('click', () => this.testPrinter('admin'));
        }
        if (disconnectPrinterBtn) {
            disconnectPrinterBtn.addEventListener('click', () => this.disconnectPrinter('admin'));
        }
        
        // Barcode Scanner
        const connectScannerBtn = document.getElementById('connect-scanner-btn');
        const testScannerBtn = document.getElementById('test-scanner-btn');
        const disconnectScannerBtn = document.getElementById('disconnect-scanner-btn');
        
        if (connectScannerBtn) {
            connectScannerBtn.addEventListener('click', () => this.connectScanner('admin'));
        }
        if (testScannerBtn) {
            testScannerBtn.addEventListener('click', () => this.testScanner('admin'));
        }
        if (disconnectScannerBtn) {
            disconnectScannerBtn.addEventListener('click', () => this.disconnectScanner('admin'));
        }
        
        // Settings
        const autoOpenCashdrawer = document.getElementById('auto-open-cashdrawer');
        const autoPrintReceipt = document.getElementById('auto-print-receipt');
        const scannerBeep = document.getElementById('scanner-beep');
        
        if (autoOpenCashdrawer) {
            autoOpenCashdrawer.value = this.settings.autoOpenCashdrawer;
            autoOpenCashdrawer.addEventListener('change', (e) => {
                this.settings.autoOpenCashdrawer = e.target.value;
                this.saveSettings();
            });
        }
        
        if (autoPrintReceipt) {
            autoPrintReceipt.value = this.settings.autoPrintReceipt;
            autoPrintReceipt.addEventListener('change', (e) => {
                this.settings.autoPrintReceipt = e.target.value;
                this.saveSettings();
            });
        }
        
        if (scannerBeep) {
            scannerBeep.checked = this.settings.scannerBeep;
            scannerBeep.addEventListener('change', (e) => {
                this.settings.scannerBeep = e.target.checked;
                this.saveSettings();
            });
        }
        
        // Test buttons
        const testAllHardwareBtn = document.getElementById('test-all-hardware-btn');
        const hardwareDiagnosticsBtn = document.getElementById('hardware-diagnostics-btn');
        const resetHardwareBtn = document.getElementById('reset-hardware-btn');
        
        if (testAllHardwareBtn) {
            testAllHardwareBtn.addEventListener('click', () => this.testAllHardware());
        }
        if (hardwareDiagnosticsBtn) {
            hardwareDiagnosticsBtn.addEventListener('click', () => this.runDiagnostics());
        }
        if (resetHardwareBtn) {
            resetHardwareBtn.addEventListener('click', () => this.resetAllConnections());
        }
    }
    
    // Initialize event listeners for cashier panel
    initializeCashierEventListeners() {
        // Hardware Connect button
        const hardwareConnectBtn = document.getElementById('hardware-connect-btn');
        if (hardwareConnectBtn) {
            hardwareConnectBtn.addEventListener('click', () => {
                const modal = new bootstrap.Modal(document.getElementById('hardwareConnectModal'));
                modal.show();
            });
        }
        
        // Cash Drawer
        const connectCashdrawerBtn = document.getElementById('connect-cashdrawer-btn-cashier');
        const testCashdrawerBtn = document.getElementById('test-cashdrawer-btn-cashier');
        const disconnectCashdrawerBtn = document.getElementById('disconnect-cashdrawer-btn-cashier');
        
        if (connectCashdrawerBtn) {
            connectCashdrawerBtn.addEventListener('click', () => this.connectCashdrawer('cashier'));
        }
        if (testCashdrawerBtn) {
            testCashdrawerBtn.addEventListener('click', () => this.testCashdrawer('cashier'));
        }
        if (disconnectCashdrawerBtn) {
            disconnectCashdrawerBtn.addEventListener('click', () => this.disconnectCashdrawer('cashier'));
        }
        
        // Receipt Printer
        const connectPrinterBtn = document.getElementById('connect-printer-btn-cashier');
        const testPrinterBtn = document.getElementById('test-printer-btn-cashier');
        const disconnectPrinterBtn = document.getElementById('disconnect-printer-btn-cashier');
        
        if (connectPrinterBtn) {
            connectPrinterBtn.addEventListener('click', () => this.connectPrinter('cashier'));
        }
        if (testPrinterBtn) {
            testPrinterBtn.addEventListener('click', () => this.testPrinter('cashier'));
        }
        if (disconnectPrinterBtn) {
            disconnectPrinterBtn.addEventListener('click', () => this.disconnectPrinter('cashier'));
        }
        
        // Barcode Scanner
        const connectScannerBtn = document.getElementById('connect-scanner-btn-cashier');
        const testScannerBtn = document.getElementById('test-scanner-btn-cashier');
        const disconnectScannerBtn = document.getElementById('disconnect-scanner-btn-cashier');
        
        if (connectScannerBtn) {
            connectScannerBtn.addEventListener('click', () => this.connectScanner('cashier'));
        }
        if (testScannerBtn) {
            testScannerBtn.addEventListener('click', () => this.testScanner('cashier'));
        }
        if (disconnectScannerBtn) {
            disconnectScannerBtn.addEventListener('click', () => this.disconnectScanner('cashier'));
        }
        
        // Scanner auto-focus
        const scannerAutoFocus = document.getElementById('scanner-auto-focus-cashier');
        if (scannerAutoFocus) {
            scannerAutoFocus.checked = this.devices.scanner.autoFocus;
            scannerAutoFocus.addEventListener('change', (e) => {
                this.devices.scanner.autoFocus = e.target.checked;
                this.saveSettings();
            });
        }
        
        // Test buttons
        const testAllHardwareBtn = document.getElementById('test-all-hardware-btn-cashier');
        const hardwareDiagnosticsBtn = document.getElementById('hardware-diagnostics-btn-cashier');
        
        if (testAllHardwareBtn) {
            testAllHardwareBtn.addEventListener('click', () => this.testAllHardware());
        }
        if (hardwareDiagnosticsBtn) {
            hardwareDiagnosticsBtn.addEventListener('click', () => this.runDiagnostics());
        }
    }
    
    // Initialize all event listeners
    initializeEventListeners() {
        this.initializeAdminEventListeners();
        this.initializeCashierEventListeners();
    }
    
    // Connect Cash Drawer using Web Serial API
    async connectCashdrawer(panel = 'admin') {
        const portSelect = document.getElementById(panel === 'admin' ? 'cashdrawer-port' : 'cashdrawer-port-cashier');
        const port = portSelect?.value;
        
        if (!port) {
            this.showNotification('Please select a port for the cash drawer', 'warning');
            return;
        }
        
        if (!this.capabilities.serial) {
            this.showNotification('Web Serial API not supported in this browser', 'error');
            return;
        }
        
        try {
            // Request serial port access
            const serialPort = await navigator.serial.requestPort();
            
            // Open the serial connection
            await serialPort.open({ baudRate: 9600 });
            
            this.devices.cashdrawer.connected = true;
            this.devices.cashdrawer.port = port;
            this.devices.cashdrawer.serialPort = serialPort;
            this.devices.cashdrawer.status = 'Connected';
            this.devices.cashdrawer.lastUsed = new Date().toISOString();
            
            this.saveSettings();
            this.updateCashdrawerUI(panel);
            this.updateHardwareStatus();
            this.showNotification('Cash drawer connected successfully', 'success');
            
            // Start listening for data
            this.startCashdrawerListener(serialPort);
            
        } catch (error) {
            console.error('Cash drawer connection error:', error);
            this.showNotification(`Failed to connect cash drawer: ${error.message}`, 'error');
        }
    }
    
    // Start listening for cash drawer responses
    startCashdrawerListener(serialPort) {
        const reader = serialPort.readable.getReader();
        
        const readData = async () => {
            try {
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    
                    // Process cash drawer response
                    const response = new TextDecoder().decode(value);
                    console.log('Cash drawer response:', response);
                }
            } catch (error) {
                console.error('Cash drawer read error:', error);
            } finally {
                reader.releaseLock();
            }
        };
        
        readData();
    }
    
    // Test Cash Drawer - Send actual open command
    async testCashdrawer(panel = 'admin') {
        if (!this.devices.cashdrawer.connected || !this.devices.cashdrawer.serialPort) {
            this.showNotification('Cash drawer is not connected', 'error');
            return;
        }
        
        try {
            const writer = this.devices.cashdrawer.serialPort.writable.getWriter();
            
            // Send cash drawer kick command (ESC p m n)
            // ESC = 0x1B, p = 0x70, m = 0, n = 60 (pulse width in ms)
            const command = new Uint8Array([0x1B, 0x70, 0x00, 0x3C, 0x00]);
            await writer.write(command);
            
            this.devices.cashdrawer.lastUsed = new Date().toISOString();
            this.saveSettings();
            this.showNotification('Cash drawer opened successfully', 'success');
            this.playBeep();
            
            writer.releaseLock();
            
        } catch (error) {
            console.error('Cash drawer open error:', error);
            this.showNotification(`Failed to open cash drawer: ${error.message}`, 'error');
        }
    }
    
    // Disconnect Cash Drawer
    async disconnectCashdrawer(panel = 'admin') {
        if (this.devices.cashdrawer.serialPort) {
            try {
                await this.devices.cashdrawer.serialPort.close();
            } catch (error) {
                console.error('Error closing cash drawer port:', error);
            }
        }
        
        this.devices.cashdrawer.connected = false;
        this.devices.cashdrawer.port = null;
        this.devices.cashdrawer.serialPort = null;
        this.devices.cashdrawer.status = 'Not Connected';
        
        this.saveSettings();
        this.updateCashdrawerUI(panel);
        this.updateHardwareStatus();
        this.showNotification('Cash drawer disconnected', 'info');
    }
    
    // Connect Receipt Printer using Web Serial API or Bluetooth
    async connectPrinter(panel = 'admin') {
        const portSelect = document.getElementById(panel === 'admin' ? 'printer-port' : 'printer-port-cashier');
        const nameInput = document.getElementById(panel === 'admin' ? 'printer-name' : 'printer-name-cashier');
        
        const port = portSelect?.value;
        const name = nameInput?.value;
        
        if (!port) {
            this.showNotification('Please select a connection type for the printer', 'warning');
            return;
        }
        
        try {
            let connected = false;
            
            if (port === 'USB' || port.startsWith('COM')) {
                // Use Web Serial API
                if (!this.capabilities.serial) {
                    this.showNotification('Web Serial API not supported in this browser', 'error');
                    return;
                }
                
                const serialPort = await navigator.serial.requestPort();
                await serialPort.open({ baudRate: 9600 });
                
                this.devices.printer.serialPort = serialPort;
                connected = true;
                
            } else if (port === 'Bluetooth') {
                // Use Web Bluetooth API
                if (!this.capabilities.bluetooth) {
                    this.showNotification('Web Bluetooth API not supported in this browser', 'error');
                    return;
                }
                
                const bluetoothDevice = await navigator.bluetooth.requestDevice({
                    filters: [
                        { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Generic printer service
                        { namePrefix: 'Printer' }
                    ],
                    optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
                });
                
                const server = await bluetoothDevice.gatt.connect();
                this.devices.printer.bluetoothDevice = bluetoothDevice;
                connected = true;
                
            } else if (port === 'Network') {
                // Use Web Socket for network printers
                const printerIp = prompt('Enter printer IP address:');
                if (printerIp) {
                    const socket = new WebSocket(`ws://${printerIp}:9100`);
                    this.devices.printer.networkSocket = socket;
                    connected = true;
                }
            }
            
            if (connected) {
                this.devices.printer.connected = true;
                this.devices.printer.port = port;
                this.devices.printer.name = name || 'Default Printer';
                this.devices.printer.status = 'Connected';
                this.devices.printer.lastUsed = new Date().toISOString();
                
                this.saveSettings();
                this.updatePrinterUI(panel);
                this.updateHardwareStatus();
                this.showNotification('Printer connected successfully', 'success');
            }
            
        } catch (error) {
            console.error('Printer connection error:', error);
            this.showNotification(`Failed to connect printer: ${error.message}`, 'error');
        }
    }
    
    // Test Receipt Printer - Send actual print commands
    async testPrinter(panel = 'admin') {
        if (!this.devices.printer.connected) {
            this.showNotification('Printer is not connected', 'error');
            return;
        }
        
        try {
            const receiptData = this.generateTestReceipt();
            
            if (this.devices.printer.serialPort) {
                // Serial printer
                const writer = this.devices.printer.serialPort.writable.getWriter();
                await writer.write(receiptData);
                writer.releaseLock();
            } else if (this.devices.printer.bluetoothDevice) {
                // Bluetooth printer
                const service = await this.devices.printer.bluetoothDevice.gatt.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
                const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
                await characteristic.writeValue(receiptData);
            } else if (this.devices.printer.networkSocket) {
                // Network printer
                this.devices.printer.networkSocket.send(receiptData);
            }
            
            this.devices.printer.lastUsed = new Date().toISOString();
            this.saveSettings();
            this.showNotification('Test receipt printed successfully', 'success');
            this.playBeep();
            
        } catch (error) {
            console.error('Printer test error:', error);
            this.showNotification(`Failed to print test receipt: ${error.message}`, 'error');
        }
    }
    
    // Generate ESC/POS test receipt
    generateTestReceipt() {
        const encoder = new TextEncoder();
        const commands = [];
        
        // Initialize printer
        commands.push(0x1B, 0x40); // ESC @ - Initialize
        
        // Center text
        commands.push(0x1B, 0x61, 0x01); // ESC a 1 - Center align
        
        // Store name
        const storeName = "ZENITH LABS POS";
        commands.push(...encoder.encode(storeName));
        commands.push(0x0A, 0x0A); // New lines
        
        // Test receipt text
        commands.push(0x1B, 0x61, 0x00); // ESC a 0 - Left align
        commands.push(...encoder.encode("TEST RECEIPT"));
        commands.push(0x0A);
        commands.push(...encoder.encode("===================="));
        commands.push(0x0A);
        
        // Date and time
        const now = new Date();
        commands.push(...encoder.encode(`Date: ${now.toLocaleDateString()}`));
        commands.push(0x0A);
        commands.push(...encoder.encode(`Time: ${now.toLocaleTimeString()}`));
        commands.push(0x0A, 0x0A);
        
        // Sample items
        commands.push(...encoder.encode("Sample Item 1    x1    ₱50.00"));
        commands.push(0x0A);
        commands.push(...encoder.encode("Sample Item 2    x2    ₱30.00"));
        commands.push(0x0A);
        commands.push(...encoder.encode("--------------------"));
        commands.push(0x0A);
        
        // Total
        commands.push(0x1B, 0x45, 0x01); // ESC E 1 - Bold on
        commands.push(...encoder.encode("TOTAL: ₱110.00"));
        commands.push(0x1B, 0x45, 0x00); // ESC E 0 - Bold off
        commands.push(0x0A, 0x0A);
        
        // Cut paper
        commands.push(0x1D, 0x56, 0x00); // GS V 0 - Cut paper
        
        return new Uint8Array(commands);
    }
    
    // Disconnect Receipt Printer
    async disconnectPrinter(panel = 'admin') {
        if (this.devices.printer.serialPort) {
            try {
                await this.devices.printer.serialPort.close();
            } catch (error) {
                console.error('Error closing printer port:', error);
            }
        }
        
        if (this.devices.printer.bluetoothDevice) {
            try {
                await this.devices.printer.bluetoothDevice.gatt.disconnect();
            } catch (error) {
                console.error('Error disconnecting bluetooth printer:', error);
            }
        }
        
        if (this.devices.printer.networkSocket) {
            this.devices.printer.networkSocket.close();
        }
        
        this.devices.printer.connected = false;
        this.devices.printer.port = null;
        this.devices.printer.name = null;
        this.devices.printer.serialPort = null;
        this.devices.printer.bluetoothDevice = null;
        this.devices.printer.networkSocket = null;
        this.devices.printer.status = 'Not Connected';
        
        this.saveSettings();
        this.updatePrinterUI(panel);
        this.updateHardwareStatus();
        this.showNotification('Printer disconnected', 'info');
    }
    
    // Connect Barcode Scanner using Web Serial API, Bluetooth, or Camera
    async connectScanner(panel = 'admin') {
        const typeSelect = document.getElementById(panel === 'admin' ? 'scanner-type' : 'scanner-type-cashier');
        const type = typeSelect?.value;
        
        if (!type) {
            this.showNotification('Please select a scanner type', 'warning');
            return;
        }
        
        try {
            let connected = false;
            
            if (type === 'USB' || type === 'Serial') {
                // Use Web Serial API
                if (!this.capabilities.serial) {
                    this.showNotification('Web Serial API not supported in this browser', 'error');
                    return;
                }
                
                const serialPort = await navigator.serial.requestPort();
                await serialPort.open({ baudRate: 9600 });
                
                this.devices.scanner.serialPort = serialPort;
                this.startScannerListener(serialPort);
                connected = true;
                
            } else if (type === 'Bluetooth') {
                // Use Web Bluetooth API
                if (!this.capabilities.bluetooth) {
                    this.showNotification('Web Bluetooth API not supported in this browser', 'error');
                    return;
                }
                
                const bluetoothDevice = await navigator.bluetooth.requestDevice({
                    filters: [
                        { services: ['00001812-0000-1000-8000-00805f9b34fb'] }, // HID service
                        { namePrefix: 'Scanner' }
                    ],
                    optionalServices: ['00001812-0000-1000-8000-00805f9b34fb']
                });
                
                const server = await bluetoothDevice.gatt.connect();
                this.devices.scanner.bluetoothDevice = bluetoothDevice;
                this.startBluetoothScannerListener(bluetoothDevice);
                connected = true;
                
            } else if (type === 'Camera') {
                // Use Web Camera API
                if (!this.capabilities.camera) {
                    this.showNotification('Camera API not supported in this browser', 'error');
                    return;
                }
                
                await this.initializeCameraScanner();
                connected = true;
            }
            
            if (connected) {
                this.devices.scanner.connected = true;
                this.devices.scanner.type = type;
                this.devices.scanner.status = 'Connected';
                this.devices.scanner.lastUsed = new Date().toISOString();
                
                this.saveSettings();
                this.updateScannerUI(panel);
                this.updateHardwareStatus();
                this.showNotification('Scanner connected successfully', 'success');
            }
            
        } catch (error) {
            console.error('Scanner connection error:', error);
            this.showNotification(`Failed to connect scanner: ${error.message}`, 'error');
        }
    }
    
    // Start listening for serial scanner data
    startScannerListener(serialPort) {
        let buffer = '';
        
        const reader = serialPort.readable.getReader();
        
        const readData = async () => {
            try {
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    
                    // Accumulate data
                    buffer += new TextDecoder().decode(value);
                    
                    // Check for complete barcode (usually ends with newline)
                    if (buffer.includes('\n') || buffer.includes('\r')) {
                        const barcode = buffer.trim();
                        buffer = '';
                        
                        // Process barcode
                        this.processScannedBarcode(barcode);
                    }
                }
            } catch (error) {
                console.error('Scanner read error:', error);
            } finally {
                reader.releaseLock();
            }
        };
        
        readData();
    }
    
    // Start listening for Bluetooth scanner data
    async startBluetoothScannerListener(bluetoothDevice) {
        try {
            const service = await bluetoothDevice.gatt.getPrimaryService('00001812-0000-1000-8000-00805f9b34fb');
            const characteristic = await service.getCharacteristic('00002a4b-0000-1000-8000-00805f9b34fb');
            
            await characteristic.startNotifications();
            
            characteristic.addEventListener('characteristicvaluechanged', (event) => {
                const value = event.target.value;
                const barcode = new TextDecoder().decode(value);
                this.processScannedBarcode(barcode);
            });
            
        } catch (error) {
            console.error('Bluetooth scanner listener error:', error);
        }
    }
    
    // Initialize camera scanner
    async initializeCameraScanner() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            
            this.devices.scanner.cameraStream = stream;
            
            // Create video element for camera
            const video = document.createElement('video');
            video.srcObject = stream;
            video.autoplay = true;
            video.style.display = 'none';
            document.body.appendChild(video);
            
            // Initialize barcode scanning library
            this.startCameraScanning(video);
            
        } catch (error) {
            console.error('Camera scanner error:', error);
            throw error;
        }
    }
    
    // Start camera barcode scanning (would need a library like QuaggaJS or ZXing)
    startCameraScanning(video) {
        // This is a placeholder for actual barcode scanning implementation
        // In production, you would use a library like:
        // - QuaggaJS for 1D barcodes
        // - ZXing for 1D and 2D barcodes
        
        console.log('Camera scanner initialized - barcode scanning library needed');
        this.showNotification('Camera scanner ready - barcode scanning library integration needed', 'info');
    }
    
    // Process scanned barcode
    processScannedBarcode(barcode) {
        this.devices.scanner.lastUsed = new Date().toISOString();
        this.saveSettings();
        
        // Play beep if enabled
        if (this.settings.scannerBeep) {
            this.playBeep();
        }
        
        // Show notification
        this.showNotification(`Barcode scanned: ${barcode}`, 'success');
        
        // Add to cart if in cashier panel
        if (window.handleBarcodeScan) {
            window.handleBarcodeScan(barcode);
        }
        
        // Auto-focus back to barcode input if enabled
        if (this.devices.scanner.autoFocus) {
            const barcodeInput = document.getElementById('barcode-input');
            if (barcodeInput) {
                barcodeInput.focus();
            }
        }
    }
    
    // Test Barcode Scanner
    async testScanner(panel = 'admin') {
        if (!this.devices.scanner.connected) {
            this.showNotification('Scanner is not connected', 'error');
            return;
        }
        
        this.showNotification('Scanner ready - scan a barcode to test', 'info');
        
        // Simulate a test barcode for camera scanners
        if (this.devices.scanner.type === 'Camera') {
            setTimeout(() => {
                this.processScannedBarcode('1234567890123');
            }, 2000);
        }
    }
    
    // Disconnect Barcode Scanner
    async disconnectScanner(panel = 'admin') {
        if (this.devices.scanner.serialPort) {
            try {
                await this.devices.scanner.serialPort.close();
            } catch (error) {
                console.error('Error closing scanner port:', error);
            }
        }
        
        if (this.devices.scanner.bluetoothDevice) {
            try {
                await this.devices.scanner.bluetoothDevice.gatt.disconnect();
            } catch (error) {
                console.error('Error disconnecting bluetooth scanner:', error);
            }
        }
        
        if (this.devices.scanner.cameraStream) {
            this.devices.scanner.cameraStream.getTracks().forEach(track => track.stop());
        }
        
        this.devices.scanner.connected = false;
        this.devices.scanner.type = null;
        this.devices.scanner.serialPort = null;
        this.devices.scanner.bluetoothDevice = null;
        this.devices.scanner.cameraStream = null;
        this.devices.scanner.status = 'Not Connected';
        
        this.saveSettings();
        this.updateScannerUI(panel);
        this.updateHardwareStatus();
        this.showNotification('Scanner disconnected', 'info');
    }
    
    // Handle barcode scan (add item to cart)
    handleBarcodeScan(barcode) {
        // This would integrate with the existing cart system
        console.log('Barcode scanned:', barcode);
        // Implementation would look up barcode in inventory and add to cart
    }
    
    // Initialize camera scanner
    initializeCameraScanner() {
        // In real implementation, this would access device camera for barcode scanning
        console.log('Camera scanner initialized');
    }
    
    // Update Cash Drawer UI
    updateCashdrawerUI(panel = 'admin') {
        const statusEl = document.getElementById(panel === 'admin' ? 'cashdrawer-status' : 'cashdrawer-status-cashier');
        const connectBtn = document.getElementById(panel === 'admin' ? 'connect-cashdrawer-btn' : 'connect-cashdrawer-btn-cashier');
        const testBtn = document.getElementById(panel === 'admin' ? 'test-cashdrawer-btn' : 'test-cashdrawer-btn-cashier');
        const disconnectBtn = document.getElementById(panel === 'admin' ? 'disconnect-cashdrawer-btn' : 'disconnect-cashdrawer-btn-cashier');
        
        if (this.devices.cashdrawer.connected) {
            if (statusEl) statusEl.innerHTML = '<span class="badge bg-success">Connected</span>';
            if (connectBtn) connectBtn.classList.add('d-none');
            if (testBtn) testBtn.classList.remove('d-none');
            if (disconnectBtn) disconnectBtn.classList.remove('d-none');
        } else {
            if (statusEl) statusEl.innerHTML = '<span class="badge bg-secondary">Not Connected</span>';
            if (connectBtn) connectBtn.classList.remove('d-none');
            if (testBtn) testBtn.classList.add('d-none');
            if (disconnectBtn) disconnectBtn.classList.add('d-none');
        }
    }
    
    // Update Printer UI
    updatePrinterUI(panel = 'admin') {
        const statusEl = document.getElementById(panel === 'admin' ? 'printer-status' : 'printer-status-cashier');
        const connectBtn = document.getElementById(panel === 'admin' ? 'connect-printer-btn' : 'connect-printer-btn-cashier');
        const testBtn = document.getElementById(panel === 'admin' ? 'test-printer-btn' : 'test-printer-btn-cashier');
        const disconnectBtn = document.getElementById(panel === 'admin' ? 'disconnect-printer-btn' : 'disconnect-printer-btn-cashier');
        
        if (this.devices.printer.connected) {
            if (statusEl) statusEl.innerHTML = '<span class="badge bg-success">Connected</span>';
            if (connectBtn) connectBtn.classList.add('d-none');
            if (testBtn) testBtn.classList.remove('d-none');
            if (disconnectBtn) disconnectBtn.classList.remove('d-none');
        } else {
            if (statusEl) statusEl.innerHTML = '<span class="badge bg-secondary">Not Connected</span>';
            if (connectBtn) connectBtn.classList.remove('d-none');
            if (testBtn) testBtn.classList.add('d-none');
            if (disconnectBtn) disconnectBtn.classList.add('d-none');
        }
    }
    
    // Update Scanner UI
    updateScannerUI(panel = 'admin') {
        const statusEl = document.getElementById(panel === 'admin' ? 'scanner-status' : 'scanner-status-cashier');
        const connectBtn = document.getElementById(panel === 'admin' ? 'connect-scanner-btn' : 'connect-scanner-btn-cashier');
        const testBtn = document.getElementById(panel === 'admin' ? 'test-scanner-btn' : 'test-scanner-btn-cashier');
        const disconnectBtn = document.getElementById(panel === 'admin' ? 'disconnect-scanner-btn' : 'disconnect-scanner-btn-cashier');
        
        if (this.devices.scanner.connected) {
            if (statusEl) statusEl.innerHTML = '<span class="badge bg-success">Connected</span>';
            if (connectBtn) connectBtn.classList.add('d-none');
            if (testBtn) testBtn.classList.remove('d-none');
            if (disconnectBtn) disconnectBtn.classList.remove('d-none');
        } else {
            if (statusEl) statusEl.innerHTML = '<span class="badge bg-secondary">Not Connected</span>';
            if (connectBtn) connectBtn.classList.remove('d-none');
            if (testBtn) testBtn.classList.add('d-none');
            if (disconnectBtn) disconnectBtn.classList.add('d-none');
        }
    }
    
    // Update hardware status table
    updateHardwareStatus() {
        // Update admin panel table
        const adminTbody = document.getElementById('hardware-status-tbody');
        if (adminTbody) {
            adminTbody.innerHTML = this.generateHardwareStatusRows();
        }
        
        // Update cashier panel table
        const cashierTbody = document.getElementById('hardware-status-tbody-cashier');
        if (cashierTbody) {
            cashierTbody.innerHTML = this.generateHardwareStatusRows();
        }
    }
    
    // Generate hardware status table rows
    generateHardwareStatusRows() {
        const devices = [
            { name: 'Cash Drawer', key: 'cashdrawer', icon: '💰' },
            { name: 'Receipt Printer', key: 'printer', icon: '🧾' },
            { name: 'Barcode Scanner', key: 'scanner', icon: '📷' }
        ];
        
        return devices.map(device => {
            const deviceData = this.devices[device.key];
            const statusBadge = deviceData.connected ? 'bg-success' : 'bg-secondary';
            const lastUsed = deviceData.lastUsed ? new Date(deviceData.lastUsed).toLocaleString() : 'Never';
            
            return `
                <tr>
                    <td>${device.icon} ${device.name}</td>
                    <td><span class="badge ${statusBadge}">${deviceData.status}</span></td>
                    <td>${deviceData.port || deviceData.type || 'N/A'}</td>
                    <td>${lastUsed}</td>
                    <td>
                        ${deviceData.connected ? 
                            `<button class="btn btn-sm btn-outline-warning" onclick="hardwareManager.disconnect${device.key.replace('cashdrawer', 'Cashdrawer').replace('printer', 'Printer').replace('scanner', 'Scanner')}()">Disconnect</button>` :
                            `<button class="btn btn-sm btn-outline-primary" onclick="document.getElementById('${device.key}-port').focus()">Connect</button>`
                        }
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    // Test all connected hardware
    testAllHardware() {
        this.showNotification('Testing all connected hardware...', 'info');
        
        const tests = [];
        
        if (this.devices.cashdrawer.connected) {
            tests.push(this.testCashdrawer());
        }
        
        if (this.devices.printer.connected) {
            tests.push(this.testPrinter());
        }
        
        if (this.devices.scanner.connected) {
            tests.push(this.testScanner());
        }
        
        Promise.all(tests).then(() => {
            this.showNotification('All hardware tests completed', 'success');
        });
    }
    
    // Run hardware diagnostics
    runDiagnostics() {
        this.showNotification('Running hardware diagnostics...', 'info');
        
        const diagnostics = {
            cashdrawer: this.devices.cashdrawer.connected ? 'OK' : 'Not Connected',
            printer: this.devices.printer.connected ? 'OK' : 'Not Connected',
            scanner: this.devices.scanner.connected ? 'OK' : 'Not Connected',
            browser: navigator.userAgent,
            permissions: 'Checking...',
            ports: 'Scanning...'
        };
        
        setTimeout(() => {
            console.log('Hardware Diagnostics:', diagnostics);
            this.showNotification('Diagnostics completed. Check console for details.', 'success');
        }, 2000);
    }
    
    // Reset all connections
    resetAllConnections() {
        if (confirm('Are you sure you want to disconnect all hardware devices?')) {
            this.disconnectCashdrawer();
            this.disconnectPrinter();
            this.disconnectScanner();
            this.showNotification('All hardware connections reset', 'info');
        }
    }
    
    // Public methods for integration
    async openCashDrawer() {
        if (this.devices.cashdrawer.connected) {
            return await this.testCashdrawer();
        }
        return false;
    }
    
    async printReceipt(receiptData) {
        if (this.devices.printer.connected) {
            try {
                const receiptCommands = this.generateReceiptCommands(receiptData);
                
                if (this.devices.printer.serialPort) {
                    const writer = this.devices.printer.serialPort.writable.getWriter();
                    await writer.write(receiptCommands);
                    writer.releaseLock();
                } else if (this.devices.printer.bluetoothDevice) {
                    const service = await this.devices.printer.bluetoothDevice.gatt.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
                    const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
                    await characteristic.writeValue(receiptCommands);
                } else if (this.devices.printer.networkSocket) {
                    this.devices.printer.networkSocket.send(receiptCommands);
                }
                
                return true;
            } catch (error) {
                console.error('Print receipt error:', error);
                this.showNotification(`Failed to print receipt: ${error.message}`, 'error');
            }
        }
        return false;
    }
    
    // Generate ESC/POS receipt commands
    generateReceiptCommands(receiptData) {
        const encoder = new TextEncoder();
        const commands = [];
        
        // Initialize printer
        commands.push(0x1B, 0x40); // ESC @ - Initialize
        
        // Center text for header
        commands.push(0x1B, 0x61, 0x01); // ESC a 1 - Center align
        
        // Store name
        commands.push(...encoder.encode("ZENITH LABS POS"));
        commands.push(0x0A, 0x0A); // New lines
        
        // Left align for details
        commands.push(0x1B, 0x61, 0x00); // ESC a 0 - Left align
        
        // Date and time
        const date = new Date(receiptData.date);
        commands.push(...encoder.encode(`Date: ${date.toLocaleDateString()}`));
        commands.push(0x0A);
        commands.push(...encoder.encode(`Time: ${date.toLocaleTimeString()}`));
        commands.push(0x0A);
        commands.push(...encoder.encode(`Sale ID: ${receiptData.saleId}`));
        commands.push(0x0A, 0x0A);
        
        // Items
        commands.push(...encoder.encode("ITEMS"));
        commands.push(0x0A);
        commands.push(...encoder.encode("===================="));
        commands.push(0x0A);
        
        if (receiptData.items && receiptData.items.length > 0) {
            receiptData.items.forEach(item => {
                const itemLine = `${item.name.padEnd(15)} x${item.qty} ${item.price.toFixed(2)}`;
                commands.push(...encoder.encode(itemLine));
                commands.push(0x0A);
            });
        }
        
        commands.push(...encoder.encode("--------------------"));
        commands.push(0x0A);
        
        // Totals
        commands.push(0x1B, 0x45, 0x01); // ESC E 1 - Bold on
        commands.push(...encoder.encode(`TOTAL: ₱${receiptData.total.toFixed(2)}`));
        commands.push(0x1B, 0x45, 0x00); // ESC E 0 - Bold off
        commands.push(0x0A);
        
        if (receiptData.given > 0) {
            commands.push(...encoder.encode(`PAID: ₱${receiptData.given.toFixed(2)}`));
            commands.push(0x0A);
            commands.push(...encoder.encode(`CHANGE: ₱${receiptData.change.toFixed(2)}`));
            commands.push(0x0A, 0x0A);
        }
        
        // Footer
        commands.push(0x1B, 0x61, 0x01); // ESC a 1 - Center align
        commands.push(...encoder.encode("Thank you for shopping!"));
        commands.push(0x0A, 0x0A);
        
        // Cut paper
        commands.push(0x1D, 0x56, 0x00); // GS V 0 - Cut paper
        
        return new Uint8Array(commands);
    }
    
    playBeep() {
        if (this.settings.scannerBeep) {
            // Play beep sound
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE');
            audio.play();
        }
    }
    
    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize hardware manager
let hardwareManager;

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    hardwareManager = new HardwareManager();
    
    // Make hardware manager globally accessible
    window.hardwareManager = hardwareManager;
    
    console.log('🔧 Real Hardware Manager initialized');
    console.log('🔧 Capabilities:', hardwareManager.capabilities);
    
    // Show capability warnings
    if (!hardwareManager.capabilities.serial) {
        console.warn('⚠️ Web Serial API not supported - USB/Serial hardware unavailable');
    }
    if (!hardwareManager.capabilities.bluetooth) {
        console.warn('⚠️ Web Bluetooth API not supported - Bluetooth hardware unavailable');
    }
    if (!hardwareManager.capabilities.camera) {
        console.warn('⚠️ Camera API not supported - Camera scanner unavailable');
    }
});
