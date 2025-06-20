document.addEventListener('DOMContentLoaded', () => {
    const originalTextDiv = document.getElementById('original-text')
    const improvedTextDiv = document.getElementById('improved-text')
    const closeBtn = document.getElementById('close-btn')
    const copyImprovedBtn = document.getElementById('copy-improved-btn')

    let currentImprovedText = ''

    // Ensure the window has focus for keyboard events
    document.body.tabIndex = -1
    window.focus()
    document.body.focus()
    
    // Additional focus grab after a short delay
    setTimeout(() => {
        window.focus()
        document.body.focus()
    }, 100)

    // Close window function
    function closeWindow() {
        window.close()
    }

    // Event listeners
    closeBtn.addEventListener('click', closeWindow)

    // Copy improved text
    copyImprovedBtn.addEventListener('click', async () => {
        try {
            const textToCopy = currentImprovedText || improvedTextDiv.textContent
            await navigator.clipboard.writeText(textToCopy)
            copyImprovedBtn.textContent = 'Copied!'
            setTimeout(() => {
                copyImprovedBtn.textContent = 'Copy Improved'
            }, 2000)
        } catch (error) {
            console.error('Failed to copy improved text:', error)
        }
    })

    // Listen for captured text from main process
    window.electronAPI.onSetCapturedText((event, text) => {
        originalTextDiv.textContent = text
    })

    // Listen for improved text from main process
    window.electronAPI.onSetImprovedText((event, improvedText) => {
        currentImprovedText = improvedText
        improvedTextDiv.textContent = improvedText
    })

    // Listen for errors from main process
    window.electronAPI.onSetError((event, errorMessage) => {
        improvedTextDiv.innerHTML = `<div style="color: #ff6b6b; font-style: italic;">Error: ${errorMessage}</div>`
    })

    // Handle keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            event.preventDefault()
            event.stopPropagation()
            closeWindow()
        } else if (event.key === 'Enter') {
            event.preventDefault()
            event.stopPropagation()
            // Copy improved text and close (default action)
            copyImprovedAndClose()
        }
    }, true)

    // Function to copy improved text and close modal
    async function copyImprovedAndClose() {
        try {
            const textToCopy = currentImprovedText || improvedTextDiv.textContent
            if (textToCopy && !textToCopy.includes('Improving text...') && !textToCopy.includes('Error:')) {
                await navigator.clipboard.writeText(textToCopy)
            }
            closeWindow()
        } catch (error) {
            console.error('Failed to copy improved text:', error)
            // Still close the window even if copy fails
            closeWindow()
        }
    }

    // Prevent context menu
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault()
    })
})