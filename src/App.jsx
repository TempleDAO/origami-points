import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './components/ui/card';
import { Input } from './components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { ChevronDown, ChevronUp } from 'lucide-react';
import _ from 'lodash';

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

const OrigamiPoints = () => {
  const [address, setAddress] = useState('');
  const [allPoints, setAllPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVault, setSelectedVault] = useState('all');
  const [expandedAddresses, setExpandedAddresses] = useState(new Set());
  const [uniqueVaults, setUniqueVaults] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [yesterdayPoints, setYesterdayPoints] = useState(0);
  const [s1Points, setS1Points] = useState(0);
  const [s2Points, setS2Points] = useState(0);

  const getPeriodPoints = (data, pointsId) => {
    return _.sumBy(data.filter(item => item.points_id === pointsId), 'allocation');
  };

  const fetchAllPoints = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        'https://origami.automation-templedao.link/points_allocation?holder_address=ilike.*'
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch points data');
      }
      
      const data = await response.json();
      setAllPoints(data);
      
      const vaults = _.uniq(data.map(item => item.token_address));
      setUniqueVaults(vaults);
      
      // Calculate yesterday's points
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const yesterdayPoints = _.sumBy(
        data.filter(item => {
          const itemDate = new Date(item.timestamp);
          return itemDate >= yesterday && itemDate < new Date();
        }),
        'allocation'
      );
  
      // Calculate season points
      const s1Points = getPeriodPoints(data, 'P-1') + getPeriodPoints(data, 'P-2');
      const s2Points = getPeriodPoints(data, 'P-6');
      const totalPoints = s1Points + s2Points;
  
      setTotalPoints(totalPoints);
      setYesterdayPoints(yesterdayPoints);
      setS1Points(s1Points);
      setS2Points(s2Points);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPoints();
  }, []);

  const toggleAddressExpansion = (address) => {
    const newExpanded = new Set(expandedAddresses);
    if (newExpanded.has(address)) {
      newExpanded.delete(address);
    } else {
      newExpanded.add(address);
    }
    setExpandedAddresses(newExpanded);
  };

  const getAggregatedData = () => {
    const filteredData = selectedVault === 'all' 
      ? allPoints 
      : allPoints.filter(item => item.token_address === selectedVault);

    return _(filteredData)
      .groupBy('holder_address')
      .map((items, address) => ({
        address,
        totalPoints: _.sumBy(items, 'allocation'),
        vaults: _(items)
          .groupBy('token_address')
          .map((vaultItems, vault) => ({
            vault,
            points: _.sumBy(vaultItems, 'allocation'),
            lastUpdate: _.maxBy(vaultItems, 'timestamp').timestamp
          }))
          .value()
      }))
      .orderBy(['totalPoints'], ['desc'])
      .value();
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2
    }).format(num);
  };

  const getVaultName = (address) => {
    return VAULT_NAMES[address] || formatAddress(address);
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
          <a 
            href="https://twitter.com/unhappyben" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            Made by unhappyben
          </a>
        </div>

        {/* Stats Box */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-lg font-semibold">{formatNumber(totalPoints)}</p>
              <p className="text-sm text-gray-500">Total Points</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">{formatNumber(yesterdayPoints)}</p>
              <p className="text-sm text-gray-500">Yesterday Points</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">{formatNumber(s1Points)}</p>
              <p className="text-sm text-gray-500">S1 Points</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">{formatNumber(s2Points)}</p>
              <p className="text-sm text-gray-500">S2 Points</p>
            </div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Search address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full"
            />
            <Select value={selectedVault} onValueChange={setSelectedVault}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by vault" />
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

        {/* Leaderboard */}
        {loading && (
          <div className="text-center py-8">
            Loading...
          </div>
        )}

        {error && (
          <div className="text-red-500 text-center py-4 bg-white rounded-lg shadow-sm">
            {error}
          </div>
        )}

        {!loading && (
          <div className="space-y-4">
            {getAggregatedData()
              .filter(item => 
                !address || 
                item.address.toLowerCase().includes(address.toLowerCase())
              )
              .map((item, index) => (
                <Card key={item.address} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div 
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => toggleAddressExpansion(item.address)}
                    >
                      <div className="flex gap-4 items-center">
                        <span className="text-gray-500 w-8 mt-4">#{index + 1}</span>
                        <div className="mt-4">
                          <p className="font-medium">{formatAddress(item.address)}</p>
                          <p className="text-sm text-gray-500">
                            {item.vaults.length} vault{item.vaults.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 mt-4">
                        <span className="text-xl font-semibold">
                          {formatNumber(item.totalPoints)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {((item.totalPoints / totalPoints) * 100).toFixed(2)}% of total
                        </span>
                        <span className="ml-2">
                          {expandedAddresses.has(item.address) ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </span>
                      </div>
                    </div>

                    {expandedAddresses.has(item.address) && (
                      <div className="mt-4 space-y-2">
                        {item.vaults.map((vault) => (
                          <div 
                            key={vault.vault}
                            className="flex justify-between items-center p-2 bg-gray-50 rounded"
                          >
                            <div>
                              <p className="font-medium">{getVaultName(vault.vault)}</p>
                              <p className="text-sm text-gray-500">
                                Last updated: {new Date(vault.lastUpdate).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex flex-col items-end">
                              <div className="text-lg">
                                {formatNumber(vault.points)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {((vault.points / item.totalPoints) * 100).toFixed(2)}% of wallet
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrigamiPoints;
