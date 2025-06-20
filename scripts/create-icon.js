const fs = require('fs')
const path = require('path')
const { createCanvas } = require('canvas')

// Create build directory 
const buildDir = path.join(__dirname, '..', 'build')
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true })
}

// Create a 512x512 PNG icon
function createIcon() {
    const size = 512
    const canvas = createCanvas(size, size)
    const ctx = canvas.getContext('2d')
    
    // Clear canvas with transparent background
    ctx.clearRect(0, 0, size, size)
    
    // Draw black square
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, size, size)
    
    // Draw white border (16px for 512x512)
    const borderWidth = 16
    ctx.fillStyle = '#FFFFFF'
    
    // Top border
    ctx.fillRect(0, 0, size, borderWidth)
    // Bottom border
    ctx.fillRect(0, size - borderWidth, size, borderWidth)
    // Left border
    ctx.fillRect(0, 0, borderWidth, size)
    // Right border
    ctx.fillRect(size - borderWidth, 0, borderWidth, size)
    
    // Save as PNG
    const buffer = canvas.toBuffer('image/png')
    fs.writeFileSync(path.join(buildDir, 'icon.png'), buffer)
    
    console.log('Created icon.png (512x512)')
}

// Create the icon
try {
    createIcon()
    console.log('Icon created successfully!')
} catch (error) {
    console.error('Error creating icon:', error)
    process.exit(1)
}