import { Chat } from 'react';
import { Text, i18n } from 'react';
import * as wjcCore from 'wijmo';
import { CollectionView } from 'wijmo';
import { FlexGrid as FlexGridInstance } from 'wijmo.grid';
import { FlexGrid, FlexGridColumn } from 'wijmo.react.grid';
import { Button, EmptyState, Icon } from 'core-components/react';
import React, { useMemo, useRef, useState, useEffect } from 'react';
import ChatApi from '../utils/chatApi';
import { useChat } from '../store';
import './ChatResults.scss';

// This is a build time key. No concerns having it here
wjcCore.setLicenseKey(process.env.WIJMO_LICENSE_KEY || '');

const ChatResults = () => {
  const { t } = i18n.useTranslation('hermes');
  const { activeChatId: chat_id } = useChat();
  const [flows, setFlows] = useState<Chat.MessageFlow[]>([]);
  const gridRef = useRef<typeof FlexGrid>(null);
  const rows = useMemo(() => new CollectionView(flows), [flows]);

  useEffect(() => void (!!chat_id && ChatApi.fetchFlows({ chat_id }).then(setFlows)), [chat_id]);

  const initGrid = (grid: FlexGridInstance) => {
    grid.rowHeaders.columns[0].visible = false;
  };

  return (
    <div className="ai-assistance-results">
      <div>
        <Text variant="display-sm">Results</Text>
      </div>
      <Text>View all results for this chat.</Text>
      {!flows.length ? (
        <EmptyState className="no-results" emptyStateTitle={t('RESULTS.EMPTY.TITLE')}>
          <p>{t('RESULTS.EMPTY.SUBTITLE')}</p>
          <div slot="actions">
            <Button appearance="secondary">
              {t('RESULTS.EMPTY.LEARN_MORE')}
              <Icon iconName="arrow-up-right-from-square" slot="end" />
            </Button>
          </div>
        </EmptyState>
      ) : (
        <FlexGrid
          alternatingRowStep={1}
          anchorCursor
          aria-describedby="tableDescription"
          aria-labelledby="tableHeader"
          headersFocusability="All"
          headersVisibility="All"
          initialized={initGrid}
          isReadOnly
          itemsSource={rows}
          ref={gridRef}
          selectionMode="None"
          showMarquee
          style={{ marginTop: 'var(---space-stack-lg)' }}
        >
          <FlexGridColumn binding="message" header={t('RESULTS.HEADERS.NAME')} width="*" />
          <FlexGridColumn binding="function_input.request_type" header={t('RESULTS.HEADERS.SKILL')} width={200} />
          <FlexGridColumn binding="sent_time" header={t('RESULTS.HEADERS.DATE')} width={200} />
          <FlexGridColumn binding="id" header={t('RESULTS.HEADERS.STATUS')} width={200} />
        </FlexGrid>
      )}
      {/* {!flows.length && ( // TODO: finish setting up table with searchable results
        <EmptyState emptyStateTitle={t('RESULTS.NONE.TITLE')} isCenter>
          <Text>{t('RESULTS.NONE.SUBTITLE')}</Text>
        </EmptyState>
      )} */}
    </div>
  );
};

export default ChatResults;
