
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\Circle.svelte generated by Svelte v3.24.0 */

    const file = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\Circle.svelte";

    function create_fragment(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "circle svelte-dmy3ge");
    			set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			set_style(div, "--color", /*color*/ ctx[1]);
    			add_location(div, file, 25, 0, 583);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size, unit*/ 5) {
    				set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 2) {
    				set_style(div, "--color", /*color*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { size = 60 } = $$props;
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	const writable_props = ["size", "color", "unit"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Circle> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Circle", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(2, unit = $$props.unit);
    	};

    	$$self.$capture_state = () => ({ size, color, unit });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(2, unit = $$props.unit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, color, unit];
    }

    class Circle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { size: 0, color: 1, unit: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Circle",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get size() {
    		throw new Error("<Circle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Circle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Circle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Circle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<Circle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<Circle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\Circle2.svelte generated by Svelte v3.24.0 */

    const file$1 = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\Circle2.svelte";

    function create_fragment$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "circle svelte-gkf9c4");
    			set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[1]);
    			set_style(div, "--colorInner", /*colorInner*/ ctx[4]);
    			set_style(div, "--colorCenter", /*colorCenter*/ ctx[3]);
    			set_style(div, "--colorOuter", /*colorOuter*/ ctx[2]);
    			add_location(div, file$1, 53, 0, 1156);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size, unit*/ 3) {
    				set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*colorInner*/ 16) {
    				set_style(div, "--colorInner", /*colorInner*/ ctx[4]);
    			}

    			if (dirty & /*colorCenter*/ 8) {
    				set_style(div, "--colorCenter", /*colorCenter*/ ctx[3]);
    			}

    			if (dirty & /*colorOuter*/ 4) {
    				set_style(div, "--colorOuter", /*colorOuter*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { size = 60 } = $$props;
    	let { unit = "px" } = $$props;
    	let { colorOuter = "#FF3E00" } = $$props;
    	let { colorCenter = "#40B3FF" } = $$props;
    	let { colorInner = "#676778" } = $$props;
    	const writable_props = ["size", "unit", "colorOuter", "colorCenter", "colorInner"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Circle2> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Circle2", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("unit" in $$props) $$invalidate(1, unit = $$props.unit);
    		if ("colorOuter" in $$props) $$invalidate(2, colorOuter = $$props.colorOuter);
    		if ("colorCenter" in $$props) $$invalidate(3, colorCenter = $$props.colorCenter);
    		if ("colorInner" in $$props) $$invalidate(4, colorInner = $$props.colorInner);
    	};

    	$$self.$capture_state = () => ({
    		size,
    		unit,
    		colorOuter,
    		colorCenter,
    		colorInner
    	});

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("unit" in $$props) $$invalidate(1, unit = $$props.unit);
    		if ("colorOuter" in $$props) $$invalidate(2, colorOuter = $$props.colorOuter);
    		if ("colorCenter" in $$props) $$invalidate(3, colorCenter = $$props.colorCenter);
    		if ("colorInner" in $$props) $$invalidate(4, colorInner = $$props.colorInner);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, unit, colorOuter, colorCenter, colorInner];
    }

    class Circle2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			size: 0,
    			unit: 1,
    			colorOuter: 2,
    			colorCenter: 3,
    			colorInner: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Circle2",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get size() {
    		throw new Error("<Circle2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Circle2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<Circle2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<Circle2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get colorOuter() {
    		throw new Error("<Circle2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set colorOuter(value) {
    		throw new Error("<Circle2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get colorCenter() {
    		throw new Error("<Circle2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set colorCenter(value) {
    		throw new Error("<Circle2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get colorInner() {
    		throw new Error("<Circle2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set colorInner(value) {
    		throw new Error("<Circle2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\Circle3.svelte generated by Svelte v3.24.0 */

    const file$2 = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\Circle3.svelte";

    function create_fragment$2(ctx) {
    	let div10;
    	let div9;
    	let div8;
    	let div1;
    	let div0;
    	let t1;
    	let div3;
    	let div2;
    	let t3;
    	let div5;
    	let div4;
    	let t5;
    	let div7;
    	let div6;

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			div9 = element("div");
    			div8 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = " ";
    			t1 = space();
    			div3 = element("div");
    			div2 = element("div");
    			div2.textContent = " ";
    			t3 = space();
    			div5 = element("div");
    			div4 = element("div");
    			div4.textContent = " ";
    			t5 = space();
    			div7 = element("div");
    			div6 = element("div");
    			div6.textContent = " ";
    			attr_dev(div0, "class", "ball ball-top-left svelte-1t1q7st");
    			add_location(div0, file$2, 95, 8, 2102);
    			attr_dev(div1, "class", "single-ball svelte-1t1q7st");
    			add_location(div1, file$2, 94, 6, 2067);
    			attr_dev(div2, "class", "ball ball-top-right svelte-1t1q7st");
    			add_location(div2, file$2, 98, 8, 2206);
    			attr_dev(div3, "class", "contener_mixte");
    			add_location(div3, file$2, 97, 6, 2168);
    			attr_dev(div4, "class", "ball ball-bottom-left svelte-1t1q7st");
    			add_location(div4, file$2, 101, 8, 2311);
    			attr_dev(div5, "class", "contener_mixte");
    			add_location(div5, file$2, 100, 6, 2273);
    			attr_dev(div6, "class", "ball ball-bottom-right svelte-1t1q7st");
    			add_location(div6, file$2, 104, 8, 2418);
    			attr_dev(div7, "class", "contener_mixte");
    			add_location(div7, file$2, 103, 6, 2380);
    			attr_dev(div8, "class", "ball-container svelte-1t1q7st");
    			add_location(div8, file$2, 93, 4, 2031);
    			attr_dev(div9, "class", "inner svelte-1t1q7st");
    			add_location(div9, file$2, 92, 2, 2006);
    			attr_dev(div10, "class", "wrapper svelte-1t1q7st");
    			set_style(div10, "--size", /*size*/ ctx[0] + /*unit*/ ctx[1]);
    			set_style(div10, "--floatSize", /*size*/ ctx[0]);
    			set_style(div10, "--ballTopLeftColor", /*ballTopLeft*/ ctx[2]);
    			set_style(div10, "--ballTopRightColor", /*ballTopRight*/ ctx[3]);
    			set_style(div10, "--ballBottomLeftColor", /*ballBottomLeft*/ ctx[4]);
    			set_style(div10, "--ballBottomRightColor", /*ballBottomRight*/ ctx[5]);
    			add_location(div10, file$2, 88, 0, 1767);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div1);
    			append_dev(div1, div0);
    			append_dev(div8, t1);
    			append_dev(div8, div3);
    			append_dev(div3, div2);
    			append_dev(div8, t3);
    			append_dev(div8, div5);
    			append_dev(div5, div4);
    			append_dev(div8, t5);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size, unit*/ 3) {
    				set_style(div10, "--size", /*size*/ ctx[0] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*size*/ 1) {
    				set_style(div10, "--floatSize", /*size*/ ctx[0]);
    			}

    			if (dirty & /*ballTopLeft*/ 4) {
    				set_style(div10, "--ballTopLeftColor", /*ballTopLeft*/ ctx[2]);
    			}

    			if (dirty & /*ballTopRight*/ 8) {
    				set_style(div10, "--ballTopRightColor", /*ballTopRight*/ ctx[3]);
    			}

    			if (dirty & /*ballBottomLeft*/ 16) {
    				set_style(div10, "--ballBottomLeftColor", /*ballBottomLeft*/ ctx[4]);
    			}

    			if (dirty & /*ballBottomRight*/ 32) {
    				set_style(div10, "--ballBottomRightColor", /*ballBottomRight*/ ctx[5]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { size = 60 } = $$props;
    	let { unit = "px" } = $$props;
    	let { ballTopLeft = "#FF3E00" } = $$props;
    	let { ballTopRight = "#F8B334" } = $$props;
    	let { ballBottomLeft = "#40B3FF" } = $$props;
    	let { ballBottomRight = "#676778" } = $$props;

    	const writable_props = [
    		"size",
    		"unit",
    		"ballTopLeft",
    		"ballTopRight",
    		"ballBottomLeft",
    		"ballBottomRight"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Circle3> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Circle3", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("unit" in $$props) $$invalidate(1, unit = $$props.unit);
    		if ("ballTopLeft" in $$props) $$invalidate(2, ballTopLeft = $$props.ballTopLeft);
    		if ("ballTopRight" in $$props) $$invalidate(3, ballTopRight = $$props.ballTopRight);
    		if ("ballBottomLeft" in $$props) $$invalidate(4, ballBottomLeft = $$props.ballBottomLeft);
    		if ("ballBottomRight" in $$props) $$invalidate(5, ballBottomRight = $$props.ballBottomRight);
    	};

    	$$self.$capture_state = () => ({
    		size,
    		unit,
    		ballTopLeft,
    		ballTopRight,
    		ballBottomLeft,
    		ballBottomRight
    	});

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("unit" in $$props) $$invalidate(1, unit = $$props.unit);
    		if ("ballTopLeft" in $$props) $$invalidate(2, ballTopLeft = $$props.ballTopLeft);
    		if ("ballTopRight" in $$props) $$invalidate(3, ballTopRight = $$props.ballTopRight);
    		if ("ballBottomLeft" in $$props) $$invalidate(4, ballBottomLeft = $$props.ballBottomLeft);
    		if ("ballBottomRight" in $$props) $$invalidate(5, ballBottomRight = $$props.ballBottomRight);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, unit, ballTopLeft, ballTopRight, ballBottomLeft, ballBottomRight];
    }

    class Circle3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			size: 0,
    			unit: 1,
    			ballTopLeft: 2,
    			ballTopRight: 3,
    			ballBottomLeft: 4,
    			ballBottomRight: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Circle3",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get size() {
    		throw new Error("<Circle3>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Circle3>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<Circle3>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<Circle3>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ballTopLeft() {
    		throw new Error("<Circle3>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ballTopLeft(value) {
    		throw new Error("<Circle3>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ballTopRight() {
    		throw new Error("<Circle3>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ballTopRight(value) {
    		throw new Error("<Circle3>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ballBottomLeft() {
    		throw new Error("<Circle3>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ballBottomLeft(value) {
    		throw new Error("<Circle3>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ballBottomRight() {
    		throw new Error("<Circle3>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ballBottomRight(value) {
    		throw new Error("<Circle3>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const calculateRgba = (input, opacity) => {
      let color;
      if (input[0] === `#`) {
        color = input.slice(1);
      }

      if (color.length === 3) {
        let res = ``;
        color.split(``).forEach(c => {
          res += c;
          res += c;
        });
        color = res;
      }

      const rgbValues = color
        .match(/.{2}/g)
        .map(hex => parseInt(hex, 16))
        .join(`, `);
      return `rgba(${rgbValues}, ${opacity})`;
    };

    const range = (size, startAt = 0) =>
      [...Array(size).keys()].map(i => i + startAt);

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\DoubleBounce.svelte generated by Svelte v3.24.0 */
    const file$3 = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\DoubleBounce.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (36:2) {#each range(2, 1) as version}
    function create_each_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "circle svelte-h1a2xs");
    			set_style(div, "animation", "2.1s " + (/*version*/ ctx[3] === 1 ? `1s` : `0s`) + " infinite ease-in-out");
    			add_location(div, file$3, 36, 2, 767);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(36:2) {#each range(2, 1) as version}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let each_value = range(2, 1);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "wrapper svelte-h1a2xs");
    			set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			set_style(div, "--color", /*color*/ ctx[1]);
    			add_location(div, file$3, 34, 0, 661);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*range*/ 0) {
    				each_value = range(2, 1);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*size, unit*/ 5) {
    				set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 2) {
    				set_style(div, "--color", /*color*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { size = 60 } = $$props;
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	const writable_props = ["size", "color", "unit"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DoubleBounce> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("DoubleBounce", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(2, unit = $$props.unit);
    	};

    	$$self.$capture_state = () => ({ range, size, color, unit });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(2, unit = $$props.unit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, color, unit];
    }

    class DoubleBounce extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { size: 0, color: 1, unit: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DoubleBounce",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get size() {
    		throw new Error("<DoubleBounce>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<DoubleBounce>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<DoubleBounce>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<DoubleBounce>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<DoubleBounce>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<DoubleBounce>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\GoogleSpin.svelte generated by Svelte v3.24.0 */

    const file$4 = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\GoogleSpin.svelte";

    function create_fragment$4(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "spinner spinner--google svelte-e9uauf");
    			attr_dev(div, "style", /*styles*/ ctx[0]);
    			add_location(div, file$4, 5, 0, 116);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*styles*/ 1) {
    				attr_dev(div, "style", /*styles*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { size = "40px" } = $$props;
    	const writable_props = ["size"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GoogleSpin> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("GoogleSpin", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    	};

    	$$self.$capture_state = () => ({ size, styles });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    		if ("styles" in $$props) $$invalidate(0, styles = $$props.styles);
    	};

    	let styles;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*size*/ 2) {
    			 $$invalidate(0, styles = [`width: ${size}`, `height: ${size}`].join(";"));
    		}
    	};

    	return [styles, size];
    }

    class GoogleSpin extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { size: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GoogleSpin",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get size() {
    		throw new Error("<GoogleSpin>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<GoogleSpin>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\ScaleOut.svelte generated by Svelte v3.24.0 */

    const file$5 = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\ScaleOut.svelte";

    function create_fragment$5(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", "circle svelte-4a3dxb");
    			add_location(div0, file$5, 35, 2, 727);
    			attr_dev(div1, "class", "wrapper svelte-4a3dxb");
    			set_style(div1, "--size", /*size*/ ctx[0] + /*unit*/ ctx[3]);
    			set_style(div1, "--color", /*color*/ ctx[1]);
    			set_style(div1, "--duration", /*duration*/ ctx[2]);
    			add_location(div1, file$5, 31, 0, 623);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size, unit*/ 9) {
    				set_style(div1, "--size", /*size*/ ctx[0] + /*unit*/ ctx[3]);
    			}

    			if (dirty & /*color*/ 2) {
    				set_style(div1, "--color", /*color*/ ctx[1]);
    			}

    			if (dirty & /*duration*/ 4) {
    				set_style(div1, "--duration", /*duration*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { size = 60 } = $$props;
    	let { color = "#FF3E00" } = $$props;
    	let { duration = "1.0s" } = $$props;
    	let { unit = "px" } = $$props;
    	const writable_props = ["size", "color", "duration", "unit"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ScaleOut> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ScaleOut", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("duration" in $$props) $$invalidate(2, duration = $$props.duration);
    		if ("unit" in $$props) $$invalidate(3, unit = $$props.unit);
    	};

    	$$self.$capture_state = () => ({ size, color, duration, unit });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("duration" in $$props) $$invalidate(2, duration = $$props.duration);
    		if ("unit" in $$props) $$invalidate(3, unit = $$props.unit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, color, duration, unit];
    }

    class ScaleOut extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { size: 0, color: 1, duration: 2, unit: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ScaleOut",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get size() {
    		throw new Error("<ScaleOut>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<ScaleOut>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<ScaleOut>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<ScaleOut>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get duration() {
    		throw new Error("<ScaleOut>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<ScaleOut>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<ScaleOut>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<ScaleOut>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\SpinLine.svelte generated by Svelte v3.24.0 */

    const file$6 = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\SpinLine.svelte";

    function create_fragment$6(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", "line svelte-1hlkuhp");
    			add_location(div0, file$6, 83, 2, 1665);
    			attr_dev(div1, "class", "wrapper svelte-1hlkuhp");
    			set_style(div1, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			set_style(div1, "--color", /*color*/ ctx[1]);
    			set_style(div1, "--stroke", /*stroke*/ ctx[3]);
    			set_style(div1, "--floatSize", /*size*/ ctx[0]);
    			add_location(div1, file$6, 79, 0, 1544);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size, unit*/ 5) {
    				set_style(div1, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 2) {
    				set_style(div1, "--color", /*color*/ ctx[1]);
    			}

    			if (dirty & /*stroke*/ 8) {
    				set_style(div1, "--stroke", /*stroke*/ ctx[3]);
    			}

    			if (dirty & /*size*/ 1) {
    				set_style(div1, "--floatSize", /*size*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { size = 60 } = $$props;
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	let { stroke = parseInt(size / 12) + unit } = $$props;
    	const writable_props = ["size", "color", "unit", "stroke"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SpinLine> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("SpinLine", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(2, unit = $$props.unit);
    		if ("stroke" in $$props) $$invalidate(3, stroke = $$props.stroke);
    	};

    	$$self.$capture_state = () => ({ size, color, unit, stroke });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(2, unit = $$props.unit);
    		if ("stroke" in $$props) $$invalidate(3, stroke = $$props.stroke);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, color, unit, stroke];
    }

    class SpinLine extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { size: 0, color: 1, unit: 2, stroke: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SpinLine",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get size() {
    		throw new Error("<SpinLine>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<SpinLine>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<SpinLine>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<SpinLine>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<SpinLine>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<SpinLine>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get stroke() {
    		throw new Error("<SpinLine>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set stroke(value) {
    		throw new Error("<SpinLine>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\Stretch.svelte generated by Svelte v3.24.0 */
    const file$7 = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\Stretch.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (42:2) {#each range(5, 1) as version}
    function create_each_block$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "rect svelte-1uxpkwt");

    			set_style(div, "animation-delay", /*version*/ ctx[4] === 2
    			? "-1.1s"
    			: /*version*/ ctx[4] === 3
    				? "-1s"
    				: /*version*/ ctx[4] === 4
    					? "-0.9s"
    					: /*version*/ ctx[4] === 5 ? "-0.8s" : "");

    			add_location(div, file$7, 42, 2, 831);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(42:2) {#each range(5, 1) as version}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div;
    	let each_value = range(5, 1);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "wrapper svelte-1uxpkwt");
    			set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[3]);
    			set_style(div, "--color", /*color*/ ctx[1]);
    			set_style(div, "--duration", /*duration*/ ctx[2]);
    			add_location(div, file$7, 37, 0, 693);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*range*/ 0) {
    				each_value = range(5, 1);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*size, unit*/ 9) {
    				set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[3]);
    			}

    			if (dirty & /*color*/ 2) {
    				set_style(div, "--color", /*color*/ ctx[1]);
    			}

    			if (dirty & /*duration*/ 4) {
    				set_style(div, "--duration", /*duration*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { size = 60 } = $$props;
    	let { color = "#FF3E00" } = $$props;
    	let { duration = "1.2s" } = $$props;
    	let { unit = "px" } = $$props;
    	const writable_props = ["size", "color", "duration", "unit"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Stretch> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Stretch", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("duration" in $$props) $$invalidate(2, duration = $$props.duration);
    		if ("unit" in $$props) $$invalidate(3, unit = $$props.unit);
    	};

    	$$self.$capture_state = () => ({ range, size, color, duration, unit });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("duration" in $$props) $$invalidate(2, duration = $$props.duration);
    		if ("unit" in $$props) $$invalidate(3, unit = $$props.unit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, color, duration, unit];
    }

    class Stretch extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { size: 0, color: 1, duration: 2, unit: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Stretch",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get size() {
    		throw new Error("<Stretch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Stretch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Stretch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Stretch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get duration() {
    		throw new Error("<Stretch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Stretch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<Stretch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<Stretch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\BarLoader.svelte generated by Svelte v3.24.0 */
    const file$8 = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\BarLoader.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (72:2) {#each range(2, 1) as version}
    function create_each_block$2(ctx) {
    	let div;
    	let div_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", div_class_value = "lines small-lines " + /*version*/ ctx[4] + " svelte-1e28p2");
    			set_style(div, "--color", /*color*/ ctx[1]);
    			add_location(div, file$8, 72, 2, 1507);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*color*/ 2) {
    				set_style(div, "--color", /*color*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(72:2) {#each range(2, 1) as version}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div;
    	let each_value = range(2, 1);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "wrapper svelte-1e28p2");
    			set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			set_style(div, "--rgba", /*rgba*/ ctx[3]);
    			add_location(div, file$8, 70, 0, 1404);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*range, color*/ 2) {
    				each_value = range(2, 1);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*size, unit*/ 5) {
    				set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { size = 60 } = $$props;
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	let rgba = calculateRgba(color, 0.2);
    	const writable_props = ["size", "color", "unit"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BarLoader> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("BarLoader", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(2, unit = $$props.unit);
    	};

    	$$self.$capture_state = () => ({
    		calculateRgba,
    		range,
    		size,
    		color,
    		unit,
    		rgba
    	});

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(2, unit = $$props.unit);
    		if ("rgba" in $$props) $$invalidate(3, rgba = $$props.rgba);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, color, unit, rgba];
    }

    class BarLoader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { size: 0, color: 1, unit: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BarLoader",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get size() {
    		throw new Error("<BarLoader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<BarLoader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<BarLoader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<BarLoader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<BarLoader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<BarLoader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\Jumper.svelte generated by Svelte v3.24.0 */
    const file$9 = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\Jumper.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (36:2) {#each range(3, 1) as version}
    function create_each_block$3(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "circle svelte-195boue");

    			set_style(div, "animation-delay", /*version*/ ctx[3] === 1
    			? `0s`
    			: /*version*/ ctx[3] === 2
    				? `0.33333s`
    				: /*version*/ ctx[3] === 3 ? `0.66666s` : `0s`);

    			add_location(div, file$9, 36, 2, 752);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(36:2) {#each range(3, 1) as version}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div;
    	let each_value = range(3, 1);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "wrapper svelte-195boue");
    			set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			set_style(div, "--color", /*color*/ ctx[1]);
    			add_location(div, file$9, 34, 0, 646);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*range*/ 0) {
    				each_value = range(3, 1);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*size, unit*/ 5) {
    				set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 2) {
    				set_style(div, "--color", /*color*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { size = 60 } = $$props;
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	const writable_props = ["size", "color", "unit"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Jumper> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Jumper", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(2, unit = $$props.unit);
    	};

    	$$self.$capture_state = () => ({ range, size, color, unit });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(2, unit = $$props.unit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, color, unit];
    }

    class Jumper extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { size: 0, color: 1, unit: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Jumper",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get size() {
    		throw new Error("<Jumper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Jumper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Jumper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Jumper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<Jumper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<Jumper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\RingLoader.svelte generated by Svelte v3.24.0 */
    const file$a = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\RingLoader.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (54:2) {#each range(2, 1) as version}
    function create_each_block$4(ctx) {
    	let div;
    	let div_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", div_class_value = "border " + /*version*/ ctx[3] + " svelte-1cgklou");
    			add_location(div, file$a, 54, 2, 1238);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(54:2) {#each range(2, 1) as version}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div;
    	let each_value = range(2, 1);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "wrapper svelte-1cgklou");
    			set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			set_style(div, "--color", /*color*/ ctx[1]);
    			add_location(div, file$a, 52, 0, 1132);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*range*/ 0) {
    				each_value = range(2, 1);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*size, unit*/ 5) {
    				set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 2) {
    				set_style(div, "--color", /*color*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { size = 60 } = $$props;
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	const writable_props = ["size", "color", "unit"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<RingLoader> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("RingLoader", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(2, unit = $$props.unit);
    	};

    	$$self.$capture_state = () => ({ range, size, color, unit });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(2, unit = $$props.unit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, color, unit];
    }

    class RingLoader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { size: 0, color: 1, unit: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RingLoader",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get size() {
    		throw new Error("<RingLoader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<RingLoader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<RingLoader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<RingLoader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<RingLoader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<RingLoader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\SyncLoader.svelte generated by Svelte v3.24.0 */
    const file$b = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\SyncLoader.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (58:2) {#each range(3, 1) as i}
    function create_each_block$5(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "dot svelte-q9s07q");
    			set_style(div, "--dotSize", /*size*/ ctx[0] * 0.25 + /*unit*/ ctx[2]);
    			set_style(div, "--color", /*color*/ ctx[1]);
    			set_style(div, "animation-delay", /*i*/ ctx[3] * 0.07 + "s");
    			add_location(div, file$b, 58, 2, 1290);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*size, unit*/ 5) {
    				set_style(div, "--dotSize", /*size*/ ctx[0] * 0.25 + /*unit*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 2) {
    				set_style(div, "--color", /*color*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(58:2) {#each range(3, 1) as i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div;
    	let each_value = range(3, 1);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "wrapper svelte-q9s07q");
    			set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			add_location(div, file$b, 56, 0, 1209);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size, unit, color, range*/ 7) {
    				each_value = range(3, 1);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*size, unit*/ 5) {
    				set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { size = 60 } = $$props;
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	const writable_props = ["size", "color", "unit"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SyncLoader> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("SyncLoader", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(2, unit = $$props.unit);
    	};

    	$$self.$capture_state = () => ({ range, size, color, unit });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(2, unit = $$props.unit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, color, unit];
    }

    class SyncLoader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { size: 0, color: 1, unit: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SyncLoader",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get size() {
    		throw new Error("<SyncLoader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<SyncLoader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<SyncLoader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<SyncLoader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<SyncLoader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<SyncLoader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\Rainbow.svelte generated by Svelte v3.24.0 */

    const file$c = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\Rainbow.svelte";

    function create_fragment$c(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", "rainbow svelte-1t1ct37");
    			add_location(div0, file$c, 46, 2, 995);
    			attr_dev(div1, "class", "wrapper svelte-1t1ct37");
    			set_style(div1, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			set_style(div1, "--color", /*color*/ ctx[1]);
    			add_location(div1, file$c, 45, 0, 923);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size, unit*/ 5) {
    				set_style(div1, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 2) {
    				set_style(div1, "--color", /*color*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { size = 60 } = $$props;
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	const writable_props = ["size", "color", "unit"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Rainbow> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Rainbow", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(2, unit = $$props.unit);
    	};

    	$$self.$capture_state = () => ({ size, color, unit });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(2, unit = $$props.unit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, color, unit];
    }

    class Rainbow extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { size: 0, color: 1, unit: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Rainbow",
    			options,
    			id: create_fragment$c.name
    		});
    	}

    	get size() {
    		throw new Error("<Rainbow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Rainbow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Rainbow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Rainbow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<Rainbow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<Rainbow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\Wave.svelte generated by Svelte v3.24.0 */
    const file$d = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\Wave.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (41:2) {#each range(10, 0) as version}
    function create_each_block$6(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "bar svelte-1vjdab9");
    			set_style(div, "left", /*version*/ ctx[3] * (/*size*/ ctx[0] / 5 + (/*size*/ ctx[0] / 15 - /*size*/ ctx[0] / 100)) + /*unit*/ ctx[2]);
    			set_style(div, "animation-delay", /*version*/ ctx[3] * 0.15 + "s");
    			add_location(div, file$d, 41, 2, 982);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*size, unit*/ 5) {
    				set_style(div, "left", /*version*/ ctx[3] * (/*size*/ ctx[0] / 5 + (/*size*/ ctx[0] / 15 - /*size*/ ctx[0] / 100)) + /*unit*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$6.name,
    		type: "each",
    		source: "(41:2) {#each range(10, 0) as version}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let div;
    	let each_value = range(10, 0);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "wrapper svelte-1vjdab9");
    			set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			set_style(div, "--color", /*color*/ ctx[1]);
    			add_location(div, file$d, 39, 0, 875);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*range, size, unit*/ 5) {
    				each_value = range(10, 0);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$6(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$6(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*size, unit*/ 5) {
    				set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 2) {
    				set_style(div, "--color", /*color*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { size = 60 } = $$props;
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	const writable_props = ["size", "color", "unit"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Wave> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Wave", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(2, unit = $$props.unit);
    	};

    	$$self.$capture_state = () => ({ range, size, color, unit });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(2, unit = $$props.unit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, color, unit];
    }

    class Wave extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { size: 0, color: 1, unit: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Wave",
    			options,
    			id: create_fragment$d.name
    		});
    	}

    	get size() {
    		throw new Error("<Wave>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Wave>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Wave>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Wave>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<Wave>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<Wave>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\Firework.svelte generated by Svelte v3.24.0 */

    const file$e = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\Firework.svelte";

    function create_fragment$e(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", "firework svelte-4zud4");
    			add_location(div0, file$e, 36, 2, 792);
    			attr_dev(div1, "class", "wrapper svelte-4zud4");
    			set_style(div1, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			set_style(div1, "--color", /*color*/ ctx[1]);
    			add_location(div1, file$e, 35, 0, 720);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size, unit*/ 5) {
    				set_style(div1, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 2) {
    				set_style(div1, "--color", /*color*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { size = 60 } = $$props;
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	const writable_props = ["size", "color", "unit"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Firework> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Firework", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(2, unit = $$props.unit);
    	};

    	$$self.$capture_state = () => ({ size, color, unit });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(2, unit = $$props.unit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, color, unit];
    }

    class Firework extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { size: 0, color: 1, unit: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Firework",
    			options,
    			id: create_fragment$e.name
    		});
    	}

    	get size() {
    		throw new Error("<Firework>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Firework>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Firework>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Firework>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<Firework>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<Firework>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\Pulse.svelte generated by Svelte v3.24.0 */
    const file$f = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\Pulse.svelte";

    function get_each_context$7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (39:2) {#each range(3, 0) as version}
    function create_each_block$7(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "cube svelte-jaxue9");
    			set_style(div, "animation-delay", /*version*/ ctx[3] * 0.15 + "s");
    			set_style(div, "left", /*version*/ ctx[3] * (/*size*/ ctx[0] / 3 + /*size*/ ctx[0] / 15) + /*unit*/ ctx[2]);
    			add_location(div, file$f, 39, 2, 836);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*size, unit*/ 5) {
    				set_style(div, "left", /*version*/ ctx[3] * (/*size*/ ctx[0] / 3 + /*size*/ ctx[0] / 15) + /*unit*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$7.name,
    		type: "each",
    		source: "(39:2) {#each range(3, 0) as version}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let div;
    	let each_value = range(3, 0);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$7(get_each_context$7(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "wrapper svelte-jaxue9");
    			set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			set_style(div, "--color", /*color*/ ctx[1]);
    			add_location(div, file$f, 37, 0, 730);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*range, size, unit*/ 5) {
    				each_value = range(3, 0);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$7(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$7(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*size, unit*/ 5) {
    				set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 2) {
    				set_style(div, "--color", /*color*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { size = 60 } = $$props;
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	const writable_props = ["size", "color", "unit"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Pulse> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Pulse", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(2, unit = $$props.unit);
    	};

    	$$self.$capture_state = () => ({ range, size, color, unit });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(2, unit = $$props.unit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, color, unit];
    }

    class Pulse extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, { size: 0, color: 1, unit: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Pulse",
    			options,
    			id: create_fragment$f.name
    		});
    	}

    	get size() {
    		throw new Error("<Pulse>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Pulse>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Pulse>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Pulse>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<Pulse>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<Pulse>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\Jellyfish.svelte generated by Svelte v3.24.0 */
    const file$g = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\Jellyfish.svelte";

    function get_each_context$8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (41:2) {#each range(6, 0) as version}
    function create_each_block$8(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "ring svelte-gdryy6");
    			set_style(div, "animation-delay", /*version*/ ctx[3] * 100 + "ms");
    			set_style(div, "width", /*version*/ ctx[3] * (/*size*/ ctx[0] / 6) + /*unit*/ ctx[2]);
    			set_style(div, "height", /*version*/ ctx[3] * (/*size*/ ctx[0] / 6) / 2 + /*unit*/ ctx[2]);
    			add_location(div, file$g, 41, 2, 951);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*size, unit*/ 5) {
    				set_style(div, "width", /*version*/ ctx[3] * (/*size*/ ctx[0] / 6) + /*unit*/ ctx[2]);
    			}

    			if (dirty & /*size, unit*/ 5) {
    				set_style(div, "height", /*version*/ ctx[3] * (/*size*/ ctx[0] / 6) / 2 + /*unit*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$8.name,
    		type: "each",
    		source: "(41:2) {#each range(6, 0) as version}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let div;
    	let each_value = range(6, 0);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$8(get_each_context$8(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "wrapper svelte-gdryy6");
    			set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			set_style(div, "--color", /*color*/ ctx[1]);
    			set_style(div, "--motionOne", -/*size*/ ctx[0] / 5 + /*unit*/ ctx[2]);
    			set_style(div, "--motionTwo", /*size*/ ctx[0] / 4 + /*unit*/ ctx[2]);
    			set_style(div, "--motionThree", -/*size*/ ctx[0] / 5 + /*unit*/ ctx[2]);
    			add_location(div, file$g, 36, 0, 746);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*range, size, unit*/ 5) {
    				each_value = range(6, 0);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$8(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$8(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*size, unit*/ 5) {
    				set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 2) {
    				set_style(div, "--color", /*color*/ ctx[1]);
    			}

    			if (dirty & /*size, unit*/ 5) {
    				set_style(div, "--motionOne", -/*size*/ ctx[0] / 5 + /*unit*/ ctx[2]);
    			}

    			if (dirty & /*size, unit*/ 5) {
    				set_style(div, "--motionTwo", /*size*/ ctx[0] / 4 + /*unit*/ ctx[2]);
    			}

    			if (dirty & /*size, unit*/ 5) {
    				set_style(div, "--motionThree", -/*size*/ ctx[0] / 5 + /*unit*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let { size = 60 } = $$props;
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	const writable_props = ["size", "color", "unit"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Jellyfish> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Jellyfish", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(2, unit = $$props.unit);
    	};

    	$$self.$capture_state = () => ({ range, size, color, unit });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(2, unit = $$props.unit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, color, unit];
    }

    class Jellyfish extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, { size: 0, color: 1, unit: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Jellyfish",
    			options,
    			id: create_fragment$g.name
    		});
    	}

    	get size() {
    		throw new Error("<Jellyfish>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Jellyfish>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Jellyfish>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Jellyfish>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<Jellyfish>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<Jellyfish>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\Chasing.svelte generated by Svelte v3.24.0 */
    const file$h = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\Chasing.svelte";

    function get_each_context$9(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (45:4) {#each range(2, 0) as version}
    function create_each_block$9(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "dot svelte-1gbpzwq");
    			set_style(div, "animation-delay", /*version*/ ctx[3] === 1 ? "-1.0s" : "0s");
    			set_style(div, "bottom", /*version*/ ctx[3] === 1 ? "0" : "");
    			set_style(div, "top", /*version*/ ctx[3] === 1 ? "auto" : "");
    			add_location(div, file$h, 45, 4, 992);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$9.name,
    		type: "each",
    		source: "(45:4) {#each range(2, 0) as version}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let div1;
    	let div0;
    	let each_value = range(2, 0);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$9(get_each_context$9(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "spinner svelte-1gbpzwq");
    			add_location(div0, file$h, 43, 2, 929);
    			attr_dev(div1, "class", "wrapper svelte-1gbpzwq");
    			set_style(div1, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			set_style(div1, "--color", /*color*/ ctx[1]);
    			add_location(div1, file$h, 42, 0, 857);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*range*/ 0) {
    				each_value = range(2, 0);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$9(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$9(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*size, unit*/ 5) {
    				set_style(div1, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 2) {
    				set_style(div1, "--color", /*color*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let { size = 60 } = $$props;
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	const writable_props = ["size", "color", "unit"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Chasing> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Chasing", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(2, unit = $$props.unit);
    	};

    	$$self.$capture_state = () => ({ calculateRgba, range, size, color, unit });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(2, unit = $$props.unit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, color, unit];
    }

    class Chasing extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, { size: 0, color: 1, unit: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chasing",
    			options,
    			id: create_fragment$h.name
    		});
    	}

    	get size() {
    		throw new Error("<Chasing>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Chasing>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Chasing>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Chasing>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<Chasing>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<Chasing>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\Shadow.svelte generated by Svelte v3.24.0 */

    const file$i = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\Shadow.svelte";

    function create_fragment$i(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", "shadow svelte-158kb8g");
    			add_location(div0, file$i, 67, 2, 1886);
    			attr_dev(div1, "class", "wrapper svelte-158kb8g");
    			set_style(div1, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			set_style(div1, "--color", /*color*/ ctx[1]);
    			add_location(div1, file$i, 66, 0, 1814);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size, unit*/ 5) {
    				set_style(div1, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			}

    			if (dirty & /*color*/ 2) {
    				set_style(div1, "--color", /*color*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let { size = 60 } = $$props;
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	const writable_props = ["size", "color", "unit"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Shadow> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Shadow", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(2, unit = $$props.unit);
    	};

    	$$self.$capture_state = () => ({ size, color, unit });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(2, unit = $$props.unit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, color, unit];
    }

    class Shadow extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, { size: 0, color: 1, unit: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Shadow",
    			options,
    			id: create_fragment$i.name
    		});
    	}

    	get size() {
    		throw new Error("<Shadow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Shadow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Shadow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Shadow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<Shadow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<Shadow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.24.0 */

    const file$j = "src\\App.svelte";

    function create_fragment$j(ctx) {
    	let div0;
    	let h1;
    	let t0_value = /*name*/ ctx[0].default + "";
    	let t0;
    	let t1;
    	let a;
    	let t3;
    	let section;
    	let div2;
    	let spinline;
    	let t4;
    	let div1;
    	let t6;
    	let div4;
    	let circle2;
    	let t7;
    	let div3;
    	let t9;
    	let div6;
    	let doublebounce;
    	let t10;
    	let div5;
    	let t12;
    	let div8;
    	let circle;
    	let t13;
    	let div7;
    	let t15;
    	let div10;
    	let stretch;
    	let t16;
    	let div9;
    	let t18;
    	let div12;
    	let circle3;
    	let t19;
    	let div11;
    	let t21;
    	let div14;
    	let barloader;
    	let t22;
    	let div13;
    	let t24;
    	let div16;
    	let syncloader;
    	let t25;
    	let div15;
    	let t27;
    	let div18;
    	let jumper;
    	let t28;
    	let div17;
    	let t30;
    	let div20;
    	let googlespin;
    	let t31;
    	let div19;
    	let t33;
    	let div22;
    	let scaleout;
    	let t34;
    	let div21;
    	let t36;
    	let div24;
    	let ringloader;
    	let t37;
    	let div23;
    	let t39;
    	let div26;
    	let rainbow;
    	let t40;
    	let div25;
    	let t42;
    	let div28;
    	let wave;
    	let t43;
    	let div27;
    	let t45;
    	let div30;
    	let firework;
    	let t46;
    	let div29;
    	let t48;
    	let div32;
    	let pulse;
    	let t49;
    	let div31;
    	let t51;
    	let div34;
    	let jellyfish;
    	let t52;
    	let div33;
    	let t54;
    	let div36;
    	let chasing;
    	let t55;
    	let div35;
    	let t57;
    	let div38;
    	let shadow;
    	let t58;
    	let div37;
    	let current;

    	spinline = new SpinLine({
    			props: { size: "60", color: "#FF3E00" },
    			$$inline: true
    		});

    	circle2 = new Circle2({
    			props: {
    				size: "60",
    				unit: "px",
    				colorOuter: "#FF3E00",
    				colorCenter: "#40B3FF",
    				colorInner: "#676778"
    			},
    			$$inline: true
    		});

    	doublebounce = new DoubleBounce({
    			props: { size: "60", color: "#FF3E00" },
    			$$inline: true
    		});

    	circle = new Circle({
    			props: { size: "60", color: "#FF3E00", unit: "px" },
    			$$inline: true
    		});

    	stretch = new Stretch({
    			props: { size: "60", color: "#FF3E00" },
    			$$inline: true
    		});

    	circle3 = new Circle3({
    			props: {
    				size: "60",
    				unit: "px",
    				ballTopLeft: "#FF3E00",
    				ballTopRight: "#F8B334",
    				ballBottomLeft: "#40B3FF",
    				ballBottomRight: "#676778"
    			},
    			$$inline: true
    		});

    	barloader = new BarLoader({
    			props: { size: "60", color: "#FF3E00", unit: "px" },
    			$$inline: true
    		});

    	syncloader = new SyncLoader({
    			props: { size: "60", color: "#FF3E00" },
    			$$inline: true
    		});

    	jumper = new Jumper({
    			props: { size: "60", color: "#FF3E00" },
    			$$inline: true
    		});

    	googlespin = new GoogleSpin({ props: { size: "60px" }, $$inline: true });

    	scaleout = new ScaleOut({
    			props: { size: "60", color: "#FF3E00" },
    			$$inline: true
    		});

    	ringloader = new RingLoader({
    			props: { size: "60", color: "#FF3E00" },
    			$$inline: true
    		});

    	rainbow = new Rainbow({
    			props: { size: "60", color: "#FF3E00" },
    			$$inline: true
    		});

    	wave = new Wave({
    			props: { size: "60", color: "#FF3E00" },
    			$$inline: true
    		});

    	firework = new Firework({
    			props: { size: "60", color: "#FF3E00" },
    			$$inline: true
    		});

    	pulse = new Pulse({
    			props: { size: "60", color: "#FF3E00" },
    			$$inline: true
    		});

    	jellyfish = new Jellyfish({
    			props: { size: "60", color: "#FF3E00" },
    			$$inline: true
    		});

    	chasing = new Chasing({
    			props: { size: "60", color: "#FF3E00", unit: "px" },
    			$$inline: true
    		});

    	shadow = new Shadow({
    			props: { size: "60", color: "#FF3E00" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			a = element("a");
    			a.textContent = "Github";
    			t3 = space();
    			section = element("section");
    			div2 = element("div");
    			create_component(spinline.$$.fragment);
    			t4 = space();
    			div1 = element("div");
    			div1.textContent = "SpinLine";
    			t6 = space();
    			div4 = element("div");
    			create_component(circle2.$$.fragment);
    			t7 = space();
    			div3 = element("div");
    			div3.textContent = "Circle2";
    			t9 = space();
    			div6 = element("div");
    			create_component(doublebounce.$$.fragment);
    			t10 = space();
    			div5 = element("div");
    			div5.textContent = "DoubleBounce";
    			t12 = space();
    			div8 = element("div");
    			create_component(circle.$$.fragment);
    			t13 = space();
    			div7 = element("div");
    			div7.textContent = "Circle";
    			t15 = space();
    			div10 = element("div");
    			create_component(stretch.$$.fragment);
    			t16 = space();
    			div9 = element("div");
    			div9.textContent = "Stretch";
    			t18 = space();
    			div12 = element("div");
    			create_component(circle3.$$.fragment);
    			t19 = space();
    			div11 = element("div");
    			div11.textContent = "Circle3";
    			t21 = space();
    			div14 = element("div");
    			create_component(barloader.$$.fragment);
    			t22 = space();
    			div13 = element("div");
    			div13.textContent = "BarLoader";
    			t24 = space();
    			div16 = element("div");
    			create_component(syncloader.$$.fragment);
    			t25 = space();
    			div15 = element("div");
    			div15.textContent = "SyncLoader";
    			t27 = space();
    			div18 = element("div");
    			create_component(jumper.$$.fragment);
    			t28 = space();
    			div17 = element("div");
    			div17.textContent = "Jumper";
    			t30 = space();
    			div20 = element("div");
    			create_component(googlespin.$$.fragment);
    			t31 = space();
    			div19 = element("div");
    			div19.textContent = "GoogleSpin";
    			t33 = space();
    			div22 = element("div");
    			create_component(scaleout.$$.fragment);
    			t34 = space();
    			div21 = element("div");
    			div21.textContent = "ScaleOut";
    			t36 = space();
    			div24 = element("div");
    			create_component(ringloader.$$.fragment);
    			t37 = space();
    			div23 = element("div");
    			div23.textContent = "RingLoader";
    			t39 = space();
    			div26 = element("div");
    			create_component(rainbow.$$.fragment);
    			t40 = space();
    			div25 = element("div");
    			div25.textContent = "Rainbow";
    			t42 = space();
    			div28 = element("div");
    			create_component(wave.$$.fragment);
    			t43 = space();
    			div27 = element("div");
    			div27.textContent = "Wave";
    			t45 = space();
    			div30 = element("div");
    			create_component(firework.$$.fragment);
    			t46 = space();
    			div29 = element("div");
    			div29.textContent = "Firework";
    			t48 = space();
    			div32 = element("div");
    			create_component(pulse.$$.fragment);
    			t49 = space();
    			div31 = element("div");
    			div31.textContent = "Pulse";
    			t51 = space();
    			div34 = element("div");
    			create_component(jellyfish.$$.fragment);
    			t52 = space();
    			div33 = element("div");
    			div33.textContent = "Jellyfish";
    			t54 = space();
    			div36 = element("div");
    			create_component(chasing.$$.fragment);
    			t55 = space();
    			div35 = element("div");
    			div35.textContent = "Chasing";
    			t57 = space();
    			div38 = element("div");
    			create_component(shadow.$$.fragment);
    			t58 = space();
    			div37 = element("div");
    			div37.textContent = "Shadow";
    			attr_dev(h1, "class", "svelte-1rq2dnk");
    			add_location(h1, file$j, 77, 1, 1381);
    			attr_dev(a, "href", "https://github.com/Schum123/svelte-loading-spinners");
    			attr_dev(a, "class", "btn svelte-1rq2dnk");
    			add_location(a, file$j, 78, 1, 1407);
    			attr_dev(div0, "class", "header svelte-1rq2dnk");
    			add_location(div0, file$j, 76, 2, 1358);
    			attr_dev(div1, "class", "spinner-title svelte-1rq2dnk");
    			add_location(div1, file$j, 86, 4, 1604);
    			attr_dev(div2, "class", "spinner-item svelte-1rq2dnk");
    			add_location(div2, file$j, 84, 1, 1529);
    			attr_dev(div3, "class", "spinner-title svelte-1rq2dnk");
    			add_location(div3, file$j, 91, 5, 1800);
    			attr_dev(div4, "class", "spinner-item svelte-1rq2dnk");
    			add_location(div4, file$j, 89, 3, 1666);
    			attr_dev(div5, "class", "spinner-title svelte-1rq2dnk");
    			add_location(div5, file$j, 95, 5, 1937);
    			attr_dev(div6, "class", "spinner-item svelte-1rq2dnk");
    			add_location(div6, file$j, 93, 3, 1856);
    			attr_dev(div7, "class", "spinner-title svelte-1rq2dnk");
    			add_location(div7, file$j, 99, 5, 2083);
    			attr_dev(div8, "class", "spinner-item svelte-1rq2dnk");
    			add_location(div8, file$j, 97, 3, 1998);
    			attr_dev(div9, "class", "spinner-title svelte-1rq2dnk");
    			add_location(div9, file$j, 103, 5, 2214);
    			attr_dev(div10, "class", "spinner-item svelte-1rq2dnk");
    			add_location(div10, file$j, 101, 3, 2138);
    			attr_dev(div11, "class", "spinner-title svelte-1rq2dnk");
    			add_location(div11, file$j, 107, 5, 2436);
    			attr_dev(div12, "class", "spinner-item svelte-1rq2dnk");
    			add_location(div12, file$j, 105, 3, 2270);
    			attr_dev(div13, "class", "spinner-title svelte-1rq2dnk");
    			add_location(div13, file$j, 111, 5, 2581);
    			attr_dev(div14, "class", "spinner-item svelte-1rq2dnk");
    			add_location(div14, file$j, 109, 3, 2492);
    			attr_dev(div15, "class", "spinner-title svelte-1rq2dnk");
    			add_location(div15, file$j, 115, 5, 2718);
    			attr_dev(div16, "class", "spinner-item svelte-1rq2dnk");
    			add_location(div16, file$j, 113, 3, 2639);
    			attr_dev(div17, "class", "spinner-title svelte-1rq2dnk");
    			add_location(div17, file$j, 119, 5, 2852);
    			attr_dev(div18, "class", "spinner-item svelte-1rq2dnk");
    			add_location(div18, file$j, 117, 3, 2777);
    			attr_dev(div19, "class", "spinner-title svelte-1rq2dnk");
    			add_location(div19, file$j, 123, 5, 2972);
    			attr_dev(div20, "class", "spinner-item svelte-1rq2dnk");
    			add_location(div20, file$j, 121, 3, 2907);
    			attr_dev(div21, "class", "spinner-title svelte-1rq2dnk");
    			add_location(div21, file$j, 127, 5, 3108);
    			attr_dev(div22, "class", "spinner-item svelte-1rq2dnk");
    			add_location(div22, file$j, 125, 3, 3031);
    			attr_dev(div23, "class", "spinner-title svelte-1rq2dnk");
    			add_location(div23, file$j, 131, 4, 3243);
    			attr_dev(div24, "class", "spinner-item svelte-1rq2dnk");
    			add_location(div24, file$j, 129, 3, 3165);
    			attr_dev(div25, "class", "spinner-title svelte-1rq2dnk");
    			add_location(div25, file$j, 135, 4, 3375);
    			attr_dev(div26, "class", "spinner-item svelte-1rq2dnk");
    			add_location(div26, file$j, 133, 2, 3300);
    			attr_dev(div27, "class", "spinner-title svelte-1rq2dnk");
    			add_location(div27, file$j, 139, 4, 3501);
    			attr_dev(div28, "class", "spinner-item svelte-1rq2dnk");
    			add_location(div28, file$j, 137, 2, 3429);
    			attr_dev(div29, "class", "spinner-title svelte-1rq2dnk");
    			add_location(div29, file$j, 143, 4, 3628);
    			attr_dev(div30, "class", "spinner-item svelte-1rq2dnk");
    			add_location(div30, file$j, 141, 2, 3552);
    			attr_dev(div31, "class", "spinner-title svelte-1rq2dnk");
    			add_location(div31, file$j, 147, 4, 3756);
    			attr_dev(div32, "class", "spinner-item svelte-1rq2dnk");
    			add_location(div32, file$j, 145, 2, 3683);
    			attr_dev(div33, "class", "spinner-title svelte-1rq2dnk");
    			add_location(div33, file$j, 151, 3, 3884);
    			attr_dev(div34, "class", "spinner-item svelte-1rq2dnk");
    			add_location(div34, file$j, 149, 2, 3810);
    			attr_dev(div35, "class", "spinner-title svelte-1rq2dnk");
    			add_location(div35, file$j, 155, 3, 4022);
    			attr_dev(div36, "class", "spinner-item svelte-1rq2dnk");
    			add_location(div36, file$j, 153, 2, 3940);
    			attr_dev(div37, "class", "spinner-title svelte-1rq2dnk");
    			add_location(div37, file$j, 159, 3, 4147);
    			attr_dev(div38, "class", "spinner-item svelte-1rq2dnk");
    			add_location(div38, file$j, 157, 2, 4076);
    			attr_dev(section, "class", "svelte-1rq2dnk");
    			add_location(section, file$j, 82, 2, 1513);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h1);
    			append_dev(h1, t0);
    			append_dev(div0, t1);
    			append_dev(div0, a);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, div2);
    			mount_component(spinline, div2, null);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(section, t6);
    			append_dev(section, div4);
    			mount_component(circle2, div4, null);
    			append_dev(div4, t7);
    			append_dev(div4, div3);
    			append_dev(section, t9);
    			append_dev(section, div6);
    			mount_component(doublebounce, div6, null);
    			append_dev(div6, t10);
    			append_dev(div6, div5);
    			append_dev(section, t12);
    			append_dev(section, div8);
    			mount_component(circle, div8, null);
    			append_dev(div8, t13);
    			append_dev(div8, div7);
    			append_dev(section, t15);
    			append_dev(section, div10);
    			mount_component(stretch, div10, null);
    			append_dev(div10, t16);
    			append_dev(div10, div9);
    			append_dev(section, t18);
    			append_dev(section, div12);
    			mount_component(circle3, div12, null);
    			append_dev(div12, t19);
    			append_dev(div12, div11);
    			append_dev(section, t21);
    			append_dev(section, div14);
    			mount_component(barloader, div14, null);
    			append_dev(div14, t22);
    			append_dev(div14, div13);
    			append_dev(section, t24);
    			append_dev(section, div16);
    			mount_component(syncloader, div16, null);
    			append_dev(div16, t25);
    			append_dev(div16, div15);
    			append_dev(section, t27);
    			append_dev(section, div18);
    			mount_component(jumper, div18, null);
    			append_dev(div18, t28);
    			append_dev(div18, div17);
    			append_dev(section, t30);
    			append_dev(section, div20);
    			mount_component(googlespin, div20, null);
    			append_dev(div20, t31);
    			append_dev(div20, div19);
    			append_dev(section, t33);
    			append_dev(section, div22);
    			mount_component(scaleout, div22, null);
    			append_dev(div22, t34);
    			append_dev(div22, div21);
    			append_dev(section, t36);
    			append_dev(section, div24);
    			mount_component(ringloader, div24, null);
    			append_dev(div24, t37);
    			append_dev(div24, div23);
    			append_dev(section, t39);
    			append_dev(section, div26);
    			mount_component(rainbow, div26, null);
    			append_dev(div26, t40);
    			append_dev(div26, div25);
    			append_dev(section, t42);
    			append_dev(section, div28);
    			mount_component(wave, div28, null);
    			append_dev(div28, t43);
    			append_dev(div28, div27);
    			append_dev(section, t45);
    			append_dev(section, div30);
    			mount_component(firework, div30, null);
    			append_dev(div30, t46);
    			append_dev(div30, div29);
    			append_dev(section, t48);
    			append_dev(section, div32);
    			mount_component(pulse, div32, null);
    			append_dev(div32, t49);
    			append_dev(div32, div31);
    			append_dev(section, t51);
    			append_dev(section, div34);
    			mount_component(jellyfish, div34, null);
    			append_dev(div34, t52);
    			append_dev(div34, div33);
    			append_dev(section, t54);
    			append_dev(section, div36);
    			mount_component(chasing, div36, null);
    			append_dev(div36, t55);
    			append_dev(div36, div35);
    			append_dev(section, t57);
    			append_dev(section, div38);
    			mount_component(shadow, div38, null);
    			append_dev(div38, t58);
    			append_dev(div38, div37);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*name*/ 1) && t0_value !== (t0_value = /*name*/ ctx[0].default + "")) set_data_dev(t0, t0_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(spinline.$$.fragment, local);
    			transition_in(circle2.$$.fragment, local);
    			transition_in(doublebounce.$$.fragment, local);
    			transition_in(circle.$$.fragment, local);
    			transition_in(stretch.$$.fragment, local);
    			transition_in(circle3.$$.fragment, local);
    			transition_in(barloader.$$.fragment, local);
    			transition_in(syncloader.$$.fragment, local);
    			transition_in(jumper.$$.fragment, local);
    			transition_in(googlespin.$$.fragment, local);
    			transition_in(scaleout.$$.fragment, local);
    			transition_in(ringloader.$$.fragment, local);
    			transition_in(rainbow.$$.fragment, local);
    			transition_in(wave.$$.fragment, local);
    			transition_in(firework.$$.fragment, local);
    			transition_in(pulse.$$.fragment, local);
    			transition_in(jellyfish.$$.fragment, local);
    			transition_in(chasing.$$.fragment, local);
    			transition_in(shadow.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(spinline.$$.fragment, local);
    			transition_out(circle2.$$.fragment, local);
    			transition_out(doublebounce.$$.fragment, local);
    			transition_out(circle.$$.fragment, local);
    			transition_out(stretch.$$.fragment, local);
    			transition_out(circle3.$$.fragment, local);
    			transition_out(barloader.$$.fragment, local);
    			transition_out(syncloader.$$.fragment, local);
    			transition_out(jumper.$$.fragment, local);
    			transition_out(googlespin.$$.fragment, local);
    			transition_out(scaleout.$$.fragment, local);
    			transition_out(ringloader.$$.fragment, local);
    			transition_out(rainbow.$$.fragment, local);
    			transition_out(wave.$$.fragment, local);
    			transition_out(firework.$$.fragment, local);
    			transition_out(pulse.$$.fragment, local);
    			transition_out(jellyfish.$$.fragment, local);
    			transition_out(chasing.$$.fragment, local);
    			transition_out(shadow.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(section);
    			destroy_component(spinline);
    			destroy_component(circle2);
    			destroy_component(doublebounce);
    			destroy_component(circle);
    			destroy_component(stretch);
    			destroy_component(circle3);
    			destroy_component(barloader);
    			destroy_component(syncloader);
    			destroy_component(jumper);
    			destroy_component(googlespin);
    			destroy_component(scaleout);
    			destroy_component(ringloader);
    			destroy_component(rainbow);
    			destroy_component(wave);
    			destroy_component(firework);
    			destroy_component(pulse);
    			destroy_component(jellyfish);
    			destroy_component(chasing);
    			destroy_component(shadow);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let { name } = $$props;
    	const writable_props = ["name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		Circle,
    		Circle2,
    		Circle3,
    		DoubleBounce,
    		GoogleSpin,
    		ScaleOut,
    		SpinLine,
    		Stretch,
    		BarLoader,
    		Jumper,
    		RingLoader,
    		SyncLoader,
    		Rainbow,
    		Wave,
    		Firework,
    		Pulse,
    		Jellyfish,
    		Chasing,
    		Shadow,
    		name
    	});

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$j.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
      target: document.body,
      props: {
        name: {
          default: "svelte-loading-spinners"
        }
      }
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
