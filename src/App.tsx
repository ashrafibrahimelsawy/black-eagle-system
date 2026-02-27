import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import Leaves from "./pages/Leaves";
import Projects from "./pages/Projects";
import Clients from "./pages/Clients";
import Users from "./pages/Users";
import Finance from "./pages/Finance";
import Payroll from "./pages/Payroll";
import Tasks from "./pages/Tasks";
import Layout from "./components/Layout";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={setUser} />} />
        
        <Route element={user ? <Layout user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" />}>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/attendance" element={<Attendance user={user} />} />
          <Route path="/leaves" element={<Leaves user={user} />} />
          <Route path="/projects" element={<Projects user={user} />} />
          <Route path="/clients" element={<Clients user={user} />} />
          <Route path="/tasks" element={<Tasks user={user} />} />
          <Route path="/finance" element={<Finance user={user} />} />
          <Route path="/payroll" element={<Payroll user={user} />} />
          <Route path="/users" element={<Users user={user} />} />
        </Route>
      </Routes>
    </Router>
  );
}
