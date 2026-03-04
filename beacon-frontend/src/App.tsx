import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css'
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { useState } from 'react';
import Signup from './pages/Signup';


function App() {
  
  const [isAuthed, setIsAuthed] = useState<boolean>(() => {
    return !!localStorage.getItem("token");
  });

  return (
    <Routes>
      <Route path="/login" element={
        isAuthed ? <Navigate to="/" /> : <Login onLogin={() => setIsAuthed(true)} />
        }
      />
    
      <Route path="/signup" element={
        isAuthed ? <Navigate to="/" /> : <Signup onSignup={() => setIsAuthed(true)} />
        }
      />

      <Route path="/" element={
        isAuthed ? <Dashboard onLogout={() => setIsAuthed(false)} /> : <Navigate to="/login" />
        }
      />
      
    </Routes>
  )
}

export default App
