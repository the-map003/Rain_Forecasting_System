import { 
  LayoutDashboard, 
  CloudRain, 
  Map, 
  BarChart3, 
  Bell, 
  History, 
  Settings, 
  Calendar, 
  Droplets, 
  CloudLightning,
  Users,
  UserPlus, 
  ListOrdered, 
  FileText, 
  ChevronRight,
  Lock,
  Cpu,
  Activity,
  FileBarChart
} from 'lucide-react';

// Define menu items with role access control
export const menuItems = [
  {
    id: 'Dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard/admin',
    description: 'Overview & Analytics',
    roles: ['admin'] // Only visible to admin
  },
  {
    id: 'UserDashboard',
    label: 'Staff Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard/user',
    description: 'Overview & Analytics',
    roles: ['staff'] // Only visible to staff
  },
  {
    id: 'UserManagement',
    label: 'Users',
    icon: Users,
    path: null, // Parent menu, no direct route
    description: 'Manage system users',
    hasChildren: true,
    roles: ['admin'], // Only visible to admin
    children: [
      {
        id: 'AddUser',
        label: 'Add System User',
        icon: UserPlus,
        path: '/dashboard/admin/users/add-user',
      },
      {
        id: 'ManageUser',
        label: 'Manage Users',
        icon: ListOrdered,
        path: '/dashboard/admin/users/manage-user',
      },
      {
        id: 'UserReport',
        label: 'User Reports',
        icon: FileText,
        path: '/dashboard/admin/users/user-report',
      },
    ],
    dropdownIcon: ChevronRight, // For rendering UI
  },
  {
    id: 'DeviceManagement',
    label: 'Devices',
    icon: Cpu,
    path: null,
    description: 'Manage IoT devices',
    hasChildren: true,
    roles: ['admin', 'staff'],
    children: [
      {
        id: 'ManageDevices',
        label: 'Manage Devices',
        icon: ListOrdered,
        path: '/dashboard/admin/devices/manage',
        roles: ['admin'] // Only admin can manage devices
      },
      {
        id: 'DeviceData',
        label: 'Live Data',
        icon: Activity,
        path: '/dashboard/admin/devices/data',
        roles: ['admin']
      },
      {
        id: 'StaffDeviceData',
        label: 'Live Data',
        icon: Activity,
        path: '/dashboard/user/devices/data',
        roles: ['staff']
      },
      {
        id: 'DeviceReports',
        label: 'Device Reports',
        icon: FileBarChart,
        path: '/dashboard/admin/devices/reports',
        roles: ['admin']
      },
      {
        id: 'StaffDeviceReports',
        label: 'Device Reports',
        icon: FileBarChart,
        path: '/dashboard/user/devices/reports',
        roles: ['staff']
      },
    ],
    dropdownIcon: ChevronRight,
  },
  {
    id: 'RainfallMap',
    label: 'Rainfall Map',
    icon: Map,
    path: '/rainfall/map',
    description: 'Geographical precipitation',
    roles: ['admin', 'staff'] // Visible to both roles
  },
  {
    id: 'Analytics',
    label: 'Analytics',
    icon: BarChart3,
    path: '/analytics',
    description: 'Weather trends & patterns',
    roles: ['admin', 'staff'] // Visible to both roles
  },
  {
    id: 'Alerts',
    label: 'Alerts & Notifications',
    icon: Bell,
    path: '/alerts',
    description: 'Weather warnings & updates',
    roles: ['admin', 'staff'] // Visible to both roles
  },
  {
    id: 'HistoricalData',
    label: 'Historical Data',
    icon: History,
    path: '/historical',
    description: 'Past weather records',
    roles: ['admin', 'staff'] // Visible to both roles
  },
  {
    id: 'Settings',
    label: 'Settings',
    icon: Settings,
    path: null, // Changed from '/settings' to null since it's now a parent menu
    description: 'System configuration',
    hasChildren: true, // Added to indicate this is a parent menu with children
    roles: ['admin', 'staff'], // Visible to both roles
    children: [
      {
        id: 'ChangePassword',
        label: 'Change Password',
        icon: Lock,
        path: '/settings/change-password',
      },
      // You can add more settings options here in the future
    ],
    dropdownIcon: ChevronRight, // For rendering UI
  },
];

export const quickActions = [
  {
    id: 'daily-forecast',
    label: 'Daily Forecast',
    icon: Calendar,
    path: '/forecast/daily',
  },
  {
    id: 'humidity-levels',
    label: 'Humidity Levels',
    icon: Droplets,
    path: '/metrics/humidity',
  },
  {
    id: 'storm-tracker',
    label: 'Storm Tracker',
    icon: CloudLightning,
    path: '/tracker/storm',
  },
];