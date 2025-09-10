import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/userContext';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { Edit, Trash2, Check, X, RefreshCw, Plus, Wifi, CheckCircle, XCircle, Cpu, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/apiPaths';

const ManageDevices = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [editingDevice, setEditingDevice] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phoneNumber: ''
  });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    phoneNumber: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check authentication on component mount
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      toast.error('Session expired. Please login again.');
      navigate('/login');
      return;
    }
    
    // Verify user role for admin-only page
    try {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== 'admin') {
        toast.error('Unauthorized access');
        navigate('/dashboard/user');
        return;
      }
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
      return;
    }
    
    fetchDevices();
  }, [navigate]);

  const fetchDevices = async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/devices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDevices(response.data.data);
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error('Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDevice = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Debug logging
      console.log('Token exists:', !!token);
      console.log('Token length:', token ? token.length : 0);
      console.log('API URL:', `${API_BASE_URL}/devices`);
      
      if (!token) {
        toast.error('No authentication token found. Please login again.');
        return;
      }
      
      const response = await axios.post(
        `${API_BASE_URL}/devices`,
        addForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const newDevice = response.data.data;
      toast.success(`Device registered successfully! ID: ${newDevice.deviceId}`);
      
      // Send MQTT configuration message for remote setup
      await configureDeviceViaMQTT(newDevice.deviceId);
      
      setDevices([...devices, newDevice]);
      setShowAddModal(false);
      resetAddForm();
    } catch (error) {
      console.error('Error adding device:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.');
        // Optionally redirect to login
        // window.location.href = '/login';
      } else {
        toast.error(error.response?.data?.message || 'Failed to add device');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const configureDeviceViaMQTT = async (deviceId) => {
    try {
      // This will be handled by the MQTT service
      const mqttPayload = {
        action: 'configure',
        deviceId: deviceId,
        timestamp: new Date().toISOString()
      };
      
      // Call backend endpoint to send MQTT configuration
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/devices/configure-mqtt`,
        { deviceId, mqttPayload },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('MQTT configuration sent to device');
    } catch (error) {
      console.error('Error sending MQTT configuration:', error);
      toast.error('Device registered but MQTT configuration failed. Configure manually.');
    }
  };

  const handleSaveEdit = async (deviceId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/devices/${deviceId}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Device updated successfully');
      setDevices(devices.map(d => d._id === deviceId ? { ...d, ...editForm } : d));
      setEditingDevice(null);
      resetEditForm();
    } catch (error) {
      console.error('Error updating device:', error);
      toast.error(error.response?.data?.message || 'Failed to update device');
    }
  };

  const handleConfirmDelete = async (deviceId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/devices/${deviceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Device deleted successfully');
      setDevices(devices.filter(d => d._id !== deviceId));
      setSelectedDevices(selectedDevices.filter(id => id !== deviceId));
      setConfirmDelete(null);
    } catch (error) {
      console.error('Error deleting device:', error);
      toast.error(error.response?.data?.message || 'Failed to delete device');
    }
  };

  // Handle checkbox selection
  const handleSelectDevice = (deviceId) => {
    if (selectedDevices.includes(deviceId)) {
      setSelectedDevices(selectedDevices.filter(id => id !== deviceId));
    } else {
      setSelectedDevices([...selectedDevices, deviceId]);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedDevices.length === devices.length) {
      setSelectedDevices([]);
    } else {
      setSelectedDevices(devices.map(device => device._id));
    }
  };

  // Start editing a device
  const handleEditClick = (device) => {
    setEditingDevice(device._id);
    setEditForm({
      name: device.name,
      phoneNumber: device.phoneNumber
    });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingDevice(null);
    resetEditForm();
  };

  // Delete selected devices
  const handleDeleteSelected = async () => {
    if (selectedDevices.length === 0) return;
    
    try {
      const devicesToDelete = [...selectedDevices];
      
      for (const deviceId of devicesToDelete) {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE_URL}/devices/${deviceId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDevices(prevDevices => prevDevices.filter(device => device._id !== deviceId));
      }
      
      setSelectedDevices([]);
      toast.success(`${devicesToDelete.length} device(s) deleted successfully`);
    } catch (error) {
      console.error('Error deleting selected devices:', error);
      toast.error('Failed to delete some devices');
    }
  };

  const resetEditForm = () => {
    setEditForm({
      name: '',
      phoneNumber: ''
    });
  };

  const resetAddForm = () => {
    setAddForm({
      name: '',
      phoneNumber: ''
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const isDeviceOnline = (lastDataReceived) => {
    if (!lastDataReceived) return false;
    const lastUpdate = new Date(lastDataReceived);
    const now = new Date();
    const diffMinutes = (now - lastUpdate) / (1000 * 60);
    return diffMinutes < 5; // Consider online if data received within last 5 minutes
  };

  return (
    <DashboardLayout activeMenu="DeviceManagement">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-100">Manage Devices</h1>
            <p className="text-blue-300">Manage IoT devices and their configurations.</p>
          </div>
          <div className="flex space-x-4">
            {selectedDevices.length > 0 && (
              <button 
                onClick={handleDeleteSelected}
                className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedDevices.length})
              </button>
            )}
            <button 
              onClick={fetchDevices}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Device
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-300"></div>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-white/5 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 rounded border-white/30 bg-white/10 focus:ring-blue-500"
                          checked={selectedDevices.length === devices.length && devices.length > 0}
                          onChange={handleSelectAll}
                        />
                      </div>
                    </th>
                    <th className="px-6 py-3 bg-white/5 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">Device ID</th>
                    <th className="px-6 py-3 bg-white/5 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 bg-white/5 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">Phone Number</th>
                    <th className="px-6 py-3 bg-white/5 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 bg-white/5 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">Last Data</th>
                    <th className="px-6 py-3 bg-white/5 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-white/5">
                  {devices.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-white/70">
                        No devices found. Add your first device to get started.
                      </td>
                    </tr>
                  ) : (
                    devices.map((device) => (
                      <tr key={device._id} className="hover:bg-white/10 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 rounded border-white/30 bg-white/10 focus:ring-blue-500"
                            checked={selectedDevices.includes(device._id)}
                            onChange={() => handleSelectDevice(device._id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-white">
                          {device.deviceId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingDevice === device._id ? (
                            <select
                              value={editForm.name}
                              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                            >
                              <option value="" className="bg-slate-800 text-white">All Devices</option>
                              {devices.map(device => (
                                <option key={device.deviceId} value={device.name} className="bg-slate-800 text-white">
                                  {device.name} ({device.deviceId})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="text-white">{device.name}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingDevice === device._id ? (
                            <input
                              type="tel"
                              value={editForm.phoneNumber}
                              onChange={(e) => setEditForm({...editForm, phoneNumber: e.target.value})}
                              className="w-full px-2 py-1 bg-white/20 border border-white/30 rounded text-white"
                            />
                          ) : (
                            <div className="text-white/80">{device.phoneNumber}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {device.isActive ? (
                              <span className="text-green-400">
                                <CheckCircle className="h-4 w-4" />
                              </span>
                            ) : (
                              <span className="text-red-400">
                                <XCircle className="h-4 w-4" />
                              </span>
                            )}
                            {isDeviceOnline(device.lastDataReceived) && (
                              <span className="text-blue-400 animate-pulse">
                                <Wifi className="h-4 w-4" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-white/70">
                          {formatDate(device.lastDataReceived)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {confirmDelete === device._id ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleConfirmDelete(device._id)}
                                className="text-red-400 hover:text-red-300 flex items-center"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Confirm
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="text-gray-400 hover:text-gray-300 flex items-center"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </button>
                            </div>
                          ) : editingDevice === device._id ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleSaveEdit(device._id)}
                                className="text-green-400 hover:text-green-300 flex items-center"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-gray-400 hover:text-gray-300 flex items-center"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditClick(device)}
                                className="text-blue-400 hover:text-blue-300 flex items-center"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </button>
                              <button
                                onClick={() => setConfirmDelete(device._id)}
                                className="text-red-400 hover:text-red-300 flex items-center"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Device Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 w-full max-w-md mx-auto my-auto">
              <h2 className="text-xl font-bold text-white mb-6">Add New Device</h2>
              <form onSubmit={handleAddDevice} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/90">Device Name *</label>
                  <div className="relative">
                    <Cpu className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60" />
                    <input
                      type="text"
                      value={addForm.name}
                      onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                      placeholder="Enter device name"
                      disabled={isSubmitting}
                      className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/90">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60" />
                    <input
                      type="tel"
                      value={addForm.phoneNumber}
                      onChange={(e) => setAddForm({ ...addForm, phoneNumber: e.target.value })}
                      placeholder="+1234567890"
                      disabled={isSubmitting}
                      className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetAddForm();
                    }}
                    className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 relative group bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 hover:from-blue-700 hover:via-sky-700 hover:to-cyan-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 shadow-2xl hover:shadow-blue-500/25 transform hover:-translate-y-1 ${isSubmitting ? 'opacity-70 cursor-not-allowed transform-none' : ''}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-400 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative z-10">
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Adding...
                        </div>
                      ) : (
                        'Add Device'
                      )}
                    </div>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default ManageDevices;
