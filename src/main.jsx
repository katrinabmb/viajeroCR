import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { LanguageProvider } from './components/LanguageProvider.jsx'
import './styles/font-styles.css'


createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <LanguageProvider>
      <App />
    </LanguageProvider>
    </BrowserRouter>
)
