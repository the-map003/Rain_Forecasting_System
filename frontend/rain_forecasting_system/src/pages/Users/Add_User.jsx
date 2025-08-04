import React, { useEffect, useState } from 'react';
import AddUserLayout from '../../components/layouts/Users/AddUserLayout';
import { useUserAuth } from '../../hooks/useUserAuth';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { FaUser } from 'react-icons/fa';
import { IoMail } from 'react-icons/io5';

const Home = () => {
  useUserAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchDashboardData = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await axiosInstance.get(`${API_PATHS.DASHBOARD}`);
      if (response.data) {
        setDashboardData(response.data);
      } 
    } catch(error) {
      console.log("Something went wrong. Please try again.", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fullName.trim() || !email.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      // Replace with your actual API endpoint
      const response = await axiosInstance.post(`${API_PATHS.REGISTER_USER}`, {
        fullName: fullName.trim(),
        email: email.trim()
      });

      if (response.data) {
        setSuccess('System user registered successfully! Default password will be sent to their email.');
        setFullName('');
        setEmail('');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || 'Failed to register user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    return () => {};
  }, []);

  return (
    <AddUserLayout activeMenu="UserManagement">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-100">Add System Users</h1>
          <p className="text-blue-300">Register system user here.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-300"></div>
          </div>
        ) : (
          <div className="max-w-8xl mx-auto ">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 shadow-2xl">

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/90">Full Name</label>
                  <div className="relative">
                    <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60" />
                    <input
                      value={fullName}
                      onChange={({target}) => setFullName(target.value)}
                      placeholder="Enter user's full name"
                      type="text"
                      disabled={isSubmitting}
                      className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                      required
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-xl pointer-events-none"></div>
                  </div>
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/90">Email Address</label>
                  <div className="relative">
                    <IoMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60" />
                    <input
                      value={email}
                      onChange={({target}) => setEmail(target.value)}
                      placeholder="Enter user's email address"
                      type="email"
                      disabled={isSubmitting}
                      className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                      required
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-xl pointer-events-none"></div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl p-4">
                    <div className="flex items-center">
                      <div className="text-red-300 mr-3 text-lg">⚠️</div>
                      <p className='text-red-200 text-sm font-medium'>{error}</p>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-xl p-4">
                    <div className="flex items-center">
                      <div className="text-green-300 mr-3 text-lg">✅</div>
                      <p className='text-green-200 text-sm font-medium'>{success}</p>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button 
                  type="submit"
                  className={`w-full relative group bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 hover:from-blue-700 hover:via-sky-700 hover:to-cyan-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 shadow-2xl hover:shadow-blue-500/25 transform hover:-translate-y-1 ${isSubmitting ? 'opacity-70 cursor-not-allowed transform-none' : ''}`}
                  disabled={isSubmitting}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-400 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <div className="relative z-10">
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Registering User...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <span>Register System User</span>
                      </div>
                    )}
                  </div>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AddUserLayout>
  );
};

export default Home;