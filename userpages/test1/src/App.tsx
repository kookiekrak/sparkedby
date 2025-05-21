import './App.css'

// Import landing page components
import Navbar from './components/landing/Navbar'
import Hero from './components/landing/Hero'
import EmailSignup from './components/landing/EmailSignup'
import Footer from './components/landing/Footer'

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <EmailSignup />
      </main>
      <Footer />
    </div>
  )
}

export default App
