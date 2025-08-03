# JPLx13 - Multi-Agent Chat Application

A modern, intelligent chat interface with specialized AI agents, conversation management, and seamless n8n webhook integration.

![JPLx13 Chat Interface](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## ✨ Features

### 🤖 Multi-Agent AI System
- **Reasoning Agent** 🧠 - Strategic analysis & logical reasoning
- **Creative Agent** 🎨 - Creative brainstorming & copywriting
- **Research Agent** 🔬 - Current events & market analysis
- **Data Agent** 📊 - Statistical analysis & visualization
- **Auto Agent** 🤖 - Intelligent agent selection

### 💬 Conversation Management
- **Persistent Storage** - All conversations saved to localStorage
- **Auto-Generated Titles** - Smart titles from first user message
- **Click-to-Edit Titles** - Easy customization of conversation names
- **Search & Filter** - Find conversations quickly
- **Keyboard Shortcuts** - Power user navigation

### 📁 File Upload Support
- **Multiple Formats** - PDF, DOC, DOCX, TXT, CSV, XLSX, JSON, ICS, PNG, JPG
- **File Validation** - Size limits and type checking
- **Progress Tracking** - Real-time upload progress
- **Base64 Encoding** - Secure transmission to webhook

### 🎨 Modern UI/UX
- **Dark Theme** - Eye-friendly interface
- **Responsive Design** - Works on all devices
- **Smooth Animations** - Polished user experience
- **Visual Feedback** - Clear status indicators

### 🔧 Technical Features
- **n8n Webhook Integration** - JSON payload communication
- **Error Handling** - Comprehensive retry logic
- **Timeout Management** - 30-second request timeouts
- **TypeScript** - Full type safety
- **Next.js 15** - Latest React framework

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/jplx13.git
cd jplx13

# Install dependencies
npm install
# or
yarn install
# or
pnpm install

# Start development server
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🎯 Usage Guide

### Starting a Conversation
1. Click "New Conversation" or press `Ctrl+N`
2. Select an agent type (or use Auto mode)
3. Type your message and press Enter
4. The conversation title will be auto-generated from your first message

### Managing Conversations
- **Switch Conversations**: Click any conversation in the sidebar
- **Edit Titles**: Click on any conversation title to edit it
- **Search**: Use the search bar or press `Ctrl+K` to find conversations
- **Delete**: Hover over a conversation and click the X button
- **Clear All**: Use the "Clear All" button in the search area

### Keyboard Shortcuts
- `Tab` - Cycle through agent types
- `Ctrl+N` - Create new conversation
- `Ctrl+K` - Focus search bar
- `Escape` - Clear selected file

### File Uploads
1. Click the paperclip icon or drag a file
2. Supported formats: PDF, DOC, DOCX, TXT, CSV, XLSX, JSON, ICS, PNG, JPG
3. Maximum file size: 10MB
4. Files are automatically processed and sent to the AI

## 🔧 Configuration

### n8n Webhook Setup
The application sends JSON payloads to your n8n webhook. Configure your webhook URL in the code:

```typescript
// In app/page.tsx, line ~183
const response = await fetch("https://jplx13.app.n8n.cloud/webhook/jplx13-form", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(jsonData),
})
```

### Expected Webhook Payload
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "sessionId": "1704110400000",
  "chatInput": "Your message here",
  "selectedAgent": "reasoning",
  "manualOverride": true,
  "file": {
    "name": "document.pdf",
    "type": "application/pdf",
    "size": 1024000,
    "data": "base64EncodedFileData..."
  }
}
```

## 🏗️ Project Structure

```
jplx13/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main chat interface
├── components/            # Reusable UI components
│   ├── ui/               # Shadcn/ui components
│   └── ErrorBoundary.tsx # Error handling
├── hooks/                # Custom React hooks
│   ├── useAgentSelection.ts
│   ├── useConversations.ts
│   └── useFileUpload.ts
├── lib/                  # Utility functions
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect Next.js
3. Deploy with default settings
4. Your app will be live at `https://your-project.vercel.app`

### Environment Variables
No environment variables are required for basic functionality. The n8n webhook URL is currently hardcoded but can be moved to environment variables for production.

## 🛠️ Development

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Component-based architecture

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide React](https://lucide.dev/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)

## 📞 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/yourusername/jplx13/issues) page
2. Create a new issue with detailed information
3. Include browser console logs for debugging

---

**Made with ❤️ for intelligent conversations** 