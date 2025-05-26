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

// Icons as components
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

// Mock data generator for charts
const generateMockData = () => {
  const now = new Date();
  const data = [];
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now - i * 60 * 60 * 1000);
    data.push({
      time: time.getHours() + ':00',
      sensor1: Number((-18 + Math.random() * 4 - 2).toFixed(1)),
      sensor2: Number((-20 + Math.random() * 4 - 2).toFixed(1)),
      sensor3: Number((-19 + Math.random() * 4 - 2).toFixed(1)),
      sensor4: Number((-17 + Math.random() * 4 - 2).toFixed(1)),
    });
  }
  return data;
};

const ColdStorageDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedSensor, setSelectedSensor] = useState('all');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sensors, setSensors] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [chartData, setChartData] = useState(generateMockData());
  
  // Settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [alertDelay, setAlertDelay] = useState(5);

  // Fetch sensors từ Supabase
  const fetchSensors = async () => {
    try {
      const { data, error } = await supabase
        .from('sensors')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      
      // Nếu không có data, dùng mock data
      if (!data || data.length === 0) {
        setSensors([
          { id: 1, name: 'Sensor 1 - Kho A', temperature: -18.5, status: 'active', min_threshold: -30, max_threshold: -15 },
          { id: 2, name: 'Sensor 2 - Kho B', temperature: -20.2, status: 'active', min_threshold: -30, max_threshold: -15 },
          { id: 3, name: 'Sensor 3 - Kho C', temperature: -19.8, status: 'warning', min_threshold: -30, max_threshold: -15 },
          { id: 4, name: 'Sensor 4 - Kho D', temperature: -17.3, status: 'active', min_threshold: -30, max_threshold: -15 },
        ]);
      } else {
        setSensors(data);
      }
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching sensors:', error);
      // Use mock data on error
      setSensors([
        { id: 1, name: 'Sensor 1 - Kho A', temperature: -18.5, status: 'active', min_threshold: -30, max_threshold: -15 },
        { id: 2, name: 'Sensor 2 - Kho B', temperature: -20.2, status: 'active', min_threshold: -30, max_threshold: -15 },
        { id: 3, name: 'Sensor 3 - Kho C', temperature: -19.8, status: 'warning', min_threshold: -30, max_threshold: -15 },
        { id: 4, name: 'Sensor 4 - Kho D', temperature: -17.3, status: 'active', min_threshold: -30, max_threshold: -15 },
      ]);
    }
  };

  // Fetch alerts từ Supabase
  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Transform data nếu cần
      const transformedData = data ? data.map(alert => ({
        ...alert,
        time: new Date(alert.created_at).toLocaleString('vi-VN'),
        sensor: `Sensor ${alert.sensor_id}`
      })) : [];
      
      setAlertHistory(transformedData);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      // Use mock data on error
      setAlertHistory([
        { id: 1, time: '2025-05-26 10:30', sensor: 'Sensor 3', type: 'high', temperature: -14.5, status: 'unresolved' },
        { id: 2, time: '2025-05-26 09:15', sensor: 'Sensor 1', type: 'low', temperature: -31.2, status: 'resolved' },
      ]);
    }
  };

  // Update sensor temperature
  const updateSensorTemperature = async (sensorId, newTemp) => {
    try {
      const { error } = await supabase
        .from('sensors')
        .update({ temperature: newTemp })
        .eq('id', sensorId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating sensor:', error);
    }
  };

  // Create alert
  const createAlert = async (sensorId, type, temperature) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .insert([
          {
            sensor_id: sensorId,
            type: type,
            temperature: temperature,
            status: 'unresolved'
          }
        ]);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchSensors();
    fetchAlerts();
    setIsLoading(false);

    // Subscribe to realtime changes
    const sensorsSubscription = supabase
      .channel('sensors-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sensors' },
        (payload) => {
          console.log('Sensor change:', payload);
          fetchSensors();
        }
      )
      .subscribe();

    const alertsSubscription = supabase
      .channel('alerts-channel')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        (payload) => {
          console.log('Alert change:', payload);
          fetchAlerts();
        }
      )
      .subscribe();

    // Simulate temperature updates (for demo)
    const interval = setInterval(() => {
      if (sensors.length > 0) {
        sensors.forEach(sensor => {
          const variation = (Math.random() - 0.5) * 0.5;
          const newTemp = Number((sensor.temperature + variation).toFixed(1));
          
          // Check thresholds and create alert if needed
          if (newTemp > sensor.max_threshold || newTemp < sensor.min_threshold) {
            createAlert(
              sensor.id,
              newTemp > sensor.max_threshold ? 'high' : 'low',
              newTemp
            );
          }
          
          updateSensorTemperature(sensor.id, newTemp);
        });
      }
    }, 30000); // Update every 30 seconds

    // Cleanup
    return () => {
      sensorsSubscription.unsubscribe();
      alertsSubscription.unsubscribe();
      clearInterval(interval);
    };
  }, [sensors.length]);

  // Simulate real-time updates cho mock mode
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      setSensors(prevSensors => 
        prevSensors.map(sensor => ({
          ...sensor,
          temperature: Number((sensor.temperature + (Math.random() - 0.5) * 0.5).toFixed(1)),
          status: Math.random() > 0.9 ? 'warning' : 'active'
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchSensors();
    fetchAlerts();
    setChartData(generateMockData());
    setTimeout(() => setIsLoading(false), 1000);
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
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshIcon />
              </button>
              <button
                onClick={() => setSettingsOpen(true)}
                className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
              >
                <SettingsIcon />
              </button>
              <div className="relative">
                <button className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50">
                  <BellIcon />
                </button>
                {alertHistory.filter(a => a.status === 'unresolved').length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {alertHistory.filter(a => a.status === 'unresolved').length}
                  </span>
                )}
              </div>
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
          {sensors.length === 0 ? (
            <div className="col-span-4 text-center py-8 text-gray-500">
              Đang tải dữ liệu cảm biến...
            </div>
          ) : (
            sensors.map(sensor => (
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
            ))
          )}
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
                    <option value="1">Sensor 1</option>
                    <option value="2">Sensor 2</option>
                    <option value="3">Sensor 3</option>
                    <option value="4">Sensor 4</option>
                  </select>
                </div>

                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[-35, -10]} />
                      <Tooltip />
                      <Legend />
                      <ReferenceLine y={-15} stroke="red" strokeDasharray="5 5" label="Ngưỡng cao" />
                      <ReferenceLine y={-30} stroke="blue" strokeDasharray="5 5" label="Ngưỡng thấp" />
                      {(selectedSensor === 'all' || selectedSensor === '1') && (
                        <Line type="monotone" dataKey="sensor1" stroke="#ef4444" name="Sensor 1" strokeWidth={2} />
                      )}
                      {(selectedSensor === 'all' || selectedSensor === '2') && (
                        <Line type="monotone" dataKey="sensor2" stroke="#3b82f6" name="Sensor 2" strokeWidth={2} />
                      )}
                      {(selectedSensor === 'all' || selectedSensor === '3') && (
                        <Line type="monotone" dataKey="sensor3" stroke="#eab308" name="Sensor 3" strokeWidth={2} />
                      )}
                      {(selectedSensor === 'all' || selectedSensor === '4') && (
                        <Line type="monotone" dataKey="sensor4" stroke="#10b981" name="Sensor 4" strokeWidth={2} />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {alertHistory.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                disabled={alert.status === 'resolved'}
                                className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                              >
                                Xác nhận
                              </button>
                            </td>
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
                      <dd className="text-sm font-medium text-gray-900">98.5%</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Số lần vượt ngưỡng (7 ngày)</dt>
                      <dd className="text-sm font-medium text-gray-900">{alertHistory.length} lần</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Nhiệt độ trung bình</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {sensors.length > 0 
                          ? (sensors.reduce((sum, s) => sum + s.temperature, 0) / sensors.length).toFixed(1)
                          : '-18.9'
                        }°C
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Thời gian phản hồi trung bình</dt>
                      <dd className="text-sm font-medium text-gray-900">45 giây</dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Xuất báo cáo</h3>
                  <div className="space-y-4">
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Báo cáo theo giờ</option>
                      <option>Báo cáo theo ngày</option>
                      <option>Báo cáo theo tuần</option>
                      <option>Báo cáo theo tháng</option>
                    </select>
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                      <DownloadIcon />
                      Xuất PDF
                    </button>
                    <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
                      <DownloadIcon />
                      Xuất Excel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Settings Modal */}
        {settingsOpen && (
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
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Gửi cảnh báo qua Email</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={smsNotifications}
                        onChange={(e) => setSmsNotifications(e.target.checked)}
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
                        value={alertDelay}
                        onChange={(e) => setAlertDelay(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  onClick={() => setSettingsOpen(false)}
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

export default ColdStorageDashboard;