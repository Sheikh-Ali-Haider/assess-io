import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../layout/MainLayout';
import { Users, BookOpen, Award, TrendingUp } from 'lucide-react';
import { getAdminStats } from '../../utils/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAdminStats();
        setStats(data);
      } catch (err) {
        setError('Failed to load stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8 text-center text-gray-500">Loading dashboard...</div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="p-8 text-center text-red-500">{error}</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Page background - subtle off-white instead of grey-blue */}
      <div className="min-h-screen bg-[#F9FAFB] p-4 sm:p-6 lg:p-8">

        {/* Page header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-1">
            Administration Dashboard
          </h2>
          <p className="text-sm text-gray-500">System overview and management tools</p>
        </div>

        {/* Top 4 stat cards - consistent left-aligned layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">

          {/* Total Users card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 border-l-4 border-l-blue-600">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <div className="bg-blue-50 p-2 rounded-lg">
                <Users className="text-blue-600" size={18} />
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900">{stats.total_users}</p>
          </div>

          {/* Total Courses card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 border-l-4 border-l-indigo-500">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">Total Courses</p>
              <div className="bg-indigo-50 p-2 rounded-lg">
                <BookOpen className="text-indigo-500" size={18} />
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900">{stats.total_courses}</p>
          </div>

          {/* Total Enrollments card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">Total Enrollments</p>
              <div className="bg-green-50 p-2 rounded-lg">
                <Award className="text-green-500" size={18} />
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900">{stats.total_enrollments}</p>
          </div>

          {/* Average students per course card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 border-l-4 border-l-orange-500">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">Avg Students / Course</p>
              <div className="bg-orange-50 p-2 rounded-lg">
                <TrendingUp className="text-orange-500" size={18} />
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900">{stats.avg_students_per_course}</p>
          </div>

        </div>

        {/* Bottom 3 breakdown cards - same structure as top cards for consistency */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          {/* Students breakdown card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 border-l-4 border-l-blue-600">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">Students</p>
              <div className="bg-blue-50 p-2 rounded-lg">
                <Users className="text-blue-600" size={18} />
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900 mb-2">{stats.total_students}</p>
            {/* Percentage text needs enough contrast - using gray-600 on white */}
            <p className="text-sm font-medium text-gray-600">
              {((stats.total_students / stats.total_users) * 100).toFixed(1)}% of total users
            </p>
          </div>

          {/* Teachers breakdown card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">Teachers</p>
              <div className="bg-green-50 p-2 rounded-lg">
                <BookOpen className="text-green-600" size={18} />
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900 mb-2">{stats.total_teachers}</p>
            <p className="text-sm font-medium text-gray-600">
              {((stats.total_teachers / stats.total_users) * 100).toFixed(1)}% of total users
            </p>
          </div>

          {/* Admins breakdown card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 border-l-4 border-l-orange-500">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">Admins</p>
              <div className="bg-orange-50 p-2 rounded-lg">
                <Award className="text-orange-600" size={18} />
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900 mb-2">{stats.total_admins}</p>
            <p className="text-sm font-medium text-gray-600">
              {((stats.total_admins / stats.total_users) * 100).toFixed(1)}% of total users
            </p>
          </div>

        </div>
      </div>
    </MainLayout>
  );
}
