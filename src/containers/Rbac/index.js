import React from 'react';
import { Helmet } from 'react-helmet';

import Controls from './Controls';
import Legend from './Legend';
import Graph from './Graph';

import './index.css';

export default class Rbac extends React.PureComponent {
  render() {
    return (
      <div className="rbac">
        <Helmet>
          <title>Rbac</title>
        </Helmet>
        <Controls />
        <Legend />
        <Graph />
      </div>
    );
  }
}
