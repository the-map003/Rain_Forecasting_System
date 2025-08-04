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
  ChevronRight
} from 'lucide-react';
  export const menuItems = [
    {
      id: 'Dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard/admin',
      description: 'Overview & Analytics'
    },
    {
      id: 'UserManagement',
      label: 'Users',
      icon: Users,
      path: null, // Parent menu, no direct route
      description: 'Manage system users',
      hasChildren: true,
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
      id: 'RainfallMap',
      label: 'Rainfall Map',
      icon: Map,
      path: '/rainfall/map',
      description: 'Geographical precipitation'
    },
    {
      id: 'Analytics',
      label: 'Analytics',
      icon: BarChart3,
      path: '/analytics',
      description: 'Weather trends & patterns'
    },
    {
      id: 'Alerts',
      label: 'Alerts & Notifications',
      icon: Bell,
      path: '/alerts',
      description: 'Weather warnings & updates'
    },
    {
      id: 'HistoricalData',
      label: 'Historical Data',
      icon: History,
      path: '/historical',
      description: 'Past weather records'
    },
    {
      id: 'Settings',
      label: 'Settings',
      icon: Settings,
      path: '/settings',
      description: 'System configuration'
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