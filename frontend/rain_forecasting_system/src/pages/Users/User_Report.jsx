import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useUserAuth } from '../../hooks/useUserAuth';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { Calendar, Download, FileSpreadsheet, FileText, Search, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Home = () => {
  useUserAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFiltered, setIsFiltered] = useState(false);

  // Set default dates (current month)
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    setStartDate(formatDateForInput(firstDay));
    setEndDate(formatDateForInput(today));
  }, []);

  // Format date for input field
  const formatDateForInput = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Format date for display
  const formatDateForDisplay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Fetch users based on date range
  const fetchUsers = async () => {
    if (loading) return;
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    setLoading(true);

    try {
      const response = await axiosInstance.get(
        `${API_PATHS.USERS.GET_BY_DATE_RANGE}?startDate=${startDate}&endDate=${endDate}`
      );
      if (response.data) {
        setUsers(response.data);
        setIsFiltered(true);
      } 
    } catch(error) {
      console.log("Failed to fetch users", error);
      toast.error("Failed to fetch user report");
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    if (users.length === 0) {
      toast.error("No data to export");
      return;
    }

    // Prepare data for export
    const exportData = users.map(user => ({
      Name: user.firstname,
      Email: user.email,
      Role: user.role,
      'Password Changed': user.passwordChanged ? 'Yes' : 'No',
      'Created At': formatDateForDisplay(user.createdAt)
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

    // Generate file name with date range
    const fileName = `User_Report_${startDate}_to_${endDate}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, fileName);
    toast.success("Excel report downloaded successfully");
  };


  // Updated exportToPDF function
  const exportToPDF = () => {
    if (users.length === 0) {
      toast.error("No data to export");
      return;
    }

    // Create PDF document
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text("User Report", 14, 22);

    // Add date range
    doc.setFontSize(12);
    doc.text(`Date Range: ${formatDateForDisplay(startDate)} to ${formatDateForDisplay(endDate)}`, 14, 30);

    // Prepare table data
    const tableColumn = ["Name", "Email", "Role", "Password Changed", "Created At"];
    const tableRows = [];

    users.forEach(user => {
      const userData = [
        user.firstname,
        user.email,
        user.role,
        user.passwordChanged ? 'Yes' : 'No',
        formatDateForDisplay(user.createdAt)
      ];
      tableRows.push(userData);
    });

    // Add table to document using autoTable
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 135, 245] }
    });

    // Generate file name with date range
    const fileName = `User_Report_${startDate}_to_${endDate}.pdf`;

    // Save file
    doc.save(fileName);
    toast.success("PDF report downloaded successfully");
  };

  return (
    <DashboardLayout activeMenu="UserManagement">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-100">System User's Report</h1>
            <p className="text-blue-300">Generate and export system user reports by date range.</p>
          </div>
        </div>

        {/* Date Filter Section */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-semibold text-blue-100 mb-4">Filter by Date Range</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-blue-300 text-sm font-medium">Start Date</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-blue-300" />
                </div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-10 w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-blue-300 text-sm font-medium">End Date</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-blue-300" />
                </div>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-10 w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-end space-x-2">
              <button
                onClick={fetchUsers}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Search className="h-4 w-4 mr-2" />
                Generate Report
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                  setStartDate(formatDateForInput(firstDay));
                  setEndDate(formatDateForInput(today));
                  setIsFiltered(false);
                  setUsers([]);
                }}
                className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-300"></div>
          </div>
        ) : isFiltered ? (
          <>
            {/* Export Options */}
            <div className="flex justify-end space-x-4 mb-4">
              <button
                onClick={exportToExcel}
                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export to Excel
              </button>
              <button
                onClick={exportToPDF}
                className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export to PDF
              </button>
            </div>
            
            {/* Results Table */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-white/5 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 bg-white/5 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 bg-white/5 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 bg-white/5 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">Password Changed</th>
                      <th className="px-6 py-3 bg-white/5 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 bg-white/5">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-white/70">
                          No users found in the selected date range
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user._id} className="hover:bg-white/10 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-white">{user.firstname}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-white/80">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.passwordChanged ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {user.passwordChanged ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-white/70">
                            {formatDateForDisplay(user.createdAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>  
        ) : (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 text-center">
             <Download className="h-12 w-12 mx-auto text-blue-300 mb-4" />
             <h3 className="text-xl font-semibold text-blue-100 mb-2">Generate a User Report</h3>
             <p className="text-blue-300 mb-4">Select a date range and click "Generate Report" to view and export user data.</p>
           </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Home;