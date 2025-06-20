document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('api-form')
    const systemPromptForm = document.getElementById('system-prompt-form')
    const apiKeyInput = document.getElementById('api-key')
    const systemPromptInput = document.getElementById('system-prompt')
    const clearBtn = document.getElementById('clear-btn')
    const resetPromptBtn = document.getElementById('reset-prompt-btn')
    const statusMessage = document.getElementById('status-message')
    const toggleVisibilityBtn = document.getElementById('toggle-visibility')
    const eyeIcon = document.getElementById('eye-icon')
    const eyeOffIcon = document.getElementById('eye-off-icon')
    const tabButtons = document.querySelectorAll('.tab-button')
    const tabContents = document.querySelectorAll('.tab-content')

    let savedKey = false
    let actualApiKey = ''

    const loadedData = await window.electronAPI.loadApiKeys()
    if (loadedData.anthropic) {
        savedKey = true
        actualApiKey = loadedData.anthropic
    }
    
    // Load system prompt if it exists, otherwise load default
    if (loadedData.systemPrompt) {
        systemPromptInput.value = loadedData.systemPrompt
    } else {
        const defaultPrompt = await window.electronAPI.getDefaultPrompt()
        systemPromptInput.value = defaultPrompt
    }

    function updateKeyDisplay() {
        if (savedKey) {
            apiKeyInput.value = '••••••••••••••••••••••••••••••••••••••••'
            apiKeyInput.placeholder = 'Saved Anthropic API key'
            apiKeyInput.type = 'password'
            eyeIcon.style.display = 'block'
            eyeOffIcon.style.display = 'none'
        } else {
            apiKeyInput.value = ''
            apiKeyInput.placeholder = 'Enter your Anthropic API key'
            apiKeyInput.type = 'password'
            eyeIcon.style.display = 'block'
            eyeOffIcon.style.display = 'none'
        }
    }

    updateKeyDisplay()

    apiKeyInput.addEventListener('focus', () => {
        if (savedKey && apiKeyInput.value === '••••••••••••••••••••••••••••••••••••••••') {
            // Only clear if user actually starts typing, not just on focus
            apiKeyInput.dataset.wasMasked = 'true'
        }
    })

    apiKeyInput.addEventListener('input', () => {
        if (apiKeyInput.dataset.wasMasked === 'true') {
            // Clear the masked value when user starts typing
            if (apiKeyInput.value.includes('•')) {
                apiKeyInput.value = apiKeyInput.value.replace(/•/g, '')
            }
            apiKeyInput.dataset.wasMasked = 'false'
        }
    })

    // Toggle password visibility
    toggleVisibilityBtn.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        
        if (apiKeyInput.type === 'password') {
            // Show the actual API key if we have one saved
            if (savedKey && actualApiKey) {
                apiKeyInput.value = actualApiKey
            }
            apiKeyInput.type = 'text'
            eyeIcon.style.display = 'none'
            eyeOffIcon.style.display = 'block'
        } else {
            // Hide the API key again
            if (savedKey) {
                apiKeyInput.value = '••••••••••••••••••••••••••••••••••••••••'
            }
            apiKeyInput.type = 'password'
            eyeIcon.style.display = 'block'
            eyeOffIcon.style.display = 'none'
        }
    })

    form.addEventListener('submit', async (e) => {
        e.preventDefault()
        
        const apiKey = apiKeyInput.value.trim()
        
        // Check if we need to save an API key
        let keysToSave = {}
        if (apiKey && apiKey !== '••••••••••••••••••••••••••••••••••••••••') {
            keysToSave.anthropic = apiKey
        } else if (!savedKey) {
            showMessage('Please enter an API key', 'error')
            return
        }

        const result = await window.electronAPI.saveApiKeys(keysToSave, null)
        
        if (result.success) {
            showMessage('API key saved successfully', 'success')
            if (keysToSave.anthropic) {
                savedKey = true
                actualApiKey = keysToSave.anthropic
                updateKeyDisplay()
            }
        } else {
            showMessage(result.message, 'error')
        }
    })

    clearBtn.addEventListener('click', () => {
        apiKeyInput.value = ''
        savedKey = false
        actualApiKey = ''
        statusMessage.textContent = ''
        statusMessage.className = ''
        updateKeyDisplay()
    })

    function showMessage(message, type) {
        statusMessage.textContent = message
        statusMessage.className = type
        setTimeout(() => {
            statusMessage.textContent = ''
            statusMessage.className = ''
        }, 3000)
    }

    // Initialize tab state
    function initializeTabs() {
        tabContents.forEach(content => {
            content.classList.remove('active')
            if (content.id === 'apikey-tab') {
                content.classList.add('active')
            }
        })
    }

    // Tab switching functionality
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab
            
            // Update active button
            tabButtons.forEach(btn => btn.classList.remove('active'))
            button.classList.add('active')
            
            // Show target tab content
            tabContents.forEach(content => {
                content.classList.remove('active')
                if (content.id === `${targetTab}-tab`) {
                    content.classList.add('active')
                }
            })
        })
    })

    // Initialize tabs on load
    initializeTabs()

    // System prompt form handling
    systemPromptForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        
        const systemPrompt = systemPromptInput.value.trim()
        
        if (!systemPrompt) {
            showMessage('Please enter a system prompt', 'error')
            return
        }

        const result = await window.electronAPI.saveSystemPrompt(systemPrompt)
        
        if (result.success) {
            showMessage(result.message, 'success')
        } else {
            showMessage(result.message, 'error')
        }
    })

    // Reset to default prompt
    resetPromptBtn.addEventListener('click', async () => {
        const defaultPrompt = await window.electronAPI.getDefaultPrompt()
        systemPromptInput.value = defaultPrompt
        showMessage('Reset to default system prompt', 'success')
    })

})