var _extends =
  Object.assign ||
  function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
function _asyncToGenerator(fn) {
  return function() {
    var gen = fn.apply(this, arguments);
    return new Promise(function(resolve, reject) {
      function step(key, arg) {
        try {
          var info = gen[key](arg);
          var value = info.value;
        } catch (error) {
          reject(error);
          return;
        }
        if (info.done) {
          resolve(value);
        } else {
          return Promise.resolve(value).then(
            function(value) {
              step('next', value);
            },
            function(err) {
              step('throw', err);
            }
          );
        }
      }
      return step('next');
    });
  };
}
import groupBy from 'group-by';

import { LocalStorageAdapter, InMemoryAdapter } from './adapters';
import { excludeSpecificTasks, lifo, fifo } from './utils';

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
/* eslint no-underscore-dangle: [2, { "allow": ["_id"] }] */
/* eslint class-methods-use-this: ["error", { "exceptMethods": ["generateId"] }] */

export default class StorageCapsule {
  constructor(config, storage) {
    this.config = config;
    this.storage = this.initialize(storage);
  }

  initialize(Storage) {
    if (typeof Storage === 'object') {
      return Storage;
    } else if (typeof Storage === 'function') {
      return new Storage(this.config);
    } else if (this.config.get('storage') === 'localstorage') {
      return new LocalStorageAdapter(this.config);
    }
    return new InMemoryAdapter(this.config);
  }

  /**
   * Select a channel by channel name
   *
   * @param  {String} name
   * @return {StorageCapsule}
   *
   * @api public
   */
  channel(name) {
    this.storageChannel = name;
    return this;
  }

  /**
   * Fetch tasks from storage with ordered
   *
   * @return {any[]}
   *
   * @api public
   */
  fetch() {
    var _this = this;
    return _asyncToGenerator(function*() {
      const all = (yield _this.all()).filter(excludeSpecificTasks);
      const tasks = groupBy(all, 'priority');
      return Object.keys(tasks)
        .map(function(key) {
          return parseInt(key, 10);
        })
        .sort(function(a, b) {
          return b - a;
        })
        .reduce(_this.reduceTasks(tasks), []);
    })();
  }

  /**
   * Save task to storage
   *
   * @param  {ITask} task
   * @return {String|Boolean}
   *
   * @api public
   */
  save(task) {
    var _this2 = this;
    return _asyncToGenerator(function*() {
      if (typeof task !== 'object') return false;

      // get all tasks current channel's
      const tasks = yield _this2.storage.get(_this2.storageChannel);

      // Check the channel limit.
      // If limit is exceeded, does not insert new task
      if (yield _this2.isExceeded()) {
        console.warn(
          `Task limit exceeded: The '${
            _this2.storageChannel
          }' channel limit is ${_this2.config.get('limit')}`
        );
        return false;
      }

      // prepare all properties before save
      // example: createdAt etc.
      const newTask = _this2.prepareTask(task);

      // add task to storage
      tasks.push(newTask);

      // save tasks
      yield _this2.storage.set(_this2.storageChannel, tasks);

      return newTask._id;
    })();
  }

  /**
   * Update channel store.
   *
   * @return {string}
   *   The value. This annotation can be used for type hinting purposes.
   */
  update(id, update) {
    var _this3 = this;
    return _asyncToGenerator(function*() {
      const data = yield _this3.all();
      const index = data.findIndex(function(t) {
        return t._id === id;
      });

      // if index not found, return false
      if (index < 0) return false;

      // merge existing object with given update object
      data[index] = Object.assign({}, data[index], update);

      // save to the storage as string
      yield _this3.storage.set(_this3.storageChannel, data);

      return true;
    })();
  }

  /**
   * Remove task from storage
   *
   * @param  {String} id
   * @return {Boolean}
   *
   * @api public
   */
  delete(id) {
    var _this4 = this;
    return _asyncToGenerator(function*() {
      const data = yield _this4.all();
      const index = data.findIndex(function(d) {
        return d._id === id;
      });

      if (index < 0) return false;

      delete data[index];

      yield _this4.storage.set(
        _this4.storageChannel,
        data.filter(function(d) {
          return d;
        })
      );

      return true;
    })();
  }

  /**
   * Get all tasks
   *
   * @return {Any[]}
   *
   * @api public
   */
  all() {
    var _this5 = this;
    return _asyncToGenerator(function*() {
      const items = yield _this5.storage.get(_this5.storageChannel);
      return items;
    })();
  }

  /**
   * Generate unique id
   *
   * @return {String}
   *
   * @api public
   */
  generateId() {
    return ((1 + Math.random()) * 0x10000).toString(16);
  }

  /**
   * Add some necessary properties
   *
   * @param  {String} id
   * @return {ITask}
   *
   * @api public
   */
  prepareTask(task) {
    const newTask = _extends({}, task);
    newTask.createdAt = Date.now();
    newTask._id = this.generateId();
    return newTask;
  }

  /**
   * Add some necessary properties
   *
   * @param  {ITask[]} tasks
   * @return {Function}
   *
   * @api public
   */
  reduceTasks(tasks) {
    const reduceFunc = (result, key) => {
      if (this.config.get('principle') === 'lifo') {
        return result.concat(tasks[key].sort(lifo));
      }
      return result.concat(tasks[key].sort(fifo));
    };

    return reduceFunc.bind(this);
  }

  /**
   * Task limit checker
   *
   * @return {Boolean}
   *
   * @api public
   */
  isExceeded() {
    var _this6 = this;
    return _asyncToGenerator(function*() {
      const limit = _this6.config.get('limit');
      const tasks = (yield _this6.all()).filter(excludeSpecificTasks);
      return !(limit === -1 || limit > tasks.length);
    })();
  }

  /**
   * Clear tasks with given channel name
   *
   * @param  {String} channel
   * @return {void}
   *
   * @api public
   */
  clear(channel) {
    var _this7 = this;
    return _asyncToGenerator(function*() {
      yield _this7.storage.clear(channel);
    })();
  }
}
