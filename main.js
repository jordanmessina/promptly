const { app, BrowserWindow, ipcMain, safeStorage, globalShortcut, clipboard, Tray, Menu } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
const Anthropic = require('@anthropic-ai/sdk')

let mainWindow
let modalWindow = null
let tray = null

// Path to store encrypted API keys
const keysFilePath = path.join(os.homedir(), '.promptly-keys.json')

// Default system prompt
const DEFAULT_SYSTEM_PROMPT = "You are a prompt enhancement specialist. Your job is to transform brief, simple requests into comprehensive, structured prompts that will get the best results from AI systems. Take the user's input and expand it into a detailed prompt using this format:\n\n**Situation**\nProvide relevant context, role, or scenario that frames the request. Set up who the user is or what situation they're in.\n\n**Task**\nBreak down exactly what needs to be accomplished. Be specific about requirements, format, scope, and any constraints.\n\n**Objective**\nClearly state the end goal or purpose. What should be achieved by completing this task?\n\n**Knowledge**\nInclude relevant background information, guidelines, best practices, or specific requirements that will help ensure quality results. Add 'Your life depends on...' for critical accuracy requirements.\n\nMaintain the original intent while making it much more detailed and actionable. Return only the enhanced prompt in the exact format shown above."

// Helper functions for persistent storage
function saveKeysToFile(keys, instruction = null, systemPrompt = null) {
    try {
        // Load existing data first
        let existingData = {}
        if (fs.existsSync(keysFilePath)) {
            existingData = JSON.parse(fs.readFileSync(keysFilePath, 'utf8'))
        }
        
        const dataToSave = { ...existingData }
        
        // Handle API keys (encrypted)
        for (const [provider, key] of Object.entries(keys)) {
            if (key && safeStorage.isEncryptionAvailable()) {
                dataToSave[provider] = safeStorage.encryptString(key).toString('base64')
            }
        }
        
        // Handle instruction (plain text)
        if (instruction !== null) {
            dataToSave.instruction = instruction
        }
        
        // Handle system prompt (plain text)
        if (systemPrompt !== null) {
            dataToSave.systemPrompt = systemPrompt
        }
        
        fs.writeFileSync(keysFilePath, JSON.stringify(dataToSave, null, 2))
        return true
    } catch (error) {
        console.error('Error saving data to file:', error)
        return false
    }
}

function loadKeysFromFile() {
    try {
        if (!fs.existsSync(keysFilePath)) {
            return {}
        }
        const data = JSON.parse(fs.readFileSync(keysFilePath, 'utf8'))
        const result = {}
        
        // Decrypt API keys
        for (const [provider, encryptedKey] of Object.entries(data)) {
            if (provider === 'instruction') {
                // Instruction is stored as plain text
                result.instruction = encryptedKey
            } else if (provider === 'systemPrompt') {
                // System prompt is stored as plain text
                result.systemPrompt = encryptedKey
            } else if (encryptedKey && safeStorage.isEncryptionAvailable()) {
                try {
                    const buffer = Buffer.from(encryptedKey, 'base64')
                    result[provider] = safeStorage.decryptString(buffer)
                } catch (decryptError) {
                    console.error(`Error decrypting ${provider} key - the key may need to be re-entered:`, decryptError.message)
                    // Remove the corrupted key from the file
                    delete data[provider]
                    fs.writeFileSync(keysFilePath, JSON.stringify(data, null, 2))
                }
            }
        }
        return result
    } catch (error) {
        console.error('Error loading keys from file:', error)
        // If the file is completely corrupted, remove it
        try {
            fs.unlinkSync(keysFilePath)
            console.log('Removed corrupted keys file. Please re-enter your API key.')
        } catch (unlinkError) {
            console.error('Could not remove corrupted keys file:', unlinkError)
        }
        return {}
    }
}

// Function to improve text using Anthropic API
async function improveText(originalText) {
    try {
        const data = loadKeysFromFile()
        if (!data.anthropic) {
            throw new Error('No Anthropic API key found. Please configure your API key in the settings.')
        }

        const anthropic = new Anthropic({
            apiKey: data.anthropic,
        })

        // Use custom system prompt or default
        const systemPrompt = data.systemPrompt || DEFAULT_SYSTEM_PROMPT

        const message = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1000,
            system: systemPrompt,
            messages: [{
                role: "user",
                content: `${originalText}`
            }]
        })

        return message.content[0].text.trim()
    } catch (error) {
        console.error('Error improving text:', error)
        throw error
    }
}

function createWindow() {
    const appIcon = createAppIcon(32)
    
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 900,
        show: false, // Don't show by default
        icon: appIcon,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    mainWindow.loadFile('index.html')
    
    // Don't show automatically - only show when requested from menu
}

function createAppIcon(size = 16) {
    // Create a simple icon using nativeImage
    const { nativeImage } = require('electron')
    
    const buffer = Buffer.alloc(size * size * 4, 0) // RGBA
    
    // Fill with a simple pattern (black square with white border)
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const idx = (y * size + x) * 4
            if (x === 0 || x === size - 1 || y === 0 || y === size - 1) {
                // White border
                buffer[idx] = 255     // R
                buffer[idx + 1] = 255 // G
                buffer[idx + 2] = 255 // B
                buffer[idx + 3] = 255 // A
            } else {
                // Black inside
                buffer[idx] = 0       // R
                buffer[idx + 1] = 0   // G
                buffer[idx + 2] = 0   // B
                buffer[idx + 3] = 255 // A
            }
        }
    }
    
    return nativeImage.createFromBuffer(buffer, { width: size, height: size })
}

function createTray() {
    const icon = createAppIcon(16)
    tray = new Tray(icon.resize({ width: 16, height: 16 }))
    
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Settings',
            click: () => {
                if (!mainWindow) {
                    createWindow()
                }
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.show()
                    mainWindow.focus()
                }
            }
        },
        {
            type: 'separator'
        },
        {
            label: 'Quit Promptly',
            click: () => {
                app.quit()
            }
        }
    ])
    
    tray.setToolTip('Promptly - Text Improvement Tool')
    tray.setContextMenu(contextMenu)
}

async function createModalWindow(capturedText, sourceApp = null) {
    // Close existing modal if open
    if (modalWindow && !modalWindow.isDestroyed()) {
        modalWindow.close()
        modalWindow = null
    }
    
    // Prevent creating multiple modals simultaneously
    if (modalWindow) {
        return modalWindow
    }

    // Hide main window completely while modal is open
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
        mainWindow.hide()
    }

    const appIcon = createAppIcon(32)
    
    modalWindow = new BrowserWindow({
        width: 700,
        height: 500,
        resizable: false,
        alwaysOnTop: true,
        center: true,
        frame: false,
        modal: false,
        show: false,
        skipTaskbar: true, // Don't show in taskbar
        focusable: true,
        minimizable: false,
        maximizable: false,
        acceptsFirstMouse: true,
        kiosk: false,
        icon: appIcon,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'modal-preload.js')
        }
    })

    // Store the source app on the window object
    modalWindow.sourceApp = sourceApp

    modalWindow.loadFile('modal.html')
    
    // Send the captured text once the window is ready
    modalWindow.webContents.once('did-finish-load', async () => {
        if (modalWindow && !modalWindow.isDestroyed()) {
            modalWindow.webContents.send('set-captured-text', capturedText, null, true) // Show loading
            
            // Temporarily show in dock to steal focus
            if (process.platform === 'darwin') {
                app.dock?.show()
            }
            
            modalWindow.show()
            modalWindow.focus()
            modalWindow.setAlwaysOnTop(true, 'screen-saver')
            modalWindow.moveTop()
            
            // Force focus on macOS
            if (process.platform === 'darwin') {
                app.focus({ steal: true })
                modalWindow.focus()
                
                // Use AppleScript to force focus by app name
                const { execSync } = require('child_process')
                try {
                    // Get our process name and make it frontmost
                    const pid = process.pid
                    const ourProcessName = execSync(`osascript -e "tell application \\"System Events\\" to get name of first process whose unix id is ${pid}"`).toString().trim()
                    
                    // Try to find our process and make it frontmost using our actual process name
                    execSync(`osascript -e "tell application \\"System Events\\" to set frontmost of first process whose name is \\"${ourProcessName}\\" to true"`)
                } catch (error) {
                    try {
                        // Fallback: use the process ID directly
                        const pid = process.pid
                        execSync(`osascript -e "tell application \\"System Events\\" to set frontmost of first process whose unix id is ${pid} to true"`)
                    } catch (error2) {
                        // Silent fallback - focus will be handled by Electron's built-in methods
                    }
                }
            }
            
            // Additional focus attempt after a delay
            setTimeout(() => {
                modalWindow.focus()
                modalWindow.webContents.focus()
                modalWindow.setAlwaysOnTop(true, 'screen-saver')
            }, 100)
        }
        
        try {
            // Improve the text using Anthropic API
            const improvedText = await improveText(capturedText)
            // Check if modal still exists before sending
            if (modalWindow && !modalWindow.isDestroyed()) {
                modalWindow.webContents.send('set-improved-text', improvedText)
            }
        } catch (error) {
            console.error('Failed to improve text:', error)
            // Check if modal still exists before sending error
            if (modalWindow && !modalWindow.isDestroyed()) {
                modalWindow.webContents.send('set-error', error.message)
            }
        }
    })

    modalWindow.on('closed', () => {
        const sourceApp = modalWindow.sourceApp
        modalWindow = null
        
        // Hide dock icon again
        if (process.platform === 'darwin') {
            app.dock?.hide()
        }
        
        // On macOS, activate the specific app we came from
        if (process.platform === 'darwin' && sourceApp) {
            const { execSync } = require('child_process')
            try {
                setTimeout(() => {
                    execSync(`osascript -e "tell application \\"${sourceApp}\\" to activate"`)
                }, 50)
            } catch (error) {
                console.log(`Could not restore focus to ${sourceApp}:`, error.message)
            }
        }
    })

    return modalWindow
}

// Function to check and request accessibility permissions
async function checkAccessibilityPermissions() {
    if (process.platform !== 'darwin') return true
    
    const { systemPreferences } = require('electron')
    
    // Check if we have accessibility permissions
    const hasAccess = systemPreferences.isTrustedAccessibilityClient(false)
    
    if (!hasAccess) {
        // Show a dialog explaining what permissions are needed
        const { dialog } = require('electron')
        const result = await dialog.showMessageBox({
            type: 'info',
            title: 'Accessibility Permission Required',
            message: 'Promptly needs Accessibility permission to capture text globally',
            detail: 'To use Cmd+Shift+T anywhere on your Mac, please:\n\n1. Click "Open System Settings" below\n2. Go to Privacy & Security > Accessibility\n3. Click the lock to unlock settings\n4. Add Promptly to the list and enable it\n5. Restart Promptly',
            buttons: ['Open System Settings', 'Skip for Now'],
            defaultId: 0
        })
        
        if (result.response === 0) {
            // Try to prompt for accessibility permission
            systemPreferences.isTrustedAccessibilityClient(true)
        }
        
        return false
    }
    
    return true
}

app.whenReady().then(async () => {
    // Set the app name for macOS
    app.setName('Promptly')
    
    // Set app user model ID for Windows (and helps with identification)
    if (process.platform === 'win32') {
        app.setAppUserModelId('com.jordanmessina.promptly')
    }
    
    // Hide dock icon (makes app not appear in Command+Tab)
    app.dock?.hide()
    
    createTray()
    
    // Check accessibility permissions on macOS
    await checkAccessibilityPermissions()
    
    // Check if API key is configured, if not show settings on first launch
    const keys = loadKeysFromFile()
    if (!keys.anthropic) {
        createWindow()
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.show()
            mainWindow.focus()
        }
    }
    
    // Register global shortcut for capturing highlighted text
    const ret = globalShortcut.register('CommandOrControl+Shift+T', async () => {
        // Check permissions again when shortcut is used
        if (process.platform === 'darwin') {
            const { systemPreferences } = require('electron')
            const hasAccess = systemPreferences.isTrustedAccessibilityClient(false)
            if (!hasAccess) {
                await checkAccessibilityPermissions()
                return
            }
        }
        // On macOS, we need to simulate Cmd+C to copy selected text
        if (process.platform === 'darwin') {
            const { execSync } = require('child_process')
            try {
                // Store the currently active application before we do anything
                const activeApp = execSync('osascript -e "tell application \\"System Events\\" to get name of first application process whose frontmost is true"').toString().trim()
                
                // Store current clipboard content
                const previousClipboard = clipboard.readText()
                
                // Use AppleScript to copy selected text
                execSync('osascript -e "tell application \\"System Events\\" to keystroke \\"c\\" using command down"')
                
                // Wait a bit for the copy to complete
                setTimeout(async () => {
                    try {
                        const copiedText = clipboard.readText()
                        
                        // Check if clipboard content changed (indicating text was actually copied)
                        if (copiedText && copiedText.trim() && copiedText !== previousClipboard) {
                            // Show modal window with captured text and store the active app
                            await createModalWindow(copiedText, activeApp)
                        } else if (copiedText && copiedText.trim()) {
                            // If clipboard didn't change but has content, still proceed
                            // Show modal window with captured text and store the active app
                            await createModalWindow(copiedText, activeApp)
                        }
                    } catch (error) {
                        console.error('Error creating modal window:', error)
                    }
                }, 150)
            } catch (error) {
                console.log('❌ Error capturing selected text:', error.message)
            }
        } else {
            // For other platforms, try clipboard directly
            try {
                const clipboardText = clipboard.readText()
                if (clipboardText && clipboardText.trim()) {
                    // Show modal window with captured text (no source app detection for non-macOS)
                    await createModalWindow(clipboardText, null)
                }
            } catch (error) {
                console.error('Error creating modal window:', error)
            }
        }
    })

    if (!ret) {
        console.log('Registration of global shortcut failed')
    }
})

app.on('window-all-closed', () => {
    // Don't quit when all windows are closed for menu bar apps
    // The app should continue running in the background
})

app.on('will-quit', () => {
    // Unregister all shortcuts
    globalShortcut.unregisterAll()
})

app.on('activate', () => {
    // For menu bar apps, we don't want to show anything on activate
    // since there's no dock icon to click
})

ipcMain.handle('save-api-keys', async (event, keys, instruction) => {
    try {
        // Load existing data first
        const existingData = loadKeysFromFile()
        
        // Merge with new keys (only the API keys, not instruction)
        const updatedKeys = {}
        for (const [provider, key] of Object.entries(keys)) {
            if (provider !== 'instruction') {
                updatedKeys[provider] = key
            }
        }
        
        // Save to file
        const success = saveKeysToFile(updatedKeys, instruction)
        
        if (success) {
            return { success: true, message: 'Settings saved successfully' }
        } else {
            return { success: false, message: 'Failed to save settings to file' }
        }
    } catch (error) {
        return { success: false, message: 'Failed to save settings: ' + error.message }
    }
})

ipcMain.handle('save-system-prompt', async (event, systemPrompt) => {
    try {
        // Save to file
        const success = saveKeysToFile({}, null, systemPrompt)
        
        if (success) {
            return { success: true, message: 'System prompt saved successfully' }
        } else {
            return { success: false, message: 'Failed to save system prompt to file' }
        }
    } catch (error) {
        return { success: false, message: 'Failed to save system prompt: ' + error.message }
    }
})

ipcMain.handle('get-default-prompt', async () => {
    return DEFAULT_SYSTEM_PROMPT
})

ipcMain.handle('load-api-keys', async () => {
    try {
        return loadKeysFromFile()
    } catch (error) {
        console.error('Error in load-api-keys handler:', error)
        return {}
    }
})
