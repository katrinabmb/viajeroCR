import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { LanguageProvider } from './components/LanguageProvider.jsx'
import { Provider } from 'react-redux'
import { store } from './store/store.js'
import './styles/font-styles.css'


createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Provider store={store}>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </Provider>
  </BrowserRouter>
)
