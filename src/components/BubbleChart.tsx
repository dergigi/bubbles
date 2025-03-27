import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Profile extends d3.SimulationNodeDatum {
  pubkey: string;
  name: string;
  activity: number;
  npub: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface BubbleChartProps {
  data: Profile[];
  width: number;
  height: number;
  onProfileClick: (npub: string) => void;
}

export const BubbleChart: React.FC<BubbleChartProps> = ({
  data,
  width,
  height,
  onProfileClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const simulation = d3
      .forceSimulation<Profile>(data)
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('charge', d3.forceManyBody().strength(-30))
      .force('collision', d3.forceCollide().radius((d) => d.activity + 30));

    const bubbles = svg
      .selectAll('g')
      .data(data)
      .enter()
      .append('g')
      .call(d3.drag<SVGGElement, Profile>()
        .on('start', (event) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        })
        .on('drag', (event) => {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        })
        .on('end', (event) => {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        }));

    bubbles
      .append('circle')
      .attr('r', (d) => d.activity)
      .style('fill', '#4a90e2')
      .style('opacity', 0.7)
      .style('cursor', 'pointer')
      .on('click', (event, d) => onProfileClick(d.npub));

    bubbles
      .append('text')
      .text((d) => d.name || d.pubkey.slice(0, 8))
      .attr('text-anchor', 'middle')
      .attr('dy', '.3em')
      .style('fill', 'white')
      .style('font-size', '12px')
      .style('pointer-events', 'none');

    simulation.on('tick', () => {
      bubbles
        .attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [data, width, height, onProfileClick]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ background: '#f5f5f5', borderRadius: '8px' }}
    />
  );
}; 