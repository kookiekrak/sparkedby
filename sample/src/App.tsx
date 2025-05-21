import './App.css'

// Import landing page components
import Navbar from './components/landing/Navbar'
import Hero from './components/landing/Hero'
import Features from './components/landing/Features'
import Footer from './components/landing/Footer'

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  )
}

export default App
