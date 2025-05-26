import React, { useState, useEffect } from 'react';
import { Line } from 'recharts';
import {
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { supabase } from './supabaseClient';
import Login from './components/Login';
import { exportToPDF, exportToExcel } from './utils/exportUtils';

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
  
  // Settings state
  const [settings, setSettings] = useState({
    email_notifications: true,
    sms_notifications: true,
    alert_delay: 5,
    notification_emails: ['admin@abfoods.vn'],
    notification_phones: ['+84123456789']
  });

  // Check authentication
  useEffect(() => {
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setUserProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await fetchUserProfile(user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
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
    try {
      const { data, error } = await supabase
        .from('sensors')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      setSensors(data || []);
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('Error fetching sensors:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const transformedData = data ? data.map(alert => ({
        ...alert,
        time: new Date(alert.created_at).toLocaleString('vi-VN'),
        sensor: sensors.find(s => s.id === alert.sensor_id)?.name || `Sensor ${alert.sensor_id}`
      })) : [];
      
      setAlertHistory(transformedData);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const fetchTemperatureLogs = async () => {
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

      const { data, error } = await supabase
        .from('temperature_logs')
        .select('*')
        .gte('logged_at', fromDate.toISOString())
        .order('logged_at', { ascending: true });

      if (error) throw error;
      
      // Group by hour for chart
      const chartPoints = {};
      data?.forEach(log => {
        const date = new Date(log.logged_at);
        const hourKey = `${date.getHours()}:00`;
        
        if (!chartPoints[hourKey]) {
          chartPoints[hourKey] = { time: hourKey };
        }
        chartPoints[hourKey][`sensor${log.sensor_id}`] = log.temperature;
      });
      
      // Convert to array and sort
      const chartArray = Object.values(chartPoints).sort((a, b) => {
        const hourA = parseInt(a.time.split(':')[0]);
        const hourB = parseInt(b.time.split(':')[0]);
        return hourA - hourB;
      });
      
      setChartData(chartArray);
      setTemperatureLogs(data || []);
    } catch (error) {
      console.error('Error fetching temperature logs:', error);
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
    if (!user) return; // Only update if logged in
    
    for (const sensor of sensors) {
      const variation = (Math.random() - 0.5) * 0.5;
      const newTemp = Number((sensor.temperature + variation).toFixed(1));
      
      try {
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
        
        // Check thresholds and create alert
        if (newTemp > sensor.max_threshold || newTemp < sensor.min_threshold) {
          const { error: alertError } = await supabase
            .from('alerts')
            .insert([{
              sensor_id: sensor.id,
              type: newTemp > sensor.max_threshold ? 'high' : 'low',
              temperature: newTemp,
              status: 'unresolved'
            }]);
            
          if (alertError) throw alertError;
          
          // Show browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Cảnh báo nhiệt độ!', {
              body: `${sensor.name}: ${newTemp}°C - ${newTemp > sensor.max_threshold ? 'Vượt ngưỡng cao' : 'Vượt ngưỡng thấp'}`,
              icon: '/favicon.ico'
            });
          }
        }
      } catch (error) {
        console.error('Error updating sensor:', error);
      }
    }
  };

  // Update functions
  const updateSensorThreshold = async (sensorId, minThreshold, maxThreshold) => {
    if (!user || userProfile?.role !== 'admin') {
      alert('Chỉ admin mới có quyền thay đổi cài đặt!');
      return;
    }

    try {
      const { error } = await supabase
        .from('sensors')
        .update({ 
          min_threshold: minThreshold,
          max_threshold: maxThreshold,
          updated_at: new Date().toISOString()
        })
        .eq('id', sensorId);

      if (error) throw error;
      await fetchSensors();
      alert('Cập nhật ngưỡng thành công!');
    } catch (error) {
      console.error('Error updating threshold:', error);
      alert('Lỗi khi cập nhật ngưỡng!');
    }
  };

  const updateSettings = async () => {
    if (!user || userProfile?.role !== 'admin') {
      alert('Chỉ admin mới có quyền thay đổi cài đặt!');
      return;
    }

    try {
      const { error } = await supabase
        .from('settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);

      if (error) throw error;
      alert('Cập nhật cài đặt thành công!');
      setSettingsOpen(false);
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Lỗi khi cập nhật cài đặt!');
    }
  };

  const resolveAlert = async (alertId) => {
    if (!user || userProfile?.role !== 'admin') {
      alert('Chỉ admin mới có quyền xử lý cảnh báo!');
      return;
    }

    try {
      const { error } = await supabase
        .from('alerts')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: user.id
        })
        .eq('id', alertId);

      if (error) throw error;
      await fetchAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const handleLogin = () => {
    setShowLogin(true);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Initialize data and subscriptions
  useEffect(() => {
    // Always fetch data, even for anonymous users
    fetchSensors();
    fetchAlerts();
    fetchSettings();
    fetchTemperatureLogs();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Subscribe to realtime changes
    const sensorsChannel = supabase
      .channel('public:sensors')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sensors' },
        () => {
          fetchSensors();
        }
      )
      .subscribe();

    const alertsChannel = supabase
      .channel('public:alerts')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    const logsChannel = supabase
      .channel('public:temperature_logs')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'temperature_logs' },
        () => {
          fetchTemperatureLogs();
        }
      )
      .subscribe();

    return () => {
      sensorsChannel.unsubscribe();
      alertsChannel.unsubscribe();
      logsChannel.unsubscribe();
    };
  }, []);

  // Temperature update interval - only when user is logged in
  useEffect(() => {
    if (user && sensors.length > 0) {
      // Initial update
      updateSensorTemperature();
      
      // Update every 30 seconds
      const interval = setInterval(() => {
        updateSensorTemperature();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user, sensors.length]);

  // Fetch temperature logs when timeRange changes
  useEffect(() => {
    fetchTemperatureLogs();
  }, [timeRange]);

  const handleRefresh = () => {
    setIsLoading(true);
    Promise.all([
      fetchSensors(),
      fetchAlerts(),
      fetchTemperatureLogs()
    ]).then(() => {
      setTimeout(() => setIsLoading(false), 500);
    });
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
  if (showLogin && !user) {
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
                <button className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50" title="Thông báo">
                  <BellIcon />
                </button>
                {alertHistory.filter(a => a.status === 'unresolved').length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {alertHistory.filter(a => a.status === 'unresolved').length}
                  </span>
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

        {/* Alert for anonymous users */}
        {!user && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Bạn đang xem ở chế độ khách. <button onClick={handleLogin} className="font-medium underline">Đăng nhập</button> để có thể cập nhật dữ liệu và truy cập đầy đủ tính năng.
            </p>
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

                <div className="h-96">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis domain={[-35, -10]} />
                        <Tooltip />
                        <Legend />
                        <ReferenceLine y={-15} stroke="red" strokeDasharray="5 5" label="Ngưỡng cao" />
                        <ReferenceLine y={-30} stroke="blue" strokeDasharray="5 5" label="Ngưỡng thấp" />
                        {sensors.map((sensor, index) => {
                          if (selectedSensor === 'all' || selectedSensor == sensor.id) {
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
                              />
                            );
                          }
                          return null;
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      Không có dữ liệu trong khoảng thời gian này
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Alerts Tab */}
            {activeTab === 'alerts' && (
              <div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
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
                          <td colSpan={user && userProfile?.role === 'admin' ? 6 : 5} className="px-6 py-4 text-center text-gray-500">
                            Không có cảnh báo
                          </td>
                        </tr>
                      ) : (
                        alertHistory.map((alert) => (
                          <tr key={alert.id}>
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
                                  className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                                >
                                  Xác nhận
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
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
                    await updateSettings();
                    // Update thresholds
                    for (const sensor of sensors) {
                      const minValue = document.getElementById(`min-${sensor.id}`).value;
                      const maxValue = document.getElementById(`max-${sensor.id}`).value;
                      if (minValue != sensor.min_threshold || maxValue != sensor.max_threshold) {
                        await updateSensorThreshold(sensor.id, parseFloat(minValue), parseFloat(maxValue));
                      }
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Lưu
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