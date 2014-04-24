/**
 * Created by michael on 2014/4/24.
 */

(function () {
    var exports = self;

    var VALUE_KEY = '_value',
        PARENT_KEY = '_parent';


    function firstCharCapitalize(string) {
        var ret = '';
        if (string) {
            ret = string[0].toUpperCase() + string.substring(1, string.length);
        }
        return ret;
    }

    function Event(config) {
        _.exports(config);
    }

    _.extend(Event.prototype, {
        stopPropagation: function() {
            this._isStopped = true;
        }
    });

    exports.Obj = function Obj(config) {
        _.extend(this, {
            _listeners: [],
            _handlers: {}
        });
        _.extend(this, config);
    };

    _.extend(Obj.prototype, Object.prototype, {
        addEventListener: function(target, type, callback) {
            var listeners = target._listeners,
                handlerName = firstCharCapitalize(type);
            if (listeners.indexOf(this) === -1) {
                listeners.push(this);
            }
            if (this._handlers[handlerName] === undefined) {
                this._handlers[handlerName] = [];
            }
            var handlers = this._handlers[handlerName];
            if (handlers.indexOf(callback) === -1) {
                handlers.push(callback);
            }
        },

        raiseEvent: function (event) {
            var handlerName = firstCharCapitalize(event.type),
                handler = this[handlerName];

            if (handler) {
                handler.call(this, event);
            }
            if (event._isStopped) {
                return;
            }

            _.find(this._listeners, function (listener) {
                _.find(listener._handlers, function (handlers, hn) {
                    if (hn === handlerName) {
                        _.find(handlers, function(handler) {
                            handler.call(listener, event);
                            return event._isStopped;
                        });
                        return event._isStopped;
                    }
                });
                return event._isStopped;
            });
        }
    });

    exports.Model = function Model(config) {
        var template = {
            _listeners: [],
            _handlers: {}
        };
        _.extend(this, template);
        _.extend(this, config);
        _.each(config, function (value, key) {
            if (!_.isObject(value)) {
                var leafNode = _.clone(template);
                leafNode[VALUE_KEY] = value;
                leafNode.isLeaf = true;
                this[key] = _.extend(leafNode, Model.prototype);
            } else {
                this[key] = new Model(value);
            }
            this[key][PARENT_KEY] = this;
        }, this);
    };
    _.extend(Model.prototype, Obj.prototype,{
        getParent: function () {
            return this[PARENT_KEY];
        },
        getChildrenKeys: function () {
            return _.without(_.keys(this), VALUE_KEY);
        },
        isLeafNode: function () {
            return this.isLeaf;
        },
        getValue: function () {
            return this[VALUE_KEY];
        },
        setValue: function (newValue) {
            if (this.isLeafNode() && this.getValue() !== newValue) {
                var oldValue = this.getValue();
                this[VALUE_KEY] = newValue;
                this.raiseEvent({
                    type: 'valueChanged',
                    target: this,
                    oldValue: oldValue,
                    newValue: newValue
                });
            }
        },
        raiseEvent: function (event) {
            Obj.prototype.raiseEvent.call(this, event);
            if (event._isStopped) {
                return;
            }
            var parent = this.getParent();
            if (parent) {
                parent.raiseEvent(event);
            }
        }
    });
}());