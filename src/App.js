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

// Icons components (giữ nguyên như code cũ)
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

const ColdStorageDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sensors, setSensors] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch sensors từ Supabase
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

  // Fetch alerts từ Supabase
  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAlertHistory(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
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
      sensors.forEach(sensor => {
        const variation = (Math.random() - 0.5) * 0.5;
        const newTemp = sensor.temperature + variation;
        
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
    }, 30000); // Update every 30 seconds

    // Cleanup
    return () => {
      sensorsSubscription.unsubscribe();
      alertsSubscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchSensors();
    fetchAlerts();
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

        {/* Tabs Content */}
        <div className="bg-white rounded-lg shadow-sm">
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
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('alerts')}
                className={`py-2 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'alerts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Cảnh báo ({alertHistory.filter(a => a.status === 'unresolved').length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Thông tin hệ thống</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-900">Tổng số cảm biến</h3>
                    <p className="text-2xl font-bold text-blue-600">{sensors.length}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-green-900">Hoạt động bình thường</h3>
                    <p className="text-2xl font-bold text-green-600">
                      {sensors.filter(s => s.status === 'active').length}
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-red-900">Cảnh báo chưa xử lý</h3>
                    <p className="text-2xl font-bold text-red-600">
                      {alertHistory.filter(a => a.status === 'unresolved').length}
                    </p>
                  </div>
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {alertHistory.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                            Không có cảnh báo
                          </td>
                        </tr>
                      ) : (
                        alertHistory.map((alert) => (
                          <tr key={alert.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(alert.created_at).toLocaleString('vi-VN')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              Sensor {alert.sensor_id}
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
                              {alert.temperature?.toFixed(1)}°C
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
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColdStorageDashboard;