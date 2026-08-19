import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'


const container = document.getElementById('root')
if (!container) {
  throw new Error('Unable to start CredFX: no #root element found in the document')
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)