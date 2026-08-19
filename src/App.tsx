import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import ManageStudents from './pages/dashboard/ManageStudents';
import ManageFaculty from './pages/dashboard/ManageFaculty';
import ManageDepartments from './pages/dashboard/ManageDepartments';
import Analytics from './pages/dashboard/Analytics';
import ManageRoutines from './pages/dashboard/ManageRoutines';
import ManageModerators from './pages/dashboard/ManageModerators';
import ManageNotices from './pages/dashboard/ManageNotices';
import ModeratorDashboardLayout from './components/layout/ModeratorDashboardLayout';
import ModeratorDashboardHome from './pages/moderator-dashboard/ModeratorDashboardHome';
import FacultyDashboardLayout from './components/layout/FacultyDashboardLayout';
import FacultyDashboardHome from './pages/faculty-dashboard/FacultyDashboardHome';
import ManageMaterials from './pages/dashboard/ManageMaterials';
import StudentMaterials from './pages/dashboard/StudentMaterials';
import StudentAttendance from './pages/dashboard/StudentAttendance';
import ManageAttendance from './pages/dashboard/ManageAttendance';
import ChatPage from './pages/dashboard/ChatPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import { useOutletContext } from 'react-router-dom';

const MaterialsRouter = () => {
  const { user, role: contextRole } = useOutletContext<any>();
  const role = (
    contextRole ||
    user?.role ||
    user?.user_metadata?.role ||
    (user?.email === 'admin@unixx.com' ? 'admin' :
    localStorage.getItem('unixx_student_session') ? 'student' :
    localStorage.getItem('unixx_faculty_session') ? 'faculty' :
    localStorage.getItem('unixx_moderator_session') ? 'moderator' :
    localStorage.getItem('unixx_admin_session') === 'true' ? 'admin' : 'student')
  ).toLowerCase();

  return role === 'student' ? <StudentMaterials /> : <ManageMaterials />;
};

const AttendanceRouter = () => {
  const { user, role: contextRole } = useOutletContext<any>();
  const role = (
    contextRole ||
    user?.role ||
    user?.user_metadata?.role ||
    (user?.email === 'admin@unixx.com' ? 'admin' :
    localStorage.getItem('unixx_student_session') ? 'student' :
    localStorage.getItem('unixx_faculty_session') ? 'faculty' :
    localStorage.getItem('unixx_moderator_session') ? 'moderator' :
    localStorage.getItem('unixx_admin_session') === 'true' ? 'admin' : 'student')
  ).toLowerCase();

  return role === 'student' ? <StudentAttendance /> : <ManageAttendance />;
};


export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="students" element={<ManageStudents />} />
          <Route path="faculty" element={<ManageFaculty />} />
          <Route path="moderators" element={<ManageModerators />} />
          <Route path="departments" element={<ManageDepartments />} />
          <Route path="notices" element={<ManageNotices />} />
          <Route path="routines" element={<ManageRoutines />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="materials" element={<MaterialsRouter />} />
          <Route path="attendance" element={<AttendanceRouter />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="groups" element={<ChatPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="/moderator-dashboard" element={<ModeratorDashboardLayout />}>
          <Route index element={<ModeratorDashboardHome />} />
          <Route path="students" element={<ManageStudents />} />
          <Route path="faculty" element={<ManageFaculty />} />
          <Route path="departments" element={<ManageDepartments />} />
          <Route path="notices" element={<ManageNotices />} />
          <Route path="routines" element={<ManageRoutines />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="materials" element={<MaterialsRouter />} />
          <Route path="attendance" element={<AttendanceRouter />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="/faculty-dashboard" element={<FacultyDashboardLayout />}>
          <Route index element={<FacultyDashboardHome />} />
          <Route path="students" element={<ManageStudents />} />
          <Route path="notices" element={<ManageNotices />} />
          <Route path="routines" element={<ManageRoutines />} />
          <Route path="courses" element={<MaterialsRouter />} />
          <Route path="materials" element={<MaterialsRouter />} />
          <Route path="attendance" element={<AttendanceRouter />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </>
  );
}


