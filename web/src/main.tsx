import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'

import App from './App'
import Landing from './routes/Landing'
import Dashboard from './routes/Dashboard'
import Auth from './routes/Auth'

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/auth', element: <Auth children={null} /> },
  { path: '/app', element: <App />, children: [
      { index: true, element: <Dashboard /> },
    ]},
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
