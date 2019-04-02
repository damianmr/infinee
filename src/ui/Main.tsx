import React from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import GameFolderDropZone from './GameFolderDropZone';

const Main = styled.main.attrs({
  className: 'lh-solid tc helvetica'
})`
`;

const InfinEE = () => {
  return (
    <Main>
      <GameFolderDropZone />
    </Main>
  );
};

document.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(<InfinEE />, document.getElementById('root'));
});