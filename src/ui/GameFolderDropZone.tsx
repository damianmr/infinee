import React, { MutableRefObject, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import usePreventDefaultAndPropagation from './util/usePreventDefaultAndPropagation';

const DropDiv = styled.div.attrs({
  className: 'fixed absolute--fill z-999'
})`
  background-color: ${({ isVisible }: { isVisible: boolean }) =>
    isVisible ? 'turquoise' : 'gray'};
`;

export default function GameFolderDropZone() {
  const dropZoneRef = useRef(null);
  const [isVisible, setVisible] = useState(false);

  function onWindowDragEnter() {
    setVisible(true);
  }

  function onWindowDragLeave() {
    setVisible(false);
  }

  usePreventDefaultAndPropagation(['dragover', 'drop'], dropZoneRef);

  useEffect(() => {
    window.addEventListener('dragenter', onWindowDragEnter);
    window.addEventListener('dragleave', onWindowDragLeave);

    return () => {
      window.removeEventListener('dragenter', onWindowDragEnter);
      window.removeEventListener('dragleave', onWindowDragLeave);
    };
  });

  return (
    <DropDiv ref={dropZoneRef} isVisible={isVisible}>
      <div>DD</div>
    </DropDiv>
  );
}
