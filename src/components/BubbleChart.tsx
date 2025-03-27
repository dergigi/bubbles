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

    // Create a group for zoom/pan transformations
    const g = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    svg.call(zoom);
    
    // Double-click to reset zoom
    svg.on('dblclick.zoom', () => {
      svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity
      );
    });

    // Create color scale for bubbles
    const colorScale = d3.scaleOrdinal<string>()
      .domain(data.map(d => d.pubkey))
      .range([
        '#ff9999', '#99ff99', '#9999ff', '#ffff99', '#ff99ff', '#99ffff',
        '#ff8080', '#80ff80', '#8080ff', '#ffff80', '#ff80ff', '#80ffff'
      ]);

    // Create a radial gradient for the bubbles
    const defs = svg.append('defs');
    
    data.forEach((d, i) => {
      const gradientId = `bubble-gradient-${i}`;
      const gradient = defs.append('radialGradient')
        .attr('id', gradientId)
        .attr('cx', '35%')
        .attr('cy', '35%')
        .attr('r', '60%');
      
      const color = colorScale(d.pubkey);
      
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', d3.rgb(color).brighter(1).toString());
        
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', d3.rgb(color).darker(1).toString());
    });

    const simulation = d3
      .forceSimulation<Profile>(data)
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('charge', d3.forceManyBody().strength(-50))
      .force('collision', d3.forceCollide<Profile>().radius((d) => d.activity + 30));

    const bubbles = g
      .selectAll('g.bubble-group')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'bubble-group')
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

    // Add glow filter
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
      
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '2.5')
      .attr('result', 'coloredBlur');
      
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode')
      .attr('in', 'coloredBlur');
    feMerge.append('feMergeNode')
      .attr('in', 'SourceGraphic');

    // Add bubble circles with gradients
    bubbles
      .append('circle')
      .attr('r', (d) => d.activity)
      .style('fill', (d, i) => `url(#bubble-gradient-${i})`)
      .style('filter', 'url(#glow)')
      .style('opacity', 0.8)
      .style('cursor', 'pointer')
      .style('stroke', 'rgba(255, 255, 255, 0.2)')
      .style('stroke-width', 1)
      .on('mouseover', function() {
        d3.select(this)
          .transition()
          .duration(300)
          .style('opacity', 1)
          .style('stroke', 'rgba(255, 255, 255, 0.8)')
          .style('stroke-width', 2);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(300)
          .style('opacity', 0.8)
          .style('stroke', 'rgba(255, 255, 255, 0.2)')
          .style('stroke-width', 1);
      })
      .on('click', (event, d) => onProfileClick(d.npub));

    // Add text labels
    bubbles
      .append('text')
      .text((d) => d.name || d.pubkey.slice(0, 8))
      .attr('text-anchor', 'middle')
      .attr('dy', '.3em')
      .style('fill', 'white')
      .style('font-weight', 'bold')
      .style('font-size', (d) => Math.min(d.activity / 3, 14) + 'px')
      .style('pointer-events', 'none')
      .style('text-shadow', '0 0 4px rgba(0, 0, 0, 0.8)');

    simulation.on('tick', () => {
      bubbles.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    // Add grid lines for reference
    const gridSize = Math.max(width, height) * 2;
    const gridStep = 100;
    
    // Horizontal grid lines
    g.selectAll('.grid-line-h')
      .data(d3.range(-gridSize, gridSize, gridStep))
      .enter()
      .append('line')
      .attr('class', 'grid-line-h')
      .attr('x1', -gridSize)
      .attr('x2', gridSize)
      .attr('y1', d => d)
      .attr('y2', d => d)
      .style('stroke', 'rgba(255, 255, 255, 0.05)');
    
    // Vertical grid lines
    g.selectAll('.grid-line-v')
      .data(d3.range(-gridSize, gridSize, gridStep))
      .enter()
      .append('line')
      .attr('class', 'grid-line-v')
      .attr('x1', d => d)
      .attr('x2', d => d)
      .attr('y1', -gridSize)
      .attr('y2', gridSize)
      .style('stroke', 'rgba(255, 255, 255, 0.05)');

    // Add instructions for users
    svg.append('text')
      .attr('x', 20)
      .attr('y', 30)
      .attr('fill', 'rgba(255,255,255,0.5)')
      .style('font-size', '14px')
      .text('Scroll to zoom • Drag to pan • Double-click to reset');

    return () => {
      simulation.stop();
    };
  }, [data, width, height, onProfileClick]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ background: '#121212', borderRadius: '0px' }}
    />
  );
}; 