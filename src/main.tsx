import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Theme from './theme'

const rootElement = document.getElementById('root')

if (rootElement === null) {
  throw new Error('Failed to find the root element')
}

const root = createRoot(rootElement)

root.render(
  <StrictMode>
    <ThemeProvider theme={Theme}>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        pauseOnHover
      />
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>
)