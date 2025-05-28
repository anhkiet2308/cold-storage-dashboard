import React, { useState, useEffect } from 'react';
import {
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Line  // Thêm vào đây
} from 'recharts';
import { supabase, testConnection } from './supabaseClient';
import Login from './components/Login';
import { exportToPDF, exportToExcel } from './utils/exportUtils';
const DEBUG_SCHEMA = true;
// Icons
const ThermostatIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
  </svg>
);

const LoginIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);


const App = () => {
  
  // Authentication state
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  // Dashboard state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedSensor, setSelectedSensor] = useState('all');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sensors, setSensors] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [temperatureLogs, setTemperatureLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [chartData, setChartData] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    email_notifications: true,
    sms_notifications: true,
    alert_delay: 5,
    notification_emails: ['admin@abfoods.vn'],
    notification_phones: ['+84123456789']
  });

  const [chartKey, setChartKey] = useState(0);
  const [chartLoading, setChartLoading] = useState(false);
  // THÊM useEffect này sau tất cả useState (khoảng dòng 95)
// Improved Memory Monitor
useEffect(() => {
  console.log('App component mounted');
  
  const logMemory = () => {
    if (performance.memory) {
      const used = Math.round(performance.memory.usedJSHeapSize / 1048576);
      console.log('Memory usage:', {
        used: used + ' MB',
        total: Math.round(performance.memory.totalJSHeapSize / 1048576) + ' MB',
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + ' MB'
      });
      
      // Alert if memory too high
      if (used > 100) {
        console.warn('🚨 High memory usage detected:', used + 'MB');
      }
    }
  };

  const memoryInterval = setInterval(logMemory, 15000);
  logMemory(); // Initial log

  return () => {
    console.log('App component unmounted');
    clearInterval(memoryInterval);
  };
}, []);
useEffect(() => {
  // Auto refresh every 30 seconds
  const autoRefresh = setInterval(() => {
    console.log('🔄 Auto refresh data');
    fetchSensors();
    fetchAlerts();
    fetchTemperatureLogs();
  }, 10000);

  return () => clearInterval(autoRefresh);
}, []);
useEffect(() => {
  // Force unlock loading sau 10 giây nếu bị stuck  
  const forceTimeout = setTimeout(() => {
    if (loading) {
      console.log('🚨 FORCE UNLOCK: App stuck in loading, forcing unlock');
      setLoading(false);
    }
  }, 10000);

  return () => clearTimeout(forceTimeout);
}, [loading]);
  // Check authentication
  useEffect(() => {
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister();
        }
      });
    }

    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user ? 'User logged in' : 'No user');
      
      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
        setShowLogin(false); // Đảm bảo ẩn login form
      } else {
        setUser(null);
        setUserProfile(null);
        // Không tự động hiện login form ở đây
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
  console.log('🔍 checkUser started');
  try {
    // Test connection first
    //console.log('🧪 Testing Supabase connection...');
    //const connectionOk = await testConnection();
    
    //if (!connectionOk) {
    //  console.log('⚠️ Supabase connection failed, running in offline mode');
    //  setLoading(false);
    //  return;
   // }

    console.log('👤 Getting user from Supabase...');
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('❌ Error getting user:', error.message);
    } else {
      console.log('👤 User result:', user ? 'User found' : 'No user');
    }
    
    if (user) {
      setUser(user);
      console.log('📋 Fetching user profile...');
      await fetchUserProfile(user.id);
    } else {
      console.log('👤 No user logged in, continuing as anonymous');
    }
  } catch (error) {
    console.error('❌ Error in checkUser:', error.message);
  } finally {
    console.log('✅ Setting loading to false');
    setLoading(false);
  }
};

const fetchUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.log('Profile not found, creating default user profile');
      return;
    }
    setUserProfile(data);
  } catch (error) {
    console.error('Error fetching profile:', error);
  }
};

  // Fetch data functions
  const fetchSensors = async () => {
  console.log('🔍 fetchSensors called (using fetch)');
  try {
    const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/rest/v1/sensors?select=*&order=id.asc`, {
      headers: {
        'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📊 Sensors data received:', data);
    
    if (DEBUG_SCHEMA && data.length > 0) {
      console.log('🔍 SENSOR COLUMNS:', Object.keys(data[0]));
      console.log('🔍 FIRST SENSOR:', data[0]);
    }

    setSensors(data || []);
    setLastUpdate(new Date());
    
  } catch (error) {
    console.error('💥 Error fetching sensors:', error);
  }
};

  const fetchAlerts = async () => {
    console.log('🔍 fetchAlerts called (using fetch)');
    try {
      const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/rest/v1/alerts?select=*&order=created_at.desc&limit=50`, {
        headers: {
          'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('🚨 Alerts data received:', data);
      
      if (DEBUG_SCHEMA && data.length > 0) {
      console.log('🔍 ALERT COLUMNS:', Object.keys(data[0]));
      console.log('🔍 FIRST ALERT:', data[0]);
      }

      // Check column names match database
      const transformedData = data ? data.map(alert => ({
        ...alert,
        time: new Date(alert.created_at).toLocaleString('vi-VN'),
        sensor: sensors.find(s => s.id === alert.sensor_id)?.name || `Sensor ${alert.sensor_id}`
      })) : [];
      
      setAlertHistory(transformedData);
    } catch (error) {
      console.error('💥 Error fetching alerts:', error);
    }
  };

  const fetchTemperatureLogs = async () => {
    console.log('🔍 fetchTemperatureLogs called (using fetch)');
    setChartLoading(true);
    try {
      const timeRangeHours = {
        '1h': 1,
        '6h': 6,
        '24h': 24,
        '7d': 168,
        '30d': 720
      };
      
      const fromDate = new Date();
      fromDate.setHours(fromDate.getHours() - timeRangeHours[timeRange]);

      const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/rest/v1/temperature_logs?select=*&logged_at=gte.${fromDate.toISOString()}&order=logged_at.asc`, {
        headers: {
          'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📈 Temperature logs received:', data);
      
      // Improved grouping with higher resolution
      const chartPoints = {};
      const groupingMinutes = timeRange === '1h' ? 5 : 
                            timeRange === '6h' ? 15 : 
                            timeRange === '24h' ? 60 : 
                            timeRange === '7d' ? 360 : 1440; // 6 hours for 7d, 1 day for 30d
      
      data?.forEach(log => {
        const date = new Date(log.logged_at);
        // Group by specific time intervals for better resolution
        const roundedMinutes = Math.floor(date.getMinutes() / groupingMinutes) * groupingMinutes;
        const groupKey = `${date.getHours().toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`;
        const dayKey = date.toDateString();
        const fullKey = timeRange === '7d' || timeRange === '30d' ? 
                        `${dayKey} ${groupKey}` : groupKey;
        
        if (!chartPoints[fullKey]) {
          chartPoints[fullKey] = { 
            time: timeRange === '7d' || timeRange === '30d' ? 
                  `${date.getDate()}/${date.getMonth() + 1} ${groupKey}` : groupKey,
            timestamp: date.getTime()
          };
        }
        chartPoints[fullKey][`sensor${log.sensor_id}`] = log.temperature;
      });
      
      const chartArray = Object.values(chartPoints)
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(point => {
          const { timestamp, ...rest } = point;
          return rest;
        });
      
      console.log('📊 Chart data points:', chartArray.length);
      setChartData(chartArray);
      setTemperatureLogs(data || []);
    } catch (error) {
      console.error('💥 Error fetching temperature logs:', error);
    }
    finally {
    // THÊM DÒNG NÀY
    setChartLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        console.log('Settings not found, using defaults');
        return;
      }
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  // Update sensor temperature and check thresholds
  const updateSensorTemperature = async () => {
    if (!user) return;
    
    try {
      const updatePromises = sensors.map(async (sensor) => {
        try {
          const variation = (Math.random() - 0.5) * 0.5;
          const newTemp = Number((sensor.temperature + variation).toFixed(1));
          
          // Update sensor temperature
          const { error: updateError } = await supabase
            .from('sensors')
            .update({ 
              temperature: newTemp,
              updated_at: new Date().toISOString()
            })
            .eq('id', sensor.id);
          
          if (updateError) throw updateError;
          
          // Log temperature
          const { error: logError } = await supabase
            .from('temperature_logs')
            .insert([{ 
              sensor_id: sensor.id, 
              temperature: newTemp 
            }]);
            
          if (logError) throw logError;
          
          // Check thresholds and create alert - ĐÚNG TÊN CỘT
          if (newTemp > sensor.max_threshold || newTemp < sensor.min_threshold) {
            const { error: alertError } = await supabase
              .from('alerts')
              .insert([{
                sensor_id: sensor.id,  // ĐÚNG: sensor_id không phải sensors_id
                type: newTemp > sensor.max_threshold ? 'high' : 'low',
                temperature: newTemp,
                status: 'unresolved'
              }]);
              
            if (alertError) {
              console.error('Alert insert error:', alertError);
              throw alertError;
            }
            
            // Show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Cảnh báo nhiệt độ!', {
                body: `${sensor.name}: ${newTemp}°C - ${newTemp > sensor.max_threshold ? 'Vượt ngưỡng cao' : 'Vượt ngưỡng thấp'}`,
                icon: '/favicon.ico'
              });
            }
          }
          
          return { success: true, sensorId: sensor.id };
        } catch (error) {
          console.error(`Error updating sensor ${sensor.id}:`, error);
          return { success: false, sensorId: sensor.id, error };
        }
      });

      const results = await Promise.allSettled(updatePromises);
      const failures = results.filter(r => r.status === 'rejected' || !r.value?.success);
      
      if (failures.length > 0) {
        console.warn(`${failures.length} sensor updates failed`);
      }
      
    } catch (error) {
      console.error('Error in updateSensorTemperature:', error);
    }
  };

  // Update functions
  const updateSensorThreshold = async (sensorId, minThreshold, maxThreshold) => {
  if (!user || userProfile?.role !== 'admin') {
    console.error('❌ Permission denied: User not admin');
    alert('Chỉ admin mới có quyền thay đổi cài đặt!');
    return false;
  }

  console.log(`🔧 updateSensorThreshold called for sensor ${sensorId}:`, { 
    minThreshold, 
    maxThreshold,
    types: { min: typeof minThreshold, max: typeof maxThreshold },
    userId: user.id,
    userEmail: user.email,
    userRole: userProfile?.role
  });
  
  try {
    // Use Supabase client
    const updateData = {
      min_threshold: Number(minThreshold),
      max_threshold: Number(maxThreshold),
      updated_at: new Date().toISOString()
    };
    
    console.log('📤 Sending update to Supabase:', updateData);
    
    const { data, error } = await supabase
      .from('sensors')
      .update(updateData)
      .eq('id', sensorId)
      .select();

    if (error) {
      console.error('❌ Supabase error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log('✅ Supabase update successful:', data);
    
    if (!data || data.length === 0) {
      console.warn('⚠️ No rows were updated. Sensor might not exist or no permission');
      return false;
    }
    
    console.log('🔄 Refreshing sensors data...');
    await fetchSensors();
    
    return true;
    
  } catch (error) {
    console.error('💥 Error in updateSensorThreshold:', error);
    return false;
  }
};

  const updateSettings = async () => {
    if (!user || userProfile?.role !== 'admin') {
      alert('Chỉ admin mới có quyền thay đổi cài đặt!');
      return false;
    }

    console.log('⚙️ Updating settings...');
    try {
      const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/rest/v1/settings?id=eq.1`, {
        method: 'PATCH',
        headers: {
          'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          ...settings,
          updated_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('✅ Settings updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error updating settings:', error);
      return false;
    }
  };
  const resolveAlert = async (alertId) => {
    if (!user || userProfile?.role !== 'admin') {
      alert('Chỉ admin mới có quyền xử lý cảnh báo!');
      return;
    }

    console.log('🔄 Resolving alert ID:', alertId, 'User ID:', user.id);
    try {
      // TRY USING SUPABASE CLIENT INSTEAD OF FETCH
      console.log('📤 Using Supabase client to resolve alert...');
      
      const { data, error } = await supabase
        .from('alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: user.id
        })
        .eq('id', alertId)
        .select();

      if (error) {
        console.error('❌ Supabase error:', error);
        console.error('❌ Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('✅ Alert resolved successfully:', data);
      
      if (!data || data.length === 0) {
        console.warn('⚠️ No rows were updated. Alert might not exist or no permission');
        alert('Không thể cập nhật cảnh báo. Có thể alert không tồn tại hoặc không có quyền.');
        return;
      }
      
      // Refresh alerts immediately
      await fetchAlerts();
      
    } catch (error) {
      console.error('❌ Error resolving alert:', error);
      alert('Lỗi khi xử lý cảnh báo: ' + error.message);
    }
  };

  const handleLogin = () => {
    setShowLogin(true);
  };

  const handleLogout = async () => {
  console.log('🚪 Logging out...');
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Logout error:', error);
      throw error;
    }
    
    console.log('✅ Successfully logged out');
    setUser(null);
    setUserProfile(null);
    
    // Clear any local storage if needed
    localStorage.removeItem('supabase.auth.token');
    
    // Reload page to ensure clean state
    window.location.reload();
    
  } catch (error) {
    console.error('❌ Error logging out:', error);
    alert('Lỗi khi đăng xuất: ' + error.message);
  }
};

  // Initialize data and subscriptions
  // Thay thế phần Subscribe realtime trong useEffect
useEffect(() => {
  let mounted = true;
  let sensorsChannel = null;
  let alertsChannel = null;
  let logsChannel = null;

  const setupChannels = async () => {
    if (!mounted) return;

    try {
      // Always fetch data first
      await Promise.all([
        fetchSensors(),
        fetchAlerts(), 
        fetchSettings(),
        fetchTemperatureLogs()
      ]);

      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      if (!mounted) return;

      // Setup channels với better error handling
      sensorsChannel = supabase
        .channel('sensors-channel')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'sensors' },
          (payload) => {
            if (!mounted) return;
            console.log('Sensors change:', payload);
            fetchSensors().catch(err => console.error('Fetch sensors error:', err));
          }
        )
        .subscribe((status) => {
          if (!mounted) return;
          console.log('Sensors channel status:', status);
        });

      alertsChannel = supabase
        .channel('alerts-channel')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'alerts' },
          (payload) => {
            if (!mounted) return;
            console.log('Alerts change:', payload);
            fetchAlerts().catch(err => console.error('Fetch alerts error:', err));
          }
        )
        .subscribe((status) => {
          if (!mounted) return;
          console.log('Alerts channel status:', status);
        });

      logsChannel = supabase
        .channel('logs-channel')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'temperature_logs' },
          (payload) => {
            if (!mounted) return;
            console.log('Logs change:', payload);
            fetchTemperatureLogs().catch(err => console.error('Fetch logs error:', err));
          }
        )
        .subscribe((status) => {
          if (!mounted) return;
          console.log('Temperature logs channel status:', status);
        });

    } catch (error) {
      console.error('Error setting up channels:', error);
    }
  };

  setupChannels();

  return () => {
    console.log('Cleaning up channels...');
    mounted = false;
    
    const cleanup = async () => {
      try {
        const unsubscribePromises = [];
        
        if (sensorsChannel) {
          unsubscribePromises.push(sensorsChannel.unsubscribe());
        }
        if (alertsChannel) {
          unsubscribePromises.push(alertsChannel.unsubscribe());
        }
        if (logsChannel) {
          unsubscribePromises.push(logsChannel.unsubscribe());
        }

        await Promise.allSettled(unsubscribePromises);
        console.log('All channels cleaned up');
      } catch (error) {
        console.error('Error cleaning up channels:', error);
      }
    };

    cleanup();
  };
}, []);

  // Temperature update interval - only when user is logged in
  // Temperature update interval - only when user is logged in
useEffect(() => {
  let interval = null;
  let mounted = true;
  let errorCount = 0;

  if (user && sensors.length > 0 && mounted) {
    console.log('Starting temperature update timer');
    
    const safeUpdate = async () => {
      if (!mounted) return;
      try {
        await updateSensorTemperature();
        errorCount = 0; // Reset on success
      } catch (error) {
        errorCount++;
        console.error(`Timer update error (${errorCount}):`, error);
        
        // Stop timer if too many errors
        if (errorCount >= 3) {
          console.error('🚨 Too many timer errors, stopping updates');
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
        }
      }
    };

    safeUpdate(); // Initial call

    interval = setInterval(safeUpdate, 30000); // Every 30 seconds
  }

  return () => {
    mounted = false;
    if (interval) {
      console.log('Clearing temperature update timer');
      clearInterval(interval);
      interval = null;
    }
  };
}, [user, sensors.length]);

useEffect(() => {
  const handleClickOutside = (event) => {
    if (showNotifications && !event.target.closest('.relative')) {
      setShowNotifications(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [showNotifications]);

useEffect(() => {
    // Re-fetch chart data when sensors change to update reference lines
    if (sensors.length > 0) {
      console.log('📊 Sensors updated, refreshing chart...');
      fetchTemperatureLogs();
      // Force chart re-render
      setChartKey(prev => prev + 1);
    }
  }, [sensors]);

useEffect(() => {
  let mounted = true;
  
  const fetchLogs = async () => {
    if (!mounted) return;
    try {
      await fetchTemperatureLogs();
    } catch (error) {
      console.error('Error fetching temperature logs:', error);
    }
  };

  // Debounce để tránh gọi liên tục
  const timeoutId = setTimeout(fetchLogs, 300);
  
  return () => {
    mounted = false;
    clearTimeout(timeoutId);
  };
}, [timeRange]);

  const fetchWithRetry = async (fetchFunction, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await fetchFunction();
      return;
    } catch (error) {
      console.error(`Fetch attempt ${i + 1} failed:`, error);
      if (i === retries - 1) {
        throw error;
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};

  const handleRefresh = async () => {
  setIsLoading(true);
  try {
    await Promise.all([
      fetchWithRetry(fetchSensors),
      fetchWithRetry(fetchAlerts),
      fetchWithRetry(fetchTemperatureLogs)
    ]);
  } catch (error) {
    console.error('Error refreshing data:', error);
    // Có thể hiển thị toast notification lỗi ở đây
  } finally {
    setTimeout(() => setIsLoading(false), 500);
  }
};

  const getSensorStatusColor = (sensor) => {
    if (!sensor) return 'bg-gray-100 text-gray-800 border-gray-200';
    
    if (sensor.status === 'error') return 'bg-red-100 text-red-800 border-red-200';
    if (sensor.status === 'warning' || sensor.temperature > sensor.max_threshold || sensor.temperature < sensor.min_threshold) 
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getSensorCardColor = (sensor) => {
    if (!sensor) return 'border-gray-500';
    
    if (sensor.status === 'error') return 'border-red-500';
    if (sensor.status === 'warning' || sensor.temperature > sensor.max_threshold || sensor.temperature < sensor.min_threshold) 
      return 'border-yellow-500';
    return 'border-green-500';
  };

  // Show loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Show login screen if requested
  if (!user || showLogin) {
    return <Login onLogin={(user) => {
      setUser(user);
      setShowLogin(false);
    }} />;
  }

  // Main dashboard - accessible to everyone
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Hệ thống giám sát nhiệt độ kho lạnh</h1>
              <p className="text-sm text-gray-500 mt-1">
                Cập nhật lần cuối: {lastUpdate.toLocaleString('vi-VN')}
                {user && (
                  <span> | Xin chào, {userProfile?.email || user.email} ({userProfile?.role === 'admin' ? 'Quản trị viên' : 'Người dùng'})</span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                title="Làm mới"
              >
                <RefreshIcon />
              </button>
              {user && userProfile?.role === 'admin' && (
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                  title="Cài đặt"
                >
                  <SettingsIcon />
                </button>
              )}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50" 
                  title="Thông báo"
                >
                  <BellIcon />
                </button>
                {alertHistory.filter(a => a.status === 'unresolved').length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {alertHistory.filter(a => a.status === 'unresolved').length}
                  </span>
                )}
                
                {/* THÊM NOTIFICATION POPUP */}
                {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-medium text-gray-900">Thông báo ({alertHistory.length})</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {alertHistory.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          Không có thông báo
                        </div>
                      ) : (
                        alertHistory.slice(0, 10).map((alert) => (
                          <div key={alert.id} className="p-3 border-b border-gray-100 hover:bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {alert.sensor} - {alert.temperature?.toFixed ? alert.temperature.toFixed(1) : alert.temperature}°C
                                </p>
                                <p className="text-xs text-gray-500">{alert.time}</p>
                                <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                                  alert.type === 'high'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {alert.type === 'high' ? 'Vượt ngưỡng cao' : 'Vượt ngưỡng thấp'}
                                </span>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                alert.status === 'resolved'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {alert.status === 'resolved' ? '✓' : '!'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {alertHistory.length > 10 && (
                      <div className="p-3 text-center border-t border-gray-200">
                        <button 
                          onClick={() => {
                            setActiveTab('alerts');
                            setShowNotifications(false);
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Xem tất cả ({alertHistory.length})
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {user ? (
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                  title="Đăng xuất"
                >
                  <LogoutIcon />
                </button>
              ) : (
                <button
                  onClick={handleLogin}
                  className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  title="Đăng nhập"
                >
                  <LoginIcon />
                </button>
              )}
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="mb-4">
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        )}


        {/* Sensor Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {sensors.map(sensor => (
            <div key={sensor.id} className={`bg-white rounded-lg shadow-sm border-2 p-4 ${getSensorCardColor(sensor)}`}>
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-sm font-medium text-gray-600">{sensor.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full border ${getSensorStatusColor(sensor)}`}>
                  {sensor.status === 'active' ? 'Hoạt động' : sensor.status === 'warning' ? 'Cảnh báo' : 'Lỗi'}
                </span>
              </div>
              <div className="flex items-center mb-3">
                <ThermostatIcon />
                <span className="text-3xl font-bold text-gray-900 ml-2">
                  {sensor.temperature ? sensor.temperature.toFixed(1) : '--'}°C
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Min: {sensor.min_threshold}°C</span>
                <span>Max: {sensor.max_threshold}°C</span>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-2 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Biểu đồ
              </button>
              <button
                onClick={() => setActiveTab('alerts')}
                className={`py-2 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'alerts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Cảnh báo
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-2 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'reports'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Báo cáo
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div>
                <div className="flex gap-4 mb-4">
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1h">1 giờ</option>
                    <option value="6h">6 giờ</option>
                    <option value="24h">24 giờ</option>
                    <option value="7d">7 ngày</option>
                    <option value="30d">30 ngày</option>
                  </select>
                  <select
                    value={selectedSensor}
                    onChange={(e) => setSelectedSensor(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tất cả cảm biến</option>
                    {sensors.map(sensor => (
                      <option key={sensor.id} value={sensor.id}>{sensor.name}</option>
                    ))}
                  </select>
                </div>

                <div className="h-96 relative">
                  {chartLoading && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Đang tải biểu đồ...</span>
                    </div>
                  )}
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" key={chartKey}>
                      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis domain={['dataMin - 5', 'dataMax + 5']} />
                        <Tooltip />
                        <Legend />
                        
                        {/* Dynamic Reference Lines with debugging */}
                        {(() => {
                          console.log('🔍 Rendering reference lines...', {
                            selectedSensor,
                            sensorsCount: sensors.length,
                            sensors: sensors.map(s => ({ id: s.id, name: s.name, min: s.min_threshold, max: s.max_threshold }))
                          });
                          
                          if (selectedSensor === 'all') {
                            if (sensors.length > 0) {
                              const maxThreshold = Math.max(...sensors.map(s => s.max_threshold));
                              const minThreshold = Math.min(...sensors.map(s => s.min_threshold));
                              console.log('📏 All sensors reference lines:', { minThreshold, maxThreshold });
                              
                              return (
                                <>
                                  <ReferenceLine 
                                    y={maxThreshold} 
                                    stroke="red" 
                                    strokeDasharray="5 5" 
                                    label={{ value: `Ngưỡng cao: ${maxThreshold}°C`, position: "topRight" }}
                                  />
                                  <ReferenceLine 
                                    y={minThreshold} 
                                    stroke="blue" 
                                    strokeDasharray="5 5" 
                                    label={{ value: `Ngưỡng thấp: ${minThreshold}°C`, position: "bottomRight" }}
                                  />
                                </>
                              );
                            }
                          } else {
                            const sensor = sensors.find(s => s.id.toString() === selectedSensor);
                            if (sensor) {
                              console.log('📏 Single sensor reference lines:', {
                                sensor: sensor.name,
                                min: sensor.min_threshold,
                                max: sensor.max_threshold
                              });
                              
                              return (
                                <>
                                  <ReferenceLine 
                                    y={sensor.max_threshold} 
                                    stroke="red" 
                                    strokeDasharray="5 5" 
                                    label={{ value: `${sensor.name} - Cao: ${sensor.max_threshold}°C`, position: "topRight" }}
                                  />
                                  <ReferenceLine 
                                    y={sensor.min_threshold} 
                                    stroke="blue" 
                                    strokeDasharray="5 5" 
                                    label={{ value: `${sensor.name} - Thấp: ${sensor.min_threshold}°C`, position: "bottomRight" }}
                                  />
                                </>
                              );
                            }
                          }
                          
                          console.log('⚠️ No reference lines rendered');
                          return null;
                        })()}
                        
                        {sensors.map((sensor, index) => {
                          if (selectedSensor === 'all' || selectedSensor === sensor.id.toString()) {
                            const colors = ['#ef4444', '#3b82f6', '#eab308', '#10b981'];
                            return (
                              <Line 
                                key={sensor.id}
                                type="monotone" 
                                dataKey={`sensor${sensor.id}`} 
                                stroke={colors[index % colors.length]} 
                                name={sensor.name} 
                                strokeWidth={2}
                                connectNulls
                                dot={{ r: 2 }}
                                activeDot={{ r: 4 }}
                              />
                            );
                          }
                          return null;
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                    {chartLoading ? 'Đang tải dữ liệu biểu đồ...' : 'Không có dữ liệu trong khoảng thời gian này'}
                  </div>
                  )}
                </div>
              </div>
            )}

            {/* Alerts Tab */}
            {activeTab === 'alerts' && (
              <div>
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thời gian
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cảm biến
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Loại cảnh báo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nhiệt độ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trạng thái
                        </th>
                        {user && userProfile?.role === 'admin' && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hành động
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {alertHistory.length === 0 ? (
                        <tr>
                          <td colSpan={user && userProfile?.role === 'admin' ? 6 : 5} className="px-6 py-8 text-center text-gray-500">
                            Không có cảnh báo
                          </td>
                        </tr>
                      ) : (
                        alertHistory.map((alert) => (
                          <tr key={alert.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {alert.time}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {alert.sensor}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                alert.type === 'high'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {alert.type === 'high' ? 'Vượt ngưỡng cao' : 'Vượt ngưỡng thấp'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {alert.temperature?.toFixed ? alert.temperature.toFixed(1) : alert.temperature}°C
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                alert.status === 'resolved'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {alert.status === 'resolved' ? 'Đã xử lý' : 'Chưa xử lý'}
                              </span>
                            </td>
                            {user && userProfile?.role === 'admin' && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <button
                                  onClick={() => resolveAlert(alert.id)}
                                  disabled={alert.status === 'resolved'}
                                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-xs"
                                >
                                  {alert.status === 'resolved' ? 'Đã xử lý' : 'Xác nhận'}
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {alertHistory.length > 5 && (
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Kéo xuống để xem thêm cảnh báo ({alertHistory.length} tổng cộng)
                  </p>
                )}
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Thống kê tổng quan</h3>
                  <dl className="space-y-4">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Thời gian hoạt động ổn định</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {sensors.length > 0 
                          ? Math.round(sensors.filter(s => s.status === 'active').length / sensors.length * 100)
                          : 0
                        }%
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Số lần vượt ngưỡng</dt>
                      <dd className="text-sm font-medium text-gray-900">{alertHistory.length} lần</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Nhiệt độ trung bình</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {sensors.length > 0 
                          ? (sensors.reduce((sum, s) => sum + (s.temperature || 0), 0) / sensors.length).toFixed(1)
                          : '--'
                        }°C
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Cảnh báo chưa xử lý</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {alertHistory.filter(a => a.status === 'unresolved').length} cảnh báo
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Xuất báo cáo</h3>
                  <div className="space-y-4">
                    <button 
                      onClick={() => exportToPDF(alertHistory, 'alerts')}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <DownloadIcon />
                      Xuất báo cáo cảnh báo (PDF)
                    </button>
                    <button 
                      onClick={() => exportToExcel(temperatureLogs, sensors, 'temperature')}
                      className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      <DownloadIcon />
                      Xuất báo cáo nhiệt độ (Excel)
                    </button>
                    {!user && (
                      <p className="text-xs text-gray-500 text-center">
                        Đăng nhập để xuất báo cáo đầy đủ
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Settings Modal - Only for Admin */}
        {settingsOpen && user && userProfile?.role === 'admin' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Cài đặt hệ thống</h2>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Alert Settings */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Cảnh báo</h3>
                  <div className="space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.email_notifications}
                        onChange={(e) => setSettings({...settings, email_notifications: e.target.checked})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Gửi cảnh báo qua Email</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.sms_notifications}
                        onChange={(e) => setSettings({...settings, sms_notifications: e.target.checked})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Gửi cảnh báo qua SMS</span>
                    </label>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Thời gian delay cảnh báo (phút)
                      </label>
                      <input
                        type="number"
                        value={settings.alert_delay}
                        onChange={(e) => setSettings({...settings, alert_delay: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Danh sách email nhận cảnh báo (mỗi email một dòng)
                      </label>
                      <textarea
                        value={settings.notification_emails?.join('\n') || ''}
                        onChange={(e) => setSettings({...settings, notification_emails: e.target.value.split('\n').filter(e => e.trim())})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Danh sách số điện thoại nhận SMS (mỗi số một dòng)
                      </label>
                      <textarea
                        value={settings.notification_phones?.join('\n') || ''}
                        onChange={(e) => setSettings({...settings, notification_phones: e.target.value.split('\n').filter(e => e.trim())})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                      />
                    </div>
                  </div>
                </div>

                {/* Temperature Thresholds */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Ngưỡng nhiệt độ</h3>
                  <div className="space-y-4">
                    {sensors.map(sensor => (
                      <div key={sensor.id} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">{sensor.name}</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Ngưỡng thấp (°C)
                            </label>
                            <input
                              type="number"
                              id={`min-${sensor.id}`}
                              defaultValue={sensor.min_threshold}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Ngưỡng cao (°C)
                            </label>
                            <input
                              type="number"
                              id={`max-${sensor.id}`}
                              defaultValue={sensor.max_threshold}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={async () => {
                    console.log('💾 Saving all settings...');
                    setIsLoading(true);
                    
                    try {
                      let allSuccess = true;
                      let errorMessages = [];
                      
                      // 1. Update general settings
                      console.log('📧 Updating general settings...');
                      const settingsSuccess = await updateSettings();
                      if (!settingsSuccess) {
                        allSuccess = false;
                        errorMessages.push('Lỗi cập nhật cài đặt chung');
                      }
                      
                      // 2. Update thresholds cho từng sensor
                      console.log('🌡️ Starting sensor threshold updates...');
                      console.log('📊 Total sensors to update:', sensors.length);
                      
                      for (let i = 0; i < sensors.length; i++) {
                        const sensor = sensors[i];
                        console.log(`\n🔄 Processing sensor ${i + 1}/${sensors.length}: ${sensor.name} (ID: ${sensor.id})`);
                        
                        const minElement = document.getElementById(`min-${sensor.id}`);
                        const maxElement = document.getElementById(`max-${sensor.id}`);
                        
                        if (!minElement || !maxElement) {
                          console.error(`❌ Cannot find input elements for sensor ${sensor.id}`);
                          console.log('🔍 Available elements with min- prefix:', 
                            Array.from(document.querySelectorAll('[id^="min-"]')).map(el => el.id)
                          );
                          errorMessages.push(`Không tìm thấy input cho ${sensor.name}`);
                          allSuccess = false;
                          continue;
                        }
                        
                        const minValue = parseFloat(minElement.value);
                        const maxValue = parseFloat(maxElement.value);
                        
                        console.log(`📊 Sensor ${sensor.id} (${sensor.name}):`, {
                          currentMin: sensor.min_threshold,
                          currentMax: sensor.max_threshold,
                          newMin: minValue,
                          newMax: maxValue,
                          minElement: minElement.value,
                          maxElement: maxElement.value
                        });
                        
                        // Validate values
                        if (isNaN(minValue) || isNaN(maxValue)) {
                          console.error(`❌ Invalid values for sensor ${sensor.id}:`, { minValue, maxValue });
                          errorMessages.push(`Giá trị ngưỡng không hợp lệ cho ${sensor.name}`);
                          allSuccess = false;
                          continue;
                        }
                        
                        if (minValue >= maxValue) {
                          console.error(`❌ Min >= Max for sensor ${sensor.id}:`, { minValue, maxValue });
                          errorMessages.push(`Ngưỡng thấp phải nhỏ hơn ngưỡng cao cho ${sensor.name}`);
                          allSuccess = false;
                          continue;
                        }
                        
                        // Update sensor threshold
                        console.log(`🔧 Updating sensor ${sensor.id} thresholds: ${minValue} to ${maxValue}`);
                        
                        try {
                          const thresholdSuccess = await updateSensorThreshold(sensor.id, minValue, maxValue);
                          if (thresholdSuccess) {
                            console.log(`✅ Successfully updated sensor ${sensor.id} (${sensor.name})`);
                          } else {
                            console.error(`❌ Failed to update sensor ${sensor.id} (${sensor.name})`);
                            allSuccess = false;
                            errorMessages.push(`Lỗi cập nhật ngưỡng cho ${sensor.name}`);
                          }
                        } catch (error) {
                          console.error(`💥 Exception updating sensor ${sensor.id}:`, error);
                          allSuccess = false;
                          errorMessages.push(`Lỗi exception cho ${sensor.name}: ${error.message}`);
                        }
                        
                        // Add delay between updates
                        await new Promise(resolve => setTimeout(resolve, 500));
                      }
                      
                      console.log('\n📊 Update Summary:');
                      console.log('✅ Success:', allSuccess);
                      console.log('❌ Errors:', errorMessages);
                      
                      if (allSuccess) {
                        alert('✅ Đã lưu tất cả cài đặt thành công!');
                        setSettingsOpen(false);
                        // Force refresh all data
                        await Promise.all([fetchSensors(), fetchAlerts()]);
                      } else {
                        alert('⚠️ Một số cài đặt không được lưu:\n' + errorMessages.join('\n'));
                      }
                      
                    } catch (error) {
                      console.error('💥 Critical error saving settings:', error);
                      alert('❌ Có lỗi nghiêm trọng khi lưu cài đặt: ' + error.message);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;