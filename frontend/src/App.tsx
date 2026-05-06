import { BrowserRouter, Routes, Route } from "react-router-dom";
import Profile from "./pages/Profile";
import Feed from "./pages/Feed";
import Explore from "./pages/Explore";
import AddUser from "./pages/AddUser";
import EditUser from "./pages/EditUser";
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
            <Route path="/explore" element={<Explore />} />
            <Route path="/add-user" element={<AddUser />} />
            <Route path="/edit-user/:username" element={<EditUser />} />
            <Route path="/profile/:username" element={<Profile />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
