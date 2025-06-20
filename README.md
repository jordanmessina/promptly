# Promptly

> ⚡ This entire app was vibe-coded - from concept to completion!

> AI-powered text improvement at your fingertips

Promptly is a macOS menu bar app that instantly improves any highlighted text using Claude AI. Simply highlight text anywhere on your Mac, press `Cmd+Shift+T`, and get an enhanced version instantly.

![Promptly Demo](demo/demo.gif)

## ✨ Features

- **Global Text Capture**: Works in any app - emails, documents, Slack, social media
- **Instant AI Enhancement**: Powered by Claude 3.5 Sonnet for high-quality improvements
- **Customizable Instructions**: Tailor the AI to your specific needs (business emails, casual messages, etc.)
- **Menu Bar Integration**: Lives quietly in your menu bar, always ready
- **Secure Storage**: API keys encrypted with macOS Keychain
- **Native macOS Experience**: Fast, lightweight, and follows macOS design principles

## 🚀 Quick Start

### Installation

1. **Download** the latest DMG from [Releases](../../releases)
2. **Open** the DMG file
3. **Drag** Promptly to your Applications folder
4. **Launch** Promptly from Applications

### Setup

1. **First Launch**: Promptly will ask for Accessibility permissions
   - Click "Open System Settings"
   - Add Promptly to Privacy & Security > Accessibility
   - Enable the checkbox next to Promptly

2. **Configure API Key**: 
   - Click the Promptly icon in your menu bar
   - Select "Settings"
   - Enter your [Anthropic API key](https://console.anthropic.com/)
   - Optionally customize the improvement instruction

### Usage

1. **Highlight** any text in any app
2. **Press** `Cmd+Shift+T`
3. **Review** the original and improved versions
4. **Press** `Enter` to copy the improved text (or `Escape` to close)
5. **Paste** wherever you need it!

## ⚙️ Settings

### API Key
Get your free API key from [Anthropic Console](https://console.anthropic.com/). New users get free credits to try Claude.

### Custom Instructions
Customize how Promptly improves your text:

- **Default**: "Improve this text by making it more succinct, clear, and well-structured..."
- **Business**: "Rewrite this to be more professional and formal for business emails"
- **Casual**: "Make this more casual and friendly for Slack messages"
- **Social**: "Rewrite this to be engaging and concise for social media posts"

## 🔒 Privacy & Security

- **API keys** are encrypted using macOS Keychain
- **Text processing** happens via Anthropic's API (see their [privacy policy](https://www.anthropic.com/privacy))
- **No tracking** or analytics - your data stays private
- **Local storage** only for API keys and settings

## 🛠️ Troubleshooting

### Global Shortcut Not Working
1. Ensure Promptly has **Accessibility permissions**:
   - System Settings > Privacy & Security > Accessibility
   - Add and enable Promptly
2. **Restart** Promptly after granting permissions

### API Errors
- Check your **API key** is correct in Settings
- Verify you have **available credits** in your Anthropic account
- Ensure you have an **internet connection**

### General Issues
- **Restart** Promptly from the menu bar (Quit and relaunch)
- Check **Console.app** for error messages
- Make sure you're running **macOS 10.14+**

## 💝 Support

- **Issues**: [GitHub Issues](../../issues)
- **Feature Requests**: [GitHub Discussions](../../discussions)

---

## 🔧 Development

### Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **macOS** (for building and testing)

### Setup

```bash
# Clone the repository
git clone https://github.com/jordanmessina/promptly.git
cd promptly

# Install dependencies
npm install

# Start development
npm start
```

### Development Scripts

```bash
# Development
npm start                 # Run in development mode
npm run build            # Build for all platforms
npm run build:mac        # Build macOS DMG only

# Testing
npm test                 # Run tests (when implemented)
```

### Project Structure

```
promptly/
├── main.js              # Main Electron process
├── renderer.js          # Settings window renderer
├── modal.js             # Modal window logic
├── preload.js           # Main window preload script
├── modal-preload.js     # Modal window preload script
├── index.html           # Settings window
├── modal.html           # Text improvement modal
├── styles.css           # Settings window styles
├── modal.css            # Modal window styles
├── package.json         # Dependencies and build config
└── build/
    └── entitlements.mac.plist  # macOS entitlements
```

### Key Components

- **Main Process** (`main.js`): Global shortcuts, system tray, window management
- **Modal Window**: Text display and improvement interface  
- **Settings Window**: API key and instruction configuration
- **IPC Communication**: Secure data exchange between processes

### Building for Distribution

```bash
# Build signed DMGs for distribution
npm run build:mac

# Output files
dist/Promptly-1.0.0.dmg         # Intel x64
dist/Promptly-1.0.0-arm64.dmg   # Apple Silicon
```

### Architecture Notes

- **Menu Bar App**: No dock icon, lives in system tray
- **Global Shortcuts**: Uses Electron's globalShortcut API
- **Text Capture**: AppleScript integration for clipboard access
- **Focus Management**: macOS-specific focus stealing for modal display
- **Security**: Hardened runtime, code signing, proper entitlements

### Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built with ❤️ using Electron and Claude AI**