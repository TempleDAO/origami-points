import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/react"
import _ from 'lodash';
import DateRange from '@/components/ui/date-range';
import { useQuery } from '@tanstack/react-query';
import { Slider } from "@/components/ui/slider";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter, ZAxis, Bar, BarChart} from 'recharts';

const VAULT_NAMES = {
  "0xE567DCf433F97d787dF2359bDBF95dFd2B7aBF4E": "lov-sUSDe-b",
  "0xb9dad3693AEAc9025Cb24a47AFA6930539877187": "lov-PT-sUSDe-Oct2024-a",
  "0x235e2afeAA56497436987E87bb475D04BEFC1394": "lov-wETH-DAI-long-a",
  "0x7FC862A47BBCDe3812CA772Ae851d0A9D1619eDa": "lov-sUSDe-a",
  "0xdE6d401E4B651F313edB7da0A11e072EEf4Ce7BE": "lov-sDAI-a",
  "0x9C1F7237480c030Cb14375Ff6b650606248A5247": "lov-weETH-a",
  "0xBd46AbF8999E979C4Ec507E8bE06b5D4402A0205": "lov-PT-USD0++-Mar2025-a",
  "0x71520ce2DB377AFa999bc6fdc1af896B21b2F26a": "lov-rswETH-a",
  "0x9fA6D162E32A08B323ADEaE2560F0E44D6dBE53c": "lov-USDe-b",
  "0xC03C434D8430d27bb16f07658be4352BeAD17eA5": "lov-wstETH-b",
  "0xcA92bccEB7349347bB14bd5748820659e198c632": "lov-PT-cornLBTC-Dec2024-a",
  "0x26DF9465964C2cEF869281c09a10F7Dd7b1321a7": "lov-AAVE-USDC-long-a",
  "0x117b36e79aDadD8ea81fbc53Bfc9CD33270d845D": "lov-wstETH-a",
  "0xCaB062047F8b3e2CecB27206d8399899eC4ad2eB": "lov-PT-eBTC-Dec2024-a",
  "0x78F3108a8dDf0faaE25862d4008DE3adF129A8e6": "lov-USD0++-a",
  "0xDb4f1Bb3f8c9929aaFbe7197e10ffaFEEAe19B9A": "lov-PT-sUSDe-Mar2025-a",
  "0xD71Df8f4aa216A21Fa4994167adB65d866cE9B7f": "lov-PT-LBTC-Mar2025-a",
  "0x0f90a6962e86b5587b4c11bA2B9697dC3bA84800": "sUSDS + Sky Farms",
  "0xC65a88A7b7752873a3106BD864BBCd717e35d2e5": "lov-USDe-a",
  "0xC242487172641eEf13626C2c426CB3d41BebC6DE": "lov-woETH-a",
  "0x5Ca7539f4a3D0E5006523C1380898898457E927f": "lov-WETH-CBBTC-long-a",
  "0xC3979edD2bC308D536964b9515161C8551D0aE3a": "lov-wETH-sDAI-short-a"
};

const gradients = [
  'linear-gradient(to right, #FF8066, #FF5252)', // lovPendle
  'linear-gradient(to right, #FF4D4D, #FF66FF)', // lovEthena
  'linear-gradient(to right, #66FF80, #FFE566)', // lovStables
  'linear-gradient(to right, #B366FF, #6680FF)', // lovETH
  'linear-gradient(to right, #4D80FF, #66FFFF)', // lovBTC
  'linear-gradient(to right, #66FFB3, #66FF80)'  // lovTendies
];

const getRandomGradient = () => {
  return gradients[Math.floor(Math.random() * gradients.length)];
};

const POINTS_ALLOCATIONS_BLOB_URL = 'https://5qlianxz5pithtal.public.blob.vercel-storage.com/points-allocations.json';

const OrigamiPoints = () => {
  const TEMPLE_ADDRESSES = [
    "0x0591926d5d3b9Cc48ae6eFB8Db68025ddc3adFA5".toLowerCase(),
    "0x6feb7be522DB641A5C0f246924D8a92cF3218692".toLowerCase()
  ];

  const ORIGAMI_ADDRESSES = [
    "0x781B4c57100738095222bd92D37B07ed034AB696".toLowerCase()
  ];

  const getPeriodPoints = (data, pointsId) => {
    return _.sumBy(data.filter(item => item.points_id === pointsId), 'allocation');
  };

  const calculatePoints = (data) => {
    const filteredData = data.filter(item => {
      const addressLower = item.holder_address.toLowerCase();
      if (hideTempleAddresses && TEMPLE_ADDRESSES.includes(addressLower)) return false;
      if (hideOrigamiAddresses && ORIGAMI_ADDRESSES.includes(addressLower)) return false;
      return true;
    });
  
    const yesterday = getLastTimestamp(allPoints);
    const yesterdayPoints = _.sumBy(
      filteredData.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate >= yesterday && itemDate < new Date();
      }),
      'allocation'
    );
  
    const s1Points = getPeriodPoints(filteredData, ORI_S1);
    const s2Points = getPeriodPoints(filteredData, ORI_S2);
    const totalPoints = s1Points + s2Points;
  
    return { yesterday, yesterdayPoints, s1Points, s2Points, totalPoints };
  };

  const [sliderValue, setSliderValue] = useState([0, 100]);
  const [dateRange, setDateRange] = useState([null, null]);
  const [address, setAddress] = useState('');
  const [selectedVault, setSelectedVault] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('last7');
  const [expandedAddresses, setExpandedAddresses] = useState(new Set());
  const [hideTempleAddresses, setHideTempleAddresses] = useState(false);
  const [hideOrigamiAddresses, setHideOrigamiAddresses] = useState(false);
  const [activeTab, setActiveTab] = useState('leaderboard');

  const {
    data: allPoints = [], // Default to empty array
    isLoading,
    error
  } = useQuery({
    queryKey: ['points-data'],
    queryFn: async () => {
      const response = await fetch(POINTS_ALLOCATIONS_BLOB_URL, {
        headers: {
          "Accept": "application/json",
          "Accept-Encoding": "gzip",
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch points data');
      }
      const jv = await response.json()
      return jv.filter(
        item => [ORI_S1,ORI_S2].includes(item.points_id)
      );
    }
  });
  
  const {
    uniqueVaults,
    totalPoints,
    yesterday,
    yesterdayPoints,
    s1Points,
    s2Points
  } = useMemo(() => {
    const vaults = _.uniq(allPoints.map(item => item.token_address));
    const points = calculatePoints(allPoints);
    
    return {
      uniqueVaults: vaults,
      totalPoints: points.totalPoints,
      yesterday: points.yesterday,
      yesterdayPoints: points.yesterdayPoints,
      s1Points: points.s1Points,
      s2Points: points.s2Points
    };
  }, [allPoints, hideTempleAddresses, hideOrigamiAddresses]);

  const activeAddressCounts = useMemo(() => {
    const allAddresses = _.uniq(allPoints.map(item => item.holder_address));
    const activeAddresses = _.uniq(
      allPoints.filter(item => {
        const lastUpdate = new Date(item.timestamp);
        return lastUpdate.toDateString() === yesterday.toDateString();
      }).map(item => item.holder_address)
    );
    
    return {
      active: activeAddresses.length,
      total: allAddresses.length
    };
  }, [allPoints]);

  const aggregatedData = useMemo(() => {
    const today = new Date().toDateString();

    function matchVault(item) {
      return selectedVault === 'all' || item.token_address === selectedVault;
    }

    function matchTimeRange(item) {
      if (selectedTimeRange === 'all' || yesterday === undefined) {
        return true;
      }
      if (selectedTimeRange === 'last7') {
        return new Date(item.timestamp) >= new Date(yesterday.getTime() - 7 * 1000 * 3600 * 24);
      }
      if (selectedTimeRange === 'last30') {
        return new Date(item.timestamp) >= new Date(yesterday.getTime() - 30 * 1000 * 3600 * 24);
      }
      return false;
    }

    const filteredData = allPoints
      .filter(matchVault)
      .filter(matchTimeRange)
      ;

    const aggregatedData = _(filteredData)
      .groupBy('holder_address')
      .map((items, address) => {
        const vaults = _(items)
          .groupBy('token_address')
          .map((vaultItems, vault) => {
            const lastUpdate = _.maxBy(vaultItems, 'timestamp').timestamp;
            return {
              vault,
              points: _.sumBy(vaultItems, 'allocation'),
              lastUpdate,
              isActiveToday: new Date(lastUpdate).toDateString() === today
            };
          })
          .value();
  
        return {
          address,
          totalPoints: _.sumBy(items, 'allocation'),
          vaults,
          vaultCount: vaults.length,
          isActiveToday: vaults.some(v => v.isActiveToday)
        };
      })
      .orderBy(['totalPoints'], ['desc'])
      .value();

      aggregatedData.sort( (i1,i2) => i2.totalPoints - i1.totalPoints );
      return aggregatedData.map( (item,i) => ({...item, rank: i+1}) );
  }, [allPoints, selectedVault, selectedTimeRange, hideTempleAddresses, hideOrigamiAddresses]);

  const memoizedHelpers = useMemo(() => ({
    getVaultPerformanceData: () => {
      const vaultStats = _(allPoints)
        .groupBy('token_address')
        .map((items, vault) => ({
          vault: getVaultName(vault),
          totalPoints: _.sumBy(items, 'allocation')
        }))
        .orderBy(['totalPoints'], ['desc'])
        .value();
      return vaultStats;
    },

    getUserLifetimeStats: (userAddress) => {
      if (!userAddress) return null;
      
      const userPoints = allPoints.filter(item => 
        item.holder_address.toLowerCase() === userAddress.toLowerCase()
      );

      if (userPoints.length === 0) return null;

      const s1Points = _.sumBy(
        userPoints.filter(item => item.points_id === ORI_S1),
        'allocation'
      );
      const s2Points = _.sumBy(
        userPoints.filter(item => item.points_id === ORI_S2),
        'allocation'
      );

      const uniqueVaults = _.uniqBy(userPoints, 'token_address');
      
      const vaultPoints = _(userPoints)
        .groupBy('token_address')
        .map((items, vault) => ({
          vault: getVaultName(vault),
          points: _.sumBy(items, 'allocation')
        }))
        .orderBy(['points'], ['desc'])
        .value();
      
      const yesterday = getLastTimestamp(allPoints);

      const yesterdayPoints = _.sumBy(
          userPoints.filter(item => {
            const itemDate = new Date(item.timestamp);
            return itemDate.toDateString() === yesterday.toDateString();
          }),
          'allocation'
        );

        // Calculate tomorrow's expected rank
      const currentTotals = _(allPoints)
          .groupBy('holder_address')
          .mapValues(items => _.sumBy(items, 'allocation'))
          .value();

      const yesterdayPointsByAddress = _(allPoints)
          .filter(item => {
            const itemDate = new Date(item.timestamp);
            return itemDate.toDateString() === yesterday.toDateString();
          })
          .groupBy('holder_address')
          .mapValues(items => _.sumBy(items, 'allocation'))
          .value();

      const tomorrowTotals = {};
        for (const [address, total] of Object.entries(currentTotals)) {
          tomorrowTotals[address] = total + (yesterdayPointsByAddress[address] || 0);
        }

      const sortedTomorrowRanks = _(tomorrowTotals)
          .map((total, address) => ({ address, total }))
          .orderBy(['total'], ['desc'])
          .value();

      const tomorrowRank = sortedTomorrowRanks.findIndex(item => 
          item.address.toLowerCase() === userAddress.toLowerCase()
        ) + 1;


      const pointsByDay = _(userPoints)
        .groupBy(item => new Date(item.timestamp).toISOString().split('T')[0])
        .mapValues(items => _.sumBy(items, 'allocation'))
        .value();

      const dates = Object.keys(pointsByDay).sort();
      let maxStreak = 0;
      let currentStreak = 0;

      for (let i = 0; i < dates.length; i++) {
        const currentDate = new Date(dates[i]);
        const nextDate = i < dates.length - 1 ? new Date(dates[i + 1]) : null;
        
        if (nextDate && (nextDate - currentDate) / (1000 * 60 * 60 * 24) === 1) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      }

      return {
        totalPoints: _.sumBy(userPoints, 'allocation'),
        s1Points,
        s2Points,
        longestStreak: maxStreak + 1,
        uniqueVaultCount: uniqueVaults.length,
        topVault: vaultPoints[0],
        yesterdayPoints,
        tomorrowRank
      };
    }
  }), [allPoints]); // Only recalculate when allPoints changes
  

  const analyticsData = React.useMemo(() => {
    return _(allPoints)
      .groupBy(item => new Date(item.timestamp).toISOString().split('T')[0])
      .map((items, date) => ({
        date,
        activeAddresses: _.uniq(items.map(i => i.holder_address)).length,
        totalPoints: _.sumBy(items, 'allocation')
      }))
      .sortBy('date')
      .value();
  }, [allPoints]);

  const filteredData = React.useMemo(() => {
    if (!dateRange[0] || !dateRange[1]) return analyticsData;
    return analyticsData.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= dateRange[0] && itemDate <= dateRange[1];
    });
  }, [analyticsData, dateRange]);

  const toggleAddressExpansion = (address) => {
    const newExpanded = new Set(expandedAddresses);
    if (newExpanded.has(address)) {
      newExpanded.delete(address);
    } else {
      newExpanded.add(address);
    }
    setExpandedAddresses(newExpanded);
  };

  const getWhaleAnalysisData = () => {
    return aggregatedData.map(item => ({
      vaultCount: item.vaultCount,
      totalPoints: item.totalPoints,
      address: item.address
    }));
  };

  const formatAddress = (address, clickable = true) => {
    if (!address) return '';
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    if (!clickable) return shortAddress;
    
    return (
      <a 
        href={`https://debank.com/profile/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {shortAddress}
      </a>
    );
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2
    }).format(num);
  };

  const getVaultName = (address) => {
    return VAULT_NAMES[address] || formatAddress(address, false);
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(to right, #f0faf9, #f5f9fc)" }}>
      <Analytics />
      <SpeedInsights/>
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header with Logo */}
        <div className="flex flex-col items-center mb-8 pt-8">
          <div className="w-full max-w-md mb-4">
            <img 
              src="https://i.ibb.co/7G5mtQZ/IMG-3747.png" 
              alt="Origami Logo" 
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* Stats Box */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-[0.5px] rounded-[24px] max-w-[300px] w-full mx-auto" style={{ background: 'linear-gradient(to right, #FF8066, #FF5252)' }}>
              <div className="bg-white py-4 px-3 rounded-[24px] h-full flex flex-col justify-center items-center">
                <p className="text-xl font-semibold">{formatNumber(totalPoints)}</p>
                <p className="text-sm text-gray-500">Total Points</p>
              </div>
            </div>
            
            <div className="p-[0.5px] rounded-[24px] max-w-[300px] w-full mx-auto" style={{ background: 'linear-gradient(to right, #FF4D4D, #FF66FF)' }}>
              <div className="bg-white py-4 px-3 rounded-[24px] h-full flex flex-col justify-center items-center">
                <p className="text-lg font-semibold">{formatNumber(yesterdayPoints)}</p>
                <p className="text-sm text-gray-500">Last Points Allocation</p>
              </div>
            </div>

            <div className="p-[0.5px] rounded-[24px] max-w-[300px] w-full mx-auto" style={{ background: 'linear-gradient(to right, #66FF80, #FFE566)' }}>
              <div className="bg-white py-4 px-3 rounded-[24px] h-full flex flex-col justify-center items-center">
                <p className="text-lg font-semibold">{formatNumber(s1Points)}</p>
                <p className="text-sm text-gray-500">S1 Points</p>
              </div>
            </div>

            <div className="p-[0.5px] rounded-[24px] max-w-[300px] w-full mx-auto" style={{ background: 'linear-gradient(to right, #B366FF, #6680FF)' }}>
              <div className="bg-white py-4 px-3 rounded-[24px] h-full flex flex-col justify-center items-center">
                <p className="text-lg font-semibold">{formatNumber(s2Points)}</p>
                <p className="text-sm text-gray-500">S2 Points</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        {/*
            only show leaderboard
        <div className="mb-6">
          <div className="p-[1px] rounded-[28px] bg-gradient-to-r from-blue-400 to-purple-400">
            <div className="bg-white rounded-[28px] p-1">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className={`flex-1 px-4 py-2 rounded-[24px] text-sm font-medium transition-colors
                    ${activeTab === 'leaderboard' 
                      ? 'bg-gradient-to-r from-blue-400 to-purple-400 text-white' 
                      : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  Leaderboard
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`flex-1 px-4 py-2 rounded-[24px] text-sm font-medium transition-colors
                    ${activeTab === 'analytics' 
                      ? 'bg-gradient-to-r from-blue-400 to-purple-400 text-white' 
                      : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
        */}

        {/* Search and Filter Controls */}
        {activeTab === 'leaderboard' && (
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-[1px] rounded-[28px]" style={{ background: 'linear-gradient(to right, #66FFB3, #66FF80)' }}>
                <div className="bg-white rounded-[28px]">
                  <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                    <SelectTrigger className="w-full border-none focus:ring-0 rounded-[28px] px-4 py-3">
                      <SelectValue placeholder="Last 7 days" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last7">Last 7 days</SelectItem>
                      <SelectItem value="last30">Last 30 days</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-[1px] rounded-[28px]" style={{ background: 'linear-gradient(to right, #66FFB3, #66FF80)' }}>
                <div className="bg-white rounded-[28px]">
                  <Select value={selectedVault} onValueChange={setSelectedVault}>
                    <SelectTrigger className="w-full border-none focus:ring-0 rounded-[28px] px-4 py-3">
                      <SelectValue placeholder="All Vaults" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vaults</SelectItem>
                      {uniqueVaults.map((vault) => (
                        <SelectItem key={vault} value={vault}>
                          {getVaultName(vault)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-[1px] rounded-[28px]" style={{ background: 'linear-gradient(to right, #4D80FF, #66FFFF)' }}>
                <div className="bg-white rounded-[28px]">
                  <Input
                    placeholder="Search address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full border-none focus:ring-0 rounded-[28px] px-4 py-3"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legend & Filters */}
        {activeTab === 'leaderboard' && (
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <img 
                src="https://origami.finance/light/boosted-yields.svg" 
                alt="Active today"
                className="w-4 h-4"
              />
              <span>{activeAddressCounts.active}/{activeAddressCounts.total} addresses received points on last allocation date {yesterday ? "(" + yesterday.toISOString().substring(0,10) + ")" : ""}</span>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch 
                  checked={hideTempleAddresses}
                  onCheckedChange={setHideTempleAddresses}
                />
                <span className="text-gray-500 text-sm">Hide Temple addresses</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch 
                  checked={hideOrigamiAddresses}
                  onCheckedChange={setHideOrigamiAddresses}
                />
                <span className="text-gray-500 text-sm">Hide Origami fee address</span>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Lifetime Stats */}
            <Card className="hover:shadow-md transition-shadow p-[1px] overflow-hidden rounded-[28px]" 
                  style={{ 
                    padding: '1.5px',
                    borderRadius: '32px',
                    background: getRandomGradient(),
                    isolation: 'isolate',
                    overflow: 'hidden'                  
                  }}>
              <div className="bg-white p-6 rounded-[27px]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">Lifetime Stats</h3>
                  <div className="w-1/3">
                    <Input
                      placeholder="Search address stats..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full border rounded-[28px] px-4 py-2"
                    />
                  </div>
                </div>

                {!address ? (
                  // Default view - Global stats
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500">Total Points Distributed</p>
                      <p className="text-xl font-semibold">{formatNumber(totalPoints)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500">Active Addresses</p>
                      <p className="text-xl font-semibold">{activeAddressCounts.active}/{activeAddressCounts.total}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500">Total Vaults</p>
                      <p className="text-xl font-semibold">{uniqueVaults.length}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500">Season 1 Points</p>
                      <p className="text-xl font-semibold">{formatNumber(s1Points)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500">Season 2 Points</p>
                      <p className="text-xl font-semibold">{formatNumber(s2Points)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500">Yesterday's Points</p>
                      <p className="text-xl font-semibold">{formatNumber(yesterdayPoints)}</p>
                    </div>
                  </div>
                ) : (
                  // Address-specific stats view
                  (() => {
                    const stats = memoizedHelpers.getUserLifetimeStats(address);
                    if (!stats) return <p className="text-gray-500">No data found for this address</p>;
                    
                    // Find rank and next rank details
                    const currentRank = aggregatedData.findIndex(item => 
                      item.address.toLowerCase() === address.toLowerCase()
                    ) + 1;
                    
                    let pointsToNextRank = 0;
                    if (currentRank > 1) {
                      const nextRankPoints = aggregatedData[currentRank - 2]?.totalPoints || 0;
                      pointsToNextRank = Math.max(0, nextRankPoints - stats.totalPoints);
                    }

                    return (
                      <>
                        <div className="mb-4 text-gray-600">
                          <span className="font-medium">#{currentRank} Rank</span>
                          {pointsToNextRank > 0 && (
                            <span className="ml-2">| +{formatNumber(pointsToNextRank)} points until next rank</span>
                          )}
                          {stats.tomorrowRank && (
                            <span className="ml-2">| Expected Rank Tomorrow #{stats.tomorrowRank} 
                              {stats.tomorrowRank < currentRank ? 
                                ` (↑${currentRank - stats.tomorrowRank})` : 
                                stats.tomorrowRank > currentRank ? 
                                  ` (↓${stats.tomorrowRank - currentRank})` : 
                                  ' (=)'
                              }
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-sm text-gray-500">Total Points</p>
                            <p className="text-xl font-semibold">{formatNumber(stats.totalPoints)}</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-sm text-gray-500">Season 1 Points</p>
                            <p className="text-xl font-semibold">{formatNumber(stats.s1Points)}</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-sm text-gray-500">Season 2 Points</p>
                            <p className="text-xl font-semibold">{formatNumber(stats.s2Points)}</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-sm text-gray-500">Longest Points Streak</p>
                            <p className="text-xl font-semibold">{stats.longestStreak} days</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-sm text-gray-500">Unique Vaults Used</p>
                            <p className="text-xl font-semibold">{stats.uniqueVaultCount}</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-sm text-gray-500">Top Performing Vault</p>
                            <p className="text-lg font-semibold truncate">{stats.topVault.vault}</p>
                            <p className="text-sm text-gray-500">{formatNumber(stats.topVault.points)} points</p>
                          </div>
                        </div>
                      </>
                    );
                  })()
                )}
              </div>
            </Card>

            {/* Daily Active Users */}
            <Card className="hover:shadow-md transition-shadow p-[1px] overflow-hidden rounded-[28px]" 
                  style={{ 
                    padding: '1.5px',
                    borderRadius: '32px',
                    background: getRandomGradient(),
                    isolation: 'isolate',
                    overflow: 'hidden'                  
                  }}>
              <div className="bg-white p-6 rounded-[27px]">
                <h3 className="text-lg font-semibold mb-4">Daily Active Users</h3>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString()}
                        interval="preserveStartEnd"
                        tick={{ fontSize: 8 }} 
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(date) => new Date(date).toLocaleDateString()}
                        formatter={(value) => new Intl.NumberFormat().format(value)}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="activeAddresses" 
                        stroke="#8884d8" 
                        name="Active Addresses"
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 border-t pt-4">
                  <div className="h-8 relative">
                    <div className="absolute -top-6 left-0 right-0 flex justify-between text-xs text-gray-500">
                      <span>{analyticsData[0]?.date ? new Date(analyticsData[0].date).toLocaleDateString() : ''}</span>
                      <span>{analyticsData[analyticsData.length - 1]?.date ? new Date(analyticsData[analyticsData.length - 1].date).toLocaleDateString() : ''}</span>
                    </div>

                    <div className="absolute inset-0 flex items-center">
                      <Slider
                        defaultValue={[0, 100]}
                        value={sliderValue}
                        max={100}
                        step={1}
                        className="w-full"
                        onValueChange={(value) => {
                          setSliderValue(value);
                          if (analyticsData.length === 0) return;
                          
                          const startIdx = Math.floor(analyticsData.length * (value[0] / 100));
                          const endIdx = Math.floor(analyticsData.length * (value[1] / 100));
                          
                          setDateRange([
                            new Date(analyticsData[startIdx].date),
                            new Date(analyticsData[Math.min(endIdx, analyticsData.length - 1)].date)
                          ]);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Vault Performance */}
            <Card className="hover:shadow-md transition-shadow p-[1px] overflow-hidden rounded-[28px]" 
                  style={{ 
                    padding: '1.5px',
                    borderRadius: '32px',
                    background: getRandomGradient(),
                    isolation: 'isolate',
                    overflow: 'hidden'                  
                  }}>
              <div className="bg-white p-6 rounded-[27px]">
                <h3 className="text-lg font-semibold mb-4">Vault Performance</h3>
                <div className="h-[600px]"> 
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={memoizedHelpers.getVaultPerformanceData()} layout="vertical" margin={{ left: 200, right: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" hide={true} /> {/* Hide the axis numbers */}
                      <YAxis 
                        type="category" 
                        dataKey="vault" 
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip formatter={(value) => new Intl.NumberFormat().format(value)} />
                      <Bar 
                        dataKey="totalPoints" 
                        fill="#8884d8"
                        label={(props) => {
                          const { value, x, y, width, height } = props;
                          return (
                            <text
                              x={x + width + 10}
                              y={y + height / 2}
                              dy={4}
                              textAnchor="start"
                              fill="#666"
                              fontSize={12}
                            >
                              {new Intl.NumberFormat('en-US', {
                                notation: 'compact',
                                maximumFractionDigits: 1
                              }).format(value)}
                            </text>
                          );
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
            </div>
        )}


        {/* Leaderboard Content */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            {isLoading && (
              <div className="text-center py-8">
                Loading...
              </div>
            )}

            {error && (
              <div className="text-red-500 text-center py-4 bg-white rounded-[28px] shadow-sm overflow-hidden">
                {error.message}
              </div>
            )}
            
            {!isLoading && aggregatedData
              .slice(0, 100)
              .filter(item => {
                const addressLower = item.address.toLowerCase();
                if (hideTempleAddresses && TEMPLE_ADDRESSES.includes(addressLower)) return false;
                if (hideOrigamiAddresses && ORIGAMI_ADDRESSES.includes(addressLower)) return false;
                return !address || addressLower.includes(address.toLowerCase());
              })
              .map((item) => (
                <Card 
                  key={item.address} 
                  className="hover:shadow-md transition-shadow p-[1px] overflow-hidden rounded-[28px]" 
                  style={{ 
                    padding: '1px',
                    borderRadius: '32px',
                    background: getRandomGradient(),
                    isolation: 'isolate',
                    overflow: 'hidden'                  
                  }}
                >
                  <div  
                    className="bg-white w-full h-full"
                    style={{
                      borderRadius: '31px',
                      padding: '16px'
                    }}
                  >
                    <div 
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => toggleAddressExpansion(item.address)}
                    >
                      <div className="flex gap-4 items-center">
                        <span className="text-gray-400 w-8">#{item.rank}</span>
                        <div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-blue-500">{formatAddress(item.address)}</p>
                              {item.vaults.some(vault => {
                                const lastUpdate = new Date(vault.lastUpdate);
                                const today = new Date();
                                return lastUpdate.toDateString() === today.toDateString();
                              }) && (
                                <img 
                                  src="https://origami.finance/light/boosted-yields.svg" 
                                  alt="Active today"
                                  className="w-4 h-4"
                                />
                              )}
                            </div>
                            <p className="text-gray-400 text-sm">
                              {item.vaults.length} vault{item.vaults.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xl font-semibold">
                          {formatNumber(item.totalPoints)}
                        </span>
                        <span className="text-gray-400 text-sm">
                          {((item.totalPoints / totalPoints) * 100).toFixed(2)}% of total
                        </span>
                      </div>
                    </div>

                    {/* Expanded vault details */}
                    {expandedAddresses.has(item.address) && (
                      <div className="mt-4 space-y-2">
                        {item.vaults.map((vault) => (
                          <div 
                            key={vault.vault}
                            className="flex justify-between items-center p-3 bg-gray-50 rounded-[20px] overflow-hidden"
                          >
                            <div>
                              <p className="font-medium">{getVaultName(vault.vault)}</p>
                              <p className="text-gray-400 text-sm">
                                Last updated: {new Date(vault.lastUpdate).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex flex-col items-end">
                              <div className="text-lg font-medium">
                                {formatNumber(vault.points)}
                              </div>
                              <div className="text-gray-400 text-sm">
                                {((vault.points / item.totalPoints) * 100).toFixed(2)}% of wallet
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

function getLastTimestamp(allPoints) {
  return _.max(allPoints.map(p => new Date(p.timestamp)));
}

const ORI_S1 = 'P-5';
const ORI_S2 = 'P-6';

export default OrigamiPoints;
