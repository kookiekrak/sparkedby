import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import Features from "../components/landing/Features";
import Footer from "../components/landing/Footer";

export function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        <Hero />
        <Features />
        
        {/* Placeholder for How It Works section */}
        <section id="how-it-works" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  How SparkedBy Works
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Create and launch your landing page in three simple steps.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-blue-600 text-2xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Describe Your Idea</h3>
                <p className="text-gray-600">Tell us about your business idea and target audience. Our AI will handle the rest.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-purple-600 text-2xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Customize Your Page</h3>
                <p className="text-gray-600">Adjust colors, images, and content to match your brand identity. No coding required.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-2xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Launch & Collect</h3>
                <p className="text-gray-600">Publish your page instantly and start collecting signups, feedback, and validating your idea.</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Placeholder for Templates section */}
        <section id="templates" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Beautiful Templates
                </span>
                {" "}for Every Industry
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Choose from dozens of professionally designed templates to showcase your unique business idea.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Template previews would go here */}
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
                  <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-gray-500 font-medium">Template Preview {i+1}</span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1">Template Name {i+1}</h3>
                    <p className="text-gray-600 text-sm">Perfect for {["SaaS", "E-commerce", "Mobile App", "Education", "Healthcare", "Service"][i % 6]} businesses</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Placeholder for FAQ section */}
        <section id="faq" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Frequently Asked
                </span>
                {" "}Questions
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Everything you need to know about SparkedBy.
              </p>
            </div>
            
            <div className="max-w-3xl mx-auto divide-y divide-gray-200">
              {[
                { q: "What is SparkedBy?", a: "SparkedBy is an automatic landing page generator that helps businesses validate their ideas quickly by collecting signups and feedback without having to build a full product." },
                { q: "Do I need coding knowledge to use SparkedBy?", a: "Not at all! SparkedBy is designed for non-technical founders and marketers. Our intuitive interface makes it easy to create and customize professional landing pages without writing a single line of code." },
                { q: "How long does it take to create a landing page?", a: "With SparkedBy, you can have a professional landing page ready in just 5 minutes. Simply describe your idea, customize the generated page, and publish it instantly." },
                { q: "Can I use my own domain?", a: "Yes! You can connect your own domain or use our free subdomain for your landing page." },
                { q: "What kind of analytics do you provide?", a: "We provide comprehensive analytics including visitor counts, conversion rates, signup demographics, and more to help you validate your business idea effectively." }
              ].map((item, i) => (
                <div key={i} className="py-6">
                  <h3 className="text-lg font-medium text-gray-900">{item.q}</h3>
                  <p className="mt-3 text-gray-600">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
