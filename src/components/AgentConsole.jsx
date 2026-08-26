import { useState, useEffect } from "react";
import { executeClawAgent, getRecentAgentLogs } from "../lib/clawApi.js";

export default function AgentConsole({ selectedWorkspaceId }) {
  const [loading, setLoading] = useState(false);
  const [activeOutput, setActiveOutput] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchLogs();
  }, [selectedWorkspaceId]);

  const fetchLogs = async () => {
    const data = await getRecentAgentLogs(10, selectedWorkspaceId);
    setLogs(data);
  };

  const runAgentTask = async (clawKey) => {
    setLoading(true);
    setActiveOutput(null);

    try {
      const response = await executeClawAgent({
        clawKey,
        workspaceId: selectedWorkspaceId,
        payload: {
          triggerSource: `Dashboard UI Manual Trigger (${clawKey})`,
          workspaceId: selectedWorkspaceId,
          timestamp: new Date().toISOString(),
        },
      });

      setActiveOutput(response);
      await fetchLogs();
    } catch (err) {
      alert("Execution error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
      <h2>ClawAIStack Agent Control Center</h2>

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        <button
          onClick={() => runAgentTask("bookkeeper-claw")}
          disabled={loading}
          style={{ padding: "10px 16px", cursor: "pointer" }}
        >
          {loading ? "Processing..." : "Run Bookkeeper Task"}
        </button>

        <button
          onClick={() => runAgentTask("ap-claw")}
          disabled={loading}
          style={{ padding: "10px 16px", cursor: "pointer" }}
        >
          {loading ? "Processing..." : "Run AP Matching Task"}
        </button>

        <button
          onClick={() => runAgentTask("controller-claw")}
          disabled={loading}
          style={{ padding: "10px 16px", cursor: "pointer" }}
        >
          {loading ? "Processing..." : "Run Controller Audit"}
        </button>
      </div>

      {activeOutput && (
        <div style={{ background: "#f4f4f5", padding: "16px", borderRadius: "8px", marginBottom: "24px" }}>
          <h4>Latest Agent Output ({activeOutput.clawKey})</h4>
          <p><strong>Active Model:</strong> {activeOutput.activeModelUsed}</p>
          <p><strong>Execution Time:</strong> {activeOutput.executionTimeMs} ms</p>
          <pre style={{ background: "#e4e4e7", padding: "12px", borderRadius: "4px", fontSize: "12px" }}>
            {JSON.stringify(activeOutput.result, null, 2)}
          </pre>
        </div>
      )}

      <h3>Execution Audit Trail</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ccc" }}>
            <th style={{ padding: "8px" }}>Agent</th>
            <th style={{ padding: "8px" }}>Task Name</th>
            <th style={{ padding: "8px" }}>Status</th>
            <th style={{ padding: "8px" }}>Time (ms)</th>
            <th style={{ padding: "8px" }}>Logged At</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "8px", fontWeight: "bold" }}>{log.claw_id}</td>
              <td style={{ padding: "8px" }}>{log.task_name}</td>
              <td style={{ padding: "8px", color: log.status === "Success" ? "green" : "red" }}>{log.status}</td>
              <td style={{ padding: "8px" }}>{log.execution_time_ms} ms</td>
              <td style={{ padding: "8px" }}>{new Date(log.created_at).toLocaleTimeString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}