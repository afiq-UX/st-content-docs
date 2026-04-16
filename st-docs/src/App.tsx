import { useState } from "react"
import Sidebar from "./components/Sidebar.tsx"
import WelcomeView from "./components/WelcomeView.tsx"
import DetailView from "./components/DetailView.tsx"

export default function App() {
  const [activeId, setActiveId] = useState<string | null>(null)

  return (
    <div className="app">
      <Sidebar activeId={activeId} onNavigate={setActiveId} />
      <main id="main">
        {activeId 
          ? <DetailView id={activeId} onNavigate={setActiveId} />
          : <WelcomeView onNavigate={setActiveId} />
        }
      </main>
    </div>
  )
}