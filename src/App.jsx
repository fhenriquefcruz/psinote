// App
import { AuthProvider } from './contexts/AuthContext'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import AppRoutes from './routes/AppRoutes'

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <ToastContainer position="bottom-right" />
    </AuthProvider>
  )
}

export default App
