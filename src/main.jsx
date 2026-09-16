import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ExpenseProvider } from './context/ExpenseContext.jsx'
import { InvestmentProvider } from './context/InvestmentContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ExpenseProvider>
      <InvestmentProvider>
        <App />
      </InvestmentProvider>
    </ExpenseProvider>
  </StrictMode>,
)
