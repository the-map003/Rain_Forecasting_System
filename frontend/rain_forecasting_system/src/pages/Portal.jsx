import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../utils/apiPaths';
import mqttDirectService from '../utils/mqttDirectService';
import weatherService from '../utils/weatherService';
import { Activity, CloudOff, CloudRain, Droplets, Thermometer, Wind, LogIn, BarChart2 } from 'lucide-react';

const Portal = () => {
  const navigate = useNavigate();
  const [phoneInput, setPhoneInput] = useState('');
  const [device, setDevice] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [mqttConnected, setMqttConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [activeTab, setActiveTab] = useState('live');
  const [rainAlertActive, setRainAlertActive] = useState(false);
  const [lastAlertAt, setLastAlertAt] = useState(null);

  useEffect(() => {
    mqttDirectService.onConnectionChange((connected) => setMqttConnected(connected));
    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!device?.deviceId) return;
    const deviceId = device.deviceId;
    mqttDirectService.subscribeToDevice(deviceId, (message, _topic, receivedId) => {
      if (receivedId !== deviceId) return;
      const now = new Date().toISOString();
      setLiveData({ ...message, lastUpdate: now, _fromMqtt: true });
    });
    return () => {
      mqttDirectService.unsubscribeFromDevice(deviceId);
    };
  }, [device]);

  const fetchWeather = async () => {
    try {
      const current = await weatherService.getCurrentWeather();
      setWeatherData(current);
      const forecast = await weatherService.getForecast();
      setForecastData(forecast);
    } catch (err) {
      console.error('Weather load error:', err);
    }
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    const cleaned = phoneInput.replace(/\s+/g, '');
    if (!cleaned) {
      toast.error('Please enter a phone number');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/devices/public/by-phone/${encodeURIComponent(cleaned)}`);
      if (res.data?.success && res.data.data) {
        setDevice(res.data.data);
        toast.success('Device found');
        setActiveTab('live');
      } else {
        setDevice(null);
        toast.error('No device registered with that phone number');
      }
    } catch (err) {
      console.error(err);
      setDevice(null);
      const msg = err.response?.data?.message || 'Lookup failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const isOnline = useMemo(() => {
    if (!liveData?.lastUpdate) return false;
    const last = new Date(liveData.lastUpdate);
    return (Date.now() - last.getTime()) / 1000 < 30;
  }, [liveData]);

  // Determine rain alert conditions
  const mqttRainAlert = useMemo(() => {
    if (!liveData) return false;
    const rd = liveData.rain_detected ?? liveData.rainDetected;
    const fr = liveData.forecast_rain ?? liveData.forecastRain;
    return Boolean(rd || fr);
  }, [liveData]);

  const forecastRainAlert = useMemo(() => {
    // Current raining or high probability in near-term forecast
    const currentlyRaining = weatherData ? weatherService.isRaining(weatherData) : false;
    const nearTerm = (forecastData || []).slice(0, 3);
    const highProbSoon = nearTerm.some(p => (p?.rainProbability || 0) >= 60 || (p?.description || '').toLowerCase().includes('rain'));
    return Boolean(currentlyRaining || highProbSoon);
  }, [weatherData, forecastData]);

  // Drive a recurring 15s alert while rain is detected/forecasted
  useEffect(() => {
    const shouldAlert = mqttRainAlert || forecastRainAlert;
    setRainAlertActive(shouldAlert);

    if (!shouldAlert) return;

    // Fire immediately once when condition becomes true
    const now = Date.now();
    const message = mqttRainAlert
      ? 'Rain alert: Device indicates rain is starting/likely.'
      : 'Weather alert: Forecast indicates rain is imminent.';
    if (!lastAlertAt || now - lastAlertAt > 14000) {
      toast(message, { icon: '🌧️' });
      setLastAlertAt(now);
    }

    const id = setInterval(() => {
      toast(message, { icon: '🌧️' });
      setLastAlertAt(Date.now());
    }, 15000);

    return () => clearInterval(id);
  }, [mqttRainAlert, forecastRainAlert]);

  const renderLive = () => (
    <div className="space-y-4">
      {!device ? (
        <div className="text-white/70">Enter your phone number to view your device's live data.</div>
      ) : !liveData ? (
        <div className="text-center py-8 text-white/60">
          <Activity className="h-12 w-12 mx-auto mb-3 text-white/40" />
          <p>No live data yet. Device may be offline.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white/5 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3 text-white/80">
              <Thermometer className="h-5 w-5 text-orange-400" />
              <span>Temperature</span>
            </div>
            <span className="text-white font-semibold">{Number(liveData.temperature).toFixed(1)}°C</span>
          </div>
          <div className="p-4 bg-white/5 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3 text-white/80">
              <Droplets className="h-5 w-5 text-blue-400" />
              <span>Humidity</span>
            </div>
            <span className="text-white font-semibold">{Number(liveData.humidity).toFixed(1)}%</span>
          </div>
          <div className="p-4 bg-white/5 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3 text-white/80">
              <Wind className="h-5 w-5 text-cyan-400" />
              <span>Pressure</span>
            </div>
            <span className="text-white font-semibold">{Number(liveData.pressure).toFixed(1)} hPa</span>
          </div>
          <div className="p-4 bg-white/5 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3 text-white/80">
              <CloudRain className="h-5 w-5 text-purple-400" />
              <span>Rain Sensor</span>
            </div>
            <span className="text-white font-semibold">{liveData.rain_value}</span>
          </div>
        </div>
      )}
      {device && (
        <div className="flex items-center gap-3 text-sm">
          <span className={`px-2 py-1 rounded-full ${isOnline ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
          <span className="text-white/60">MQTT: {mqttConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      )}
    </div>
  );

  const [reports, setReports] = useState({ loading: false, data: null });
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportPage, setReportPage] = useState(1);
  const [reportLimit, setReportLimit] = useState(10); // 10 or 15
  const fetchReports = async () => {
    if (!device?.deviceId) return;
    setReports({ loading: true, data: null });
    try {
      const params = { deviceId: device.deviceId, page: reportPage, limit: reportLimit };
      if (reportStartDate) params.startDate = reportStartDate;
      if (reportEndDate) params.endDate = reportEndDate;
      const res = await axios.get(`${API_BASE_URL}/devices/public/historical-data`, { params });
      setReports({ loading: false, data: res.data?.data || null });
    } catch (err) {
      console.error(err);
      setReports({ loading: false, data: null });
      toast.error('Failed to load reports');
    }
  };

  useEffect(() => {
    if (activeTab === 'reports') fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, device?.deviceId, reportPage, reportLimit]);

  const renderReports = () => (
    <div className="space-y-4">
      {!device ? (
        <div className="text-white/70">Lookup your device first.</div>
      ) : reports.loading ? (
        <div className="flex justify-center py-6"><div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-blue-300 rounded-full"></div></div>
      ) : !reports.data ? (
        <div className="text-white/60">No report data available.</div>
      ) : (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-white/60 mb-1">Start date</label>
              <input type="date" value={reportStartDate} onChange={(e)=>{ setReportStartDate(e.target.value); setReportPage(1); }} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">End date</label>
              <input type="date" value={reportEndDate} onChange={(e)=>{ setReportEndDate(e.target.value); setReportPage(1); }} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Rows per page</label>
              <select value={reportLimit} onChange={(e)=>{ setReportLimit(parseInt(e.target.value)); setReportPage(1); }} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
                <option className="bg-slate-800" value={10}>10</option>
                <option className="bg-slate-800" value={15}>15</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={()=>{ setReportPage(1); fetchReports(); }} className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Apply</button>
            </div>
          </div>

          {/* Inline Chart */}
          <ReportChart records={reports.data.records} />

          {/* Summary and pagination */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white"><BarChart2 className="h-5 w-5" /><span>Records</span></div>
            <div className="text-sm text-white/60">Total: {reports.data.pagination.total}</div>
          </div>

          {/* Table-like cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {reports.data.records.map((r) => (
              <div key={r._id} className="p-3 bg-white/5 rounded border border-white/10 text-sm text-white/80">
                <div className="flex justify-between"><span>{new Date(r.timestamp).toLocaleString()}</span><span>{r.rainDetected ? '🌧️' : r.forecastRain ? '☁️' : '☀️'}</span></div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>T: {r.temperature.toFixed(1)}°C</div>
                  <div>H: {r.humidity.toFixed(1)}%</div>
                  <div>P: {r.pressure.toFixed(1)} hPa</div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination controls */}
          <div className="flex items-center justify-between pt-2">
            <button disabled={reportPage <= 1} onClick={()=> setReportPage(p => Math.max(1, p-1))} className={`px-3 py-2 rounded-lg ${reportPage<=1 ? 'bg-white/10 text-white/40' : 'bg-white/10 hover:bg-white/20 text-white'}`}>Previous</button>
            <div className="text-white/70 text-sm">Page {reports.data.pagination.page} of {reports.data.pagination.pages}</div>
            <button disabled={reports.data.pagination.page >= reports.data.pagination.pages} onClick={()=> setReportPage(p => p+1)} className={`px-3 py-2 rounded-lg ${reports.data.pagination.page >= reports.data.pagination.pages ? 'bg-white/10 text-white/40' : 'bg-white/10 hover:bg-white/20 text-white'}`}>Next</button>
          </div>
        </div>
      )}
    </div>
  );

  const renderWeather = () => (
    <div className="space-y-4">
      {!weatherData ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-300"></div>
        </div>
      ) : (
        <>
          <div className="bg-slate-800 bg-opacity-50 rounded-lg shadow-md p-4 border border-blue-800">
            <h2 className="text-lg font-semibold text-blue-100 mb-4">Current Weather in Kigali, Rwanda</h2>
            <div className="bg-slate-900 bg-opacity-50 rounded-lg p-6 border border-blue-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {weatherData?.icon ? (
                    <img src={weatherService.getWeatherIconUrl(weatherData.icon)} alt="Weather icon" className="w-16 h-16 mr-4" />
                  ) : (
                    <div className="w-16 h-16 mr-4 flex items-center justify-center">
                      <CloudOff className="h-8 w-8 text-blue-300/50" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-2xl font-bold text-blue-100">{weatherData.temperature.toFixed(1)}°C</h3>
                    <p className="text-blue-300 capitalize">{weatherData.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-400">Humidity</p>
                    <p className="text-lg text-blue-200">{weatherData.humidity}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-400">Pressure</p>
                    <p className="text-lg text-blue-200">{weatherData.pressure} hPa</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-400">Wind Speed</p>
                    <p className="text-lg text-blue-200">{weatherData.windSpeed.toFixed(1)} km/h</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-400">Last Updated</p>
                    <p className="text-lg text-blue-200">{new Date(weatherData.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 bg-opacity-50 rounded-lg shadow-md p-4 border border-blue-800">
            <h2 className="text-lg font-semibold text-blue-100 mb-4">Forecast (next periods)</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {forecastData.slice(0, 5).map((d, idx) => (
                <div key={idx} className="text-center p-3 rounded-lg bg-slate-900 bg-opacity-50 border border-blue-900">
                  <p className="font-medium text-blue-200">{new Date(d.timestamp).toLocaleString()}</p>
                  <p className="text-lg font-bold text-blue-100">{Math.round(d.temperature)}°C</p>
                  <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.round(d.rainProbability)}%` }}></div>
                  </div>
                  <p className="text-xs text-blue-400 mt-1">{Math.round(d.rainProbability)}% rain</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Lightweight inline chart component (no extra deps): renders temp line + rain bars
  const ReportChart = ({ records }) => {
    if (!records || records.length === 0) return null;
    // Normalize last up to 30 points (newest first => reverse for time order)
    const points = [...records].slice(0, 30).reverse();
    const temps = points.map(p => p.temperature);
    const minT = Math.min(...temps);
    const maxT = Math.max(...temps);
    const rangeT = Math.max(1, maxT - minT);
    const width = 600;
    const height = 160;
    const padding = 24;
    const innerW = width - padding * 2;
    const innerH = height - padding * 2;
    const stepX = innerW / Math.max(1, points.length - 1);

    const toX = (i) => padding + i * stepX;
    const toY = (t) => padding + innerH - ((t - minT) / rangeT) * innerH;

    const pathD = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.temperature)}`)
      .join(' ');

    return (
      <div className="bg-white/5 rounded-lg p-3 border border-white/10 overflow-x-auto">
        <div className="text-white/80 text-sm mb-2">Temperature trend (last {points.length})</div>
        <svg width={width} height={height}>
          <rect x="0" y="0" width={width} height={height} fill="transparent" />
          {/* Grid */}
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="rgba(255,255,255,0.1)" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.1)" />
          {/* Temp path */}
          <path d={pathD} fill="none" stroke="#60a5fa" strokeWidth="2" />
          {/* Rain bars (show if rainDetected) */}
          {points.map((p, i) => (
            <rect
              key={p._id}
              x={toX(i) - 3}
              width={6}
              y={padding + innerH - (p.rainDetected ? innerH * 0.6 : 0)}
              height={p.rainDetected ? innerH * 0.6 : 0}
              fill={p.rainDetected ? 'rgba(96,165,250,0.5)' : 'transparent'}
            />
          ))}
          {/* Labels */}
          <text x={8} y={padding + 12} fill="#fff" opacity="0.6" fontSize="10">{maxT.toFixed(1)}°C</text>
          <text x={8} y={height - padding} fill="#fff" opacity="0.6" fontSize="10">{minT.toFixed(1)}°C</text>
        </svg>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-100">Rain Forecasting Portal</h1>
            <p className="text-blue-300">Check your device live data, reports, and local weather.</p>
          </div>
          <button onClick={() => navigate('/login')} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <LogIn className="h-4 w-4 mr-2" />
            Login
          </button>
        </div>

        {rainAlertActive && (
          <div className="mb-4 p-4 rounded-lg border border-blue-400/30 bg-blue-900/30 text-blue-200">
            <div className="flex items-center gap-2">
              <span role="img" aria-label="rain">🌧️</span>
              <span>
                {mqttRainAlert
                  ? 'Rain alert: Your device reports rain is starting or likely.'
                  : 'Weather alert: Forecast indicates rain is imminent in your area.'}
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleLookup} className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 mb-6">
          <label className="block text-sm font-medium text-white/90 mb-2">Enter your phone number</label>
          <div className="flex gap-3 flex-col md:flex-row">
            <input
              type="text"
              placeholder="e.g. +250788123456"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
            <button type="submit" disabled={loading} className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-60">
              {loading ? 'Looking up...' : 'Find Device'}
            </button>
          </div>
          {device ? (
            <div className="mt-3 text-sm text-white/70">Device: <span className="font-mono text-white">{device.name}</span> (<span className="font-mono">{device.deviceId}</span>)</div>
          ) : (
            <div className="mt-3 text-sm text-white/50">No device selected.</div>
          )}
        </form>

        <div className="mb-4 flex gap-2">
          <button onClick={() => setActiveTab('live')} className={`px-4 py-2 rounded-lg border ${activeTab==='live' ? 'bg-white/10 border-white/30 text-white' : 'bg-white/5 border-white/10 text-white/70 hover:text-white'}`}>Live Data</button>
          <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 rounded-lg border ${activeTab==='reports' ? 'bg-white/10 border-white/30 text-white' : 'bg-white/5 border-white/10 text-white/70 hover:text-white'}`}>Reports</button>
          <button onClick={() => setActiveTab('weather')} className={`px-4 py-2 rounded-lg border ${activeTab==='weather' ? 'bg-white/10 border-white/30 text-white' : 'bg-white/5 border-white/10 text-white/70 hover:text-white'}`}>Weather</button>
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
          {activeTab === 'live' && renderLive()}
          {activeTab === 'reports' && renderReports()}
          {activeTab === 'weather' && renderWeather()}
        </div>
      </div>
    </div>
  );
};

export default Portal;


