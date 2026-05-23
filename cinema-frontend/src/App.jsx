import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { BranchProvider } from "./contexts/BranchContext";
import { ROLE_ADMIN, ROLE_STAFF, ROLE_CUSTOMER } from "./utils/constants";
import { Toaster } from "react-hot-toast";

import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";

import MoviesPage from "./pages/admin/MoviesPage";
import RoomsPage from "./pages/admin/RoomsPage";
import ShowtimesPage from "./pages/admin/ShowtimesPage";
import ManageConcessions from "./pages/admin/ManageConcessions";
import ManageUsers from "./pages/admin/ManageUsers";
import PriceRulesPage from "./pages/admin/PriceRulesPage";
import VouchersPage from "./pages/admin/VouchersPage";
import LoyaltyTiersPage from "./pages/admin/LoyaltyTiersPage";
import AuditLogsPage from "./pages/admin/AuditLogsPage";
import BranchesPage from "./pages/admin/BranchesPage";

import HomePage from "./pages/customer/HomePage";
import MovieDetailPage from "./pages/customer/MovieDetailPage";
import BookingPage from "./pages/customer/BookingPage";
import PaymentResultPage from "./pages/customer/PaymentResultPage";
import ProfilePage from "./pages/customer/ProfilePage";

import StaffDashboard from "./pages/staff/StaffDashboard";
import POSPage from "./pages/staff/POSPage";

import MoviesListPage from "./pages/customer/MoviesListPage";

import AdminDashboard from "./pages/admin/AdminDashboard";
// Placeholder Pages
const AdminOverview = () => (
  <div className="p-8 text-center text-gray-500 mt-10">
    Chọn tính năng quản lý bên menu trái.
  </div>
);
const NotFound = () => (
  <div className="p-8 text-center">
    <h1 className="text-4xl shadow-sm text-red-500 font-bold mb-4">404</h1>
    <p>Không tìm thấy trang.</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
          },
          success: { iconTheme: { primary: '#E50914', secondary: '#fff' } }
        }} 
      />
      <BranchProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route path="/" element={<MainLayout />}>
            {/* Public Customer Route */}
            <Route index element={<HomePage />} />
            {/* THÊM ROUTE DANH SÁCH PHIM VÀO ĐÂY (Dùng movies/list/:type để tránh xung đột với :id) */}
            <Route path="movies/list/:type" element={<MoviesListPage />} />
            <Route path="movies/:id" element={<MovieDetailPage />} />
            <Route path="booking/:showtimeId" element={<BookingPage />} />
            <Route path="payment-result" element={<PaymentResultPage />} />

            {/* Protected Customer Routes */}
            <Route
              path="profile"
              element={
                <ProtectedRoute
                  allowedRoles={[ROLE_CUSTOMER, ROLE_STAFF, ROLE_ADMIN]}
                >
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Routes */}
            <Route
              path="admin"
              element={
                <ProtectedRoute allowedRoles={[ROLE_ADMIN]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="movies" element={<MoviesPage />} />
              <Route path="branches" element={<BranchesPage />} />
              <Route path="rooms" element={<RoomsPage />} />
              <Route path="showtimes" element={<ShowtimesPage />} />
              <Route path="concessions" element={<ManageConcessions />} />
              <Route path="price-rules" element={<PriceRulesPage />} />
              <Route path="vouchers" element={<VouchersPage />} />
              <Route path="loyalty-tiers" element={<LoyaltyTiersPage />} />
              <Route path="users" element={<ManageUsers />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
            </Route>

            {/* Protected Staff Routes */}
            <Route
              path="staff"
              element={
                <ProtectedRoute allowedRoles={[ROLE_STAFF, ROLE_ADMIN]}>
                  <StaffDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="staff/pos"
              element={
                <ProtectedRoute allowedRoles={[ROLE_STAFF, ROLE_ADMIN]}>
                  <POSPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      </BranchProvider>
    </AuthProvider>
  );
}

export default App;
