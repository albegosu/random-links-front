# Random Links - Frontend

Vue 3 frontend for the Random Links customizable landing page.

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Runs on `http://localhost:3000`

### Build

```bash
npm run build
```

Outputs to `dist/` directory.

## Environment Variables

Create a `.env` file:

```
VITE_API_URL=http://localhost:3001/api
```

For production, set this to your deployed backend API URL.

## Project Structure

```
frontend/
├── src/
│   ├── App.vue      # Main component
│   ├── api.js       # API client
│   ├── main.js      # Entry point
│   └── style.css    # Styles
├── index.html       # HTML template
└── vite.config.js   # Vite configuration
```

