import {
  LayoutDashboard,
  Bus,
  MapPin,
  Route,
  Users,
  Settings,
  Bell,
  User,
  Ticket,
  Monitor,
  Activity,
  Wifi,
  Database,
  Shield,
  Map,
  Navigation,
  Clock,
  MessageSquare
} from 'lucide-react';

export const MENU_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard/admin',
    roles: ['admin', 'passenger', 'driver'],
    description: 'Overview & Analytics'
  },
  {
    id: 'iot-devices',
    label: 'IoT & Devices',
    icon: Wifi,
    roles: ['admin'],
    hasSubmenu: true,
    submenu: [
      {
        id: 'topics',
        label: 'MQTT Topics',
        icon: Database,
        path: '/topics',
        description: 'Device communication'
      },
      {
        id: 'device-config',
        label: 'Device Config',
        icon: Settings,
        path: '/devices/config',
        description: 'ESP8266 configurations'
      },
      {
        id: 'device-monitoring',
        label: 'Device Status',
        icon: Activity,
        path: '/devices/status',
        description: 'Device health monitoring'
      }
    ]
  },
  {
    id: 'fleet-management',
    label: 'Fleet Management',
    icon: Bus,
    roles: ['admin', 'driver'],
    hasSubmenu: true,
    submenu: [
      {
        id: 'buses',
        label: 'Bus Fleet',
        icon: Bus,
        path: '/buses',
        description: 'Manage bus inventory'
      },
      {
        id: 'live-tracking',
        label: 'Live Tracking',
        icon: Monitor,
        path: '/buses/tracking',
        description: 'Real-time bus locations'
      },
      {
        id: 'bus-status',
        label: 'Bus Status',
        icon: Activity,
        path: '/buses/status',
        description: 'Operational status'
      }
    ]
  },
  {
    id: 'route-management',
    label: 'Route Management',
    icon: Route,
    roles: ['admin'],
    hasSubmenu: true,
    submenu: [
      {
        id: 'routes',
        label: 'Routes',
        icon: Route,
        path: '/routes',
        description: 'Route configuration'
      },
      {
        id: 'route-maps',
        label: 'Route Maps',
        icon: Map,
        path: '/routes/maps',
        description: 'Visual route mapping'
      },
      {
        id: 'stops',
        label: 'Bus Stops',
        icon: MapPin,
        path: '/stops',
        description: 'Stop locations & info'
      }
    ]
  },
  {
    id: 'passenger-services',
    label: 'Passenger Services',
    icon: Users,
    roles: ['admin', 'passenger'],
    hasSubmenu: true,
    submenu: [
      {
        id: 'tickets',
        label: 'Tickets',
        icon: Ticket,
        path: '/tickets',
        description: 'Ticket management'
      },
      {
        id: 'real-time-info',
        label: 'Real-time Info',
        icon: Clock,
        path: '/passenger/realtime',
        description: 'Live bus information'
      },
      {
        id: 'route-finder',
        label: 'Route Finder',
        icon: Navigation,
        path: '/passenger/routes',
        description: 'Find best routes'
      }
    ]
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    path: '/notifications',
    roles: ['admin', 'passenger', 'driver'],
    description: 'Alerts & Messages'
  },
  {
    id: 'user-management',
    label: 'User Management',
    icon: Shield,
    path: '/users',
    roles: ['admin'],
    description: 'User accounts & roles'
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    path: '/profile',
    roles: ['admin', 'passenger', 'driver'],
    description: 'Account settings'
  },
  {
    id: 'system-settings',
    label: 'System Settings',
    icon: Settings,
    path: '/settings',
    roles: ['admin'],
    description: 'System configuration'
  }
];

// Utility function to filter menu items based on user role
export const getFilteredMenuItems = (userRole) => {
  return MENU_ITEMS.filter(item => 
    item.roles.includes(userRole || 'passenger')
  );
};

// Utility function to find menu item by path
export const findMenuItemByPath = (path) => {
  for (const item of MENU_ITEMS) {
    if (item.path === path) {
      return item;
    }
    if (item.hasSubmenu) {
      const subItem = item.submenu.find(sub => sub.path === path);
      if (subItem) {
        return subItem;
      }
    }
  }
  return null;
};

// Quick action items for the support section
export const QUICK_ACTIONS = {
  support: {
    icon: MessageSquare,
    title: 'Quick Support',
    description: 'Need help? Contact support',
    action: 'Get Help'
  }
};

// App branding information
export const APP_INFO = {
  name: 'Bus Tracking System',
  tagline: 'Smart Transit System',
  version: 'v2.1.0',
  copyright: '© 2024 Gihanga Dynamics.',
};