import { BrowserRouter, Routes, Route } from "react-router-dom";
import Profile from "./pages/Profile";
import Feed from "./pages/Feed";
import Sidebar from "./components/Sidebar";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        {/* Sidebar is global, so it stays outside the Routes */}
        <Sidebar />
        
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route path="/profile/:username" element={<Profile />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
