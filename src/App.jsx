import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-pink-400 to-yellow-300">
      <div className="flex gap-8 mb-8">
        <a href="https://vite.dev" target="_blank" rel="noopener noreferrer">
          <img
            src={viteLogo}
            className="w-20 h-20 hover:scale-110 transition-transform duration-300 drop-shadow-xl rounded-full border-4 border-white"
            alt="Vite logo"
          />
        </a>
        <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
          <img
            src={reactLogo}
            className="w-20 h-20 hover:rotate-12 transition-transform duration-300 drop-shadow-xl rounded-full border-4 border-white"
            alt="React logo"
          />
        </a>
      </div>
      <h1 className="text-5xl font-extrabold text-white drop-shadow-lg mb-6 animate-bounce">
        Vite + React + Tailwind
      </h1>
      <div className="card bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4">
        <button
          onClick={() => setCount((count) => count + 1)}
          className="px-8 py-3 font-bold text-lg bg-gradient-to-r from-fuchsia-500 to-orange-400 text-white rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          count is {count}
        </button>
        <p className="text-gray-700">
          Edit <code className="bg-gray-100 px-2 py-1 rounded">src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs mt-8 text-white/80 text-md italic">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  )
}

export default App
