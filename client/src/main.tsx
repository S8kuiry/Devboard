import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { UserProvider } from './context/UserContext.tsx'
import { PlanModalProvider } from './context/PlanModalContext.tsx'
import { AgentProvider } from './context/AgentContext.tsx'
import { TaskModalProvider } from './context/TaskModalContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UserProvider>
      <AgentProvider>
        <PlanModalProvider>
          <TaskModalProvider>
            <App />
          </TaskModalProvider>
        </PlanModalProvider>
      </AgentProvider>
    </UserProvider>
  </StrictMode>,
)
