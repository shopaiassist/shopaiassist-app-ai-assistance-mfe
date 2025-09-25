import React, { useEffect, useState } from 'react';

import { useAssistantContent } from '../Context';
import { PanelSize } from '../types';

const panelContainer = (size: PanelSize): React.CSSProperties => ({
  borderLeft: '1px solid #ccc',
  display: size === 'none' ? size : 'flex',
  flexBasis: size === 'none' ? 0 : size === 'half' ? '50%' : '100%',
  justifyContent: 'stretch',
  transition: 'flex-basis 0.5s',
});

/** Component to render result panel */
const ResultPanel = () => {
  const { resultPanel } = useAssistantContent();
  const panelContent = (resultPanel?.content as React.ReactNode) || null;
  const [panelSize, setPanelSize] = useState<PanelSize>(resultPanel?.desiredSize || 'none');

  useEffect(() => {
    if (resultPanel?.desiredSize && resultPanel.desiredSize !== panelSize) {
      setPanelSize(resultPanel.desiredSize);
    }
  }, [resultPanel]);

  return <div style={panelContainer(panelSize)}>{panelContent}</div>;
};

export default ResultPanel;
