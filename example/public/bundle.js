
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
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
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
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
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
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
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
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
        seen_callbacks.clear();
        set_current_component(saved_component);
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
        else if (callback) {
            callback();
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
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
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
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
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.50.1' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
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
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* ..\src\Circle.svelte generated by Svelte v3.50.1 */

    const file$o = "..\\src\\Circle.svelte";

    function create_fragment$o(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "circle svelte-17jtg44");
    			set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			set_style(div, "--color", /*color*/ ctx[0]);
    			set_style(div, "--duration", /*duration*/ ctx[2]);
    			toggle_class(div, "pause-animation", /*pause*/ ctx[4]);
    			add_location(div, file$o, 31, 0, 722);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size, unit*/ 10) {
    				set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*color*/ 1) {
    				set_style(div, "--color", /*color*/ ctx[0]);
    			}

    			if (dirty & /*duration*/ 4) {
    				set_style(div, "--duration", /*duration*/ ctx[2]);
    			}

    			if (dirty & /*pause*/ 16) {
    				toggle_class(div, "pause-animation", /*pause*/ ctx[4]);
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
    		id: create_fragment$o.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$o($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Circle', slots, []);
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	let { duration = "0.75s" } = $$props;
    	let { size = "60" } = $$props;
    	let { pause = false } = $$props;
    	const writable_props = ['color', 'unit', 'duration', 'size', 'pause'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Circle> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    	};

    	$$self.$capture_state = () => ({ color, unit, duration, size, pause });

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, unit, duration, size, pause];
    }

    class Circle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$o, create_fragment$o, safe_not_equal, {
    			color: 0,
    			unit: 1,
    			duration: 2,
    			size: 3,
    			pause: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Circle",
    			options,
    			id: create_fragment$o.name
    		});
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

    	get duration() {
    		throw new Error("<Circle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Circle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Circle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Circle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pause() {
    		throw new Error("<Circle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pause(value) {
    		throw new Error("<Circle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ..\src\Circle2.svelte generated by Svelte v3.50.1 */

    const file$n = "..\\src\\Circle2.svelte";

    function create_fragment$n(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "circle svelte-fjpg5a");
    			set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[1]);
    			set_style(div, "--colorInner", /*colorInner*/ ctx[4]);
    			set_style(div, "--colorCenter", /*colorCenter*/ ctx[3]);
    			set_style(div, "--colorOuter", /*colorOuter*/ ctx[2]);
    			set_style(div, "--durationInner", /*durationInner*/ ctx[6]);
    			set_style(div, "--durationCenter", /*durationCenter*/ ctx[7]);
    			set_style(div, "--durationOuter", /*durationOuter*/ ctx[5]);
    			toggle_class(div, "pause-animation", /*pause*/ ctx[8]);
    			add_location(div, file$n, 63, 0, 1574);
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

    			if (dirty & /*durationInner*/ 64) {
    				set_style(div, "--durationInner", /*durationInner*/ ctx[6]);
    			}

    			if (dirty & /*durationCenter*/ 128) {
    				set_style(div, "--durationCenter", /*durationCenter*/ ctx[7]);
    			}

    			if (dirty & /*durationOuter*/ 32) {
    				set_style(div, "--durationOuter", /*durationOuter*/ ctx[5]);
    			}

    			if (dirty & /*pause*/ 256) {
    				toggle_class(div, "pause-animation", /*pause*/ ctx[8]);
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
    		id: create_fragment$n.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$n($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Circle2', slots, []);
    	let { size = "60" } = $$props;
    	let { unit = "px" } = $$props;
    	let { colorOuter = "#FF3E00" } = $$props;
    	let { colorCenter = "#40B3FF" } = $$props;
    	let { colorInner = "#676778" } = $$props;
    	let { durationMultiplier = 1 } = $$props;
    	let { durationOuter = `${durationMultiplier * 2}s` } = $$props;
    	let { durationInner = `${durationMultiplier * 1.5}s` } = $$props;
    	let { durationCenter = `${durationMultiplier * 3}s` } = $$props;
    	let { pause = false } = $$props;

    	const writable_props = [
    		'size',
    		'unit',
    		'colorOuter',
    		'colorCenter',
    		'colorInner',
    		'durationMultiplier',
    		'durationOuter',
    		'durationInner',
    		'durationCenter',
    		'pause'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Circle2> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('size' in $$props) $$invalidate(0, size = $$props.size);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('colorOuter' in $$props) $$invalidate(2, colorOuter = $$props.colorOuter);
    		if ('colorCenter' in $$props) $$invalidate(3, colorCenter = $$props.colorCenter);
    		if ('colorInner' in $$props) $$invalidate(4, colorInner = $$props.colorInner);
    		if ('durationMultiplier' in $$props) $$invalidate(9, durationMultiplier = $$props.durationMultiplier);
    		if ('durationOuter' in $$props) $$invalidate(5, durationOuter = $$props.durationOuter);
    		if ('durationInner' in $$props) $$invalidate(6, durationInner = $$props.durationInner);
    		if ('durationCenter' in $$props) $$invalidate(7, durationCenter = $$props.durationCenter);
    		if ('pause' in $$props) $$invalidate(8, pause = $$props.pause);
    	};

    	$$self.$capture_state = () => ({
    		size,
    		unit,
    		colorOuter,
    		colorCenter,
    		colorInner,
    		durationMultiplier,
    		durationOuter,
    		durationInner,
    		durationCenter,
    		pause
    	});

    	$$self.$inject_state = $$props => {
    		if ('size' in $$props) $$invalidate(0, size = $$props.size);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('colorOuter' in $$props) $$invalidate(2, colorOuter = $$props.colorOuter);
    		if ('colorCenter' in $$props) $$invalidate(3, colorCenter = $$props.colorCenter);
    		if ('colorInner' in $$props) $$invalidate(4, colorInner = $$props.colorInner);
    		if ('durationMultiplier' in $$props) $$invalidate(9, durationMultiplier = $$props.durationMultiplier);
    		if ('durationOuter' in $$props) $$invalidate(5, durationOuter = $$props.durationOuter);
    		if ('durationInner' in $$props) $$invalidate(6, durationInner = $$props.durationInner);
    		if ('durationCenter' in $$props) $$invalidate(7, durationCenter = $$props.durationCenter);
    		if ('pause' in $$props) $$invalidate(8, pause = $$props.pause);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		size,
    		unit,
    		colorOuter,
    		colorCenter,
    		colorInner,
    		durationOuter,
    		durationInner,
    		durationCenter,
    		pause,
    		durationMultiplier
    	];
    }

    class Circle2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$n, create_fragment$n, safe_not_equal, {
    			size: 0,
    			unit: 1,
    			colorOuter: 2,
    			colorCenter: 3,
    			colorInner: 4,
    			durationMultiplier: 9,
    			durationOuter: 5,
    			durationInner: 6,
    			durationCenter: 7,
    			pause: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Circle2",
    			options,
    			id: create_fragment$n.name
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

    	get durationMultiplier() {
    		throw new Error("<Circle2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set durationMultiplier(value) {
    		throw new Error("<Circle2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get durationOuter() {
    		throw new Error("<Circle2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set durationOuter(value) {
    		throw new Error("<Circle2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get durationInner() {
    		throw new Error("<Circle2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set durationInner(value) {
    		throw new Error("<Circle2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get durationCenter() {
    		throw new Error("<Circle2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set durationCenter(value) {
    		throw new Error("<Circle2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pause() {
    		throw new Error("<Circle2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pause(value) {
    		throw new Error("<Circle2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ..\src\Circle3.svelte generated by Svelte v3.50.1 */

    const file$m = "..\\src\\Circle3.svelte";

    function create_fragment$m(ctx) {
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
    			attr_dev(div0, "class", "ball ball-top-left svelte-1ve7ol6");
    			toggle_class(div0, "pause-animation", /*pause*/ ctx[7]);
    			add_location(div0, file$m, 98, 8, 2295);
    			attr_dev(div1, "class", "single-ball svelte-1ve7ol6");
    			add_location(div1, file$m, 97, 6, 2260);
    			attr_dev(div2, "class", "ball ball-top-right svelte-1ve7ol6");
    			toggle_class(div2, "pause-animation", /*pause*/ ctx[7]);
    			add_location(div2, file$m, 101, 8, 2429);
    			attr_dev(div3, "class", "contener_mixte");
    			add_location(div3, file$m, 100, 6, 2391);
    			attr_dev(div4, "class", "ball ball-bottom-left svelte-1ve7ol6");
    			toggle_class(div4, "pause-animation", /*pause*/ ctx[7]);
    			add_location(div4, file$m, 104, 8, 2564);
    			attr_dev(div5, "class", "contener_mixte");
    			add_location(div5, file$m, 103, 6, 2526);
    			attr_dev(div6, "class", "ball ball-bottom-right svelte-1ve7ol6");
    			toggle_class(div6, "pause-animation", /*pause*/ ctx[7]);
    			add_location(div6, file$m, 107, 8, 2701);
    			attr_dev(div7, "class", "contener_mixte");
    			add_location(div7, file$m, 106, 6, 2663);
    			attr_dev(div8, "class", "ball-container svelte-1ve7ol6");
    			toggle_class(div8, "pause-animation", /*pause*/ ctx[7]);
    			add_location(div8, file$m, 96, 4, 2194);
    			attr_dev(div9, "class", "inner svelte-1ve7ol6");
    			add_location(div9, file$m, 95, 2, 2169);
    			attr_dev(div10, "class", "wrapper svelte-1ve7ol6");
    			set_style(div10, "--size", /*size*/ ctx[0] + /*unit*/ ctx[1]);
    			set_style(div10, "--floatSize", /*size*/ ctx[0]);
    			set_style(div10, "--ballTopLeftColor", /*ballTopLeft*/ ctx[2]);
    			set_style(div10, "--ballTopRightColor", /*ballTopRight*/ ctx[3]);
    			set_style(div10, "--ballBottomLeftColor", /*ballBottomLeft*/ ctx[4]);
    			set_style(div10, "--ballBottomRightColor", /*ballBottomRight*/ ctx[5]);
    			set_style(div10, "--duration", /*duration*/ ctx[6]);
    			add_location(div10, file$m, 92, 0, 1907);
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
    			if (dirty & /*pause*/ 128) {
    				toggle_class(div0, "pause-animation", /*pause*/ ctx[7]);
    			}

    			if (dirty & /*pause*/ 128) {
    				toggle_class(div2, "pause-animation", /*pause*/ ctx[7]);
    			}

    			if (dirty & /*pause*/ 128) {
    				toggle_class(div4, "pause-animation", /*pause*/ ctx[7]);
    			}

    			if (dirty & /*pause*/ 128) {
    				toggle_class(div6, "pause-animation", /*pause*/ ctx[7]);
    			}

    			if (dirty & /*pause*/ 128) {
    				toggle_class(div8, "pause-animation", /*pause*/ ctx[7]);
    			}

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

    			if (dirty & /*duration*/ 64) {
    				set_style(div10, "--duration", /*duration*/ ctx[6]);
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
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$m($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Circle3', slots, []);
    	let { size = "60" } = $$props;
    	let { unit = "px" } = $$props;
    	let { ballTopLeft = "#FF3E00" } = $$props;
    	let { ballTopRight = "#F8B334" } = $$props;
    	let { ballBottomLeft = "#40B3FF" } = $$props;
    	let { ballBottomRight = "#676778" } = $$props;
    	let { duration = "1.5s" } = $$props;
    	let { pause = false } = $$props;

    	const writable_props = [
    		'size',
    		'unit',
    		'ballTopLeft',
    		'ballTopRight',
    		'ballBottomLeft',
    		'ballBottomRight',
    		'duration',
    		'pause'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Circle3> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('size' in $$props) $$invalidate(0, size = $$props.size);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('ballTopLeft' in $$props) $$invalidate(2, ballTopLeft = $$props.ballTopLeft);
    		if ('ballTopRight' in $$props) $$invalidate(3, ballTopRight = $$props.ballTopRight);
    		if ('ballBottomLeft' in $$props) $$invalidate(4, ballBottomLeft = $$props.ballBottomLeft);
    		if ('ballBottomRight' in $$props) $$invalidate(5, ballBottomRight = $$props.ballBottomRight);
    		if ('duration' in $$props) $$invalidate(6, duration = $$props.duration);
    		if ('pause' in $$props) $$invalidate(7, pause = $$props.pause);
    	};

    	$$self.$capture_state = () => ({
    		size,
    		unit,
    		ballTopLeft,
    		ballTopRight,
    		ballBottomLeft,
    		ballBottomRight,
    		duration,
    		pause
    	});

    	$$self.$inject_state = $$props => {
    		if ('size' in $$props) $$invalidate(0, size = $$props.size);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('ballTopLeft' in $$props) $$invalidate(2, ballTopLeft = $$props.ballTopLeft);
    		if ('ballTopRight' in $$props) $$invalidate(3, ballTopRight = $$props.ballTopRight);
    		if ('ballBottomLeft' in $$props) $$invalidate(4, ballBottomLeft = $$props.ballBottomLeft);
    		if ('ballBottomRight' in $$props) $$invalidate(5, ballBottomRight = $$props.ballBottomRight);
    		if ('duration' in $$props) $$invalidate(6, duration = $$props.duration);
    		if ('pause' in $$props) $$invalidate(7, pause = $$props.pause);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		size,
    		unit,
    		ballTopLeft,
    		ballTopRight,
    		ballBottomLeft,
    		ballBottomRight,
    		duration,
    		pause
    	];
    }

    class Circle3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$m, create_fragment$m, safe_not_equal, {
    			size: 0,
    			unit: 1,
    			ballTopLeft: 2,
    			ballTopRight: 3,
    			ballBottomLeft: 4,
    			ballBottomRight: 5,
    			duration: 6,
    			pause: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Circle3",
    			options,
    			id: create_fragment$m.name
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

    	get duration() {
    		throw new Error("<Circle3>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Circle3>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pause() {
    		throw new Error("<Circle3>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pause(value) {
    		throw new Error("<Circle3>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const durationUnitRegex = /[a-zA-Z]/;

    const calculateRgba = (color, opacity) => {
      if (color[0] === "#") {
        color = color.slice(1);
      }

      if (color.length === 3) {
        let res = "";
        color.split("").forEach((c) => {
          res += c;
          res += c;
        });
        color = res;
      }

      const rgbValues = (color.match(/.{2}/g) || [])
        .map((hex) => parseInt(hex, 16))
        .join(", ");

      return `rgba(${rgbValues}, ${opacity})`;
    };

    const range = (size, startAt = 0) =>
      [...Array(size).keys()].map(i => i + startAt);

    // export const characterRange = (startChar, endChar) =>
    //   String.fromCharCode(
    //     ...range(
    //       endChar.charCodeAt(0) - startChar.charCodeAt(0),
    //       startChar.charCodeAt(0)
    //     )
    //   );

    // export const zip = (arr, ...arrs) =>
    //   arr.map((val, i) => arrs.reduce((list, curr) => [...list, curr[i]], [val]));

    /* ..\src\DoubleBounce.svelte generated by Svelte v3.50.1 */
    const file$l = "..\\src\\DoubleBounce.svelte";

    function get_each_context$9(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (44:2) {#each range(2, 1) as version}
    function create_each_block$9(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "circle svelte-mq0ycr");

    			set_style(div, "animation", /*duration*/ ctx[2] + " " + (/*version*/ ctx[7] === 1
    			? `${(/*durationNum*/ ctx[6] - 0.1) / 2}${/*durationUnit*/ ctx[5]}`
    			: `0s`) + " infinite ease-in-out");

    			toggle_class(div, "pause-animation", /*pause*/ ctx[4]);
    			add_location(div, file$l, 44, 4, 1032);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*duration*/ 4) {
    				set_style(div, "animation", /*duration*/ ctx[2] + " " + (/*version*/ ctx[7] === 1
    				? `${(/*durationNum*/ ctx[6] - 0.1) / 2}${/*durationUnit*/ ctx[5]}`
    				: `0s`) + " infinite ease-in-out");
    			}

    			if (dirty & /*pause*/ 16) {
    				toggle_class(div, "pause-animation", /*pause*/ ctx[4]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$9.name,
    		type: "each",
    		source: "(44:2) {#each range(2, 1) as version}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$l(ctx) {
    	let div;
    	let each_value = range(2, 1);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$9(get_each_context$9(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "wrapper svelte-mq0ycr");
    			set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			set_style(div, "--color", /*color*/ ctx[0]);
    			add_location(div, file$l, 42, 0, 924);
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
    			if (dirty & /*duration, range, durationNum, durationUnit, pause*/ 116) {
    				each_value = range(2, 1);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$9(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$9(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*size, unit*/ 10) {
    				set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*color*/ 1) {
    				set_style(div, "--color", /*color*/ ctx[0]);
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
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('DoubleBounce', slots, []);
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	let { duration = "2.1s" } = $$props;
    	let { size = "60" } = $$props;
    	let { pause = false } = $$props;
    	let durationUnit = duration.match(durationUnitRegex)[0];
    	let durationNum = duration.replace(durationUnitRegex, "");
    	const writable_props = ['color', 'unit', 'duration', 'size', 'pause'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<DoubleBounce> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    	};

    	$$self.$capture_state = () => ({
    		range,
    		durationUnitRegex,
    		color,
    		unit,
    		duration,
    		size,
    		pause,
    		durationUnit,
    		durationNum
    	});

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    		if ('durationUnit' in $$props) $$invalidate(5, durationUnit = $$props.durationUnit);
    		if ('durationNum' in $$props) $$invalidate(6, durationNum = $$props.durationNum);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, unit, duration, size, pause, durationUnit, durationNum];
    }

    class DoubleBounce extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$l, create_fragment$l, safe_not_equal, {
    			color: 0,
    			unit: 1,
    			duration: 2,
    			size: 3,
    			pause: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DoubleBounce",
    			options,
    			id: create_fragment$l.name
    		});
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

    	get duration() {
    		throw new Error("<DoubleBounce>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<DoubleBounce>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<DoubleBounce>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<DoubleBounce>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pause() {
    		throw new Error("<DoubleBounce>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pause(value) {
    		throw new Error("<DoubleBounce>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ..\src\GoogleSpin.svelte generated by Svelte v3.50.1 */

    const file$k = "..\\src\\GoogleSpin.svelte";

    function create_fragment$k(ctx) {
    	let div;
    	let div_style_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "spinner spinner--google svelte-12dyej7");
    			attr_dev(div, "style", div_style_value = "--duration: " + /*duration*/ ctx[0] + "; " + /*styles*/ ctx[2]);
    			toggle_class(div, "pause-animation", /*pause*/ ctx[1]);
    			add_location(div, file$k, 7, 0, 176);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*duration, styles*/ 5 && div_style_value !== (div_style_value = "--duration: " + /*duration*/ ctx[0] + "; " + /*styles*/ ctx[2])) {
    				attr_dev(div, "style", div_style_value);
    			}

    			if (dirty & /*pause*/ 2) {
    				toggle_class(div, "pause-animation", /*pause*/ ctx[1]);
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
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let styles;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('GoogleSpin', slots, []);
    	let { size = "40px" } = $$props;
    	let { duration = "3s" } = $$props;
    	let { pause = false } = $$props;
    	const writable_props = ['size', 'duration', 'pause'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<GoogleSpin> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('duration' in $$props) $$invalidate(0, duration = $$props.duration);
    		if ('pause' in $$props) $$invalidate(1, pause = $$props.pause);
    	};

    	$$self.$capture_state = () => ({ size, duration, pause, styles });

    	$$self.$inject_state = $$props => {
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('duration' in $$props) $$invalidate(0, duration = $$props.duration);
    		if ('pause' in $$props) $$invalidate(1, pause = $$props.pause);
    		if ('styles' in $$props) $$invalidate(2, styles = $$props.styles);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*size*/ 8) {
    			$$invalidate(2, styles = [`width: ${size}`, `height: ${size}`].join(";"));
    		}
    	};

    	return [duration, pause, styles, size];
    }

    class GoogleSpin extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, { size: 3, duration: 0, pause: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GoogleSpin",
    			options,
    			id: create_fragment$k.name
    		});
    	}

    	get size() {
    		throw new Error("<GoogleSpin>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<GoogleSpin>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get duration() {
    		throw new Error("<GoogleSpin>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<GoogleSpin>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pause() {
    		throw new Error("<GoogleSpin>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pause(value) {
    		throw new Error("<GoogleSpin>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ..\src\ScaleOut.svelte generated by Svelte v3.50.1 */

    const file$j = "..\\src\\ScaleOut.svelte";

    function create_fragment$j(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", "circle svelte-11fa3qg");
    			toggle_class(div0, "pause-animation", /*pause*/ ctx[4]);
    			add_location(div0, file$j, 38, 2, 854);
    			attr_dev(div1, "class", "wrapper svelte-11fa3qg");
    			set_style(div1, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			set_style(div1, "--color", /*color*/ ctx[0]);
    			set_style(div1, "--duration", /*duration*/ ctx[2]);
    			set_style(div1, "--duration", /*duration*/ ctx[2]);
    			add_location(div1, file$j, 35, 0, 727);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*pause*/ 16) {
    				toggle_class(div0, "pause-animation", /*pause*/ ctx[4]);
    			}

    			if (dirty & /*size, unit*/ 10) {
    				set_style(div1, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*color*/ 1) {
    				set_style(div1, "--color", /*color*/ ctx[0]);
    			}

    			if (dirty & /*duration*/ 4) {
    				set_style(div1, "--duration", /*duration*/ ctx[2]);
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
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ScaleOut', slots, []);
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	let { duration = "1s" } = $$props;
    	let { size = "60" } = $$props;
    	let { pause = false } = $$props;
    	const writable_props = ['color', 'unit', 'duration', 'size', 'pause'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ScaleOut> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    	};

    	$$self.$capture_state = () => ({ color, unit, duration, size, pause });

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, unit, duration, size, pause];
    }

    class ScaleOut extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$j, create_fragment$j, safe_not_equal, {
    			color: 0,
    			unit: 1,
    			duration: 2,
    			size: 3,
    			pause: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ScaleOut",
    			options,
    			id: create_fragment$j.name
    		});
    	}

    	get color() {
    		throw new Error("<ScaleOut>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<ScaleOut>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<ScaleOut>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<ScaleOut>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get duration() {
    		throw new Error("<ScaleOut>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<ScaleOut>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<ScaleOut>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<ScaleOut>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pause() {
    		throw new Error("<ScaleOut>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pause(value) {
    		throw new Error("<ScaleOut>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ..\src\SpinLine.svelte generated by Svelte v3.50.1 */

    const file$i = "..\\src\\SpinLine.svelte";

    function create_fragment$i(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", "line svelte-lmjzn5");
    			toggle_class(div0, "pause-animation", /*pause*/ ctx[5]);
    			add_location(div0, file$i, 88, 2, 1815);
    			attr_dev(div1, "class", "wrapper svelte-lmjzn5");
    			set_style(div1, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			set_style(div1, "--color", /*color*/ ctx[0]);
    			set_style(div1, "--stroke", /*stroke*/ ctx[4]);
    			set_style(div1, "--floatSize", /*size*/ ctx[3]);
    			set_style(div1, "--duration", /*duration*/ ctx[2]);
    			add_location(div1, file$i, 85, 0, 1672);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*pause*/ 32) {
    				toggle_class(div0, "pause-animation", /*pause*/ ctx[5]);
    			}

    			if (dirty & /*size, unit*/ 10) {
    				set_style(div1, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*color*/ 1) {
    				set_style(div1, "--color", /*color*/ ctx[0]);
    			}

    			if (dirty & /*stroke*/ 16) {
    				set_style(div1, "--stroke", /*stroke*/ ctx[4]);
    			}

    			if (dirty & /*size*/ 8) {
    				set_style(div1, "--floatSize", /*size*/ ctx[3]);
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
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SpinLine', slots, []);
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	let { duration = "4s" } = $$props;
    	let { size = "60" } = $$props;
    	let { stroke = +size / 12 + unit } = $$props;
    	let { pause = false } = $$props;
    	const writable_props = ['color', 'unit', 'duration', 'size', 'stroke', 'pause'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SpinLine> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('stroke' in $$props) $$invalidate(4, stroke = $$props.stroke);
    		if ('pause' in $$props) $$invalidate(5, pause = $$props.pause);
    	};

    	$$self.$capture_state = () => ({
    		color,
    		unit,
    		duration,
    		size,
    		stroke,
    		pause
    	});

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('stroke' in $$props) $$invalidate(4, stroke = $$props.stroke);
    		if ('pause' in $$props) $$invalidate(5, pause = $$props.pause);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, unit, duration, size, stroke, pause];
    }

    class SpinLine extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$i, create_fragment$i, safe_not_equal, {
    			color: 0,
    			unit: 1,
    			duration: 2,
    			size: 3,
    			stroke: 4,
    			pause: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SpinLine",
    			options,
    			id: create_fragment$i.name
    		});
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

    	get duration() {
    		throw new Error("<SpinLine>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<SpinLine>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<SpinLine>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<SpinLine>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get stroke() {
    		throw new Error("<SpinLine>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set stroke(value) {
    		throw new Error("<SpinLine>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pause() {
    		throw new Error("<SpinLine>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pause(value) {
    		throw new Error("<SpinLine>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ..\src\Stretch.svelte generated by Svelte v3.50.1 */
    const file$h = "..\\src\\Stretch.svelte";

    function get_each_context$8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (45:2) {#each range(5, 1) as version}
    function create_each_block$8(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "rect svelte-13ezdzk");
    			set_style(div, "animation-delay", (/*version*/ ctx[7] - 1) * (+/*durationNum*/ ctx[6] / 12) + /*durationUnit*/ ctx[5]);
    			toggle_class(div, "pause-animation", /*pause*/ ctx[4]);
    			add_location(div, file$h, 45, 4, 1055);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*pause*/ 16) {
    				toggle_class(div, "pause-animation", /*pause*/ ctx[4]);
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
    		source: "(45:2) {#each range(5, 1) as version}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let div;
    	let each_value = range(5, 1);
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

    			attr_dev(div, "class", "wrapper svelte-13ezdzk");
    			set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			set_style(div, "--color", /*color*/ ctx[0]);
    			set_style(div, "--duration", /*duration*/ ctx[2]);
    			add_location(div, file$h, 41, 0, 917);
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
    			if (dirty & /*range, durationNum, durationUnit, pause*/ 112) {
    				each_value = range(5, 1);
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

    			if (dirty & /*size, unit*/ 10) {
    				set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*color*/ 1) {
    				set_style(div, "--color", /*color*/ ctx[0]);
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
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Stretch', slots, []);
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	let { duration = "1.2s" } = $$props;
    	let { size = "60" } = $$props;
    	let { pause = false } = $$props;
    	let durationUnit = duration.match(durationUnitRegex)[0];
    	let durationNum = duration.replace(durationUnitRegex, "");
    	const writable_props = ['color', 'unit', 'duration', 'size', 'pause'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Stretch> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    	};

    	$$self.$capture_state = () => ({
    		range,
    		durationUnitRegex,
    		color,
    		unit,
    		duration,
    		size,
    		pause,
    		durationUnit,
    		durationNum
    	});

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    		if ('durationUnit' in $$props) $$invalidate(5, durationUnit = $$props.durationUnit);
    		if ('durationNum' in $$props) $$invalidate(6, durationNum = $$props.durationNum);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, unit, duration, size, pause, durationUnit, durationNum];
    }

    class Stretch extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {
    			color: 0,
    			unit: 1,
    			duration: 2,
    			size: 3,
    			pause: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Stretch",
    			options,
    			id: create_fragment$h.name
    		});
    	}

    	get color() {
    		throw new Error("<Stretch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Stretch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<Stretch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<Stretch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get duration() {
    		throw new Error("<Stretch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Stretch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Stretch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Stretch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pause() {
    		throw new Error("<Stretch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pause(value) {
    		throw new Error("<Stretch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ..\src\BarLoader.svelte generated by Svelte v3.50.1 */
    const file$g = "..\\src\\BarLoader.svelte";

    function get_each_context$7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (77:2) {#each range(2, 1) as version}
    function create_each_block$7(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "lines small-lines " + /*version*/ ctx[6] + " svelte-15op9vl");
    			set_style(div, "--color", /*color*/ ctx[0]);
    			set_style(div, "--duration", /*duration*/ ctx[2]);
    			toggle_class(div, "pause-animation", /*pause*/ ctx[4]);
    			add_location(div, file$g, 77, 4, 1689);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*color*/ 1) {
    				set_style(div, "--color", /*color*/ ctx[0]);
    			}

    			if (dirty & /*duration*/ 4) {
    				set_style(div, "--duration", /*duration*/ ctx[2]);
    			}

    			if (dirty & /*pause*/ 16) {
    				toggle_class(div, "pause-animation", /*pause*/ ctx[4]);
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
    		source: "(77:2) {#each range(2, 1) as version}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let div;
    	let each_value = range(2, 1);
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

    			attr_dev(div, "class", "wrapper svelte-15op9vl");
    			set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			set_style(div, "--rgba", /*rgba*/ ctx[5]);
    			add_location(div, file$g, 75, 0, 1584);
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
    			if (dirty & /*range, color, duration, pause*/ 21) {
    				each_value = range(2, 1);
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

    			if (dirty & /*size, unit*/ 10) {
    				set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*rgba*/ 32) {
    				set_style(div, "--rgba", /*rgba*/ ctx[5]);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('BarLoader', slots, []);
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	let { duration = "2.1s" } = $$props;
    	let { size = "60" } = $$props;
    	let { pause = false } = $$props;
    	let rgba;
    	const writable_props = ['color', 'unit', 'duration', 'size', 'pause'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<BarLoader> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    	};

    	$$self.$capture_state = () => ({
    		calculateRgba,
    		range,
    		color,
    		unit,
    		duration,
    		size,
    		pause,
    		rgba
    	});

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    		if ('rgba' in $$props) $$invalidate(5, rgba = $$props.rgba);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*color*/ 1) {
    			$$invalidate(5, rgba = calculateRgba(color, 0.2));
    		}
    	};

    	return [color, unit, duration, size, pause, rgba];
    }

    class BarLoader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {
    			color: 0,
    			unit: 1,
    			duration: 2,
    			size: 3,
    			pause: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BarLoader",
    			options,
    			id: create_fragment$g.name
    		});
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

    	get duration() {
    		throw new Error("<BarLoader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<BarLoader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<BarLoader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<BarLoader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pause() {
    		throw new Error("<BarLoader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pause(value) {
    		throw new Error("<BarLoader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ..\src\Jumper.svelte generated by Svelte v3.50.1 */
    const file$f = "..\\src\\Jumper.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (47:2) {#each range(3, 1) as version}
    function create_each_block$6(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "circle svelte-1xjgg32");
    			set_style(div, "animation-delay", /*durationNum*/ ctx[6] / 3 * (/*version*/ ctx[7] - 1) + /*durationUnit*/ ctx[5]);
    			toggle_class(div, "pause-animation", /*pause*/ ctx[4]);
    			add_location(div, file$f, 47, 4, 1087);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*pause*/ 16) {
    				toggle_class(div, "pause-animation", /*pause*/ ctx[4]);
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
    		source: "(47:2) {#each range(3, 1) as version}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let div;
    	let each_value = range(3, 1);
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

    			attr_dev(div, "class", "wrapper svelte-1xjgg32");
    			set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			set_style(div, "--color", /*color*/ ctx[0]);
    			set_style(div, "--duration", /*duration*/ ctx[2]);
    			add_location(div, file$f, 43, 0, 948);
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
    			if (dirty & /*durationNum, range, durationUnit, pause*/ 112) {
    				each_value = range(3, 1);
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

    			if (dirty & /*size, unit*/ 10) {
    				set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*color*/ 1) {
    				set_style(div, "--color", /*color*/ ctx[0]);
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
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Jumper', slots, []);
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	let { duration = "1s" } = $$props;
    	let { size = "60" } = $$props;
    	let { pause = false } = $$props;
    	let durationUnit = duration.match(durationUnitRegex)[0];
    	let durationNum = duration.replace(durationUnitRegex, "");
    	const writable_props = ['color', 'unit', 'duration', 'size', 'pause'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Jumper> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    	};

    	$$self.$capture_state = () => ({
    		range,
    		durationUnitRegex,
    		color,
    		unit,
    		duration,
    		size,
    		pause,
    		durationUnit,
    		durationNum
    	});

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    		if ('durationUnit' in $$props) $$invalidate(5, durationUnit = $$props.durationUnit);
    		if ('durationNum' in $$props) $$invalidate(6, durationNum = $$props.durationNum);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, unit, duration, size, pause, durationUnit, durationNum];
    }

    class Jumper extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {
    			color: 0,
    			unit: 1,
    			duration: 2,
    			size: 3,
    			pause: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Jumper",
    			options,
    			id: create_fragment$f.name
    		});
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

    	get duration() {
    		throw new Error("<Jumper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Jumper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Jumper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Jumper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pause() {
    		throw new Error("<Jumper>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pause(value) {
    		throw new Error("<Jumper>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ..\src\RingLoader.svelte generated by Svelte v3.50.1 */
    const file$e = "..\\src\\RingLoader.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (60:2) {#each range(2, 1) as version}
    function create_each_block$5(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "border " + /*version*/ ctx[5] + " svelte-19rwmh");
    			toggle_class(div, "pause-animation", /*pause*/ ctx[4]);
    			add_location(div, file$e, 60, 4, 1417);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*pause*/ 16) {
    				toggle_class(div, "pause-animation", /*pause*/ ctx[4]);
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
    		source: "(60:2) {#each range(2, 1) as version}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let div;
    	let each_value = range(2, 1);
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

    			attr_dev(div, "class", "wrapper svelte-19rwmh");
    			set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			set_style(div, "--color", /*color*/ ctx[0]);
    			set_style(div, "--duration", /*duration*/ ctx[2]);
    			add_location(div, file$e, 56, 0, 1278);
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
    			if (dirty & /*range, pause*/ 16) {
    				each_value = range(2, 1);
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

    			if (dirty & /*size, unit*/ 10) {
    				set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*color*/ 1) {
    				set_style(div, "--color", /*color*/ ctx[0]);
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
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('RingLoader', slots, []);
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	let { duration = "2s" } = $$props;
    	let { size = "60" } = $$props;
    	let { pause = false } = $$props;
    	const writable_props = ['color', 'unit', 'duration', 'size', 'pause'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<RingLoader> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    	};

    	$$self.$capture_state = () => ({
    		range,
    		color,
    		unit,
    		duration,
    		size,
    		pause
    	});

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, unit, duration, size, pause];
    }

    class RingLoader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {
    			color: 0,
    			unit: 1,
    			duration: 2,
    			size: 3,
    			pause: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RingLoader",
    			options,
    			id: create_fragment$e.name
    		});
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

    	get duration() {
    		throw new Error("<RingLoader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<RingLoader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<RingLoader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<RingLoader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pause() {
    		throw new Error("<RingLoader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pause(value) {
    		throw new Error("<RingLoader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ..\src\SyncLoader.svelte generated by Svelte v3.50.1 */
    const file$d = "..\\src\\SyncLoader.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (64:2) {#each range(3, 1) as i}
    function create_each_block$4(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "dot svelte-gxixuo");
    			set_style(div, "--dotSize", +/*size*/ ctx[3] * 0.25 + /*unit*/ ctx[1]);
    			set_style(div, "--color", /*color*/ ctx[0]);
    			set_style(div, "animation-delay", /*i*/ ctx[7] * (+/*durationNum*/ ctx[6] / 10) + /*durationUnit*/ ctx[5]);
    			toggle_class(div, "pause-animation", /*pause*/ ctx[4]);
    			add_location(div, file$d, 64, 4, 1587);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*size, unit*/ 10) {
    				set_style(div, "--dotSize", +/*size*/ ctx[3] * 0.25 + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*color*/ 1) {
    				set_style(div, "--color", /*color*/ ctx[0]);
    			}

    			if (dirty & /*pause*/ 16) {
    				toggle_class(div, "pause-animation", /*pause*/ ctx[4]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(64:2) {#each range(3, 1) as i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let div;
    	let each_value = range(3, 1);
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

    			attr_dev(div, "class", "wrapper svelte-gxixuo");
    			set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			set_style(div, "--duration", /*duration*/ ctx[2]);
    			add_location(div, file$d, 62, 0, 1479);
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
    			if (dirty & /*size, unit, color, range, durationNum, durationUnit, pause*/ 123) {
    				each_value = range(3, 1);
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

    			if (dirty & /*size, unit*/ 10) {
    				set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
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
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SyncLoader', slots, []);
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	let { duration = "0.6s" } = $$props;
    	let { size = "60" } = $$props;
    	let { pause = false } = $$props;
    	let durationUnit = duration.match(durationUnitRegex)[0];
    	let durationNum = duration.replace(durationUnitRegex, "");
    	const writable_props = ['color', 'unit', 'duration', 'size', 'pause'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SyncLoader> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    	};

    	$$self.$capture_state = () => ({
    		range,
    		durationUnitRegex,
    		color,
    		unit,
    		duration,
    		size,
    		pause,
    		durationUnit,
    		durationNum
    	});

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    		if ('durationUnit' in $$props) $$invalidate(5, durationUnit = $$props.durationUnit);
    		if ('durationNum' in $$props) $$invalidate(6, durationNum = $$props.durationNum);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, unit, duration, size, pause, durationUnit, durationNum];
    }

    class SyncLoader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {
    			color: 0,
    			unit: 1,
    			duration: 2,
    			size: 3,
    			pause: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SyncLoader",
    			options,
    			id: create_fragment$d.name
    		});
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

    	get duration() {
    		throw new Error("<SyncLoader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<SyncLoader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<SyncLoader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<SyncLoader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pause() {
    		throw new Error("<SyncLoader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pause(value) {
    		throw new Error("<SyncLoader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ..\src\Rainbow.svelte generated by Svelte v3.50.1 */

    const file$c = "..\\src\\Rainbow.svelte";

    function create_fragment$c(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", "rainbow svelte-e4n95w");
    			toggle_class(div0, "pause-animation", /*pause*/ ctx[4]);
    			add_location(div0, file$c, 53, 2, 1168);
    			attr_dev(div1, "class", "wrapper svelte-e4n95w");
    			set_style(div1, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			set_style(div1, "--color", /*color*/ ctx[0]);
    			set_style(div1, "--duration", /*duration*/ ctx[2]);
    			add_location(div1, file$c, 50, 0, 1065);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*pause*/ 16) {
    				toggle_class(div0, "pause-animation", /*pause*/ ctx[4]);
    			}

    			if (dirty & /*size, unit*/ 10) {
    				set_style(div1, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*color*/ 1) {
    				set_style(div1, "--color", /*color*/ ctx[0]);
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
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Rainbow', slots, []);
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	let { duration = "3s" } = $$props;
    	let { size = "60" } = $$props;
    	let { pause = false } = $$props;
    	const writable_props = ['color', 'unit', 'duration', 'size', 'pause'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Rainbow> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    	};

    	$$self.$capture_state = () => ({ color, unit, duration, size, pause });

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, unit, duration, size, pause];
    }

    class Rainbow extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {
    			color: 0,
    			unit: 1,
    			duration: 2,
    			size: 3,
    			pause: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Rainbow",
    			options,
    			id: create_fragment$c.name
    		});
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

    	get duration() {
    		throw new Error("<Rainbow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Rainbow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Rainbow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Rainbow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pause() {
    		throw new Error("<Rainbow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pause(value) {
    		throw new Error("<Rainbow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ..\src\Wave.svelte generated by Svelte v3.50.1 */
    const file$b = "..\\src\\Wave.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (51:2) {#each range(10, 0) as version}
    function create_each_block$3(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "bar svelte-1s04skl");
    			set_style(div, "left", /*version*/ ctx[7] * (+/*size*/ ctx[3] / 5 + (+/*size*/ ctx[3] / 15 - +/*size*/ ctx[3] / 100)) + /*unit*/ ctx[1]);
    			set_style(div, "animation-delay", /*version*/ ctx[7] * (+/*durationNum*/ ctx[6] / 8.3) + /*durationUnit*/ ctx[5]);
    			toggle_class(div, "pause-animation", /*pause*/ ctx[4]);
    			add_location(div, file$b, 51, 4, 1289);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*size, unit*/ 10) {
    				set_style(div, "left", /*version*/ ctx[7] * (+/*size*/ ctx[3] / 5 + (+/*size*/ ctx[3] / 15 - +/*size*/ ctx[3] / 100)) + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*pause*/ 16) {
    				toggle_class(div, "pause-animation", /*pause*/ ctx[4]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(51:2) {#each range(10, 0) as version}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div;
    	let each_value = range(10, 0);
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

    			attr_dev(div, "class", "wrapper svelte-1s04skl");
    			set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			set_style(div, "--color", /*color*/ ctx[0]);
    			set_style(div, "--duration", /*duration*/ ctx[2]);
    			add_location(div, file$b, 47, 0, 1149);
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
    			if (dirty & /*range, size, unit, durationNum, durationUnit, pause*/ 122) {
    				each_value = range(10, 0);
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

    			if (dirty & /*size, unit*/ 10) {
    				set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*color*/ 1) {
    				set_style(div, "--color", /*color*/ ctx[0]);
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
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Wave', slots, []);
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	let { duration = "1.25s" } = $$props;
    	let { size = "60" } = $$props;
    	let { pause = false } = $$props;
    	let durationUnit = duration.match(durationUnitRegex)[0];
    	let durationNum = duration.replace(durationUnitRegex, "");
    	const writable_props = ['color', 'unit', 'duration', 'size', 'pause'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Wave> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    	};

    	$$self.$capture_state = () => ({
    		range,
    		durationUnitRegex,
    		color,
    		unit,
    		duration,
    		size,
    		pause,
    		durationUnit,
    		durationNum
    	});

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    		if ('durationUnit' in $$props) $$invalidate(5, durationUnit = $$props.durationUnit);
    		if ('durationNum' in $$props) $$invalidate(6, durationNum = $$props.durationNum);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, unit, duration, size, pause, durationUnit, durationNum];
    }

    class Wave extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
    			color: 0,
    			unit: 1,
    			duration: 2,
    			size: 3,
    			pause: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Wave",
    			options,
    			id: create_fragment$b.name
    		});
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

    	get duration() {
    		throw new Error("<Wave>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Wave>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Wave>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Wave>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pause() {
    		throw new Error("<Wave>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pause(value) {
    		throw new Error("<Wave>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ..\src\Firework.svelte generated by Svelte v3.50.1 */

    const file$a = "..\\src\\Firework.svelte";

    function create_fragment$a(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", "firework svelte-eb9o9m");
    			toggle_class(div0, "pause-animation", /*pause*/ ctx[4]);
    			add_location(div0, file$a, 44, 2, 962);
    			attr_dev(div1, "class", "wrapper svelte-eb9o9m");
    			set_style(div1, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			set_style(div1, "--color", /*color*/ ctx[0]);
    			set_style(div1, "--duration", /*duration*/ ctx[2]);
    			add_location(div1, file$a, 41, 0, 859);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*pause*/ 16) {
    				toggle_class(div0, "pause-animation", /*pause*/ ctx[4]);
    			}

    			if (dirty & /*size, unit*/ 10) {
    				set_style(div1, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*color*/ 1) {
    				set_style(div1, "--color", /*color*/ ctx[0]);
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
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Firework', slots, []);
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	let { duration = "1.25s" } = $$props;
    	let { size = "60" } = $$props;
    	let { pause = false } = $$props;
    	const writable_props = ['color', 'unit', 'duration', 'size', 'pause'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Firework> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    	};

    	$$self.$capture_state = () => ({ color, unit, duration, size, pause });

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, unit, duration, size, pause];
    }

    class Firework extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
    			color: 0,
    			unit: 1,
    			duration: 2,
    			size: 3,
    			pause: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Firework",
    			options,
    			id: create_fragment$a.name
    		});
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

    	get duration() {
    		throw new Error("<Firework>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Firework>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Firework>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Firework>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pause() {
    		throw new Error("<Firework>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pause(value) {
    		throw new Error("<Firework>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ..\src\Pulse.svelte generated by Svelte v3.50.1 */
    const file$9 = "..\\src\\Pulse.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (48:2) {#each range(3, 0) as version}
    function create_each_block$2(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "cube svelte-100k7pn");
    			set_style(div, "animation-delay", /*version*/ ctx[7] * (+/*durationNum*/ ctx[6] / 10) + /*durationUnit*/ ctx[5]);
    			set_style(div, "left", /*version*/ ctx[7] * (+/*size*/ ctx[3] / 3 + +/*size*/ ctx[3] / 15) + /*unit*/ ctx[1]);
    			toggle_class(div, "pause-animation", /*pause*/ ctx[4]);
    			add_location(div, file$9, 48, 4, 1145);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*size, unit*/ 10) {
    				set_style(div, "left", /*version*/ ctx[7] * (+/*size*/ ctx[3] / 3 + +/*size*/ ctx[3] / 15) + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*pause*/ 16) {
    				toggle_class(div, "pause-animation", /*pause*/ ctx[4]);
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
    		source: "(48:2) {#each range(3, 0) as version}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div;
    	let each_value = range(3, 0);
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

    			attr_dev(div, "class", "wrapper svelte-100k7pn");
    			set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			set_style(div, "--color", /*color*/ ctx[0]);
    			set_style(div, "--duration", /*duration*/ ctx[2]);
    			add_location(div, file$9, 44, 0, 1007);
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
    			if (dirty & /*range, durationNum, durationUnit, size, unit, pause*/ 122) {
    				each_value = range(3, 0);
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

    			if (dirty & /*size, unit*/ 10) {
    				set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*color*/ 1) {
    				set_style(div, "--color", /*color*/ ctx[0]);
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
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Pulse', slots, []);
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	let { duration = "1.5s" } = $$props;
    	let { size = "60" } = $$props;
    	let { pause = false } = $$props;
    	let durationUnit = duration.match(durationUnitRegex)[0];
    	let durationNum = duration.replace(durationUnitRegex, "");
    	const writable_props = ['color', 'unit', 'duration', 'size', 'pause'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Pulse> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    	};

    	$$self.$capture_state = () => ({
    		range,
    		durationUnitRegex,
    		color,
    		unit,
    		duration,
    		size,
    		pause,
    		durationUnit,
    		durationNum
    	});

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    		if ('durationUnit' in $$props) $$invalidate(5, durationUnit = $$props.durationUnit);
    		if ('durationNum' in $$props) $$invalidate(6, durationNum = $$props.durationNum);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, unit, duration, size, pause, durationUnit, durationNum];
    }

    class Pulse extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			color: 0,
    			unit: 1,
    			duration: 2,
    			size: 3,
    			pause: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Pulse",
    			options,
    			id: create_fragment$9.name
    		});
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

    	get duration() {
    		throw new Error("<Pulse>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Pulse>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Pulse>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Pulse>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pause() {
    		throw new Error("<Pulse>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pause(value) {
    		throw new Error("<Pulse>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ..\src\Jellyfish.svelte generated by Svelte v3.50.1 */
    const file$8 = "..\\src\\Jellyfish.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (46:2) {#each range(6, 0) as version}
    function create_each_block$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "ring svelte-hlioq1");
    			set_style(div, "animation-delay", /*version*/ ctx[7] * (/*durationNum*/ ctx[6] / 25) + /*durationUnit*/ ctx[5]);
    			set_style(div, "width", /*version*/ ctx[7] * (+/*size*/ ctx[3] / 6) + /*unit*/ ctx[1]);
    			set_style(div, "height", /*version*/ ctx[7] * (+/*size*/ ctx[3] / 6) / 2 + /*unit*/ ctx[1]);
    			toggle_class(div, "pause-animation", /*pause*/ ctx[4]);
    			add_location(div, file$8, 46, 4, 1253);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*size, unit*/ 10) {
    				set_style(div, "width", /*version*/ ctx[7] * (+/*size*/ ctx[3] / 6) + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*size, unit*/ 10) {
    				set_style(div, "height", /*version*/ ctx[7] * (+/*size*/ ctx[3] / 6) / 2 + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*pause*/ 16) {
    				toggle_class(div, "pause-animation", /*pause*/ ctx[4]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(46:2) {#each range(6, 0) as version}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div;
    	let each_value = range(6, 0);
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

    			attr_dev(div, "class", "wrapper svelte-hlioq1");
    			set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			set_style(div, "--color", /*color*/ ctx[0]);
    			set_style(div, "--motionOne", -/*size*/ ctx[3] / 5 + /*unit*/ ctx[1]);
    			set_style(div, "--motionTwo", +/*size*/ ctx[3] / 4 + /*unit*/ ctx[1]);
    			set_style(div, "--motionThree", -/*size*/ ctx[3] / 5 + /*unit*/ ctx[1]);
    			set_style(div, "--duration", /*duration*/ ctx[2]);
    			add_location(div, file$8, 42, 0, 1016);
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
    			if (dirty & /*range, durationNum, durationUnit, size, unit, pause*/ 122) {
    				each_value = range(6, 0);
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

    			if (dirty & /*size, unit*/ 10) {
    				set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*color*/ 1) {
    				set_style(div, "--color", /*color*/ ctx[0]);
    			}

    			if (dirty & /*size, unit*/ 10) {
    				set_style(div, "--motionOne", -/*size*/ ctx[3] / 5 + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*size, unit*/ 10) {
    				set_style(div, "--motionTwo", +/*size*/ ctx[3] / 4 + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*size, unit*/ 10) {
    				set_style(div, "--motionThree", -/*size*/ ctx[3] / 5 + /*unit*/ ctx[1]);
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Jellyfish', slots, []);
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	let { duration = "2.5s" } = $$props;
    	let { size = "60" } = $$props;
    	let { pause = false } = $$props;
    	let durationUnit = duration.match(durationUnitRegex)[0];
    	let durationNum = duration.replace(durationUnitRegex, "");
    	const writable_props = ['color', 'unit', 'duration', 'size', 'pause'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Jellyfish> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    	};

    	$$self.$capture_state = () => ({
    		range,
    		durationUnitRegex,
    		color,
    		unit,
    		duration,
    		size,
    		pause,
    		durationUnit,
    		durationNum
    	});

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    		if ('durationUnit' in $$props) $$invalidate(5, durationUnit = $$props.durationUnit);
    		if ('durationNum' in $$props) $$invalidate(6, durationNum = $$props.durationNum);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, unit, duration, size, pause, durationUnit, durationNum];
    }

    class Jellyfish extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			color: 0,
    			unit: 1,
    			duration: 2,
    			size: 3,
    			pause: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Jellyfish",
    			options,
    			id: create_fragment$8.name
    		});
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

    	get duration() {
    		throw new Error("<Jellyfish>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Jellyfish>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Jellyfish>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Jellyfish>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pause() {
    		throw new Error("<Jellyfish>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pause(value) {
    		throw new Error("<Jellyfish>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ..\src\Chasing.svelte generated by Svelte v3.50.1 */
    const file$7 = "..\\src\\Chasing.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (58:4) {#each range(2, 0) as version}
    function create_each_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "dot svelte-9308en");

    			set_style(div, "animation-delay", /*version*/ ctx[7] === 1
    			? `${/*durationNum*/ ctx[6] / 2}${/*durationUnit*/ ctx[5]}`
    			: '0s');

    			set_style(div, "bottom", /*version*/ ctx[7] === 1 ? '0' : '');
    			set_style(div, "top", /*version*/ ctx[7] === 1 ? 'auto' : '');
    			toggle_class(div, "pause-animation", /*pause*/ ctx[4]);
    			add_location(div, file$7, 58, 6, 1345);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*pause*/ 16) {
    				toggle_class(div, "pause-animation", /*pause*/ ctx[4]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(58:4) {#each range(2, 0) as version}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div1;
    	let div0;
    	let each_value = range(2, 0);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "spinner svelte-9308en");
    			toggle_class(div0, "pause-animation", /*pause*/ ctx[4]);
    			add_location(div0, file$7, 56, 2, 1250);
    			attr_dev(div1, "class", "wrapper svelte-9308en");
    			set_style(div1, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			set_style(div1, "--color", /*color*/ ctx[0]);
    			set_style(div1, "--duration", /*duration*/ ctx[2]);
    			add_location(div1, file$7, 53, 0, 1147);
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
    			if (dirty & /*range, durationNum, durationUnit, pause*/ 112) {
    				each_value = range(2, 0);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*pause*/ 16) {
    				toggle_class(div0, "pause-animation", /*pause*/ ctx[4]);
    			}

    			if (dirty & /*size, unit*/ 10) {
    				set_style(div1, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*color*/ 1) {
    				set_style(div1, "--color", /*color*/ ctx[0]);
    			}

    			if (dirty & /*duration*/ 4) {
    				set_style(div1, "--duration", /*duration*/ ctx[2]);
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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Chasing', slots, []);
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	let { duration = "2s" } = $$props;
    	let { size = "60" } = $$props;
    	let { pause = false } = $$props;
    	let durationUnit = duration.match(durationUnitRegex)[0];
    	let durationNum = duration.replace(durationUnitRegex, "");
    	const writable_props = ['color', 'unit', 'duration', 'size', 'pause'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Chasing> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    	};

    	$$self.$capture_state = () => ({
    		durationUnitRegex,
    		range,
    		color,
    		unit,
    		duration,
    		size,
    		pause,
    		durationUnit,
    		durationNum
    	});

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    		if ('durationUnit' in $$props) $$invalidate(5, durationUnit = $$props.durationUnit);
    		if ('durationNum' in $$props) $$invalidate(6, durationNum = $$props.durationNum);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, unit, duration, size, pause, durationUnit, durationNum];
    }

    class Chasing extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			color: 0,
    			unit: 1,
    			duration: 2,
    			size: 3,
    			pause: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chasing",
    			options,
    			id: create_fragment$7.name
    		});
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

    	get duration() {
    		throw new Error("<Chasing>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Chasing>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Chasing>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Chasing>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pause() {
    		throw new Error("<Chasing>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pause(value) {
    		throw new Error("<Chasing>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ..\src\Shadow.svelte generated by Svelte v3.50.1 */

    const file$6 = "..\\src\\Shadow.svelte";

    function create_fragment$6(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", "shadow svelte-1jumb89");
    			toggle_class(div0, "pause-animation", /*pause*/ ctx[4]);
    			add_location(div0, file$6, 76, 2, 2074);
    			attr_dev(div1, "class", "wrapper svelte-1jumb89");
    			set_style(div1, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			set_style(div1, "--color", /*color*/ ctx[0]);
    			set_style(div1, "--duration", /*duration*/ ctx[2]);
    			add_location(div1, file$6, 73, 0, 1971);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*pause*/ 16) {
    				toggle_class(div0, "pause-animation", /*pause*/ ctx[4]);
    			}

    			if (dirty & /*size, unit*/ 10) {
    				set_style(div1, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*color*/ 1) {
    				set_style(div1, "--color", /*color*/ ctx[0]);
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Shadow', slots, []);
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	let { duration = "1.7s" } = $$props;
    	let { size = "60" } = $$props;
    	let { pause = false } = $$props;
    	const writable_props = ['color', 'unit', 'duration', 'size', 'pause'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Shadow> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    	};

    	$$self.$capture_state = () => ({ color, unit, duration, size, pause });

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, unit, duration, size, pause];
    }

    class Shadow extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			color: 0,
    			unit: 1,
    			duration: 2,
    			size: 3,
    			pause: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Shadow",
    			options,
    			id: create_fragment$6.name
    		});
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

    	get duration() {
    		throw new Error("<Shadow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Shadow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Shadow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Shadow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pause() {
    		throw new Error("<Shadow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pause(value) {
    		throw new Error("<Shadow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ..\src\Square.svelte generated by Svelte v3.50.1 */

    const file$5 = "..\\src\\Square.svelte";

    function create_fragment$5(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "square svelte-1sd6xni");
    			set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			set_style(div, "--color", /*color*/ ctx[0]);
    			set_style(div, "--duration", /*duration*/ ctx[2]);
    			toggle_class(div, "pause-animation", /*pause*/ ctx[4]);
    			add_location(div, file$5, 41, 0, 1048);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size, unit*/ 10) {
    				set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*color*/ 1) {
    				set_style(div, "--color", /*color*/ ctx[0]);
    			}

    			if (dirty & /*duration*/ 4) {
    				set_style(div, "--duration", /*duration*/ ctx[2]);
    			}

    			if (dirty & /*pause*/ 16) {
    				toggle_class(div, "pause-animation", /*pause*/ ctx[4]);
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Square', slots, []);
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	let { duration = "3s" } = $$props;
    	let { size = "60" } = $$props;
    	let { pause = false } = $$props;
    	const writable_props = ['color', 'unit', 'duration', 'size', 'pause'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Square> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    	};

    	$$self.$capture_state = () => ({ color, unit, duration, size, pause });

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, unit, duration, size, pause];
    }

    class Square extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			color: 0,
    			unit: 1,
    			duration: 2,
    			size: 3,
    			pause: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Square",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get color() {
    		throw new Error("<Square>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Square>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<Square>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<Square>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get duration() {
    		throw new Error("<Square>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Square>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Square>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Square>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pause() {
    		throw new Error("<Square>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pause(value) {
    		throw new Error("<Square>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ..\src\Moon.svelte generated by Svelte v3.50.1 */

    const file$4 = "..\\src\\Moon.svelte";

    function create_fragment$4(ctx) {
    	let div2;
    	let div0;
    	let t;
    	let div1;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t = space();
    			div1 = element("div");
    			attr_dev(div0, "class", "circle-one svelte-15fw69x");
    			toggle_class(div0, "pause-animation", /*pause*/ ctx[4]);
    			add_location(div0, file$4, 50, 2, 1326);
    			attr_dev(div1, "class", "circle-two svelte-15fw69x");
    			toggle_class(div1, "pause-animation", /*pause*/ ctx[4]);
    			add_location(div1, file$4, 51, 2, 1386);
    			attr_dev(div2, "class", "wrapper svelte-15fw69x");
    			set_style(div2, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			set_style(div2, "--color", /*color*/ ctx[0]);
    			set_style(div2, "--moonSize", /*top*/ ctx[5] + /*unit*/ ctx[1]);
    			set_style(div2, "--duration", /*duration*/ ctx[2]);
    			toggle_class(div2, "pause-animation", /*pause*/ ctx[4]);
    			add_location(div2, file$4, 47, 0, 1168);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t);
    			append_dev(div2, div1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*pause*/ 16) {
    				toggle_class(div0, "pause-animation", /*pause*/ ctx[4]);
    			}

    			if (dirty & /*pause*/ 16) {
    				toggle_class(div1, "pause-animation", /*pause*/ ctx[4]);
    			}

    			if (dirty & /*size, unit*/ 10) {
    				set_style(div2, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*color*/ 1) {
    				set_style(div2, "--color", /*color*/ ctx[0]);
    			}

    			if (dirty & /*unit*/ 2) {
    				set_style(div2, "--moonSize", /*top*/ ctx[5] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*duration*/ 4) {
    				set_style(div2, "--duration", /*duration*/ ctx[2]);
    			}

    			if (dirty & /*pause*/ 16) {
    				toggle_class(div2, "pause-animation", /*pause*/ ctx[4]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Moon', slots, []);
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	let { duration = "0.6s" } = $$props;
    	let { size = "60" } = $$props;
    	let { pause = false } = $$props;
    	let moonSize = +size / 7;
    	let top = +size / 2 - moonSize / 2;
    	const writable_props = ['color', 'unit', 'duration', 'size', 'pause'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Moon> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    	};

    	$$self.$capture_state = () => ({
    		color,
    		unit,
    		duration,
    		size,
    		pause,
    		moonSize,
    		top
    	});

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    		if ('moonSize' in $$props) moonSize = $$props.moonSize;
    		if ('top' in $$props) $$invalidate(5, top = $$props.top);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, unit, duration, size, pause, top];
    }

    class Moon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			color: 0,
    			unit: 1,
    			duration: 2,
    			size: 3,
    			pause: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Moon",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get color() {
    		throw new Error("<Moon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Moon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<Moon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<Moon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get duration() {
    		throw new Error("<Moon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Moon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Moon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Moon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pause() {
    		throw new Error("<Moon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pause(value) {
    		throw new Error("<Moon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ..\src\Plane.svelte generated by Svelte v3.50.1 */
    const file$3 = "..\\src\\Plane.svelte";

    function create_fragment$3(ctx) {
    	let div7;
    	let div6;
    	let div1;
    	let div0;
    	let t0;
    	let div3;
    	let div2;
    	let t1;
    	let div5;
    	let div4;

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div6 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div3 = element("div");
    			div2 = element("div");
    			t1 = space();
    			div5 = element("div");
    			div4 = element("div");
    			attr_dev(div0, "class", "plane svelte-1s53y1n");
    			add_location(div0, file$3, 119, 6, 2550);
    			attr_dev(div1, "id", "top");
    			attr_dev(div1, "class", "mask svelte-1s53y1n");
    			add_location(div1, file$3, 118, 4, 2515);
    			attr_dev(div2, "class", "plane svelte-1s53y1n");
    			add_location(div2, file$3, 122, 6, 2627);
    			attr_dev(div3, "id", "middle");
    			attr_dev(div3, "class", "mask svelte-1s53y1n");
    			add_location(div3, file$3, 121, 4, 2589);
    			attr_dev(div4, "class", "plane svelte-1s53y1n");
    			add_location(div4, file$3, 125, 6, 2704);
    			attr_dev(div5, "id", "bottom");
    			attr_dev(div5, "class", "mask svelte-1s53y1n");
    			add_location(div5, file$3, 124, 4, 2666);
    			attr_dev(div6, "class", "spinner-inner svelte-1s53y1n");
    			toggle_class(div6, "pause-animation", /*pause*/ ctx[4]);
    			add_location(div6, file$3, 117, 2, 2452);
    			attr_dev(div7, "class", "wrapper svelte-1s53y1n");
    			set_style(div7, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			set_style(div7, "--color", /*color*/ ctx[0]);
    			set_style(div7, "--rgba", /*rgba*/ ctx[5]);
    			set_style(div7, "--duration", /*duration*/ ctx[2]);
    			add_location(div7, file$3, 114, 0, 2333);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div6);
    			append_dev(div6, div1);
    			append_dev(div1, div0);
    			append_dev(div6, t0);
    			append_dev(div6, div3);
    			append_dev(div3, div2);
    			append_dev(div6, t1);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*pause*/ 16) {
    				toggle_class(div6, "pause-animation", /*pause*/ ctx[4]);
    			}

    			if (dirty & /*size, unit*/ 10) {
    				set_style(div7, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*color*/ 1) {
    				set_style(div7, "--color", /*color*/ ctx[0]);
    			}

    			if (dirty & /*rgba*/ 32) {
    				set_style(div7, "--rgba", /*rgba*/ ctx[5]);
    			}

    			if (dirty & /*duration*/ 4) {
    				set_style(div7, "--duration", /*duration*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Plane', slots, []);
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	let { duration = "1.3s" } = $$props;
    	let { size = "60" } = $$props;
    	let { pause = false } = $$props;
    	let rgba;
    	const writable_props = ['color', 'unit', 'duration', 'size', 'pause'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Plane> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    	};

    	$$self.$capture_state = () => ({
    		calculateRgba,
    		color,
    		unit,
    		duration,
    		size,
    		pause,
    		rgba
    	});

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    		if ('rgba' in $$props) $$invalidate(5, rgba = $$props.rgba);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*color*/ 1) {
    			$$invalidate(5, rgba = calculateRgba(color, 0.6));
    		}
    	};

    	return [color, unit, duration, size, pause, rgba];
    }

    class Plane extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			color: 0,
    			unit: 1,
    			duration: 2,
    			size: 3,
    			pause: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Plane",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get color() {
    		throw new Error("<Plane>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Plane>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<Plane>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<Plane>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get duration() {
    		throw new Error("<Plane>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Plane>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Plane>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Plane>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pause() {
    		throw new Error("<Plane>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pause(value) {
    		throw new Error("<Plane>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ..\src\Diamonds.svelte generated by Svelte v3.50.1 */

    const file$2 = "..\\src\\Diamonds.svelte";

    function create_fragment$2(ctx) {
    	let span;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;

    	const block = {
    		c: function create() {
    			span = element("span");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			attr_dev(div0, "class", "svelte-drr98r");
    			add_location(div0, file$2, 51, 2, 1278);
    			attr_dev(div1, "class", "svelte-drr98r");
    			add_location(div1, file$2, 52, 2, 1289);
    			attr_dev(div2, "class", "svelte-drr98r");
    			add_location(div2, file$2, 53, 2, 1300);
    			set_style(span, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			set_style(span, "--color", /*color*/ ctx[0]);
    			set_style(span, "--duration", /*duration*/ ctx[2]);
    			attr_dev(span, "class", "svelte-drr98r");
    			toggle_class(span, "pause-animation", /*pause*/ ctx[4]);
    			add_location(span, file$2, 50, 0, 1167);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, div0);
    			append_dev(span, t0);
    			append_dev(span, div1);
    			append_dev(span, t1);
    			append_dev(span, div2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size, unit*/ 10) {
    				set_style(span, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*color*/ 1) {
    				set_style(span, "--color", /*color*/ ctx[0]);
    			}

    			if (dirty & /*duration*/ 4) {
    				set_style(span, "--duration", /*duration*/ ctx[2]);
    			}

    			if (dirty & /*pause*/ 16) {
    				toggle_class(span, "pause-animation", /*pause*/ ctx[4]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Diamonds', slots, []);
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	let { duration = "1.5s" } = $$props;
    	let { size = "60" } = $$props;
    	let { pause = false } = $$props;
    	const writable_props = ['color', 'unit', 'duration', 'size', 'pause'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Diamonds> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    	};

    	$$self.$capture_state = () => ({ color, unit, duration, size, pause });

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, unit, duration, size, pause];
    }

    class Diamonds extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			color: 0,
    			unit: 1,
    			duration: 2,
    			size: 3,
    			pause: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Diamonds",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get color() {
    		throw new Error("<Diamonds>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Diamonds>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<Diamonds>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<Diamonds>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get duration() {
    		throw new Error("<Diamonds>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Diamonds>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Diamonds>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Diamonds>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pause() {
    		throw new Error("<Diamonds>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pause(value) {
    		throw new Error("<Diamonds>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* ..\src\Clock.svelte generated by Svelte v3.50.1 */

    const file$1 = "..\\src\\Clock.svelte";

    function create_fragment$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			set_style(div, "--color", /*color*/ ctx[0]);
    			set_style(div, "--duration", /*duration*/ ctx[2]);
    			attr_dev(div, "class", "svelte-jrwh28");
    			toggle_class(div, "pause-animation", /*pause*/ ctx[4]);
    			add_location(div, file$1, 50, 0, 1317);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size, unit*/ 10) {
    				set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*color*/ 1) {
    				set_style(div, "--color", /*color*/ ctx[0]);
    			}

    			if (dirty & /*duration*/ 4) {
    				set_style(div, "--duration", /*duration*/ ctx[2]);
    			}

    			if (dirty & /*pause*/ 16) {
    				toggle_class(div, "pause-animation", /*pause*/ ctx[4]);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Clock', slots, []);
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	let { duration = "8s" } = $$props;
    	let { size = "60" } = $$props;
    	let { pause = false } = $$props;
    	const writable_props = ['color', 'unit', 'duration', 'size', 'pause'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Clock> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    	};

    	$$self.$capture_state = () => ({ color, unit, duration, size, pause });

    	$$self.$inject_state = $$props => {
    		if ('color' in $$props) $$invalidate(0, color = $$props.color);
    		if ('unit' in $$props) $$invalidate(1, unit = $$props.unit);
    		if ('duration' in $$props) $$invalidate(2, duration = $$props.duration);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('pause' in $$props) $$invalidate(4, pause = $$props.pause);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, unit, duration, size, pause];
    }

    class Clock extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			color: 0,
    			unit: 1,
    			duration: 2,
    			size: 3,
    			pause: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Clock",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get color() {
    		throw new Error("<Clock>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Clock>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<Clock>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<Clock>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get duration() {
    		throw new Error("<Clock>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Clock>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Clock>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Clock>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pause() {
    		throw new Error("<Clock>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pause(value) {
    		throw new Error("<Clock>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.50.1 */

    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let div0;
    	let h1;
    	let t0_value = /*name*/ ctx[0].default + "";
    	let t0;
    	let t1;
    	let a;
    	let t3;
    	let div1;
    	let span;
    	let t4;
    	let t5;
    	let t6;
    	let button;
    	let t8;
    	let input;
    	let t9;
    	let section;
    	let div3;
    	let spinline;
    	let t10;
    	let div2;
    	let t11;
    	let div5;
    	let circle2;
    	let t12;
    	let div4;
    	let t14;
    	let div7;
    	let doublebounce;
    	let t15;
    	let div6;
    	let t17;
    	let div9;
    	let circle;
    	let t18;
    	let div8;
    	let t20;
    	let div11;
    	let stretch;
    	let t21;
    	let div10;
    	let t23;
    	let div13;
    	let circle3;
    	let t24;
    	let div12;
    	let t26;
    	let div15;
    	let barloader;
    	let t27;
    	let div14;
    	let t29;
    	let div17;
    	let syncloader;
    	let t30;
    	let div16;
    	let t32;
    	let div19;
    	let jumper;
    	let t33;
    	let div18;
    	let t35;
    	let div21;
    	let googlespin;
    	let t36;
    	let div20;
    	let t38;
    	let div23;
    	let scaleout;
    	let t39;
    	let div22;
    	let t41;
    	let div25;
    	let ringloader;
    	let t42;
    	let div24;
    	let t44;
    	let div27;
    	let rainbow;
    	let t45;
    	let div26;
    	let t47;
    	let div29;
    	let wave;
    	let t48;
    	let div28;
    	let t50;
    	let div31;
    	let firework;
    	let t51;
    	let div30;
    	let t53;
    	let div33;
    	let pulse;
    	let t54;
    	let div32;
    	let t56;
    	let div35;
    	let jellyfish;
    	let t57;
    	let div34;
    	let t59;
    	let div37;
    	let chasing;
    	let t60;
    	let div36;
    	let t62;
    	let div39;
    	let shadow;
    	let t63;
    	let div38;
    	let t65;
    	let div41;
    	let square;
    	let t66;
    	let div40;
    	let t68;
    	let div43;
    	let moon;
    	let t69;
    	let div42;
    	let t71;
    	let div45;
    	let plane;
    	let t72;
    	let div44;
    	let t74;
    	let div47;
    	let diamonds;
    	let t75;
    	let div46;
    	let t77;
    	let div49;
    	let clock;
    	let t78;
    	let div48;
    	let current;
    	let mounted;
    	let dispose;

    	spinline = new SpinLine({
    			props: {
    				size: /*size*/ ctx[3],
    				color: /*color*/ ctx[1]
    			},
    			$$inline: true
    		});

    	circle2 = new Circle2({
    			props: {
    				size: /*size*/ ctx[3],
    				unit: /*unit*/ ctx[4],
    				colorOuter: "#FF3E00",
    				colorCenter: "#40B3FF",
    				colorInner: "#676778"
    			},
    			$$inline: true
    		});

    	doublebounce = new DoubleBounce({
    			props: {
    				size: /*size*/ ctx[3],
    				color: /*color*/ ctx[1]
    			},
    			$$inline: true
    		});

    	circle = new Circle({ $$inline: true });

    	stretch = new Stretch({
    			props: {
    				size: /*size*/ ctx[3],
    				color: /*color*/ ctx[1],
    				unit: /*unit*/ ctx[4]
    			},
    			$$inline: true
    		});

    	circle3 = new Circle3({
    			props: {
    				size: /*size*/ ctx[3],
    				unit: /*unit*/ ctx[4],
    				ballTopLeft: "#FF3E00",
    				ballTopRight: "#F8B334",
    				ballBottomLeft: "#40B3FF",
    				ballBottomRight: "#676778"
    			},
    			$$inline: true
    		});

    	barloader = new BarLoader({
    			props: {
    				size: /*size*/ ctx[3],
    				color: /*color*/ ctx[1],
    				unit: /*unit*/ ctx[4]
    			},
    			$$inline: true
    		});

    	syncloader = new SyncLoader({
    			props: {
    				size: /*size*/ ctx[3],
    				color: /*color*/ ctx[1]
    			},
    			$$inline: true
    		});

    	jumper = new Jumper({
    			props: {
    				size: /*size*/ ctx[3],
    				color: /*color*/ ctx[1]
    			},
    			$$inline: true
    		});

    	googlespin = new GoogleSpin({ props: { size: "60px" }, $$inline: true });

    	scaleout = new ScaleOut({
    			props: {
    				size: /*size*/ ctx[3],
    				color: /*color*/ ctx[1]
    			},
    			$$inline: true
    		});

    	ringloader = new RingLoader({
    			props: {
    				size: /*size*/ ctx[3],
    				color: /*color*/ ctx[1]
    			},
    			$$inline: true
    		});

    	rainbow = new Rainbow({
    			props: {
    				size: /*size*/ ctx[3],
    				color: /*color*/ ctx[1]
    			},
    			$$inline: true
    		});

    	wave = new Wave({
    			props: {
    				size: /*size*/ ctx[3],
    				color: /*color*/ ctx[1]
    			},
    			$$inline: true
    		});

    	firework = new Firework({
    			props: {
    				size: /*size*/ ctx[3],
    				color: /*color*/ ctx[1]
    			},
    			$$inline: true
    		});

    	pulse = new Pulse({
    			props: {
    				size: /*size*/ ctx[3],
    				color: /*color*/ ctx[1]
    			},
    			$$inline: true
    		});

    	jellyfish = new Jellyfish({
    			props: {
    				size: /*size*/ ctx[3],
    				color: /*color*/ ctx[1]
    			},
    			$$inline: true
    		});

    	chasing = new Chasing({
    			props: {
    				color: /*color*/ ctx[1],
    				unit: /*unit*/ ctx[4],
    				size: /*size*/ ctx[3]
    			},
    			$$inline: true
    		});

    	shadow = new Shadow({
    			props: {
    				size: /*size*/ ctx[3],
    				color: /*color*/ ctx[1]
    			},
    			$$inline: true
    		});

    	square = new Square({
    			props: {
    				size: /*size*/ ctx[3],
    				color: /*color*/ ctx[1]
    			},
    			$$inline: true
    		});

    	moon = new Moon({
    			props: {
    				size: /*size*/ ctx[3],
    				color: /*color*/ ctx[1]
    			},
    			$$inline: true
    		});

    	plane = new Plane({
    			props: {
    				size: /*size*/ ctx[3],
    				color: /*color*/ ctx[1]
    			},
    			$$inline: true
    		});

    	diamonds = new Diamonds({ $$inline: true });
    	clock = new Clock({ $$inline: true });

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			a = element("a");
    			a.textContent = "Github";
    			t3 = space();
    			div1 = element("div");
    			span = element("span");
    			t4 = text("Color: ");
    			t5 = text(/*color*/ ctx[1]);
    			t6 = space();
    			button = element("button");
    			button.textContent = "Change color";
    			t8 = space();
    			input = element("input");
    			t9 = space();
    			section = element("section");
    			div3 = element("div");
    			create_component(spinline.$$.fragment);
    			t10 = space();
    			div2 = element("div");
    			t11 = space();
    			div5 = element("div");
    			create_component(circle2.$$.fragment);
    			t12 = space();
    			div4 = element("div");
    			div4.textContent = "Circle2";
    			t14 = space();
    			div7 = element("div");
    			create_component(doublebounce.$$.fragment);
    			t15 = space();
    			div6 = element("div");
    			div6.textContent = "DoubleBounce";
    			t17 = space();
    			div9 = element("div");
    			create_component(circle.$$.fragment);
    			t18 = space();
    			div8 = element("div");
    			div8.textContent = "Circle";
    			t20 = space();
    			div11 = element("div");
    			create_component(stretch.$$.fragment);
    			t21 = space();
    			div10 = element("div");
    			div10.textContent = "Stretch";
    			t23 = space();
    			div13 = element("div");
    			create_component(circle3.$$.fragment);
    			t24 = space();
    			div12 = element("div");
    			div12.textContent = "Circle3";
    			t26 = space();
    			div15 = element("div");
    			create_component(barloader.$$.fragment);
    			t27 = space();
    			div14 = element("div");
    			div14.textContent = "BarLoader";
    			t29 = space();
    			div17 = element("div");
    			create_component(syncloader.$$.fragment);
    			t30 = space();
    			div16 = element("div");
    			div16.textContent = "SyncLoader";
    			t32 = space();
    			div19 = element("div");
    			create_component(jumper.$$.fragment);
    			t33 = space();
    			div18 = element("div");
    			div18.textContent = "Jumper";
    			t35 = space();
    			div21 = element("div");
    			create_component(googlespin.$$.fragment);
    			t36 = space();
    			div20 = element("div");
    			div20.textContent = "GoogleSpin";
    			t38 = space();
    			div23 = element("div");
    			create_component(scaleout.$$.fragment);
    			t39 = space();
    			div22 = element("div");
    			div22.textContent = "ScaleOut";
    			t41 = space();
    			div25 = element("div");
    			create_component(ringloader.$$.fragment);
    			t42 = space();
    			div24 = element("div");
    			div24.textContent = "RingLoader";
    			t44 = space();
    			div27 = element("div");
    			create_component(rainbow.$$.fragment);
    			t45 = space();
    			div26 = element("div");
    			div26.textContent = "Rainbow";
    			t47 = space();
    			div29 = element("div");
    			create_component(wave.$$.fragment);
    			t48 = space();
    			div28 = element("div");
    			div28.textContent = "Wave";
    			t50 = space();
    			div31 = element("div");
    			create_component(firework.$$.fragment);
    			t51 = space();
    			div30 = element("div");
    			div30.textContent = "Firework";
    			t53 = space();
    			div33 = element("div");
    			create_component(pulse.$$.fragment);
    			t54 = space();
    			div32 = element("div");
    			div32.textContent = "Pulse";
    			t56 = space();
    			div35 = element("div");
    			create_component(jellyfish.$$.fragment);
    			t57 = space();
    			div34 = element("div");
    			div34.textContent = "Jellyfish";
    			t59 = space();
    			div37 = element("div");
    			create_component(chasing.$$.fragment);
    			t60 = space();
    			div36 = element("div");
    			div36.textContent = "Chasing";
    			t62 = space();
    			div39 = element("div");
    			create_component(shadow.$$.fragment);
    			t63 = space();
    			div38 = element("div");
    			div38.textContent = "Shadow";
    			t65 = space();
    			div41 = element("div");
    			create_component(square.$$.fragment);
    			t66 = space();
    			div40 = element("div");
    			div40.textContent = "Square";
    			t68 = space();
    			div43 = element("div");
    			create_component(moon.$$.fragment);
    			t69 = space();
    			div42 = element("div");
    			div42.textContent = "Moon";
    			t71 = space();
    			div45 = element("div");
    			create_component(plane.$$.fragment);
    			t72 = space();
    			div44 = element("div");
    			div44.textContent = "Plane";
    			t74 = space();
    			div47 = element("div");
    			create_component(diamonds.$$.fragment);
    			t75 = space();
    			div46 = element("div");
    			div46.textContent = "Diamonds";
    			t77 = space();
    			div49 = element("div");
    			create_component(clock.$$.fragment);
    			t78 = space();
    			div48 = element("div");
    			div48.textContent = "Clock";
    			attr_dev(h1, "class", "svelte-1bp00zc");
    			add_location(h1, file, 80, 2, 1922);
    			attr_dev(a, "href", "https://github.com/Schum123/svelte-loading-spinners");
    			attr_dev(a, "class", "btn svelte-1bp00zc");
    			add_location(a, file, 81, 2, 1949);
    			attr_dev(div0, "class", "header svelte-1bp00zc");
    			add_location(div0, file, 79, 0, 1898);
    			attr_dev(span, "class", "color-value svelte-1bp00zc");
    			add_location(span, file, 86, 2, 2083);
    			add_location(button, file, 87, 2, 2134);
    			attr_dev(input, "type", "color");
    			attr_dev(input, "class", "svelte-1bp00zc");
    			add_location(input, file, 88, 2, 2197);
    			attr_dev(div1, "class", "color-picker svelte-1bp00zc");
    			add_location(div1, file, 85, 0, 2053);
    			attr_dev(div2, "class", "spinner-title svelte-1bp00zc");
    			add_location(div2, file, 93, 4, 2367);
    			attr_dev(div3, "class", "spinner-item svelte-1bp00zc");
    			attr_dev(div3, "title", "SpinLine");
    			add_location(div3, file, 91, 2, 2285);
    			attr_dev(div4, "class", "spinner-title svelte-1bp00zc");
    			add_location(div4, file, 103, 4, 2590);
    			attr_dev(div5, "class", "spinner-item svelte-1bp00zc");
    			attr_dev(div5, "title", "Circle2");
    			add_location(div5, file, 96, 2, 2412);
    			attr_dev(div6, "class", "spinner-title svelte-1bp00zc");
    			add_location(div6, file, 107, 4, 2734);
    			attr_dev(div7, "class", "spinner-item svelte-1bp00zc");
    			attr_dev(div7, "title", "DoubleBounce");
    			add_location(div7, file, 105, 2, 2644);
    			attr_dev(div8, "class", "spinner-title svelte-1bp00zc");
    			add_location(div8, file, 111, 4, 2856);
    			attr_dev(div9, "class", "spinner-item svelte-1bp00zc");
    			attr_dev(div9, "title", "Circle");
    			add_location(div9, file, 109, 2, 2793);
    			attr_dev(div10, "class", "spinner-title svelte-1bp00zc");
    			add_location(div10, file, 115, 4, 2996);
    			attr_dev(div11, "class", "spinner-item svelte-1bp00zc");
    			attr_dev(div11, "title", "Stretch");
    			add_location(div11, file, 113, 2, 2909);
    			attr_dev(div12, "class", "spinner-title svelte-1bp00zc");
    			add_location(div12, file, 125, 4, 3267);
    			attr_dev(div13, "class", "spinner-item svelte-1bp00zc");
    			attr_dev(div13, "title", "Circle3");
    			add_location(div13, file, 117, 2, 3050);
    			attr_dev(div14, "class", "spinner-title svelte-1bp00zc");
    			add_location(div14, file, 129, 4, 3412);
    			attr_dev(div15, "class", "spinner-item svelte-1bp00zc");
    			attr_dev(div15, "title", "BarLoader");
    			add_location(div15, file, 127, 2, 3321);
    			attr_dev(div16, "class", "spinner-title svelte-1bp00zc");
    			add_location(div16, file, 133, 4, 3554);
    			attr_dev(div17, "class", "spinner-item svelte-1bp00zc");
    			attr_dev(div17, "title", "SyncLoader");
    			add_location(div17, file, 131, 2, 3468);
    			attr_dev(div18, "class", "spinner-title svelte-1bp00zc");
    			add_location(div18, file, 137, 4, 3689);
    			attr_dev(div19, "class", "spinner-item svelte-1bp00zc");
    			attr_dev(div19, "title", "Jumper");
    			add_location(div19, file, 135, 2, 3611);
    			attr_dev(div20, "class", "spinner-title svelte-1bp00zc");
    			add_location(div20, file, 141, 4, 3825);
    			attr_dev(div21, "class", "spinner-item svelte-1bp00zc");
    			attr_dev(div21, "title", "GoogleSpin");
    			add_location(div21, file, 139, 2, 3742);
    			attr_dev(div22, "class", "spinner-title svelte-1bp00zc");
    			add_location(div22, file, 145, 4, 3964);
    			attr_dev(div23, "class", "spinner-item svelte-1bp00zc");
    			attr_dev(div23, "title", "ScaleOut");
    			add_location(div23, file, 143, 2, 3882);
    			attr_dev(div24, "class", "spinner-title svelte-1bp00zc");
    			add_location(div24, file, 149, 4, 4105);
    			attr_dev(div25, "class", "spinner-item svelte-1bp00zc");
    			attr_dev(div25, "title", "RingLoader");
    			add_location(div25, file, 147, 2, 4019);
    			attr_dev(div26, "class", "spinner-title svelte-1bp00zc");
    			add_location(div26, file, 153, 4, 4242);
    			attr_dev(div27, "class", "spinner-item svelte-1bp00zc");
    			attr_dev(div27, "title", "Rainbow");
    			add_location(div27, file, 151, 2, 4162);
    			attr_dev(div28, "class", "spinner-title svelte-1bp00zc");
    			add_location(div28, file, 157, 4, 4370);
    			attr_dev(div29, "class", "spinner-item svelte-1bp00zc");
    			attr_dev(div29, "title", "Wave");
    			add_location(div29, file, 155, 2, 4296);
    			attr_dev(div30, "class", "spinner-title svelte-1bp00zc");
    			add_location(div30, file, 161, 4, 4503);
    			attr_dev(div31, "class", "spinner-item svelte-1bp00zc");
    			attr_dev(div31, "title", "Firework");
    			add_location(div31, file, 159, 2, 4421);
    			attr_dev(div32, "class", "spinner-title svelte-1bp00zc");
    			add_location(div32, file, 165, 4, 4634);
    			attr_dev(div33, "class", "spinner-item svelte-1bp00zc");
    			attr_dev(div33, "title", "Pulse");
    			add_location(div33, file, 163, 2, 4558);
    			attr_dev(div34, "class", "spinner-title svelte-1bp00zc");
    			add_location(div34, file, 169, 4, 4770);
    			attr_dev(div35, "class", "spinner-item svelte-1bp00zc");
    			attr_dev(div35, "title", "Jellyfish");
    			add_location(div35, file, 167, 2, 4686);
    			attr_dev(div36, "class", "spinner-title svelte-1bp00zc");
    			add_location(div36, file, 173, 4, 4913);
    			attr_dev(div37, "class", "spinner-item svelte-1bp00zc");
    			attr_dev(div37, "title", "Chasing");
    			add_location(div37, file, 171, 2, 4826);
    			attr_dev(div38, "class", "spinner-title svelte-1bp00zc");
    			add_location(div38, file, 177, 4, 5045);
    			attr_dev(div39, "class", "spinner-item svelte-1bp00zc");
    			attr_dev(div39, "title", "Shadow");
    			add_location(div39, file, 175, 2, 4967);
    			attr_dev(div40, "class", "spinner-title svelte-1bp00zc");
    			add_location(div40, file, 181, 4, 5176);
    			attr_dev(div41, "class", "spinner-item svelte-1bp00zc");
    			attr_dev(div41, "title", "Square");
    			add_location(div41, file, 179, 2, 5098);
    			attr_dev(div42, "class", "spinner-title svelte-1bp00zc");
    			add_location(div42, file, 185, 4, 5303);
    			attr_dev(div43, "class", "spinner-item svelte-1bp00zc");
    			attr_dev(div43, "title", "Moon");
    			add_location(div43, file, 183, 2, 5229);
    			attr_dev(div44, "class", "spinner-title svelte-1bp00zc");
    			add_location(div44, file, 189, 4, 5430);
    			attr_dev(div45, "class", "spinner-item svelte-1bp00zc");
    			attr_dev(div45, "title", "Plane");
    			add_location(div45, file, 187, 2, 5354);
    			attr_dev(div46, "class", "spinner-title svelte-1bp00zc");
    			add_location(div46, file, 193, 4, 5549);
    			attr_dev(div47, "class", "spinner-item svelte-1bp00zc");
    			attr_dev(div47, "title", "Diamonds");
    			add_location(div47, file, 191, 2, 5482);
    			attr_dev(div48, "class", "spinner-title svelte-1bp00zc");
    			add_location(div48, file, 197, 4, 5665);
    			attr_dev(div49, "class", "spinner-item svelte-1bp00zc");
    			attr_dev(div49, "title", "Clock");
    			add_location(div49, file, 195, 2, 5604);
    			attr_dev(section, "class", "svelte-1bp00zc");
    			add_location(section, file, 90, 0, 2272);
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
    			insert_dev(target, div1, anchor);
    			append_dev(div1, span);
    			append_dev(span, t4);
    			append_dev(span, t5);
    			append_dev(div1, t6);
    			append_dev(div1, button);
    			append_dev(div1, t8);
    			append_dev(div1, input);
    			set_input_value(input, /*color*/ ctx[1]);
    			/*input_binding*/ ctx[7](input);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, div3);
    			mount_component(spinline, div3, null);
    			append_dev(div3, t10);
    			append_dev(div3, div2);
    			append_dev(section, t11);
    			append_dev(section, div5);
    			mount_component(circle2, div5, null);
    			append_dev(div5, t12);
    			append_dev(div5, div4);
    			append_dev(section, t14);
    			append_dev(section, div7);
    			mount_component(doublebounce, div7, null);
    			append_dev(div7, t15);
    			append_dev(div7, div6);
    			append_dev(section, t17);
    			append_dev(section, div9);
    			mount_component(circle, div9, null);
    			append_dev(div9, t18);
    			append_dev(div9, div8);
    			append_dev(section, t20);
    			append_dev(section, div11);
    			mount_component(stretch, div11, null);
    			append_dev(div11, t21);
    			append_dev(div11, div10);
    			append_dev(section, t23);
    			append_dev(section, div13);
    			mount_component(circle3, div13, null);
    			append_dev(div13, t24);
    			append_dev(div13, div12);
    			append_dev(section, t26);
    			append_dev(section, div15);
    			mount_component(barloader, div15, null);
    			append_dev(div15, t27);
    			append_dev(div15, div14);
    			append_dev(section, t29);
    			append_dev(section, div17);
    			mount_component(syncloader, div17, null);
    			append_dev(div17, t30);
    			append_dev(div17, div16);
    			append_dev(section, t32);
    			append_dev(section, div19);
    			mount_component(jumper, div19, null);
    			append_dev(div19, t33);
    			append_dev(div19, div18);
    			append_dev(section, t35);
    			append_dev(section, div21);
    			mount_component(googlespin, div21, null);
    			append_dev(div21, t36);
    			append_dev(div21, div20);
    			append_dev(section, t38);
    			append_dev(section, div23);
    			mount_component(scaleout, div23, null);
    			append_dev(div23, t39);
    			append_dev(div23, div22);
    			append_dev(section, t41);
    			append_dev(section, div25);
    			mount_component(ringloader, div25, null);
    			append_dev(div25, t42);
    			append_dev(div25, div24);
    			append_dev(section, t44);
    			append_dev(section, div27);
    			mount_component(rainbow, div27, null);
    			append_dev(div27, t45);
    			append_dev(div27, div26);
    			append_dev(section, t47);
    			append_dev(section, div29);
    			mount_component(wave, div29, null);
    			append_dev(div29, t48);
    			append_dev(div29, div28);
    			append_dev(section, t50);
    			append_dev(section, div31);
    			mount_component(firework, div31, null);
    			append_dev(div31, t51);
    			append_dev(div31, div30);
    			append_dev(section, t53);
    			append_dev(section, div33);
    			mount_component(pulse, div33, null);
    			append_dev(div33, t54);
    			append_dev(div33, div32);
    			append_dev(section, t56);
    			append_dev(section, div35);
    			mount_component(jellyfish, div35, null);
    			append_dev(div35, t57);
    			append_dev(div35, div34);
    			append_dev(section, t59);
    			append_dev(section, div37);
    			mount_component(chasing, div37, null);
    			append_dev(div37, t60);
    			append_dev(div37, div36);
    			append_dev(section, t62);
    			append_dev(section, div39);
    			mount_component(shadow, div39, null);
    			append_dev(div39, t63);
    			append_dev(div39, div38);
    			append_dev(section, t65);
    			append_dev(section, div41);
    			mount_component(square, div41, null);
    			append_dev(div41, t66);
    			append_dev(div41, div40);
    			append_dev(section, t68);
    			append_dev(section, div43);
    			mount_component(moon, div43, null);
    			append_dev(div43, t69);
    			append_dev(div43, div42);
    			append_dev(section, t71);
    			append_dev(section, div45);
    			mount_component(plane, div45, null);
    			append_dev(div45, t72);
    			append_dev(div45, div44);
    			append_dev(section, t74);
    			append_dev(section, div47);
    			mount_component(diamonds, div47, null);
    			append_dev(div47, t75);
    			append_dev(div47, div46);
    			append_dev(section, t77);
    			append_dev(section, div49);
    			mount_component(clock, div49, null);
    			append_dev(div49, t78);
    			append_dev(div49, div48);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*triggerColorPicker*/ ctx[5], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[6])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*name*/ 1) && t0_value !== (t0_value = /*name*/ ctx[0].default + "")) set_data_dev(t0, t0_value);
    			if (!current || dirty & /*color*/ 2) set_data_dev(t5, /*color*/ ctx[1]);

    			if (dirty & /*color*/ 2) {
    				set_input_value(input, /*color*/ ctx[1]);
    			}

    			const spinline_changes = {};
    			if (dirty & /*color*/ 2) spinline_changes.color = /*color*/ ctx[1];
    			spinline.$set(spinline_changes);
    			const doublebounce_changes = {};
    			if (dirty & /*color*/ 2) doublebounce_changes.color = /*color*/ ctx[1];
    			doublebounce.$set(doublebounce_changes);
    			const stretch_changes = {};
    			if (dirty & /*color*/ 2) stretch_changes.color = /*color*/ ctx[1];
    			stretch.$set(stretch_changes);
    			const barloader_changes = {};
    			if (dirty & /*color*/ 2) barloader_changes.color = /*color*/ ctx[1];
    			barloader.$set(barloader_changes);
    			const syncloader_changes = {};
    			if (dirty & /*color*/ 2) syncloader_changes.color = /*color*/ ctx[1];
    			syncloader.$set(syncloader_changes);
    			const jumper_changes = {};
    			if (dirty & /*color*/ 2) jumper_changes.color = /*color*/ ctx[1];
    			jumper.$set(jumper_changes);
    			const scaleout_changes = {};
    			if (dirty & /*color*/ 2) scaleout_changes.color = /*color*/ ctx[1];
    			scaleout.$set(scaleout_changes);
    			const ringloader_changes = {};
    			if (dirty & /*color*/ 2) ringloader_changes.color = /*color*/ ctx[1];
    			ringloader.$set(ringloader_changes);
    			const rainbow_changes = {};
    			if (dirty & /*color*/ 2) rainbow_changes.color = /*color*/ ctx[1];
    			rainbow.$set(rainbow_changes);
    			const wave_changes = {};
    			if (dirty & /*color*/ 2) wave_changes.color = /*color*/ ctx[1];
    			wave.$set(wave_changes);
    			const firework_changes = {};
    			if (dirty & /*color*/ 2) firework_changes.color = /*color*/ ctx[1];
    			firework.$set(firework_changes);
    			const pulse_changes = {};
    			if (dirty & /*color*/ 2) pulse_changes.color = /*color*/ ctx[1];
    			pulse.$set(pulse_changes);
    			const jellyfish_changes = {};
    			if (dirty & /*color*/ 2) jellyfish_changes.color = /*color*/ ctx[1];
    			jellyfish.$set(jellyfish_changes);
    			const chasing_changes = {};
    			if (dirty & /*color*/ 2) chasing_changes.color = /*color*/ ctx[1];
    			chasing.$set(chasing_changes);
    			const shadow_changes = {};
    			if (dirty & /*color*/ 2) shadow_changes.color = /*color*/ ctx[1];
    			shadow.$set(shadow_changes);
    			const square_changes = {};
    			if (dirty & /*color*/ 2) square_changes.color = /*color*/ ctx[1];
    			square.$set(square_changes);
    			const moon_changes = {};
    			if (dirty & /*color*/ 2) moon_changes.color = /*color*/ ctx[1];
    			moon.$set(moon_changes);
    			const plane_changes = {};
    			if (dirty & /*color*/ 2) plane_changes.color = /*color*/ ctx[1];
    			plane.$set(plane_changes);
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
    			transition_in(square.$$.fragment, local);
    			transition_in(moon.$$.fragment, local);
    			transition_in(plane.$$.fragment, local);
    			transition_in(diamonds.$$.fragment, local);
    			transition_in(clock.$$.fragment, local);
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
    			transition_out(square.$$.fragment, local);
    			transition_out(moon.$$.fragment, local);
    			transition_out(plane.$$.fragment, local);
    			transition_out(diamonds.$$.fragment, local);
    			transition_out(clock.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div1);
    			/*input_binding*/ ctx[7](null);
    			if (detaching) detach_dev(t9);
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
    			destroy_component(square);
    			destroy_component(moon);
    			destroy_component(plane);
    			destroy_component(diamonds);
    			destroy_component(clock);
    			mounted = false;
    			run_all(dispose);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let { name } = $$props;
    	let color = "#FF3E00";
    	let size = "60";
    	let unit = "px";
    	let colorPicker;

    	//let pause: boolean = false;
    	function triggerColorPicker() {
    		colorPicker.click();
    	}

    	const writable_props = ['name'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		color = this.value;
    		$$invalidate(1, color);
    	}

    	function input_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			colorPicker = $$value;
    			$$invalidate(2, colorPicker);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
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
    		Square,
    		Moon,
    		Plane,
    		Diamonds,
    		Clock,
    		name,
    		color,
    		size,
    		unit,
    		colorPicker,
    		triggerColorPicker
    	});

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    		if ('color' in $$props) $$invalidate(1, color = $$props.color);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('unit' in $$props) $$invalidate(4, unit = $$props.unit);
    		if ('colorPicker' in $$props) $$invalidate(2, colorPicker = $$props.colorPicker);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		name,
    		color,
    		colorPicker,
    		size,
    		unit,
    		triggerColorPicker,
    		input_input_handler,
    		input_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !('name' in props)) {
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

})();
