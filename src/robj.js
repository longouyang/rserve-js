(function() {

function make_basic(type, proto) {
    proto = proto || {
        json: function() { 
            throw "json() unsupported for type " + this.type;
        }
    };
    var wrapped_proto = {
        json: function() {
            var result = proto.json.call(this);
            result.r_type = type;
            if (!_.isUndefined(this.attributes))
                result.r_attributes = _.object(_.map(
                    this.attributes.value,
                    function(v) { return [v.name, v.value.json()]; }));
            return result;
        }
    };
    return function(v, attrs) {
        function r_object() {
            this.type = type;
            this.value = v;
            this.attributes = attrs;
        }
        r_object.prototype = wrapped_proto;
        var result = new r_object();
        return result;
    };
}

Rserve.Robj = {
    "null": function(attributes) {
        return { 
            type: "null", 
            value: null,
            attributes: attributes,
            json: function() { return null; }
        };
    },

    clos: function(formals, body, attributes) {
        return {
            type: "clos",
            value: { formals: formals,
                     body: body },
            attributes: attributes,
            json: function() { throw "json() unsupported for type clos"; }
        };
    },

    vector: make_basic("vector", {
        json: function() {
            var values = _.map(this.value, function (x) { return x.json(); });
            if (_.isUndefined(this.attributes)) {
                return values;
            } else {
                if(this.attributes.value[0].name!="names")
                    throw "expected names here";
                var keys   = this.attributes.value[0].value.value;
                var result = {};
                _.each(keys, function(key, i) {
                    result[key] = values[i];
                });
                return result;
            }
        }
    }),
    symbol: make_basic("symbol", { 
        json: function() {
            return this.value;
        }
    }),
    list: make_basic("list"),
    lang: make_basic("lang", {
        json: function() {
            var values = _.map(this.value, function (x) { return x.json(); });
            if (_.isUndefined(this.attributes)) {
                return values;
            } else {
                if(this.attributes.value[0].name!="names")
                    throw "expected names here";
                var keys   = this.attributes.value[0].value.value;
                var result = {};
                _.each(keys, function(key, i) {
                    result[key] = values[i];
                });
                return result;
            }
        }
    }),
    tagged_list: make_basic("tagged_list", {
        json: function() {
            function classify_list(list) {
                if (_.all(list, function(elt) { return elt.name === null; })) {
                    return "plain_list";
                } else if (_.all(list, function(elt) { return elt.name !== null; })) {
                    return "plain_object";
                } else
                    return "mixed_list";
            }
            var list = this.value.slice(1);
            switch (classify_list(list)) {
            case "plain_list":
                return _.map(list, function(elt) { return elt.value.json(); });
            case "plain_object":
                return _.object(_.map(list, function(elt) { 
                    return [elt.name, elt.value.json()];
                }));
            case "mixed_list":
                return list;
            default:
                throw "Internal Error";
            }
        }
    }),
    tagged_lang: make_basic("tagged_lang", {
        json: function() {
            var pair_vec = _.map(this.value, function(elt) { return [elt.name, elt.value.json()]; });
            return pair_vec;
        }
    }),
    vector_exp: make_basic("vector_exp"),
    int_array: make_basic("int_array", {
        json: function() {
            if(this.attributes && this.attributes.type==='tagged_list' 
               && this.attributes.value[0].name==='levels'
               && this.attributes.value[0].value.type==='string_array') {
                var levels = this.attributes.value[0].value.value;
                var arr = _.map(this.value, function(factor) { return levels[factor-1]; });
                arr.levels = levels;
                return arr;
            }
            else {
                if (this.value.length === 1)
                    return this.value[0];
                else
                    return this.value;
            }
        }
    }),
    double_array: make_basic("double_array", {
        json: function() {
            if (this.value.length === 1 && _.isUndefined(this.attributes))
                return this.value[0];
            else
                return this.value;
        }
    }),
    string_array: make_basic("string_array", {
        json: function() {
            if (this.value.length === 1 && _.isUndefined(this.attributes))
                return this.value[0];
            else
                return this.value;
        }
    }),
    bool_array: make_basic("bool_array", {
        json: function() {
            if (this.value.length === 1 && _.isUndefined(this.attributes))
                return this.value[0];
            else
                return this.value;
        }
    }),
    string: make_basic("string", {
        json: function() {
            return this.value;
        }
    })
};

Rserve.to_javascript = function(value)
{
    if (value.type === 'sexp') {
        return value.json();
    }
};

})();
