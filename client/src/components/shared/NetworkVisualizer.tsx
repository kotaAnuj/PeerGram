import { useRef, useEffect } from 'react';
import { useP2P } from '@/hooks/useP2P';

export default function NetworkVisualizer() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { connections, peerId } = useP2P();

  useEffect(() => {
    if (!canvasRef.current) return;

    const container = canvasRef.current;
    container.innerHTML = '';

    // Add current user node at center
    const centerNode = document.createElement('div');
    centerNode.className = 'network-node';
    centerNode.style.top = '50%';
    centerNode.style.left = '50%';
    centerNode.style.transform = 'translate(-50%, -50%)';
    centerNode.textContent = 'You';
    container.appendChild(centerNode);

    // Max number of connections to display
    const maxConnections = Math.min(connections.length, 8);
    
    // Add connected peer nodes
    for (let i = 0; i < maxConnections; i++) {
      const conn = connections[i];
      const angle = (i * (2 * Math.PI / maxConnections));
      
      // Calculate position on circle
      const distance = 35 + Math.random() * 15; // % distance from center, with some randomness
      const top = 50 + Math.sin(angle) * distance;
      const left = 50 + Math.cos(angle) * distance;
      
      // Create peer node
      const peerNode = document.createElement('div');
      peerNode.className = 'network-node';
      peerNode.style.top = `${top}%`;
      peerNode.style.left = `${left}%`;
      peerNode.textContent = `P${i+1}`;
      container.appendChild(peerNode);
      
      // Create connection line
      const connectionLine = document.createElement('div');
      connectionLine.className = `connection-line ${conn.strength}-connection`;
      
      // Calculate line position and rotation
      const lineWidth = Math.sqrt(Math.pow(top - 50, 2) + Math.pow(left - 50, 2)) * 2;
      const rotation = Math.atan2(top - 50, left - 50) * (180 / Math.PI);
      
      connectionLine.style.top = '50%';
      connectionLine.style.left = '50%';
      connectionLine.style.width = `${lineWidth}%`;
      connectionLine.style.transform = `rotate(${rotation}deg) translateY(-50%)`;
      
      container.appendChild(connectionLine);
    }

  }, [connections, peerId]);

  return (
    <div ref={canvasRef} className="relative h-48 bg-blue-50 rounded-md p-2 mb-2">
      {/* Network visualization will be rendered here */}
    </div>
  );
}
