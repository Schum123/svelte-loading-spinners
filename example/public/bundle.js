
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
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

    const globals = (typeof window !== 'undefined' ? window : global);
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
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.19.2' }, detail)));
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
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
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

    /* node_modules\svelte-loading-spinners\src\Circle.svelte generated by Svelte v3.19.2 */

    const file = "node_modules\\svelte-loading-spinners\\src\\Circle.svelte";

    function create_fragment(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "style", /*styles*/ ctx[0]);
    			attr_dev(div, "class", "spinner spinner--circle svelte-1toslag");
    			add_location(div, file, 11, 0, 239);
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
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { size } = $$props;
    	let { color } = $$props;
    	const writable_props = ["size", "color"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Circle> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Circle", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    		if ("color" in $$props) $$invalidate(2, color = $$props.color);
    	};

    	$$self.$capture_state = () => ({ size, color, styles });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    		if ("color" in $$props) $$invalidate(2, color = $$props.color);
    		if ("styles" in $$props) $$invalidate(0, styles = $$props.styles);
    	};

    	let styles;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*size, color*/ 6) {
    			 $$invalidate(0, styles = [
    				`width: ${size}px`,
    				`height: ${size}px`,
    				`border-color: ${color}`,
    				`border-color: ${color} transparent ${color} ${color}`
    			].join(";"));
    		}
    	};

    	return [styles, size, color];
    }

    class Circle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { size: 1, color: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Circle",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*size*/ ctx[1] === undefined && !("size" in props)) {
    			console.warn("<Circle> was created without expected prop 'size'");
    		}

    		if (/*color*/ ctx[2] === undefined && !("color" in props)) {
    			console.warn("<Circle> was created without expected prop 'color'");
    		}
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
    }

    /* node_modules\svelte-loading-spinners\src\Circle2.svelte generated by Svelte v3.19.2 */

    const file$1 = "node_modules\\svelte-loading-spinners\\src\\Circle2.svelte";

    function create_fragment$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "style", /*Styles*/ ctx[0]);
    			attr_dev(div, "class", "svelte-127bb7z");
    			add_location(div, file$1, 5, 0, 116);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*Styles*/ 1) {
    				attr_dev(div, "style", /*Styles*/ ctx[0]);
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
    	let { size = "40px" } = $$props;
    	const writable_props = ["size"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Circle2> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Circle2", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    	};

    	$$self.$capture_state = () => ({ size, Styles });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    		if ("Styles" in $$props) $$invalidate(0, Styles = $$props.Styles);
    	};

    	let Styles;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*size*/ 2) {
    			 $$invalidate(0, Styles = [`width: ${size}`, `height: ${size}`].join(";"));
    		}
    	};

    	return [Styles, size];
    }

    class Circle2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { size: 1 });

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
    }

    /* node_modules\svelte-loading-spinners\src\Circle3.svelte generated by Svelte v3.19.2 */

    const file$2 = "node_modules\\svelte-loading-spinners\\src\\Circle3.svelte";

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
    			attr_dev(div0, "class", "ballcolor ball_1 svelte-1v6p0m9");
    			add_location(div0, file$2, 12, 8, 403);
    			attr_dev(div1, "class", "contener_mixte svelte-1v6p0m9");
    			add_location(div1, file$2, 11, 6, 365);
    			attr_dev(div2, "class", "ballcolor ball_2 svelte-1v6p0m9");
    			add_location(div2, file$2, 15, 8, 505);
    			attr_dev(div3, "class", "contener_mixte svelte-1v6p0m9");
    			add_location(div3, file$2, 14, 6, 467);
    			attr_dev(div4, "class", "ballcolor ball_3 svelte-1v6p0m9");
    			add_location(div4, file$2, 18, 8, 607);
    			attr_dev(div5, "class", "contener_mixte svelte-1v6p0m9");
    			add_location(div5, file$2, 17, 6, 569);
    			attr_dev(div6, "class", "ballcolor ball_4 svelte-1v6p0m9");
    			add_location(div6, file$2, 21, 8, 709);
    			attr_dev(div7, "class", "contener_mixte svelte-1v6p0m9");
    			add_location(div7, file$2, 20, 6, 671);
    			attr_dev(div8, "class", "ball-container svelte-1v6p0m9");
    			add_location(div8, file$2, 10, 4, 329);
    			attr_dev(div9, "style", /*innerStyles*/ ctx[1]);
    			attr_dev(div9, "class", "spinner-inner svelte-1v6p0m9");
    			add_location(div9, file$2, 9, 2, 274);
    			attr_dev(div10, "style", /*styles*/ ctx[0]);
    			attr_dev(div10, "class", "spinner spinner--circle-8 svelte-1v6p0m9");
    			add_location(div10, file$2, 8, 0, 214);
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
    			if (dirty & /*innerStyles*/ 2) {
    				attr_dev(div9, "style", /*innerStyles*/ ctx[1]);
    			}

    			if (dirty & /*styles*/ 1) {
    				attr_dev(div10, "style", /*styles*/ ctx[0]);
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
    	let { size = "40px" } = $$props;
    	const writable_props = ["size"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Circle3> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Circle3", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    	};

    	$$self.$capture_state = () => ({ size, styles, innerStyles });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("styles" in $$props) $$invalidate(0, styles = $$props.styles);
    		if ("innerStyles" in $$props) $$invalidate(1, innerStyles = $$props.innerStyles);
    	};

    	let styles;
    	let innerStyles;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*size*/ 4) {
    			 $$invalidate(0, styles = [`width: ${size}`, `height: ${size}`].join(";"));
    		}

    		if ($$self.$$.dirty & /*size*/ 4) {
    			 $$invalidate(1, innerStyles = [`transform: 'scale(' + (${parseInt(size) / 44}) + ')'`].join(";"));
    		}
    	};

    	return [styles, innerStyles, size];
    }

    class Circle3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { size: 2 });

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
    }

    /* node_modules\svelte-loading-spinners\src\DoubleBounce.svelte generated by Svelte v3.19.2 */

    const file$3 = "node_modules\\svelte-loading-spinners\\src\\DoubleBounce.svelte";

    function create_fragment$3(ctx) {
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
    			attr_dev(div0, "class", "double-bounce1 svelte-1pf8enx");
    			attr_dev(div0, "style", /*bounceStyle*/ ctx[0]);
    			add_location(div0, file$3, 12, 2, 342);
    			attr_dev(div1, "class", "double-bounce2 svelte-1pf8enx");
    			attr_dev(div1, "style", /*bounceStyle*/ ctx[0]);
    			add_location(div1, file$3, 13, 2, 402);
    			attr_dev(div2, "style", /*styles*/ ctx[1]);
    			attr_dev(div2, "class", "spinner spinner--double-bounce svelte-1pf8enx");
    			add_location(div2, file$3, 11, 0, 277);
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
    			if (dirty & /*bounceStyle*/ 1) {
    				attr_dev(div0, "style", /*bounceStyle*/ ctx[0]);
    			}

    			if (dirty & /*bounceStyle*/ 1) {
    				attr_dev(div1, "style", /*bounceStyle*/ ctx[0]);
    			}

    			if (dirty & /*styles*/ 2) {
    				attr_dev(div2, "style", /*styles*/ ctx[1]);
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { size } = $$props;
    	let { color } = $$props;
    	let { duration = "2.0s" } = $$props;
    	const writable_props = ["size", "color", "duration"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DoubleBounce> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("DoubleBounce", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("color" in $$props) $$invalidate(3, color = $$props.color);
    		if ("duration" in $$props) $$invalidate(4, duration = $$props.duration);
    	};

    	$$self.$capture_state = () => ({
    		size,
    		color,
    		duration,
    		bounceStyle,
    		styles
    	});

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("color" in $$props) $$invalidate(3, color = $$props.color);
    		if ("duration" in $$props) $$invalidate(4, duration = $$props.duration);
    		if ("bounceStyle" in $$props) $$invalidate(0, bounceStyle = $$props.bounceStyle);
    		if ("styles" in $$props) $$invalidate(1, styles = $$props.styles);
    	};

    	let bounceStyle;
    	let styles;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*color, duration*/ 24) {
    			 $$invalidate(0, bounceStyle = [`background-color: ${color}`, `animation-duration: ${duration}`].join(";"));
    		}

    		if ($$self.$$.dirty & /*size*/ 4) {
    			 $$invalidate(1, styles = [`width: ${size}px`, `height: ${size}px`].join(";"));
    		}
    	};

    	return [bounceStyle, styles, size, color, duration];
    }

    class DoubleBounce extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { size: 2, color: 3, duration: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DoubleBounce",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*size*/ ctx[2] === undefined && !("size" in props)) {
    			console.warn("<DoubleBounce> was created without expected prop 'size'");
    		}

    		if (/*color*/ ctx[3] === undefined && !("color" in props)) {
    			console.warn("<DoubleBounce> was created without expected prop 'color'");
    		}
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

    	get duration() {
    		throw new Error("<DoubleBounce>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<DoubleBounce>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-loading-spinners\src\GoogleSpin.svelte generated by Svelte v3.19.2 */

    const file$4 = "node_modules\\svelte-loading-spinners\\src\\GoogleSpin.svelte";

    function create_fragment$4(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "spinner spinner--google svelte-mjkcbc");
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

    /* node_modules\svelte-loading-spinners\src\ScaleOut.svelte generated by Svelte v3.19.2 */

    const file$5 = "node_modules\\svelte-loading-spinners\\src\\ScaleOut.svelte";

    function create_fragment$5(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "spinner spinner--scaleout svelte-jl7wqf");
    			attr_dev(div, "style", /*styles*/ ctx[0]);
    			add_location(div, file$5, 12, 0, 255);
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { size } = $$props;
    	let { color } = $$props;
    	let { duration = "1.0s" } = $$props;
    	const writable_props = ["size", "color", "duration"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ScaleOut> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ScaleOut", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    		if ("color" in $$props) $$invalidate(2, color = $$props.color);
    		if ("duration" in $$props) $$invalidate(3, duration = $$props.duration);
    	};

    	$$self.$capture_state = () => ({ size, color, duration, styles });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    		if ("color" in $$props) $$invalidate(2, color = $$props.color);
    		if ("duration" in $$props) $$invalidate(3, duration = $$props.duration);
    		if ("styles" in $$props) $$invalidate(0, styles = $$props.styles);
    	};

    	let styles;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*size, color, duration*/ 14) {
    			 $$invalidate(0, styles = [
    				`width: ${size}px`,
    				`height: ${size}px`,
    				`background-color: ${color}`,
    				`animation-duration: ${duration}`
    			].join(";"));
    		}
    	};

    	return [styles, size, color, duration];
    }

    class ScaleOut extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { size: 1, color: 2, duration: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ScaleOut",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*size*/ ctx[1] === undefined && !("size" in props)) {
    			console.warn("<ScaleOut> was created without expected prop 'size'");
    		}

    		if (/*color*/ ctx[2] === undefined && !("color" in props)) {
    			console.warn("<ScaleOut> was created without expected prop 'color'");
    		}
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
    }

    /* node_modules\svelte-loading-spinners\src\SpinLine.svelte generated by Svelte v3.19.2 */

    const file$6 = "node_modules\\svelte-loading-spinners\\src\\SpinLine.svelte";

    function create_fragment$6(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "style", /*lineStyles*/ ctx[0]);
    			attr_dev(div0, "class", "spinner-inner svelte-1mzisj7");
    			add_location(div0, file$6, 17, 2, 434);
    			attr_dev(div1, "style", /*styles*/ ctx[1]);
    			attr_dev(div1, "class", "spinner spinner--spin-line svelte-1mzisj7");
    			add_location(div1, file$6, 16, 0, 371);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*lineStyles*/ 1) {
    				attr_dev(div0, "style", /*lineStyles*/ ctx[0]);
    			}

    			if (dirty & /*styles*/ 2) {
    				attr_dev(div1, "style", /*styles*/ ctx[1]);
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
    	let { size } = $$props;
    	let { color } = $$props;
    	let { stroke = "5px" } = $$props;
    	const writable_props = ["size", "color", "stroke"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SpinLine> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("SpinLine", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("color" in $$props) $$invalidate(3, color = $$props.color);
    		if ("stroke" in $$props) $$invalidate(4, stroke = $$props.stroke);
    	};

    	$$self.$capture_state = () => ({ size, color, stroke, lineStyles, styles });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("color" in $$props) $$invalidate(3, color = $$props.color);
    		if ("stroke" in $$props) $$invalidate(4, stroke = $$props.stroke);
    		if ("lineStyles" in $$props) $$invalidate(0, lineStyles = $$props.lineStyles);
    		if ("styles" in $$props) $$invalidate(1, styles = $$props.styles);
    	};

    	let lineStyles;
    	let styles;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*size, stroke, color*/ 28) {
    			 $$invalidate(0, lineStyles = [
    				`width: ${size}px`,
    				`height: ${stroke}`,
    				`background: ${color}`,
    				`borderRadius:${stroke}`
    			].join(";"));
    		}

    		if ($$self.$$.dirty & /*size, stroke*/ 20) {
    			 $$invalidate(1, styles = [
    				`width: ${size}px`,
    				`height: ${stroke}`,
    				`transform: scale(${parseInt(size) / 75})`
    			].join(";"));
    		}
    	};

    	return [lineStyles, styles, size, color, stroke];
    }

    class SpinLine extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { size: 2, color: 3, stroke: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SpinLine",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*size*/ ctx[2] === undefined && !("size" in props)) {
    			console.warn("<SpinLine> was created without expected prop 'size'");
    		}

    		if (/*color*/ ctx[3] === undefined && !("color" in props)) {
    			console.warn("<SpinLine> was created without expected prop 'color'");
    		}
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

    	get stroke() {
    		throw new Error("<SpinLine>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set stroke(value) {
    		throw new Error("<SpinLine>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-loading-spinners\src\Stretch.svelte generated by Svelte v3.19.2 */

    const file$7 = "node_modules\\svelte-loading-spinners\\src\\Stretch.svelte";

    function create_fragment$7(ctx) {
    	let div5;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let t2;
    	let div3;
    	let t3;
    	let div4;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			t2 = space();
    			div3 = element("div");
    			t3 = space();
    			div4 = element("div");
    			attr_dev(div0, "style", /*rectStyles*/ ctx[0]);
    			attr_dev(div0, "class", "rect rect-1 svelte-6at4lk");
    			add_location(div0, file$7, 12, 2, 335);
    			attr_dev(div1, "style", /*rectStyles*/ ctx[0]);
    			attr_dev(div1, "class", "rect rect-2 svelte-6at4lk");
    			add_location(div1, file$7, 13, 2, 391);
    			attr_dev(div2, "style", /*rectStyles*/ ctx[0]);
    			attr_dev(div2, "class", "rect rect-3 svelte-6at4lk");
    			add_location(div2, file$7, 14, 2, 447);
    			attr_dev(div3, "style", /*rectStyles*/ ctx[0]);
    			attr_dev(div3, "class", "rect rect-4 svelte-6at4lk");
    			add_location(div3, file$7, 15, 2, 503);
    			attr_dev(div4, "style", /*rectStyles*/ ctx[0]);
    			attr_dev(div4, "class", "rect rect-5 svelte-6at4lk");
    			add_location(div4, file$7, 16, 2, 559);
    			attr_dev(div5, "style", /*styles*/ ctx[1]);
    			attr_dev(div5, "class", "spinner spinner--stretch svelte-6at4lk");
    			add_location(div5, file$7, 11, 0, 276);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div5, t0);
    			append_dev(div5, div1);
    			append_dev(div5, t1);
    			append_dev(div5, div2);
    			append_dev(div5, t2);
    			append_dev(div5, div3);
    			append_dev(div5, t3);
    			append_dev(div5, div4);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*rectStyles*/ 1) {
    				attr_dev(div0, "style", /*rectStyles*/ ctx[0]);
    			}

    			if (dirty & /*rectStyles*/ 1) {
    				attr_dev(div1, "style", /*rectStyles*/ ctx[0]);
    			}

    			if (dirty & /*rectStyles*/ 1) {
    				attr_dev(div2, "style", /*rectStyles*/ ctx[0]);
    			}

    			if (dirty & /*rectStyles*/ 1) {
    				attr_dev(div3, "style", /*rectStyles*/ ctx[0]);
    			}

    			if (dirty & /*rectStyles*/ 1) {
    				attr_dev(div4, "style", /*rectStyles*/ ctx[0]);
    			}

    			if (dirty & /*styles*/ 2) {
    				attr_dev(div5, "style", /*styles*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
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
    	let { size } = $$props;
    	let { color } = $$props;
    	let { duration = "1.2s" } = $$props;
    	const writable_props = ["size", "color", "duration"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Stretch> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Stretch", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("color" in $$props) $$invalidate(3, color = $$props.color);
    		if ("duration" in $$props) $$invalidate(4, duration = $$props.duration);
    	};

    	$$self.$capture_state = () => ({
    		size,
    		color,
    		duration,
    		rectStyles,
    		styles
    	});

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("color" in $$props) $$invalidate(3, color = $$props.color);
    		if ("duration" in $$props) $$invalidate(4, duration = $$props.duration);
    		if ("rectStyles" in $$props) $$invalidate(0, rectStyles = $$props.rectStyles);
    		if ("styles" in $$props) $$invalidate(1, styles = $$props.styles);
    	};

    	let rectStyles;
    	let styles;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*color, duration*/ 24) {
    			 $$invalidate(0, rectStyles = [`background-color: ${color}`, `animation-duration: ${duration}`].join(";"));
    		}

    		if ($$self.$$.dirty & /*size*/ 4) {
    			 $$invalidate(1, styles = [`width: ${size}px`, `height: ${size}px`].join(";"));
    		}
    	};

    	return [rectStyles, styles, size, color, duration];
    }

    class Stretch extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { size: 2, color: 3, duration: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Stretch",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*size*/ ctx[2] === undefined && !("size" in props)) {
    			console.warn("<Stretch> was created without expected prop 'size'");
    		}

    		if (/*color*/ ctx[3] === undefined && !("color" in props)) {
    			console.warn("<Stretch> was created without expected prop 'color'");
    		}
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

    /* node_modules\svelte-loading-spinners\src\BarLoader.svelte generated by Svelte v3.19.2 */
    const file$8 = "node_modules\\svelte-loading-spinners\\src\\BarLoader.svelte";

    function create_fragment$8(ctx) {
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
    			attr_dev(div0, "style", /*lineStyles*/ ctx[1]);
    			attr_dev(div0, "class", "small-line one svelte-18g7eae");
    			add_location(div0, file$8, 17, 6, 428);
    			attr_dev(div1, "style", /*lineStyles*/ ctx[1]);
    			attr_dev(div1, "class", "small-line two svelte-18g7eae");
    			add_location(div1, file$8, 18, 6, 484);
    			attr_dev(div2, "style", /*styles*/ ctx[0]);
    			attr_dev(div2, "class", "wrapper svelte-18g7eae");
    			add_location(div2, file$8, 16, 2, 384);
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
    			if (dirty & /*lineStyles*/ 2) {
    				attr_dev(div0, "style", /*lineStyles*/ ctx[1]);
    			}

    			if (dirty & /*lineStyles*/ 2) {
    				attr_dev(div1, "style", /*lineStyles*/ ctx[1]);
    			}

    			if (dirty & /*styles*/ 1) {
    				attr_dev(div2, "style", /*styles*/ ctx[0]);
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { size } = $$props;
    	let { color } = $$props;
    	const writable_props = ["size", "color"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BarLoader> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("BarLoader", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("color" in $$props) $$invalidate(3, color = $$props.color);
    	};

    	$$self.$capture_state = () => ({
    		calculateRgba,
    		size,
    		color,
    		styles,
    		lineStyles
    	});

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("color" in $$props) $$invalidate(3, color = $$props.color);
    		if ("styles" in $$props) $$invalidate(0, styles = $$props.styles);
    		if ("lineStyles" in $$props) $$invalidate(1, lineStyles = $$props.lineStyles);
    	};

    	let styles;
    	let lineStyles;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*size, color*/ 12) {
    			 $$invalidate(0, styles = [
    				`height: ${size / 15}px`,
    				`width: ${size * 2}px`,
    				`background-color: ${calculateRgba(color, 0.2)}`
    			].join(";"));
    		}

    		if ($$self.$$.dirty & /*size, color*/ 12) {
    			 $$invalidate(1, lineStyles = [`height: ${size / 15}px`, `background-color: ${color}`].join(";"));
    		}
    	};

    	return [styles, lineStyles, size, color];
    }

    class BarLoader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { size: 2, color: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BarLoader",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*size*/ ctx[2] === undefined && !("size" in props)) {
    			console.warn("<BarLoader> was created without expected prop 'size'");
    		}

    		if (/*color*/ ctx[3] === undefined && !("color" in props)) {
    			console.warn("<BarLoader> was created without expected prop 'color'");
    		}
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
    }

    /* node_modules\svelte-loading-spinners\src\Jumper.svelte generated by Svelte v3.19.2 */

    const file$9 = "node_modules\\svelte-loading-spinners\\src\\Jumper.svelte";

    function create_fragment$9(ctx) {
    	let div3;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			attr_dev(div0, "style", /*circles*/ ctx[1]);
    			attr_dev(div0, "class", "svelte-y1qqh6");
    			add_location(div0, file$9, 8, 2, 238);
    			attr_dev(div1, "style", /*circles*/ ctx[1]);
    			attr_dev(div1, "class", "svelte-y1qqh6");
    			add_location(div1, file$9, 9, 2, 271);
    			attr_dev(div2, "style", /*circles*/ ctx[1]);
    			attr_dev(div2, "class", "svelte-y1qqh6");
    			add_location(div2, file$9, 10, 2, 304);
    			attr_dev(div3, "style", /*styles*/ ctx[0]);
    			attr_dev(div3, "class", "spinner spinner--jumper svelte-y1qqh6");
    			add_location(div3, file$9, 7, 0, 180);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*circles*/ 2) {
    				attr_dev(div0, "style", /*circles*/ ctx[1]);
    			}

    			if (dirty & /*circles*/ 2) {
    				attr_dev(div1, "style", /*circles*/ ctx[1]);
    			}

    			if (dirty & /*circles*/ 2) {
    				attr_dev(div2, "style", /*circles*/ ctx[1]);
    			}

    			if (dirty & /*styles*/ 1) {
    				attr_dev(div3, "style", /*styles*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
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
    	let { size } = $$props;
    	let { color } = $$props;
    	const writable_props = ["size", "color"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Jumper> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Jumper", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("color" in $$props) $$invalidate(3, color = $$props.color);
    	};

    	$$self.$capture_state = () => ({ size, color, styles, circles });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("color" in $$props) $$invalidate(3, color = $$props.color);
    		if ("styles" in $$props) $$invalidate(0, styles = $$props.styles);
    		if ("circles" in $$props) $$invalidate(1, circles = $$props.circles);
    	};

    	let styles;
    	let circles;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*size*/ 4) {
    			 $$invalidate(0, styles = [`width: ${size}px`, `height: ${size}px`].join(";"));
    		}

    		if ($$self.$$.dirty & /*color*/ 8) {
    			 $$invalidate(1, circles = [`background-color: ${color}`]);
    		}
    	};

    	return [styles, circles, size, color];
    }

    class Jumper extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { size: 2, color: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Jumper",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*size*/ ctx[2] === undefined && !("size" in props)) {
    			console.warn("<Jumper> was created without expected prop 'size'");
    		}

    		if (/*color*/ ctx[3] === undefined && !("color" in props)) {
    			console.warn("<Jumper> was created without expected prop 'color'");
    		}
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
    }

    /* node_modules\svelte-loading-spinners\src\RingLoader.svelte generated by Svelte v3.19.2 */

    const file$a = "node_modules\\svelte-loading-spinners\\src\\RingLoader.svelte";

    function create_fragment$a(ctx) {
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
    			attr_dev(div0, "style", /*ringOne*/ ctx[1]);
    			attr_dev(div0, "class", "svelte-rkxq48");
    			add_location(div0, file$a, 9, 2, 285);
    			attr_dev(div1, "style", /*ringTwo*/ ctx[2]);
    			attr_dev(div1, "class", "svelte-rkxq48");
    			add_location(div1, file$a, 10, 2, 318);
    			attr_dev(div2, "style", /*styles*/ ctx[0]);
    			attr_dev(div2, "class", "ringloader svelte-rkxq48");
    			add_location(div2, file$a, 8, 0, 240);
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
    			if (dirty & /*ringOne*/ 2) {
    				attr_dev(div0, "style", /*ringOne*/ ctx[1]);
    			}

    			if (dirty & /*ringTwo*/ 4) {
    				attr_dev(div1, "style", /*ringTwo*/ ctx[2]);
    			}

    			if (dirty & /*styles*/ 1) {
    				attr_dev(div2, "style", /*styles*/ ctx[0]);
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
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { size } = $$props;
    	let { color } = $$props;
    	const writable_props = ["size", "color"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<RingLoader> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("RingLoader", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(3, size = $$props.size);
    		if ("color" in $$props) $$invalidate(4, color = $$props.color);
    	};

    	$$self.$capture_state = () => ({ size, color, styles, ringOne, ringTwo });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(3, size = $$props.size);
    		if ("color" in $$props) $$invalidate(4, color = $$props.color);
    		if ("styles" in $$props) $$invalidate(0, styles = $$props.styles);
    		if ("ringOne" in $$props) $$invalidate(1, ringOne = $$props.ringOne);
    		if ("ringTwo" in $$props) $$invalidate(2, ringTwo = $$props.ringTwo);
    	};

    	let styles;
    	let ringOne;
    	let ringTwo;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*size*/ 8) {
    			 $$invalidate(0, styles = [`width: ${size}px`, `height: ${size}px`].join(";"));
    		}

    		if ($$self.$$.dirty & /*color*/ 16) {
    			 $$invalidate(1, ringOne = [`border-color: ${color}`].join(";"));
    		}

    		if ($$self.$$.dirty & /*color*/ 16) {
    			 $$invalidate(2, ringTwo = [`border-color: ${color}`].join(";"));
    		}
    	};

    	return [styles, ringOne, ringTwo, size, color];
    }

    class RingLoader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { size: 3, color: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RingLoader",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*size*/ ctx[3] === undefined && !("size" in props)) {
    			console.warn("<RingLoader> was created without expected prop 'size'");
    		}

    		if (/*color*/ ctx[4] === undefined && !("color" in props)) {
    			console.warn("<RingLoader> was created without expected prop 'color'");
    		}
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
    }

    /* node_modules\svelte-loading-spinners\src\SyncLoader.svelte generated by Svelte v3.19.2 */

    const file$b = "node_modules\\svelte-loading-spinners\\src\\SyncLoader.svelte";

    function create_fragment$b(ctx) {
    	let div3;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			attr_dev(div0, "style", /*styles*/ ctx[0]);
    			attr_dev(div0, "class", "svelte-9wc7dw");
    			add_location(div0, file$b, 13, 4, 273);
    			attr_dev(div1, "style", /*styles*/ ctx[0]);
    			attr_dev(div1, "class", "svelte-9wc7dw");
    			add_location(div1, file$b, 14, 4, 302);
    			attr_dev(div2, "style", /*styles*/ ctx[0]);
    			attr_dev(div2, "class", "svelte-9wc7dw");
    			add_location(div2, file$b, 15, 4, 331);
    			attr_dev(div3, "class", "svelte-9wc7dw");
    			add_location(div3, file$b, 12, 2, 262);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*styles*/ 1) {
    				attr_dev(div0, "style", /*styles*/ ctx[0]);
    			}

    			if (dirty & /*styles*/ 1) {
    				attr_dev(div1, "style", /*styles*/ ctx[0]);
    			}

    			if (dirty & /*styles*/ 1) {
    				attr_dev(div2, "style", /*styles*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
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
    	let { size } = $$props;
    	let { color } = $$props;
    	let { margin = "1px" } = $$props;
    	const writable_props = ["size", "color", "margin"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SyncLoader> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("SyncLoader", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    		if ("color" in $$props) $$invalidate(2, color = $$props.color);
    		if ("margin" in $$props) $$invalidate(3, margin = $$props.margin);
    	};

    	$$self.$capture_state = () => ({ size, color, margin, styles });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    		if ("color" in $$props) $$invalidate(2, color = $$props.color);
    		if ("margin" in $$props) $$invalidate(3, margin = $$props.margin);
    		if ("styles" in $$props) $$invalidate(0, styles = $$props.styles);
    	};

    	let styles;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*size, color, margin*/ 14) {
    			 $$invalidate(0, styles = [
    				`height: ${size}px`,
    				`width: ${size}px`,
    				`background-color: ${color}`,
    				`margin: ${margin}`
    			].join(";"));
    		}
    	};

    	return [styles, size, color, margin];
    }

    class SyncLoader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { size: 1, color: 2, margin: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SyncLoader",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*size*/ ctx[1] === undefined && !("size" in props)) {
    			console.warn("<SyncLoader> was created without expected prop 'size'");
    		}

    		if (/*color*/ ctx[2] === undefined && !("color" in props)) {
    			console.warn("<SyncLoader> was created without expected prop 'color'");
    		}
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

    	get margin() {
    		throw new Error("<SyncLoader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set margin(value) {
    		throw new Error("<SyncLoader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-loading-spinners\src\Rainbow.svelte generated by Svelte v3.19.2 */

    const { console: console_1 } = globals;
    const file$c = "node_modules\\svelte-loading-spinners\\src\\Rainbow.svelte";

    function create_fragment$c(ctx) {
    	let div1;
    	let div0;
    	let div0_style_value;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "style", div0_style_value = [/*border*/ ctx[1] + /*wrapper*/ ctx[2]]);
    			attr_dev(div0, "class", "rainbow svelte-ldp1ps");
    			add_location(div0, file$c, 17, 2, 431);
    			attr_dev(div1, "style", /*styles*/ ctx[0]);
    			attr_dev(div1, "class", "rainbow-wrapper");
    			add_location(div1, file$c, 16, 0, 381);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*border, wrapper*/ 6 && div0_style_value !== (div0_style_value = [/*border*/ ctx[1] + /*wrapper*/ ctx[2]])) {
    				attr_dev(div0, "style", div0_style_value);
    			}

    			if (dirty & /*styles*/ 1) {
    				attr_dev(div1, "style", /*styles*/ ctx[0]);
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
    	let { size } = $$props;
    	let { color } = $$props;
    	console.log(`${size / 2}`);
    	const writable_props = ["size", "color"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Rainbow> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Rainbow", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(3, size = $$props.size);
    		if ("color" in $$props) $$invalidate(4, color = $$props.color);
    	};

    	$$self.$capture_state = () => ({ size, color, styles, border, wrapper });

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(3, size = $$props.size);
    		if ("color" in $$props) $$invalidate(4, color = $$props.color);
    		if ("styles" in $$props) $$invalidate(0, styles = $$props.styles);
    		if ("border" in $$props) $$invalidate(1, border = $$props.border);
    		if ("wrapper" in $$props) $$invalidate(2, wrapper = $$props.wrapper);
    	};

    	let styles;
    	let border;
    	let wrapper;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*size*/ 8) {
    			 $$invalidate(0, styles = [`width: ${size}px`, `height: ${size / 2}px`, `overflow: hidden`].join(";"));
    		}

    		if ($$self.$$.dirty & /*color*/ 16) {
    			 $$invalidate(1, border = [`border-top-color: ${color}`, `border-right-color: ${color};`].join(";"));
    		}

    		if ($$self.$$.dirty & /*size*/ 8) {
    			 $$invalidate(2, wrapper = [`width: ${size}px`, `height: ${size}px`].join(";"));
    		}
    	};

    	return [styles, border, wrapper, size, color];
    }

    class Rainbow extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { size: 3, color: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Rainbow",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*size*/ ctx[3] === undefined && !("size" in props)) {
    			console_1.warn("<Rainbow> was created without expected prop 'size'");
    		}

    		if (/*color*/ ctx[4] === undefined && !("color" in props)) {
    			console_1.warn("<Rainbow> was created without expected prop 'color'");
    		}
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
    }

    /* src\App.svelte generated by Svelte v3.19.2 */

    const file$d = "src\\App.svelte";

    function create_fragment$d(ctx) {
    	let div0;
    	let h1;
    	let t0_value = /*name*/ ctx[0].default + "";
    	let t0;
    	let t1;
    	let a;
    	let t3;
    	let section;
    	let div2;
    	let t4;
    	let div1;
    	let t6;
    	let div4;
    	let t7;
    	let div3;
    	let t9;
    	let div6;
    	let t10;
    	let div5;
    	let t12;
    	let div8;
    	let t13;
    	let div7;
    	let t15;
    	let div10;
    	let t16;
    	let div9;
    	let t18;
    	let div12;
    	let t19;
    	let div11;
    	let t21;
    	let div14;
    	let t22;
    	let div13;
    	let t24;
    	let div16;
    	let t25;
    	let div15;
    	let t27;
    	let div18;
    	let t28;
    	let div17;
    	let t30;
    	let div20;
    	let t31;
    	let div19;
    	let t33;
    	let div22;
    	let t34;
    	let div21;
    	let t36;
    	let div24;
    	let t37;
    	let div23;
    	let t39;
    	let div26;
    	let t40;
    	let div25;
    	let current;

    	const spinline = new SpinLine({
    			props: { size: "60", color: "#FF3E00" },
    			$$inline: true
    		});

    	const circle2 = new Circle2({ props: { size: "60px" }, $$inline: true });

    	const doublebounce = new DoubleBounce({
    			props: { size: "60", color: "#FF3E00" },
    			$$inline: true
    		});

    	const circle = new Circle({
    			props: { size: "60", color: "#FF3E00" },
    			$$inline: true
    		});

    	const stretch = new Stretch({
    			props: { size: "60", color: "#FF3E00" },
    			$$inline: true
    		});

    	const circle3 = new Circle3({ props: { size: "60px" }, $$inline: true });

    	const barloader = new BarLoader({
    			props: { size: "60", color: "#FF3E00" },
    			$$inline: true
    		});

    	const syncloader = new SyncLoader({
    			props: { size: "15", color: "#FF3E00" },
    			$$inline: true
    		});

    	const jumper = new Jumper({
    			props: { size: "60", color: "#FF3E00" },
    			$$inline: true
    		});

    	const googlespin = new GoogleSpin({ props: { size: "60px" }, $$inline: true });

    	const scaleout = new ScaleOut({
    			props: { size: "60", color: "#FF3E00" },
    			$$inline: true
    		});

    	const ringloader = new RingLoader({
    			props: { size: "60", color: "#FF3E00" },
    			$$inline: true
    		});

    	const rainbow = new Rainbow({
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
    			attr_dev(h1, "class", "svelte-1y3sjtk");
    			add_location(h1, file$d, 56, 1, 1253);
    			attr_dev(a, "href", "https://github.com/Schum123/svelte-loading-spinners");
    			attr_dev(a, "class", "btn svelte-1y3sjtk");
    			add_location(a, file$d, 57, 1, 1279);
    			attr_dev(div0, "class", "header svelte-1y3sjtk");
    			add_location(div0, file$d, 55, 2, 1230);
    			attr_dev(div1, "class", "spinner-title svelte-1y3sjtk");
    			add_location(div1, file$d, 65, 4, 1476);
    			attr_dev(div2, "class", "spinner-item svelte-1y3sjtk");
    			add_location(div2, file$d, 63, 1, 1401);
    			attr_dev(div3, "class", "spinner-title svelte-1y3sjtk");
    			add_location(div3, file$d, 70, 5, 1600);
    			attr_dev(div4, "class", "spinner-item svelte-1y3sjtk");
    			add_location(div4, file$d, 68, 3, 1538);
    			attr_dev(div5, "class", "spinner-title svelte-1y3sjtk");
    			add_location(div5, file$d, 74, 5, 1737);
    			attr_dev(div6, "class", "spinner-item svelte-1y3sjtk");
    			add_location(div6, file$d, 72, 3, 1656);
    			attr_dev(div7, "class", "spinner-title svelte-1y3sjtk");
    			add_location(div7, file$d, 78, 5, 1873);
    			attr_dev(div8, "class", "spinner-item svelte-1y3sjtk");
    			add_location(div8, file$d, 76, 3, 1798);
    			attr_dev(div9, "class", "spinner-title svelte-1y3sjtk");
    			add_location(div9, file$d, 82, 5, 2004);
    			attr_dev(div10, "class", "spinner-item svelte-1y3sjtk");
    			add_location(div10, file$d, 80, 3, 1928);
    			attr_dev(div11, "class", "spinner-title svelte-1y3sjtk");
    			add_location(div11, file$d, 86, 5, 2122);
    			attr_dev(div12, "class", "spinner-item svelte-1y3sjtk");
    			add_location(div12, file$d, 84, 3, 2060);
    			attr_dev(div13, "class", "spinner-title svelte-1y3sjtk");
    			add_location(div13, file$d, 90, 5, 2256);
    			attr_dev(div14, "class", "spinner-item svelte-1y3sjtk");
    			add_location(div14, file$d, 88, 3, 2178);
    			attr_dev(div15, "class", "spinner-title svelte-1y3sjtk");
    			add_location(div15, file$d, 94, 5, 2393);
    			attr_dev(div16, "class", "spinner-item svelte-1y3sjtk");
    			add_location(div16, file$d, 92, 3, 2314);
    			attr_dev(div17, "class", "spinner-title svelte-1y3sjtk");
    			add_location(div17, file$d, 98, 5, 2527);
    			attr_dev(div18, "class", "spinner-item svelte-1y3sjtk");
    			add_location(div18, file$d, 96, 3, 2452);
    			attr_dev(div19, "class", "spinner-title svelte-1y3sjtk");
    			add_location(div19, file$d, 102, 5, 2647);
    			attr_dev(div20, "class", "spinner-item svelte-1y3sjtk");
    			add_location(div20, file$d, 100, 3, 2582);
    			attr_dev(div21, "class", "spinner-title svelte-1y3sjtk");
    			add_location(div21, file$d, 106, 5, 2783);
    			attr_dev(div22, "class", "spinner-item svelte-1y3sjtk");
    			add_location(div22, file$d, 104, 3, 2706);
    			attr_dev(div23, "class", "spinner-title svelte-1y3sjtk");
    			add_location(div23, file$d, 110, 4, 2918);
    			attr_dev(div24, "class", "spinner-item svelte-1y3sjtk");
    			add_location(div24, file$d, 108, 3, 2840);
    			attr_dev(div25, "class", "spinner-title svelte-1y3sjtk");
    			add_location(div25, file$d, 114, 4, 3050);
    			attr_dev(div26, "class", "spinner-item svelte-1y3sjtk");
    			add_location(div26, file$d, 112, 2, 2975);
    			attr_dev(section, "class", "svelte-1y3sjtk");
    			add_location(section, file$d, 61, 2, 1385);
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
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$d.name
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
