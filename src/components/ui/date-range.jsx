import React, { useState, useEffect } from 'react';
import { Slider } from "./slider";
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import _ from 'lodash';

const DateRange = ({ 
  data,
  onRangeChange
}) => {
  const [range, setRange] = useState([0, 100]);
  const [timeframe, setTimeframe] = useState({
    start: null,
    end: null
  });
  
  // Process the data to get dates and total points
  const processedData = React.useMemo(() => {
    return _(data)
      .groupBy(item => new Date(item.timestamp).toISOString().split('T')[0])
      .map((items, date) => ({
        date,
        totalPoints: _.sumBy(items, 'allocation')
      }))
      .sortBy('date')
      .value();
  }, [data]);
  
  useEffect(() => {
    if (processedData.length > 0) {
      setTimeframe({
        start: new Date(processedData[0].date),
        end: new Date(processedData[processedData.length - 1].date)
      });
    }
  }, [processedData]);

  const handleRangeChange = (newRange) => {
    setRange(newRange);
    
    if (timeframe.start && timeframe.end) {
      const totalMs = timeframe.end - timeframe.start;
      const startDate = new Date(timeframe.start.getTime() + (totalMs * newRange[0] / 100));
      const endDate = new Date(timeframe.start.getTime() + (totalMs * newRange[1] / 100));
      onRangeChange([startDate, endDate]);
    }
  };

  return (
    <div className="h-12 relative w-full">
      {/* Static Date Labels */}
      <div className="absolute top-0 left-0 right-0 flex justify-between text-xs text-gray-500 mb-1">
        <span>{timeframe.start?.toLocaleDateString()}</span>
        <span>{timeframe.end?.toLocaleDateString()}</span>
      </div>
      
      {/* Mini Chart + Slider Container */}
      <div className="relative h-6 mt-4">
        {/* Background Mini Chart */}
        <div className="absolute inset-0 opacity-30">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={processedData}>
              <Area
                type="monotone"
                dataKey="totalPoints"
                stroke="#4D80FF"
                fill="#4D80FF"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Slider */}
        <div className="absolute inset-0">
          <Slider
            defaultValue={[0, 100]}
            value={range}
            min={0}
            max={100}
            step={1}
            onValueChange={handleRangeChange}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default DateRange;