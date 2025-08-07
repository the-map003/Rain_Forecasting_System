import React, { useState, useContext } from 'react';
import { RiLockPasswordLine } from 'react-icons/ri';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import toast from 'react-hot-toast';
import { UserContext } from '../../context/userContext';
import ChangePasswordLayout from '../../components/layouts/Users/ChangePasswordLayout';

const ChangePasswordModal = () => {
  const { user, updateUser } = useContext(UserContext);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.CHANGE_PASSWORD, {
        currentPassword,
        newPassword
      });

      if (response.status === 200) {
        // Update user object with passwordChanged flag
        if (user) {
          const updatedUser = { ...user, passwordChanged: true };
          updateUser(updatedUser);
          
          // Also update in localStorage if you're storing user data there
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          if (storedUser) {
            storedUser.passwordChanged = true;
            localStorage.setItem('user', JSON.stringify(storedUser));
          }
        }
        
        toast.success('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        // Navigate back to previous page after success
        window.history.back();
      }
    } catch (error) {
      console.error('Change password error:', error);
      
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChangePasswordLayout activeMenu="Settings">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-100">Change Password</h1>
          <p className="text-blue-300">Update your password here.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-300"></div>
          </div>
        ) : (
          <div className="max-w-8xl mx-auto ">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 shadow-2xl">

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Current Password */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/90">Current Password</label>
                <div className="relative">
                  <RiLockPasswordLine className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60" />
                  <input
                    value={currentPassword}
                    onChange={({target}) => setCurrentPassword(target.value)}
                    placeholder="Enter your current password"
                    type={showCurrentPassword ? "text" : "password"}
                    disabled={isLoading}
                    className="w-full pl-12 pr-12 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                    {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/90">New Password</label>
                <div className="relative">
                  <RiLockPasswordLine className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60" />
                  <input
                    value={newPassword}
                    onChange={({target}) => setNewPassword(target.value)}
                    placeholder="Create a new password"
                    type={showNewPassword ? "text" : "password"}
                    disabled={isLoading}
                    className="w-full pl-12 pr-12 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <p className="text-xs text-blue-200">Password must be at least 6 characters</p>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/90">Confirm New Password</label>
                <div className="relative">
                  <RiLockPasswordLine className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60" />
                  <input
                    value={confirmPassword}
                    onChange={({target}) => setConfirmPassword(target.value)}
                    placeholder="Confirm your new password"
                    type={showConfirmPassword ? "text" : "password"}
                    disabled={isLoading}
                    className="w-full pl-12 pr-12 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
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

              {/* Submit Button */}
              <button 
                type="submit"
                className={`w-full relative group bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 hover:from-blue-700 hover:via-sky-700 hover:to-cyan-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 shadow-2xl hover:shadow-blue-500/25 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={isLoading}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-400 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative z-10">
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Changing Password...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <span>Change Password</span>
                    </div>
                  )}
                </div>
              </button>
            </form>
          </div>
        </div>
        )}
      </div>
    </ChangePasswordLayout>
  );
};

export default ChangePasswordModal;