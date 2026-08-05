import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { useNavigate } from 'react-router-dom';

let initialized = false;

const MermaidDiagram = ({ chart, id }) => {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    window.helpFlowNavigate = (path) => navigate(path);
    return () => { delete window.helpFlowNavigate; };
  }, [navigate]);

  useEffect(() => {
    if (!initialized) {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: 'base',
        flowchart: {
          htmlLabels: true,
          curve: 'basis',
          nodeSpacing: 32,
          rankSpacing: 55,
          padding: 12,
        },
        themeVariables: {
          fontSize: '12.5px',
          fontFamily: 'Inter, system-ui, sans-serif',
          primaryColor: '#f0f7ed',
          primaryBorderColor: '#96c67e',
          primaryTextColor: '#1f3313',
          lineColor: '#5A8C3F',
          edgeLabelBackground: '#ffffff',
          clusterBkg: '#f0f7ed',
          clusterBorder: '#b9d9a9',
        },
      });
      initialized = true;
    }

    let cancelled = false;
    mermaid.render(id, chart).then(({ svg, bindFunctions }) => {
      if (!cancelled && containerRef.current) {
        containerRef.current.innerHTML = svg;
        bindFunctions?.(containerRef.current);
      }
    }).catch((err) => {
      if (!cancelled) setError(err.message);
    });

    return () => { cancelled = true; };
  }, [chart, id]);

  if (error) {
    return <p className="text-sm text-red-500">Diagram failed to render: {error}</p>;
  }

  return <div ref={containerRef} className="w-full overflow-x-auto [&_svg]:mx-auto" />;
};

export default MermaidDiagram;
