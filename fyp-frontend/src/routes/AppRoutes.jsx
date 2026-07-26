import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from '../components/PrivateRoute';

import Login                from '../pages/auth/Login';
import StudentDashboard     from '../pages/student/StudentDashboard';
import StudentAssignments   from '../pages/student/StudentAssignments';
import StudentResults       from '../pages/student/StudentResults';
import AdminDashboard       from '../pages/admin/AdminDashboard';
import UserManagement       from '../pages/admin/UserManagement';
import CourseManagement     from '../pages/admin/CourseManagement';
import TeacherDashboard     from '../pages/teacher/TeacherDashboard';
import CourseEditor         from '../pages/teacher/CourseEditor';
import TeacherGradingQueue  from '../pages/teacher/TeacherGradingQueue';
import UploadPage           from '../pages/student/UploadPage';
import ResultView           from '../pages/student/ResultView';
import CourseView           from '../pages/student/CourseView';
import CreateAssignment     from '../pages/teacher/CreateAssignment';
import GradingQueue         from '../pages/admin/GradingQueue';
import TeacherCourses       from '../pages/teacher/TeacherCourses';
import TeacherCourseManager from '../pages/teacher/TeacherCourseManager';

export default function AppRoutes() {
  return (
    <Routes>

      {/* ── Public ─────────────────────────────────────────────── */}
      <Route path="/login" element={<Login />} />
      <Route path="/"      element={<Navigate to="/login" replace />} />

      {/* ── Root role redirects ────────────────────────────────── */}
      <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
      <Route path="/teacher" element={<Navigate to="/teacher/dashboard" replace />} />
      <Route path="/admin"   element={<Navigate to="/admin/dashboard"   replace />} />

      {/* ── Student ────────────────────────────────────────────── */}
      <Route
        path="/student/dashboard"
        element={
          <PrivateRoute allowedRoles={['student']}>
            <StudentDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/student/assignments"
        element={
          <PrivateRoute allowedRoles={['student']}>
            <StudentAssignments />
          </PrivateRoute>
        }
      />
      <Route
        path="/student/results"
        element={
          <PrivateRoute allowedRoles={['student']}>
            <StudentResults />
          </PrivateRoute>
        }
      />
      {/* Student views their own result */}
      <Route
        path="/student/results/submission/:id"
        element={
          <PrivateRoute allowedRoles={['student']}>
            <ResultView />
          </PrivateRoute>
        }
      />
      <Route
        path="/student/course/:courseId"
        element={
          <PrivateRoute allowedRoles={['student']}>
            <CourseView />
          </PrivateRoute>
        }
      />
      <Route
        path="/student/upload/:assignmentId"
        element={
          <PrivateRoute allowedRoles={['student']}>
            <UploadPage />
          </PrivateRoute>
        }
      />

      {/* ── Teacher ────────────────────────────────────────────── */}
      <Route
        path="/teacher/dashboard"
        element={
          <PrivateRoute allowedRoles={['teacher']}>
            <TeacherDashboard />
          </PrivateRoute>
        }
      />
      {/* Teacher views a student's result from the grading queue */}
      <Route
        path="/teacher/grading/submission/:id"
        element={
          <PrivateRoute allowedRoles={['teacher']}>
            <ResultView />
          </PrivateRoute>
        }
      />
      <Route
        path="/teacher/grading"
        element={
          <PrivateRoute allowedRoles={['teacher']}>
            <TeacherGradingQueue />
          </PrivateRoute>
        }
      />
      <Route
        path="/teacher/course/:courseId/grading"
        element={
          <PrivateRoute allowedRoles={['teacher']}>
            <TeacherGradingQueue />
          </PrivateRoute>
        }
      />
      <Route
        path="/teacher/create-assignment"
        element={
          <PrivateRoute allowedRoles={['teacher']}>
            <CreateAssignment />
          </PrivateRoute>
        }
      />
      <Route
        path="/teacher/course/:courseId/edit"
        element={
          <PrivateRoute allowedRoles={['teacher']}>
            <CourseEditor />
          </PrivateRoute>
        }
      />
      <Route
        path="/teacher/courses"
        element={
          <PrivateRoute allowedRoles={['teacher']}>
            <TeacherCourses />
          </PrivateRoute>
        }
      />
      <Route
        path="/teacher/course/:courseId/manage"
        element={
          <PrivateRoute allowedRoles={['teacher']}>
            <TeacherCourseManager />
          </PrivateRoute>
        }
      />
      <Route
        path="/teacher/course/:courseId/week/:weekId/create-assignment"
        element={
          <PrivateRoute allowedRoles={['teacher']}>
            <CreateAssignment />
          </PrivateRoute>
        }
      />

      {/* ── Admin ──────────────────────────────────────────────── */}
      <Route
        path="/admin/dashboard"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/create-assignment"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <CreateAssignment />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/grading-queue"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <GradingQueue />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <UserManagement />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/courses"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <CourseManagement />
          </PrivateRoute>
        }
      />

      {/* ── Error pages ────────────────────────────────────────── */}
      <Route
        path="/unauthorized"
        element={
          <div className="flex items-center justify-center min-h-screen bg-bg-light-blue">
            <div className="text-center px-4">
              <h1 className="text-4xl font-bold text-primary-blue mb-4">403</h1>
              <p className="text-text-dark text-lg">
                You don't have permission to access this page.
              </p>
            </div>
          </div>
        }
      />
      <Route
        path="*"
        element={
          <div className="flex items-center justify-center min-h-screen bg-bg-light-blue">
            <div className="text-center px-4">
              <h1 className="text-4xl font-bold text-primary-blue mb-4">404</h1>
              <p className="text-text-dark text-lg">Page not found.</p>
            </div>
          </div>
        }
      />

    </Routes>
  );
}
