import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
// import {loadGameFolder, SupportedGameFolders} from '../gameDirectory';
// import getAsEntry from '../util/getAsEntry';
// import log from '../util/log';
import usePreventDefaultAndPropagation from './util/usePreventDefaultAndPropagation';

type DropAreaType = { isDraggingSomething?: boolean };
const DropArea = styled.div.attrs({
  className: 'fixed absolute--fill z-999'
})`
  height: ${(props: DropAreaType) => (props.isDraggingSomething ? 'auto' : 0)};
  overflow: ${(props: DropAreaType) => (props.isDraggingSomething ? 'visible' : 'hidden')};
  background-color: transparent;
`;

type DropHereSignType = { isDraggingSomething?: boolean };
const DropHereSign = styled.div`
  transition: opacity 0.1s ease-in;
  pointer-events: none; /* Do not remove, or drop events will be canceled */
  background-color: rgba(228, 228, 228, 0.7);
  border: 4px black dashed;
  height: 180px;
  width: 60%;
  border-radius: 30px;
  display: inline-block;
  position: absolute;
  top: 35%;
  left: 50%;
  transform: translate(-50%, -35%);
  opacity: ${(props: DropHereSignType) => (props.isDraggingSomething ? '1' : '0')};
`;

export default function GameFolderDropZone() {
  const dropZoneRef = useRef(null);
  const [draggingOverWindow, setDraggingOverWindow] = useState(false);

  function onWindowDragEnter() {
    setDraggingOverWindow(true);
  }

  async function onDrop(event: React.DragEvent<HTMLDivElement>) {
    const droppedItem = event.nativeEvent.dataTransfer && event.nativeEvent.dataTransfer.items[0];
    if (droppedItem) {
      // log('Loading game folder');
      // const gameFolder = await loadGameFolder(SupportedGameFolders.BG2EE(getAsEntry(droppedItem)));
      // log('Done!', gameFolder);
    }
    setDraggingOverWindow(false);
    event.preventDefault();
    event.stopPropagation();
  }

  function onDragLeave() {
    setDraggingOverWindow(false);
  }

  // Though 'dragenter' and 'dragover' events are not needed (the UI does not react to them),
  // we still need to listen to them because otherwise the 'drop' event won't be triggered
  // by the browser. These are documented browser's constraints.
  // The useAndPreventDefaultPropagation effect subscribes to all the events passed in
  // the first argument.
  usePreventDefaultAndPropagation(['dragenter', 'dragover', 'drop', 'dragleave'], dropZoneRef);

  useEffect(() => {
    window.addEventListener('dragenter', onWindowDragEnter);

    return () => {
      window.removeEventListener('dragenter', onWindowDragEnter);
    };
  }, [dropZoneRef.current]);

  return (
    <DropArea
      ref={dropZoneRef}
      isDraggingSomething={draggingOverWindow}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
    >
      <DropHereSign isDraggingSomething={draggingOverWindow}>
        <span>Drop your BG2:EE folder here!</span>
      </DropHereSign>
    </DropArea>
  );
}
