import { FileReference } from 'react';
import { FileSummary, Text } from 'react';
import { useChat } from '../../store';

interface MessageFilesProps {
  files: FileReference[];
}

/**
 * Component to display the files added to the chat
 * @param files - The files added to the chat
 */
const MessageFiles = ({ files }: MessageFilesProps): JSX.Element => {
  const allFiles = useChat((state) => state.files);
  const title = `${files?.length} file${files.length > 1 ? 's' : ''} added`;

  return (
    <>
      <Text style={{ marginBottom: '1rem', width: '100%' }} variant="body-strong-md">
        {title}
      </Text>
      <FileSummary fileRecords={allFiles} files={files} />
    </>
  );
};

export default MessageFiles;
