import { Text } from 'react';
import { Button, Icon } from 'react';
import useMFECommunication from '../../hooks/useMFECommunication';

interface MessageCollectionProps {
  dbId: string;
  name: string;
}

/**
 * Component to display the database selected in the chat
 * @param dbId - The database ID
 * @param name - The database name
 */
const MessageCollection = ({ dbId, name }: MessageCollectionProps): JSX.Element => {
  const [sendEvent] = useMFECommunication();

  const goToDb = () => {
    sendEvent({ message: 'database', body: { dbId, name } });
  };

  return (
    <>
      <Text style={{ marginBottom: '0.5rem', width: '100%' }} variant="body-strong-lg">
        Database selected:
      </Text>
      <Button appearance="tertiary" density="compact" onClick={goToDb}>
        <Icon aria-hidden="true" icon-name="database" role="presentation" slot="start" />
        {name}
      </Button>
    </>
  );
};

export default MessageCollection;
