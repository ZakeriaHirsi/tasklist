import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ChecklistApp from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChecklistApp />
  </StrictMode>,
)