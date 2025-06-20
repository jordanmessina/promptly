document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('api-form')
    const apiKeyInput = document.getElementById('api-key')
    const instructionInput = document.getElementById('instruction')
    const clearBtn = document.getElementById('clear-btn')
    const statusMessage = document.getElementById('status-message')
    const toggleVisibilityBtn = document.getElementById('toggle-visibility')
    const eyeIcon = document.getElementById('eye-icon')
    const eyeOffIcon = document.getElementById('eye-off-icon')

    let savedKey = false
    let actualApiKey = ''

    const loadedData = await window.electronAPI.loadApiKeys()
    if (loadedData.anthropic) {
        savedKey = true
        actualApiKey = loadedData.anthropic
    }
    
    // Load instruction if it exists
    if (loadedData.instruction) {
        instructionInput.value = loadedData.instruction
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
        const instruction = instructionInput.value.trim()
        
        // Check if we need to save an API key
        let keysToSave = {}
        if (apiKey && apiKey !== '••••••••••••••••••••••••••••••••••••••••') {
            keysToSave.anthropic = apiKey
        } else if (!savedKey) {
            showMessage('Please enter an API key', 'error')
            return
        }

        const result = await window.electronAPI.saveApiKeys(keysToSave, instruction)
        
        if (result.success) {
            showMessage(result.message, 'success')
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
        instructionInput.value = ''
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

})