import React from 'react';
import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Tabs, Button, Popconfirm } from 'antd';
import classnames from 'classnames';

import {
  PREFIX,
  YAML,
  IS_LOADING_CATALOG,
  NO_NAMESPACE,
  itemGet,
  itemPost,
  itemPut,
  itemDelete,
  tabOpen,
  tabClose,
  tabCloseAll,
} from 'modules/k8s';

import Editor from './Editor';
import css from './index.css';


@connect(
  state => state[PREFIX],
  dispatch => bindActionCreators({
    itemGet,
    itemPost,
    itemPut,
    itemDelete,
    tabOpen,
    tabClose,
    tabCloseAll,
  }, dispatch),
)

export default class Content extends React.Component {

  static propTypes = {
    flags: PropTypes.object.isRequired,
    items: PropTypes.object.isRequired,
    tabs: PropTypes.object.isRequired,
    itemGet: PropTypes.func.isRequired,
    itemPost: PropTypes.func.isRequired,
    itemPut: PropTypes.func.isRequired,
    itemDelete: PropTypes.func.isRequired,
    tabOpen: PropTypes.func.isRequired,
    tabClose: PropTypes.func.isRequired,
    tabCloseAll: PropTypes.func.isRequired,
    defaultTab: PropTypes.string,
  };

  static defaultProps = {
    defaultTab: '',
  };

  static renderTab(props) {
    const {
      id,
      item,
      yaml,
    } = props;

    const {
      metadata: {
        name = id,
        namespace = NO_NAMESPACE,
      } = {},
      [YAML]: yamlOriginal,
    } = item || {};

    return (
      <Tabs.TabPane
        key={id}
        tab={
          <span
            className={classnames({
              [css.tabModified]: yaml && yaml !== yamlOriginal,
              [css.tabDetached]: !item,
            })}>
            {`${namespace} / ${name}`}
          </span>
        }
        closable
      />
    );
  }

  constructor(props) {
    super(props);
    this.state = { /* id: yaml */ };
    this.onDiscard = this.onEdit.bind(this, null);
  }

  shouldComponentUpdate(props) {
    return !props.flags[IS_LOADING_CATALOG];
  }

  componentDidMount() {
    const { defaultTab, tabOpen } = this.props;
    if (defaultTab) tabOpen(defaultTab);
  }

  tabsOnChange = id => {
    this.props.tabOpen(id);
  };

  tabsOnEdit = (id, action) => {
    switch (action) {
      case 'add':
        const {
          props: {
            tabs: {
              id: tabId,
            },
            items: {
              [tabId]: {
                [YAML]: itemYaml,
              } = {},
            },
            tabOpen,
          },
          state: {
            [tabId]: tabYaml,
          },
        } = this;
        return tabOpen(
          null,
          tabYaml || itemYaml,
          ({ id, yaml }) => this.setState({ [id]: yaml }),
        );
      case 'remove':
        const {
          props: {
            tabClose,
          },
        } = this;
        return tabClose(id);
      default:
        return false;
    }
  };

  onReload = () => {
    const { itemGet, tabs: { id }} = this.props;
    this.setState({ [id]: null });
    itemGet(id);
  };

  onEdit = yaml => {
    const { tabs: { id }} = this.props;
    this.setState({ [id]: yaml });
  };

  onSave = () => {
    const {
      props: {
        items,
        tabs: {
          id,
        },
        itemPost,
        itemPut,
      },
      state: {
        [id]: yaml,
      },
    } = this;
    return items[id] ? itemPut(id, yaml) : itemPost(id, yaml);
  };

  onDelete = () => {
    const { tabs: { id }, itemDelete } = this.props;
    return itemDelete(id);
  };

  onCloseAll = () => {
    this.props.tabCloseAll();
  };

  render() {
    const {
      props: {
        items,
        tabs: {
          id,
          ids: tabIds,
        },
      },
      state,
      state: {
        [id]: yamlEdited,
      },
      tabsOnChange,
      tabsOnEdit,
      onReload,
      onEdit,
      onSave,
      onDelete,
      onCloseAll,
      onDiscard,
    } = this;

    const item = items[id];
    const yamlOriginal = item && item[YAML];

    const dirty = yamlEdited && yamlEdited !== yamlOriginal;
    const yaml = yamlEdited || yamlOriginal;

    const hideTabs = false;
    const hideEditor = !tabIds.length;

    const showCloseAll = !!tabIds.length;

    return (
      <div
        className={classnames(
          css.content,
          {
            [css.hideTabs]: hideTabs,
            [css.hideEditor]: hideEditor,
          },
        )}>
        <Tabs
          type="editable-card"
          activeKey={id}
          onChange={tabsOnChange}
          onEdit={tabsOnEdit}
          tabBarExtraContent={
            <span>
              {
                showCloseAll &&
                <Button
                  className={css.button}
                  size="small"
                  onClick={onCloseAll}>
                  CloseAll
                </Button>
              }
              {
                (item && !dirty) &&
                <Button
                  className={css.button}
                  size="small"
                  onClick={onReload}>
                  Reload
                </Button>
              }
              {
                dirty &&
                <Button
                  className={css.button}
                  size="small"
                  onClick={onDiscard}>
                  Discard
                </Button>
              }
              {
                dirty &&
                <Button
                  className={css.button}
                  size="small"
                  type="primary"
                  onClick={onSave}>
                  Save
                </Button>
              }
              {
                item &&
                <Popconfirm
                  placement="bottomRight"
                  title="Are you sure to delete this item?"
                  okText="Yes" cancelText="No"
                  onConfirm={onDelete}>
                  <Button
                    className={css.button}
                    size="small"
                    type="danger">
                    Delete
                  </Button>
                </Popconfirm>
              }
            </span>
          }>
          {
            tabIds.map(itemId =>
              Content.renderTab({
                id: itemId,
                item: items[itemId],
                yaml: state[itemId],
              })
            )
          }
        </Tabs>
        <Editor
          value={yaml}
          onChange={onEdit}
        />
      </div>
    );
  }
}