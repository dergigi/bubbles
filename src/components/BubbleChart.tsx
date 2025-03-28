import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Profile extends d3.SimulationNodeDatum {
  pubkey: string;
  name: string;
  activity: number;
  npub: string;
  picture?: string;
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
  selectedTimeframe: number;
  onTimeframeChange: (timeframe: number) => void;
  showOnlyActive: boolean;
  onToggleFilter: () => void;
  allProfiles: Profile[];
}

export const BubbleChart: React.FC<BubbleChartProps> = ({
  data,
  width,
  height,
  onProfileClick,
  selectedTimeframe,
  onTimeframeChange,
  showOnlyActive,
  onToggleFilter,
  allProfiles
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Set SVG properties explicitly to ensure it's visible
    svg
      .attr('width', width)
      .attr('height', height)
      .style('position', 'absolute')
      .style('top', 0)
      .style('left', 0)
      .style('z-index', 10);

    if (data.length === 0) {
      // Display a message when no data is available
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', 'rgba(255,255,255,0.7)')
        .style('font-size', '16px')
        .text('No activity data available for this timeframe');
      
      // Still render the UI controls even if no data
      renderUIControls(svg);
      return;
    }

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

    // Normalize activity values to ensure appropriate bubble sizes
    const maxActivity = Math.max(...data.map(d => d.activity));
    const minActivity = Math.min(...data.map(d => d.activity > 0 ? d.activity : Infinity));
    
    // Scale activity values between 10 and 60
    const MIN_BUBBLE_SIZE = 10;
    const MAX_BUBBLE_SIZE = 60;
    
    const normalizeActivity = (activity: number): number => {
      if (maxActivity === minActivity) return (MIN_BUBBLE_SIZE + MAX_BUBBLE_SIZE) / 2;
      return MIN_BUBBLE_SIZE + ((activity - minActivity) / (maxActivity - minActivity)) * (MAX_BUBBLE_SIZE - MIN_BUBBLE_SIZE);
    };

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

    // Add pattern for default profile image
    defs.append('pattern')
      .attr('id', 'default-profile-img')
      .attr('patternUnits', 'objectBoundingBox')
      .attr('width', 1)
      .attr('height', 1)
      .append('circle')
      .attr('cx', 0.5)
      .attr('cy', 0.5)
      .attr('r', 0.5)
      .style('fill', '#4b9fd5');

    // Add patterns for profile pictures
    data.forEach((d, i) => {
      if (d.picture) {
        // Debug profile picture URLs
        console.log(`Creating pattern for profile ${d.name} with picture URL: ${d.picture}`);

        const pattern = defs.append('pattern')
          .attr('id', `profile-img-${i}`)
          .attr('patternUnits', 'objectBoundingBox')
          .attr('width', 1)
          .attr('height', 1);
          
        // Add a solid color background in case the image fails to load
        pattern.append('rect')
          .attr('width', 1)
          .attr('height', 1)
          .attr('fill', '#4b9fd5');
          
        // Add image on top
        const image = pattern.append('image')
          .attr('xlink:href', d.picture)
          .attr('width', 1)
          .attr('height', 1)
          .attr('preserveAspectRatio', 'xMidYMid slice');
          
        // Handle image loading errors - just use the solid color already set
        image.on('error', function() {
          console.warn(`Failed to load image for ${d.name}: ${d.picture}`);
          d3.select(this).remove();
        });
      }
    });

    const simulation = d3
      .forceSimulation<Profile>(data)
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('charge', d3.forceManyBody().strength(-50))
      .force('collision', d3.forceCollide<Profile>().radius((d) => normalizeActivity(d.activity) + 5));

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

    // Add bubble circles with profile pictures
    bubbles
      .append('circle')
      .attr('r', (d) => normalizeActivity(d.activity))
      .style('fill', (d, i) => d.picture ? `url(#profile-img-${i})` : colorScale(d.pubkey))
      .style('filter', 'url(#glow)')
      .style('opacity', 0.9)
      .style('cursor', 'pointer')
      .style('stroke', 'rgba(255, 255, 255, 0.3)')
      .style('stroke-width', 1.5)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(300)
          .style('opacity', 1)
          .style('stroke', 'rgba(255, 255, 255, 0.8)')
          .style('stroke-width', 2);
          
        // Show activity count as tooltip
        const tooltip = g.append('g')
          .attr('class', 'tooltip')
          .attr('transform', `translate(${d.x},${d.y! - normalizeActivity(d.activity) - 20})`);
          
        tooltip.append('text')
          .attr('text-anchor', 'middle')
          .style('fill', 'white')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .style('text-shadow', '0 1px 2px rgba(0,0,0,0.8)')
          .text(`${d.activity} events`);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(300)
          .style('opacity', 0.9)
          .style('stroke', 'rgba(255, 255, 255, 0.3)')
          .style('stroke-width', 1.5);
          
        // Remove tooltip
        g.selectAll('.tooltip').remove();
      })
      .on('click', (event, d) => onProfileClick(d.npub));

    // Add usernames in the center of bubbles
    bubbles
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.3em')
      .style('fill', 'white')
      .style('font-size', (d) => Math.min(normalizeActivity(d.activity) / 3, 14) + 'px')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')
      .style('text-shadow', '0 1px 2px rgba(0,0,0,0.8)')
      .text(d => d.name);

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
      .style('font-size', '12px')
      .text('Drag to move bubbles, scroll to zoom');

    // Render UI controls after everything else
    renderUIControls(svg);
  }, [
    data, 
    width, 
    height, 
    onProfileClick, 
    selectedTimeframe, 
    onTimeframeChange, 
    showOnlyActive, 
    onToggleFilter,
    allProfiles
  ]);

  // Function to render UI controls directly in SVG
  const renderUIControls = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
    // Add timeframe selector at the top left
    const timeframes = [
      { label: '8h', value: 8 * 60 * 60 },
      { label: '24h', value: 24 * 60 * 60 },
      { label: '48h', value: 48 * 60 * 60 },
      { label: '1w', value: 7 * 24 * 60 * 60 },
      { label: '1m', value: 30 * 24 * 60 * 60 },
    ];

    // Create main container for timeframe selector
    const timeframeContainer = svg.append('g')
      .attr('class', 'timeframe-selector')
      .attr('transform', `translate(20, 50)`);

    // Add background for timeframe selector with increased height
    timeframeContainer.append('rect')
      .attr('width', 250)
      .attr('height', 54)  // Increased by 20% from 45 to 54
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('fill', 'rgba(50, 50, 50, 0.9)')
      .attr('stroke', 'rgba(255, 255, 255, 0.2)')
      .attr('stroke-width', 1);

    // Add "Timeframe" label
    timeframeContainer.append('text')
      .attr('x', 10)
      .attr('y', 18)
      .attr('fill', 'rgba(255, 255, 255, 0.7)')
      .style('font-size', '12px')
      .text('Timeframe');

    // Add timeframe buttons
    timeframes.forEach((tf, i) => {
      const isSelected = selectedTimeframe === tf.value;
      const buttonGroup = timeframeContainer.append('g')
        .attr('transform', `translate(${10 + i * 48}, 28)`)  // Moved down from 24 to 28
        .style('cursor', 'pointer')
        .on('click', () => onTimeframeChange(tf.value));

      // Button background
      buttonGroup.append('rect')
        .attr('width', 42)
        .attr('height', 20)
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('fill', isSelected ? 'rgba(59, 130, 246, 0.9)' : 'rgba(75, 85, 99, 0.8)')
        .attr('stroke', isSelected ? 'rgba(147, 197, 253, 0.5)' : 'transparent')
        .attr('stroke-width', 1);

      // Button text
      buttonGroup.append('text')
        .attr('x', 21)
        .attr('y', 14)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .style('font-size', '11px')
        .style('font-weight', isSelected ? 'bold' : 'normal')
        .text(tf.label);
    });

    // Add filter toggle in the top center
    const filterContainer = svg.append('g')
      .attr('class', 'filter-toggle')
      .attr('transform', `translate(${width / 2 - 95}, 20)`)
      .style('cursor', 'pointer')
      .on('click', onToggleFilter);

    // Background for filter toggle
    filterContainer.append('rect')
      .attr('width', 190)
      .attr('height', 34)
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('fill', 'rgba(50, 50, 50, 0.9)')
      .attr('stroke', 'rgba(255, 255, 255, 0.2)')
      .attr('stroke-width', 1);

    // Toggle switch background
    filterContainer.append('rect')
      .attr('x', 12)
      .attr('y', 11)
      .attr('width', 40)
      .attr('height', 12)
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('fill', showOnlyActive ? 'rgba(59, 130, 246, 0.9)' : 'rgba(75, 85, 99, 0.8)');

    // Toggle switch knob
    filterContainer.append('circle')
      .attr('cx', showOnlyActive ? 44 : 20)
      .attr('cy', 17)
      .attr('r', 6)
      .attr('fill', 'white')
      .attr('stroke', 'rgba(0, 0, 0, 0.1)')
      .attr('stroke-width', 1);

    // Toggle label
    filterContainer.append('text')
      .attr('x', 65)
      .attr('y', 21)
      .attr('fill', 'white')
      .style('font-size', '12px')
      .text(showOnlyActive ? 'Showing active only' : 'Showing all profiles');

    // Add stats panel at the bottom right
    if (allProfiles.length) {
      // Calculate statistics for the stats panel
      const totalProfiles = allProfiles.length;
      const activeProfiles = allProfiles.filter(p => p.activity > 0).length;
      const totalEvents = allProfiles.reduce((sum, profile) => sum + profile.activity, 0);
      const averageEvents = totalEvents / totalProfiles;
      
      // Get most active profile
      const sortedProfiles = [...allProfiles].sort((a, b) => b.activity - a.activity);
      const mostActiveProfile = sortedProfiles[0];

      // Format timeframe label for display
      let timeframeLabel = '';
      if (selectedTimeframe <= 8 * 60 * 60) {
        timeframeLabel = '8 hours';
      } else if (selectedTimeframe <= 24 * 60 * 60) {
        timeframeLabel = '24 hours';
      } else if (selectedTimeframe <= 48 * 60 * 60) {
        timeframeLabel = '48 hours';
      } else if (selectedTimeframe <= 7 * 24 * 60 * 60) {
        timeframeLabel = '1 week';
      } else {
        timeframeLabel = '1 month';
      }

      const statsContainer = svg.append('g')
        .attr('class', 'stats-panel')
        .attr('transform', `translate(${width - 200}, ${height - 110})`);

      // Background for stats panel
      statsContainer.append('rect')
        .attr('width', 190)
        .attr('height', 100)
        .attr('rx', 6)
        .attr('ry', 6)
        .attr('fill', 'rgba(50, 50, 50, 0.9)')
        .attr('stroke', 'rgba(255, 255, 255, 0.2)')
        .attr('stroke-width', 1);

      // Stats title
      statsContainer.append('text')
        .attr('x', 10)
        .attr('y', 16)
        .attr('fill', 'rgba(255, 255, 255, 0.7)')
        .style('font-size', '10px')
        .text(`Statistics (last ${timeframeLabel})`);

      // Stats data
      const stats = [
        {label: 'Total Profiles:', value: totalProfiles.toString()},
        {label: 'Active Profiles:', value: `${activeProfiles} (${Math.round(activeProfiles / totalProfiles * 100)}%)`},
        {label: 'Total Events:', value: totalEvents.toString()},
        {label: 'Average Events:', value: averageEvents.toFixed(1)},
        {label: 'Most Active:', value: `${mostActiveProfile.name} (${mostActiveProfile.activity})`}
      ];

      stats.forEach((stat, i) => {
        // Label
        statsContainer.append('text')
          .attr('x', 10)
          .attr('y', 32 + i * 14)
          .attr('fill', 'rgba(255, 255, 255, 0.7)')
          .style('font-size', '10px')
          .text(stat.label);

        // Value
        statsContainer.append('text')
          .attr('x', 105)
          .attr('y', 32 + i * 14)
          .attr('fill', 'white')
          .style('font-size', '10px')
          .style('font-weight', 'bold')
          .text(stat.value);
      });
    }
  };

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        zIndex: 10
      }}
    />
  );
}; 