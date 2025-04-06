
import { Routes, Route } from "react-router-dom";
import Index from "../pages/Index";
import NotFound from "../pages/NotFound";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import UnitContent from "../pages/UnitContent";
import ProtectedRoute from "../components/ProtectedRoute";
import UploadContent from "../pages/UploadContent";
import ProfileSettings from "../pages/ProfileSettings";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/unit/:unitName" element={<ProtectedRoute><UnitContent /></ProtectedRoute>} />
      <Route path="/upload" element={<ProtectedRoute><UploadContent /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
