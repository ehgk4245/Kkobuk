import { HashRouter, Routes, Route } from 'react-router-dom'
import TitleBar from './components/common/TitleBar'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Training from './pages/Training'
import MainScreen from './pages/Main'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import { WebcamProvider } from './context/WebcamContext'

export default function App() {
  return (
    <WebcamProvider>
      <HashRouter>
        <div className="h-screen w-full flex flex-col bg-gray-900 overflow-hidden font-sans">
          <TitleBar />
          <div className="flex-1 overflow-y-auto w-full relative">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/training" element={<Training />} />
              <Route path="/main" element={<MainScreen />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </div>
      </HashRouter>
    </WebcamProvider>
  )
}
