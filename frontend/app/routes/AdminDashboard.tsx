'use client';

import React, { useEffect, useState } from 'react';
import AuthenticatedLayout from '../components/AuthenticatedLayout';
import { useTheme } from '../contexts/themeContext';
import { petsService } from '../api/petsService';
import type {PetStats, DashboardActivity, Pet} from '../api/petsService';

const AdminDashboard = () => {
  const { isDarkMode } = useTheme();
  const [stats, setStats] = useState<PetStats | null>(null);
  const [activity, setActivity] = useState<DashboardActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsData, activityData] = await Promise.all([
          petsService.getDashboardStats(),
          petsService.getDashboardActivity(),
        ]);
        setStats(statsData);
        setActivity(activityData);
        setTimeout(() => setAnimateIn(true), 100);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div 
          className="px-8 pb-8 min-h-screen flex items-center justify-center" 
          style={{ backgroundColor: isDarkMode ? "#36332E" : "#F7F5EA" }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 mx-auto mb-4"
                 style={{ 
                   borderColor: isDarkMode ? "#8B6F47" : "#D4A574",
                   borderTopColor: "transparent"
                 }}></div>
            <p style={{ color: isDarkMode ? "#F7F5EA" : "#6B5B4A" }}>
              Loading your dashboard...
            </p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  const cardBg = isDarkMode ? "#2A2724" : "#FFFFFF";
  const textPrimary = isDarkMode ? "#F5F3ED" : "#8B6F47";
  const textSecondary = isDarkMode ? "#F7F5EA" : "#6B5B4A";
  const accent = isDarkMode ? "#D4A574" : "#8B6F47";
  const chartBg = isDarkMode ? "#36332E" : "#F7F5EA";

  return (
    <AuthenticatedLayout>
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes drawLine {
          from {
            stroke-dashoffset: 1000;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        .animate-slide-up {
          animation: slideInUp 0.6s ease-out forwards;
        }

        .animate-fade {
          animation: fadeIn 0.8s ease-out forwards;
        }

        .animate-scale {
          animation: scaleIn 0.5s ease-out forwards;
        }

        .stat-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, ${accent}, ${isDarkMode ? '#D4A574' : '#B8956A'});
          transform: scaleX(0);
          transition: transform 0.3s ease;
        }

        .stat-card:hover::before {
          transform: scaleX(1);
        }

        .stat-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, ${isDarkMode ? '0.4' : '0.15'});
        }

        .activity-item {
          transition: all 0.3s ease;
        }

        .activity-item:hover {
          transform: translateX(8px);
          background: ${isDarkMode ? 'rgba(212, 165, 116, 0.1)' : 'rgba(139, 111, 71, 0.05)'} !important;
        }

        .chart-bar {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .chart-bar:hover {
          opacity: 0.8;
          transform: scaleY(1.05);
        }

        .progress-ring {
          transition: stroke-dashoffset 1s ease-out;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }

        .pulse {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>

      <div
        className="px-8 pb-8 min-h-screen"
        style={{ backgroundColor: isDarkMode ? "#36332E" : "#F7F5EA" }}
        data-cy="admin-dashboard"
      >
        {/* Header */}
        <div className={`mb-8 pt-8 ${animateIn ? 'animate-fade' : 'opacity-0'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 
                className="text-5xl font-bold mb-2 tracking-tight" 
                style={{ 
                  color: textPrimary,
                  fontFamily: "'Georgia', serif"
                }}
              >
                Dashboard
              </h1>
              <p className="text-lg" style={{ color: textSecondary }}>
                Overview of your shelter's activities
              </p>
            </div>
            <div 
              className="px-6 py-3 rounded-full text-sm font-semibold"
              style={{ 
                backgroundColor: isDarkMode ? 'rgba(212, 165, 116, 0.2)' : 'rgba(139, 111, 71, 0.1)',
                color: accent
              }}
            >
              {stats && `${stats.total} Total Pets`}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Available"
            value={stats?.available || 0}
            total={stats?.total || 1}
            icon="🏠"
            delay="0.1s"
            animateIn={animateIn}
            isDarkMode={isDarkMode}
            color="#10B981"
          />
          <StatCard
            title="Adopted"
            value={stats?.adopted || 0}
            total={stats?.total || 1}
            icon="❤️"
            delay="0.2s"
            animateIn={animateIn}
            isDarkMode={isDarkMode}
            color="#8B5CF6"
          />
          <StatCard
            title="Pending"
            value={stats?.pending || 0}
            total={stats?.total || 1}
            icon="⏳"
            delay="0.3s"
            animateIn={animateIn}
            isDarkMode={isDarkMode}
            color="#F59E0B"
          />
          <StatCard
            title="Total Pets"
            value={stats?.total || 0}
            total={stats?.total || 1}
            icon="🐕"
            delay="0.4s"
            animateIn={animateIn}
            isDarkMode={isDarkMode}
            color="#3B82F6"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Species Distribution */}
          <div 
            className={`p-8 rounded-2xl shadow-lg ${animateIn ? 'animate-scale' : 'opacity-0'}`}
            style={{ 
              backgroundColor: cardBg,
              animationDelay: '0.5s'
            }}
          >
            <h2 
              className="text-2xl font-bold mb-6" 
              style={{ color: textPrimary, fontFamily: "'Georgia', serif" }}
            >
              Species Distribution
            </h2>
            <BarChart 
              data={stats?.by_species || []} 
              isDarkMode={isDarkMode}
              accent={accent}
              chartBg={chartBg}
            />
          </div>

          {/* Gender Distribution */}
          <div 
            className={`p-8 rounded-2xl shadow-lg ${animateIn ? 'animate-scale' : 'opacity-0'}`}
            style={{ 
              backgroundColor: cardBg,
              animationDelay: '0.6s'
            }}
          >
            <h2 
              className="text-2xl font-bold mb-6" 
              style={{ color: textPrimary, fontFamily: "'Georgia', serif" }}
            >
              Gender Distribution
            </h2>
            <VerticalBarChart 
              data={stats?.by_gender || []} 
              isDarkMode={isDarkMode}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              chartBg={chartBg}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Additions */}
          <div 
            className={`p-8 rounded-2xl shadow-lg ${animateIn ? 'animate-slide-up' : 'opacity-0'}`}
            style={{ 
              backgroundColor: cardBg,
              animationDelay: '0.7s'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 
                className="text-2xl font-bold" 
                style={{ color: textPrimary, fontFamily: "'Georgia', serif" }}
              >
                Recent Additions
              </h2>
              <img src="/added.png" alt="added" className="w-10 h-10 object-contain" />
            </div>
            <div className="space-y-3">
              {activity?.recent_additions.length === 0 ? (
                <p style={{ color: textSecondary }}>No recent additions</p>
              ) : (
                activity?.recent_additions.map((pet, index) => (
                  <ActivityItem 
                    key={pet.id} 
                    pet={pet} 
                    index={index}
                    isDarkMode={isDarkMode}
                    chartBg={chartBg}
                    textPrimary={textPrimary}
                    textSecondary={textSecondary}
                  />
                ))
              )}
            </div>
          </div>

          {/* Recent Adoptions */}
          <div 
            className={`p-8 rounded-2xl shadow-lg ${animateIn ? 'animate-slide-up' : 'opacity-0'}`}
            style={{ 
              backgroundColor: cardBg,
              animationDelay: '0.8s'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 
                className="text-2xl font-bold" 
                style={{ color: textPrimary, fontFamily: "'Georgia', serif" }}
              >
                Recent Adoptions
              </h2>
              <img src="/adopted.png" alt="adopted" className="w-10 h-10 object-contain" />
            </div>
            <div className="space-y-3">
              {activity?.recent_adoptions.length === 0 ? (
                <p style={{ color: textSecondary }}>No recent adoptions</p>
              ) : (
                activity?.recent_adoptions.map((pet, index) => (
                  <ActivityItem 
                    key={pet.id} 
                    pet={pet} 
                    index={index}
                    isDarkMode={isDarkMode}
                    chartBg={chartBg}
                    textPrimary={textPrimary}
                    textSecondary={textSecondary}
                    isAdopted
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

// Stat Card Component with Progress Ring
const StatCard = ({
  title,
  value,
  total,
  icon,
  delay,
  animateIn,
  isDarkMode,
  color
}: {
  title: string;
  value: number;
  total: number;
  icon: string;
  delay: string;
  animateIn: boolean;
  isDarkMode: boolean;
  color: string;
}) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const dataCy = `stat-${title.toLowerCase().replace(' ', '-')}`;

  return (
    <div
      className={`stat-card p-6 rounded-2xl shadow-lg ${animateIn ? 'animate-scale' : 'opacity-0'}`}
      style={{
        backgroundColor: isDarkMode ? "#2A2724" : "#FFFFFF",
        animationDelay: delay
      }}
      data-cy={dataCy}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-4xl">{icon}</span>
        <svg width="80" height="80" className="transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke={isDarkMode ? "rgba(139, 111, 71, 0.2)" : "rgba(212, 165, 116, 0.2)"}
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={animateIn ? strokeDashoffset : circumference}
            strokeLinecap="round"
            className="progress-ring"
          />
        </svg>
      </div>
      <h3
        className="text-sm font-semibold mb-2 uppercase tracking-wide"
        style={{ color: isDarkMode ? "#F7F5EA" : "#6B5B4A" }}
      >
        {title}
      </h3>
      <p
        className="text-4xl font-bold"
        style={{ color: isDarkMode ? "#F5F3ED" : "#8B6F47" }}
      >
        {value}
      </p>
      <p
        className="text-sm mt-2"
        style={{ color: isDarkMode ? "#F7F5EA" : "#6B5B4A" }}
      >
        {percentage.toFixed(0)}% of total
      </p>
    </div>
  );
};

// Bar Chart Component
const BarChart = ({ 
  data, 
  isDarkMode, 
  accent, 
  chartBg 
}: { 
  data: Array<{ species: string; count: number }>; 
  isDarkMode: boolean;
  accent: string;
  chartBg: string;
}) => {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  const colors = [
    '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'
  ];

  return (
    <div className="space-y-4">
      {data.length === 0 ? (
        <p style={{ color: isDarkMode ? "#F7F5EA" : "#6B5B4A" }}>No data available</p>
      ) : (
        data.map((item, index) => (
          <div key={item.species || `species-${index}`}>
            <div className="flex justify-between items-center mb-2">
              <span 
                className="text-sm font-medium capitalize"
                style={{ color: isDarkMode ? "#F5F3ED" : "#8B6F47" }}
              >
                {item.species || 'Unknown'}
              </span>
              <span 
                className="text-sm font-bold"
                style={{ color: accent }}
              >
                {item.count}
              </span>
            </div>
            <div 
              className="w-full h-3 rounded-full overflow-hidden"
              style={{ backgroundColor: chartBg }}
            >
              <div 
                className="chart-bar h-full rounded-full"
                style={{ 
                  width: `${(item.count / maxCount) * 100}%`,
                  backgroundColor: colors[index % colors.length],
                  transformOrigin: 'left'
                }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// Donut Chart Component
const DonutChart = ({ 
  data, 
  isDarkMode, 
  textPrimary, 
  textSecondary 
}: { 
  data: Array<{ gender: string; count: number }>; 
  isDarkMode: boolean;
  textPrimary: string;
  textSecondary: string;
}) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  
  if (total === 0 || data.length === 0) {
    return <p style={{ color: textSecondary }}>No data available</p>;
  }

  const colors = {
    male: '#3B82F6',
    female: '#EC4899'
  };

  const radius = 70;
  const centerX = 100;
  const centerY = 100;
  const circumference = 2 * Math.PI * radius;
  
  let currentAngle = -90;
  
  return (
    <div className="flex items-center justify-center gap-8">
      <svg width="200" height="200" viewBox="0 0 200 200">
        {data.map((item, index) => {
          const percentage = (item.count / total) * 100;
          const segmentLength = (percentage / 100) * circumference;
          const rotation = currentAngle;
          currentAngle += (percentage / 100) * 360;
          
          return (
            <circle
              key={item.gender}
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke={colors[item.gender as keyof typeof colors] || '#9CA3AF'}
              strokeWidth="20"
              strokeDasharray={`${segmentLength} ${circumference}`}
              transform={`rotate(${rotation} ${centerX} ${centerY})`}
              style={{
                transition: 'all 0.6s ease-out',
                transformOrigin: 'center'
              }}
            />
          );
        })}
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ 
            fontSize: '32px', 
            fontWeight: 'bold',
            fill: textPrimary
          }}
        >
          {total}
        </text>
        <text
          x={centerX}
          y={centerY + 25}
          textAnchor="middle"
          style={{ 
            fontSize: '14px',
            fill: textSecondary
          }}
        >
          Total
        </text>
      </svg>
      
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.gender} className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: colors[item.gender as keyof typeof colors] || '#9CA3AF' }}
            />
            <div>
              <p 
                className="text-sm font-semibold capitalize"
                style={{ color: textPrimary }}
              >
                {item.gender}
              </p>
              <p 
                className="text-xs"
                style={{ color: textSecondary }}
              >
                {item.count} ({((item.count / total) * 100).toFixed(0)}%)
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const VerticalBarChart = ({ 
  data, 
  isDarkMode, 
  textPrimary,
  textSecondary,
  chartBg
}: { 
  data: Array<{ gender: string; count: number }>; 
  isDarkMode: boolean;
  textPrimary: string;
  textSecondary: string;
  chartBg: string;
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  const colors: Record<string, string> = {
    male: '#3B82F6',
    female: '#EC4899'
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Legend */}
      <div className="flex justify-center gap-8">
        {data.map((item) => (
          <div key={item.gender} className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: colors[item.gender] || '#9CA3AF' }}
            />
            <div>
              <p 
                className="text-sm font-semibold capitalize"
                style={{ color: textPrimary }}
              >
                {item.gender}
              </p>
              <p 
                className="text-xs"
                style={{ color: textSecondary }}
              >
                {item.count} pets
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="h-48 flex items-end justify-center gap-16 px-8">
        {data.length === 0 ? (
          <p style={{ color: textSecondary }}>No data available</p>
        ) : (
          data.map((item, index) => {
            const heightPercentage = (item.count / maxCount) * 100;
            
            return (
              <div 
                key={item.gender}
                className="flex flex-col items-center gap-2"
                style={{ width: '140px' }}
              >
                {/* Tooltip */}
                <div 
                  className="transition-all duration-300"
                  style={{
                    opacity: hoveredIndex === index ? 1 : 0,
                    transform: hoveredIndex === index ? 'translateY(0)' : 'translateY(10px)',
                    marginBottom: '4px'
                  }}
                >
                  <div 
                    className="px-4 py-3 rounded-lg shadow-lg"
                    style={{ 
                      backgroundColor: isDarkMode ? '#2A2724' : '#FFFFFF',
                      border: `2px solid ${colors[item.gender] || '#9CA3AF'}`
                    }}
                  >
                    <p 
                      className="text-3xl font-bold text-center"
                      style={{ color: colors[item.gender] || '#9CA3AF' }}
                    >
                      {item.count}
                    </p>
                    <p 
                      className="text-xs text-center capitalize mt-1"
                      style={{ color: textSecondary }}
                    >
                      {item.gender} pets
                    </p>
                  </div>
                </div>

                {/* Bar */}
                <div 
                  className="w-full rounded-t-xl cursor-pointer transition-all duration-500 relative"
                  style={{ 
                    height: `${Math.max(heightPercentage, 15)}%`,
                    backgroundColor: colors[item.gender] || '#9CA3AF',
                    minHeight: '60px',
                    transform: hoveredIndex === index ? 'scaleY(1.05)' : 'scaleY(1)',
                    transformOrigin: 'bottom',
                    boxShadow: hoveredIndex === index 
                      ? `0 -8px 30px ${colors[item.gender]}50` 
                      : 'none'
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Shimmer effect on hover */}
                  {hoveredIndex === index && (
                    <div 
                      className="absolute inset-0 rounded-t-xl"
                      style={{
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)'
                      }}
                    />
                  )}
                </div>

                {/* Label */}
                <p 
                  className="text-base font-semibold tracking-wide capitalize"
                  style={{ 
                    color: hoveredIndex === index ? colors[item.gender] : textPrimary,
                    transition: 'color 0.3s ease'
                  }}
                >
                  {item.gender}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
// Activity Item Component
const ActivityItem = ({ 
  pet, 
  index, 
  isDarkMode, 
  chartBg, 
  textPrimary, 
  textSecondary,
  isAdopted = false
}: { 
  pet: Pet; 
  index: number; 
  isDarkMode: boolean;
  chartBg: string;
  textPrimary: string;
  textSecondary: string;
  isAdopted?: boolean;
}) => (
  <div 
    className="activity-item flex items-center gap-4 p-4 rounded-xl"
    style={{ 
      backgroundColor: chartBg,
      animationDelay: `${index * 0.1}s`
    }}
  >
    <div className="relative">
      {pet.profile_picture ? (
        <img 
          src={pet.profile_picture} 
          alt={pet.name}
          className="w-16 h-16 rounded-full object-cover"
          style={{ 
            border: `3px solid ${isAdopted ? '#8B5CF6' : '#10B981'}`
          }}
        />
      ) : (
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
          style={{ 
            backgroundColor: isDarkMode ? "#36332E" : "#F7F5EA",
            border: `3px solid ${isAdopted ? '#8B5CF6' : '#10B981'}`
          }}
        >
          🐾
        </div>
      )}
      <div 
        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs"
        style={{ 
          backgroundColor: isAdopted ? '#8B5CF6' : '#10B981',
          color: 'white'
        }}
      >
        {isAdopted ? '✓' : '★'}
      </div>
    </div>
    <div className="flex-1">
      <p 
        className="font-bold text-lg"
        style={{ color: textPrimary }}
      >
        {pet.name}
      </p>
      <p 
        className="text-sm"
        style={{ color: textSecondary }}
      >
        {pet.species} • {pet.age ? `${pet.age} years` : 'Age unknown'} • {pet.gender}
      </p>
    </div>
    {isAdopted && (
      <span className="text-2xl pulse">🎉</span>
    )}
  </div>
);

export default AdminDashboard;