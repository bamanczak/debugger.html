/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow

/**
 * Utils for Jest
 * @module utils/test-head
 */

import { combineReducers } from "redux";
import sourceMaps from "devtools-source-map";
import reducers from "../reducers";
import actions from "../actions";
import * as selectors from "../selectors";
import { getHistory } from "../test/utils/history";
import configureStore from "../actions/utils/create-store";
import sourceQueue from "../utils/source-queue";

/**
 * This file contains older interfaces used by tests that have not been
 * converted to use test-mockup.js
 */

/**
 * @memberof utils/test-head
 * @static
 */
function createStore(client: any, initialState: any = {}, sourceMapsMock: any) {
  const store = configureStore({
    log: false,
    history: getHistory(),
    makeThunkArgs: args => {
      return {
        ...args,
        client,
        sourceMaps: sourceMapsMock !== undefined ? sourceMapsMock : sourceMaps
      };
    }
  })(combineReducers(reducers), initialState);
  sourceQueue.clear();
  sourceQueue.initialize({
    newSources: sources => store.dispatch(actions.newSources(sources))
  });

  return store;
}

/**
 * @memberof utils/test-head
 * @static
 */
function commonLog(msg: string, data: any = {}) {
  console.log(`[INFO] ${msg} ${JSON.stringify(data)}`);
}

function makeFrame({ id, sourceId }: Object, opts: Object = {}) {
  return {
    id,
    scope: { bindings: { variables: {}, arguments: [] } },
    location: { sourceId, line: 4 },
    ...opts
  };
}

function makeSourceRaw(name: string, props: any = {}) {
  return {
    id: name,
    loadedState: "unloaded",
    url: `http://localhost:8000/examples/${name}`,
    ...props
  };
}

/**
 * @memberof utils/test-head
 * @static
 */
function makeSource(name: string, props: any = {}) {
  return {
    source: makeSourceRaw(name, props),
    sourceActor: {
      actor: `${name}-actor`,
      source: name,
      thread: "FakeThread"
    }
  };
}

function makeOriginalSource(name: string, props?: Object) {
  const source = makeSourceRaw(name, props);
  return { source: { ...source, id: `${name}/originalSource` } };
}

function makeFuncLocation(startLine, endLine) {
  if (!endLine) {
    endLine = startLine + 1;
  }
  return {
    start: {
      line: startLine
    },
    end: {
      line: endLine
    }
  };
}

function makeSymbolDeclaration(
  name: string,
  start: number,
  end: ?number,
  klass: ?string
) {
  return {
    id: `${name}:${start}`,
    name,
    location: makeFuncLocation(start, end),
    klass
  };
}

/**
 * @memberof utils/test-head
 * @static
 */
function waitForState(store: any, predicate: any): Promise<void> {
  return new Promise(resolve => {
    let ret = predicate(store.getState());
    if (ret) {
      resolve(ret);
    }

    const unsubscribe = store.subscribe(() => {
      ret = predicate(store.getState());
      if (ret) {
        unsubscribe();
        resolve(ret);
      }
    });
  });
}

function getTelemetryEvents(eventName: string) {
  return window.dbg._telemetry.events[eventName] || [];
}

export {
  actions,
  selectors,
  reducers,
  createStore,
  commonLog,
  getTelemetryEvents,
  makeFrame,
  makeSource,
  makeOriginalSource,
  makeSymbolDeclaration,
  waitForState,
  getHistory
};
