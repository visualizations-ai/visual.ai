import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./features/auth/login";
import HomePage from "./features/pages/HomePage"; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<HomePage />} /> 
      </Routes>
    </BrowserRouter>
  );
}

export default App;
