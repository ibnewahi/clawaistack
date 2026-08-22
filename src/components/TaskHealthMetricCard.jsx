import React, { useEffect, useState } from 'react';
import MetricCard from './MetricCard';
import { supabase } from '../lib/supabase';

export default function TaskHealthMetricCard() {
  const [taskCount, setTaskCount] = useState(0);
  const [accuracy, setAccuracy] = useState('100%');

  const fetchTaskMetrics = async () => {
    const { data, error } = await supabase
      .from('claw_execution_logs')
      .select('accuracy_score');

    if (!error && data) {
      const count = data.length;
      const avgAcc =
        count > 0
          ? (data.reduce((acc, curr) => acc + (curr.accuracy_score || 0), 0) / count).toFixed(0)
          : 100;

      setTaskCount(count);
      setAccuracy(`${avgAcc}%`);
    }
  };

  useEffect(() => {
    fetchTaskMetrics();

    // Listen to live database inserts
    const channel = supabase
      .channel('kpi_realtime_sync')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'claw_execution_logs' },
        () => {
          fetchTaskMetrics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <MetricCard
      title="Autonomous Task Health"
      value={`${taskCount} Executed`}
      changePercent={`Accuracy: ${accuracy}`}
      isPositive={true}
    />
  );
}