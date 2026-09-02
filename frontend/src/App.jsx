import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import LoginPage from "./features/auth/LoginPage.jsx";
import DashboardPage from "./features/dashboard/DashboardPage.jsx";
import ProjectListPage from "./features/projects/ProjectListPage.jsx";
import ProjectDetailPage from "./features/projects/ProjectDetailPage.jsx";
import ProjectUpdateForm from "./features/projects/ProjectUpdateForm.jsx";
import DepartmentWorkspace from "./features/department/DepartmentWorkspace.jsx";
import AlertsPage from "./features/alerts/AlertsPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route element={<ProtectedRoute roles={["Administrator", "SeniorOfficer", "ProjectManager"]} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
          </Route>

          <Route path="/projects" element={<ProjectListPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />

          <Route element={<ProtectedRoute roles={["DepartmentOfficer"]} />}>
            <Route path="/department" element={<DepartmentWorkspace />} />
            <Route path="/projects/:id/update" element={<ProjectUpdateForm />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
