
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import ContentDetails from "./pages/ContentDetails";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ManageContent from "./pages/Managecontent";
import Comments from "./pages/Comments";
import CreatorProfile from "./pages/CreatorProfile";
import BackButton from "./components/BackButton";
import "./features.css";

function ProtectedRoute({ children }) {
  return localStorage.getItem("token")
    ? children
    : <Navigate to="/login" />;
}

export default function App() {
  return (
    <>
      <Navbar />
      <BackButton />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/content/:id" element={<ContentDetails />} />
        <Route path="/creator/:creatorId" element={<CreatorProfile />} />
        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />

        <Route path="/manage-content" element={
          <ProtectedRoute><ManageContent /></ProtectedRoute>
        } />

        <Route path="/comments" element={
          <ProtectedRoute><Comments /></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
