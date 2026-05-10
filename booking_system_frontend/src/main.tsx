import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Import Carbon styles BEFORE custom styles
import './carbon-theme.scss'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
