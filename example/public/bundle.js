
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
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

    /*

    Based off glamor's StyleSheet, thanks Sunil ❤️

    high performance StyleSheet for css-in-js systems

    - uses multiple style tags behind the scenes for millions of rules
    - uses `insertRule` for appending in production for *much* faster performance

    // usage

    import { StyleSheet } from '@emotion/sheet'

    let styleSheet = new StyleSheet({ key: '', container: document.head })

    styleSheet.insert('#box { border: 1px solid red; }')
    - appends a css rule into the stylesheet

    styleSheet.flush()
    - empties the stylesheet of all its contents

    */
    // $FlowFixMe
    function sheetForTag(tag) {
      if (tag.sheet) {
        // $FlowFixMe
        return tag.sheet;
      } // this weirdness brought to you by firefox

      /* istanbul ignore next */


      for (var i = 0; i < document.styleSheets.length; i++) {
        if (document.styleSheets[i].ownerNode === tag) {
          // $FlowFixMe
          return document.styleSheets[i];
        }
      }
    }

    function createStyleElement(options) {
      var tag = document.createElement('style');
      tag.setAttribute('data-emotion', options.key);

      if (options.nonce !== undefined) {
        tag.setAttribute('nonce', options.nonce);
      }

      tag.appendChild(document.createTextNode(''));
      return tag;
    }

    var StyleSheet =
    /*#__PURE__*/
    function () {
      function StyleSheet(options) {
        this.isSpeedy = options.speedy === undefined ? undefined === 'production' : options.speedy;
        this.tags = [];
        this.ctr = 0;
        this.nonce = options.nonce; // key is the value of the data-emotion attribute, it's used to identify different sheets

        this.key = options.key;
        this.container = options.container;
        this.before = null;
      }

      var _proto = StyleSheet.prototype;

      _proto.insert = function insert(rule) {
        // the max length is how many rules we have per style tag, it's 65000 in speedy mode
        // it's 1 in dev because we insert source maps that map a single rule to a location
        // and you can only have one source map per style tag
        if (this.ctr % (this.isSpeedy ? 65000 : 1) === 0) {
          var _tag = createStyleElement(this);

          var before;

          if (this.tags.length === 0) {
            before = this.before;
          } else {
            before = this.tags[this.tags.length - 1].nextSibling;
          }

          this.container.insertBefore(_tag, before);
          this.tags.push(_tag);
        }

        var tag = this.tags[this.tags.length - 1];

        if (this.isSpeedy) {
          var sheet = sheetForTag(tag);

          try {
            // this is a really hot path
            // we check the second character first because having "i"
            // as the second character will happen less often than
            // having "@" as the first character
            var isImportRule = rule.charCodeAt(1) === 105 && rule.charCodeAt(0) === 64; // this is the ultrafast version, works across browsers
            // the big drawback is that the css won't be editable in devtools

            sheet.insertRule(rule, // we need to insert @import rules before anything else
            // otherwise there will be an error
            // technically this means that the @import rules will
            // _usually_(not always since there could be multiple style tags)
            // be the first ones in prod and generally later in dev
            // this shouldn't really matter in the real world though
            // @import is generally only used for font faces from google fonts and etc.
            // so while this could be technically correct then it would be slower and larger
            // for a tiny bit of correctness that won't matter in the real world
            isImportRule ? 0 : sheet.cssRules.length);
          } catch (e) {
            {
              console.warn("There was a problem inserting the following rule: \"" + rule + "\"", e);
            }
          }
        } else {
          tag.appendChild(document.createTextNode(rule));
        }

        this.ctr++;
      };

      _proto.flush = function flush() {
        // $FlowFixMe
        this.tags.forEach(function (tag) {
          return tag.parentNode.removeChild(tag);
        });
        this.tags = [];
        this.ctr = 0;
      };

      return StyleSheet;
    }();

    function stylis_min (W) {
      function M(d, c, e, h, a) {
        for (var m = 0, b = 0, v = 0, n = 0, q, g, x = 0, K = 0, k, u = k = q = 0, l = 0, r = 0, I = 0, t = 0, B = e.length, J = B - 1, y, f = '', p = '', F = '', G = '', C; l < B;) {
          g = e.charCodeAt(l);
          l === J && 0 !== b + n + v + m && (0 !== b && (g = 47 === b ? 10 : 47), n = v = m = 0, B++, J++);

          if (0 === b + n + v + m) {
            if (l === J && (0 < r && (f = f.replace(N, '')), 0 < f.trim().length)) {
              switch (g) {
                case 32:
                case 9:
                case 59:
                case 13:
                case 10:
                  break;

                default:
                  f += e.charAt(l);
              }

              g = 59;
            }

            switch (g) {
              case 123:
                f = f.trim();
                q = f.charCodeAt(0);
                k = 1;

                for (t = ++l; l < B;) {
                  switch (g = e.charCodeAt(l)) {
                    case 123:
                      k++;
                      break;

                    case 125:
                      k--;
                      break;

                    case 47:
                      switch (g = e.charCodeAt(l + 1)) {
                        case 42:
                        case 47:
                          a: {
                            for (u = l + 1; u < J; ++u) {
                              switch (e.charCodeAt(u)) {
                                case 47:
                                  if (42 === g && 42 === e.charCodeAt(u - 1) && l + 2 !== u) {
                                    l = u + 1;
                                    break a;
                                  }

                                  break;

                                case 10:
                                  if (47 === g) {
                                    l = u + 1;
                                    break a;
                                  }

                              }
                            }

                            l = u;
                          }

                      }

                      break;

                    case 91:
                      g++;

                    case 40:
                      g++;

                    case 34:
                    case 39:
                      for (; l++ < J && e.charCodeAt(l) !== g;) {
                      }

                  }

                  if (0 === k) break;
                  l++;
                }

                k = e.substring(t, l);
                0 === q && (q = (f = f.replace(ca, '').trim()).charCodeAt(0));

                switch (q) {
                  case 64:
                    0 < r && (f = f.replace(N, ''));
                    g = f.charCodeAt(1);

                    switch (g) {
                      case 100:
                      case 109:
                      case 115:
                      case 45:
                        r = c;
                        break;

                      default:
                        r = O;
                    }

                    k = M(c, r, k, g, a + 1);
                    t = k.length;
                    0 < A && (r = X(O, f, I), C = H(3, k, r, c, D, z, t, g, a, h), f = r.join(''), void 0 !== C && 0 === (t = (k = C.trim()).length) && (g = 0, k = ''));
                    if (0 < t) switch (g) {
                      case 115:
                        f = f.replace(da, ea);

                      case 100:
                      case 109:
                      case 45:
                        k = f + '{' + k + '}';
                        break;

                      case 107:
                        f = f.replace(fa, '$1 $2');
                        k = f + '{' + k + '}';
                        k = 1 === w || 2 === w && L('@' + k, 3) ? '@-webkit-' + k + '@' + k : '@' + k;
                        break;

                      default:
                        k = f + k, 112 === h && (k = (p += k, ''));
                    } else k = '';
                    break;

                  default:
                    k = M(c, X(c, f, I), k, h, a + 1);
                }

                F += k;
                k = I = r = u = q = 0;
                f = '';
                g = e.charCodeAt(++l);
                break;

              case 125:
              case 59:
                f = (0 < r ? f.replace(N, '') : f).trim();
                if (1 < (t = f.length)) switch (0 === u && (q = f.charCodeAt(0), 45 === q || 96 < q && 123 > q) && (t = (f = f.replace(' ', ':')).length), 0 < A && void 0 !== (C = H(1, f, c, d, D, z, p.length, h, a, h)) && 0 === (t = (f = C.trim()).length) && (f = '\x00\x00'), q = f.charCodeAt(0), g = f.charCodeAt(1), q) {
                  case 0:
                    break;

                  case 64:
                    if (105 === g || 99 === g) {
                      G += f + e.charAt(l);
                      break;
                    }

                  default:
                    58 !== f.charCodeAt(t - 1) && (p += P(f, q, g, f.charCodeAt(2)));
                }
                I = r = u = q = 0;
                f = '';
                g = e.charCodeAt(++l);
            }
          }

          switch (g) {
            case 13:
            case 10:
              47 === b ? b = 0 : 0 === 1 + q && 107 !== h && 0 < f.length && (r = 1, f += '\x00');
              0 < A * Y && H(0, f, c, d, D, z, p.length, h, a, h);
              z = 1;
              D++;
              break;

            case 59:
            case 125:
              if (0 === b + n + v + m) {
                z++;
                break;
              }

            default:
              z++;
              y = e.charAt(l);

              switch (g) {
                case 9:
                case 32:
                  if (0 === n + m + b) switch (x) {
                    case 44:
                    case 58:
                    case 9:
                    case 32:
                      y = '';
                      break;

                    default:
                      32 !== g && (y = ' ');
                  }
                  break;

                case 0:
                  y = '\\0';
                  break;

                case 12:
                  y = '\\f';
                  break;

                case 11:
                  y = '\\v';
                  break;

                case 38:
                  0 === n + b + m && (r = I = 1, y = '\f' + y);
                  break;

                case 108:
                  if (0 === n + b + m + E && 0 < u) switch (l - u) {
                    case 2:
                      112 === x && 58 === e.charCodeAt(l - 3) && (E = x);

                    case 8:
                      111 === K && (E = K);
                  }
                  break;

                case 58:
                  0 === n + b + m && (u = l);
                  break;

                case 44:
                  0 === b + v + n + m && (r = 1, y += '\r');
                  break;

                case 34:
                case 39:
                  0 === b && (n = n === g ? 0 : 0 === n ? g : n);
                  break;

                case 91:
                  0 === n + b + v && m++;
                  break;

                case 93:
                  0 === n + b + v && m--;
                  break;

                case 41:
                  0 === n + b + m && v--;
                  break;

                case 40:
                  if (0 === n + b + m) {
                    if (0 === q) switch (2 * x + 3 * K) {
                      case 533:
                        break;

                      default:
                        q = 1;
                    }
                    v++;
                  }

                  break;

                case 64:
                  0 === b + v + n + m + u + k && (k = 1);
                  break;

                case 42:
                case 47:
                  if (!(0 < n + m + v)) switch (b) {
                    case 0:
                      switch (2 * g + 3 * e.charCodeAt(l + 1)) {
                        case 235:
                          b = 47;
                          break;

                        case 220:
                          t = l, b = 42;
                      }

                      break;

                    case 42:
                      47 === g && 42 === x && t + 2 !== l && (33 === e.charCodeAt(t + 2) && (p += e.substring(t, l + 1)), y = '', b = 0);
                  }
              }

              0 === b && (f += y);
          }

          K = x;
          x = g;
          l++;
        }

        t = p.length;

        if (0 < t) {
          r = c;
          if (0 < A && (C = H(2, p, r, d, D, z, t, h, a, h), void 0 !== C && 0 === (p = C).length)) return G + p + F;
          p = r.join(',') + '{' + p + '}';

          if (0 !== w * E) {
            2 !== w || L(p, 2) || (E = 0);

            switch (E) {
              case 111:
                p = p.replace(ha, ':-moz-$1') + p;
                break;

              case 112:
                p = p.replace(Q, '::-webkit-input-$1') + p.replace(Q, '::-moz-$1') + p.replace(Q, ':-ms-input-$1') + p;
            }

            E = 0;
          }
        }

        return G + p + F;
      }

      function X(d, c, e) {
        var h = c.trim().split(ia);
        c = h;
        var a = h.length,
            m = d.length;

        switch (m) {
          case 0:
          case 1:
            var b = 0;

            for (d = 0 === m ? '' : d[0] + ' '; b < a; ++b) {
              c[b] = Z(d, c[b], e).trim();
            }

            break;

          default:
            var v = b = 0;

            for (c = []; b < a; ++b) {
              for (var n = 0; n < m; ++n) {
                c[v++] = Z(d[n] + ' ', h[b], e).trim();
              }
            }

        }

        return c;
      }

      function Z(d, c, e) {
        var h = c.charCodeAt(0);
        33 > h && (h = (c = c.trim()).charCodeAt(0));

        switch (h) {
          case 38:
            return c.replace(F, '$1' + d.trim());

          case 58:
            return d.trim() + c.replace(F, '$1' + d.trim());

          default:
            if (0 < 1 * e && 0 < c.indexOf('\f')) return c.replace(F, (58 === d.charCodeAt(0) ? '' : '$1') + d.trim());
        }

        return d + c;
      }

      function P(d, c, e, h) {
        var a = d + ';',
            m = 2 * c + 3 * e + 4 * h;

        if (944 === m) {
          d = a.indexOf(':', 9) + 1;
          var b = a.substring(d, a.length - 1).trim();
          b = a.substring(0, d).trim() + b + ';';
          return 1 === w || 2 === w && L(b, 1) ? '-webkit-' + b + b : b;
        }

        if (0 === w || 2 === w && !L(a, 1)) return a;

        switch (m) {
          case 1015:
            return 97 === a.charCodeAt(10) ? '-webkit-' + a + a : a;

          case 951:
            return 116 === a.charCodeAt(3) ? '-webkit-' + a + a : a;

          case 963:
            return 110 === a.charCodeAt(5) ? '-webkit-' + a + a : a;

          case 1009:
            if (100 !== a.charCodeAt(4)) break;

          case 969:
          case 942:
            return '-webkit-' + a + a;

          case 978:
            return '-webkit-' + a + '-moz-' + a + a;

          case 1019:
          case 983:
            return '-webkit-' + a + '-moz-' + a + '-ms-' + a + a;

          case 883:
            if (45 === a.charCodeAt(8)) return '-webkit-' + a + a;
            if (0 < a.indexOf('image-set(', 11)) return a.replace(ja, '$1-webkit-$2') + a;
            break;

          case 932:
            if (45 === a.charCodeAt(4)) switch (a.charCodeAt(5)) {
              case 103:
                return '-webkit-box-' + a.replace('-grow', '') + '-webkit-' + a + '-ms-' + a.replace('grow', 'positive') + a;

              case 115:
                return '-webkit-' + a + '-ms-' + a.replace('shrink', 'negative') + a;

              case 98:
                return '-webkit-' + a + '-ms-' + a.replace('basis', 'preferred-size') + a;
            }
            return '-webkit-' + a + '-ms-' + a + a;

          case 964:
            return '-webkit-' + a + '-ms-flex-' + a + a;

          case 1023:
            if (99 !== a.charCodeAt(8)) break;
            b = a.substring(a.indexOf(':', 15)).replace('flex-', '').replace('space-between', 'justify');
            return '-webkit-box-pack' + b + '-webkit-' + a + '-ms-flex-pack' + b + a;

          case 1005:
            return ka.test(a) ? a.replace(aa, ':-webkit-') + a.replace(aa, ':-moz-') + a : a;

          case 1e3:
            b = a.substring(13).trim();
            c = b.indexOf('-') + 1;

            switch (b.charCodeAt(0) + b.charCodeAt(c)) {
              case 226:
                b = a.replace(G, 'tb');
                break;

              case 232:
                b = a.replace(G, 'tb-rl');
                break;

              case 220:
                b = a.replace(G, 'lr');
                break;

              default:
                return a;
            }

            return '-webkit-' + a + '-ms-' + b + a;

          case 1017:
            if (-1 === a.indexOf('sticky', 9)) break;

          case 975:
            c = (a = d).length - 10;
            b = (33 === a.charCodeAt(c) ? a.substring(0, c) : a).substring(d.indexOf(':', 7) + 1).trim();

            switch (m = b.charCodeAt(0) + (b.charCodeAt(7) | 0)) {
              case 203:
                if (111 > b.charCodeAt(8)) break;

              case 115:
                a = a.replace(b, '-webkit-' + b) + ';' + a;
                break;

              case 207:
              case 102:
                a = a.replace(b, '-webkit-' + (102 < m ? 'inline-' : '') + 'box') + ';' + a.replace(b, '-webkit-' + b) + ';' + a.replace(b, '-ms-' + b + 'box') + ';' + a;
            }

            return a + ';';

          case 938:
            if (45 === a.charCodeAt(5)) switch (a.charCodeAt(6)) {
              case 105:
                return b = a.replace('-items', ''), '-webkit-' + a + '-webkit-box-' + b + '-ms-flex-' + b + a;

              case 115:
                return '-webkit-' + a + '-ms-flex-item-' + a.replace(ba, '') + a;

              default:
                return '-webkit-' + a + '-ms-flex-line-pack' + a.replace('align-content', '').replace(ba, '') + a;
            }
            break;

          case 973:
          case 989:
            if (45 !== a.charCodeAt(3) || 122 === a.charCodeAt(4)) break;

          case 931:
          case 953:
            if (!0 === la.test(d)) return 115 === (b = d.substring(d.indexOf(':') + 1)).charCodeAt(0) ? P(d.replace('stretch', 'fill-available'), c, e, h).replace(':fill-available', ':stretch') : a.replace(b, '-webkit-' + b) + a.replace(b, '-moz-' + b.replace('fill-', '')) + a;
            break;

          case 962:
            if (a = '-webkit-' + a + (102 === a.charCodeAt(5) ? '-ms-' + a : '') + a, 211 === e + h && 105 === a.charCodeAt(13) && 0 < a.indexOf('transform', 10)) return a.substring(0, a.indexOf(';', 27) + 1).replace(ma, '$1-webkit-$2') + a;
        }

        return a;
      }

      function L(d, c) {
        var e = d.indexOf(1 === c ? ':' : '{'),
            h = d.substring(0, 3 !== c ? e : 10);
        e = d.substring(e + 1, d.length - 1);
        return R(2 !== c ? h : h.replace(na, '$1'), e, c);
      }

      function ea(d, c) {
        var e = P(c, c.charCodeAt(0), c.charCodeAt(1), c.charCodeAt(2));
        return e !== c + ';' ? e.replace(oa, ' or ($1)').substring(4) : '(' + c + ')';
      }

      function H(d, c, e, h, a, m, b, v, n, q) {
        for (var g = 0, x = c, w; g < A; ++g) {
          switch (w = S[g].call(B, d, x, e, h, a, m, b, v, n, q)) {
            case void 0:
            case !1:
            case !0:
            case null:
              break;

            default:
              x = w;
          }
        }

        if (x !== c) return x;
      }

      function T(d) {
        switch (d) {
          case void 0:
          case null:
            A = S.length = 0;
            break;

          default:
            if ('function' === typeof d) S[A++] = d;else if ('object' === typeof d) for (var c = 0, e = d.length; c < e; ++c) {
              T(d[c]);
            } else Y = !!d | 0;
        }

        return T;
      }

      function U(d) {
        d = d.prefix;
        void 0 !== d && (R = null, d ? 'function' !== typeof d ? w = 1 : (w = 2, R = d) : w = 0);
        return U;
      }

      function B(d, c) {
        var e = d;
        33 > e.charCodeAt(0) && (e = e.trim());
        V = e;
        e = [V];

        if (0 < A) {
          var h = H(-1, c, e, e, D, z, 0, 0, 0, 0);
          void 0 !== h && 'string' === typeof h && (c = h);
        }

        var a = M(O, e, c, 0, 0);
        0 < A && (h = H(-2, a, e, e, D, z, a.length, 0, 0, 0), void 0 !== h && (a = h));
        V = '';
        E = 0;
        z = D = 1;
        return a;
      }

      var ca = /^\0+/g,
          N = /[\0\r\f]/g,
          aa = /: */g,
          ka = /zoo|gra/,
          ma = /([,: ])(transform)/g,
          ia = /,\r+?/g,
          F = /([\t\r\n ])*\f?&/g,
          fa = /@(k\w+)\s*(\S*)\s*/,
          Q = /::(place)/g,
          ha = /:(read-only)/g,
          G = /[svh]\w+-[tblr]{2}/,
          da = /\(\s*(.*)\s*\)/g,
          oa = /([\s\S]*?);/g,
          ba = /-self|flex-/g,
          na = /[^]*?(:[rp][el]a[\w-]+)[^]*/,
          la = /stretch|:\s*\w+\-(?:conte|avail)/,
          ja = /([^-])(image-set\()/,
          z = 1,
          D = 1,
          E = 0,
          w = 1,
          O = [],
          S = [],
          A = 0,
          R = null,
          Y = 0,
          V = '';
      B.use = T;
      B.set = U;
      void 0 !== W && U(W);
      return B;
    }

    // https://github.com/thysultan/stylis.js/tree/master/plugins/rule-sheet
    // inlined to avoid umd wrapper and peerDep warnings/installing stylis
    // since we use stylis after closure compiler
    var delimiter = '/*|*/';
    var needle = delimiter + '}';

    function toSheet(block) {
      if (block) {
        Sheet.current.insert(block + '}');
      }
    }

    var Sheet = {
      current: null
    };
    var ruleSheet = function ruleSheet(context, content, selectors, parents, line, column, length, ns, depth, at) {
      switch (context) {
        // property
        case 1:
          {
            switch (content.charCodeAt(0)) {
              case 64:
                {
                  // @import
                  Sheet.current.insert(content + ';');
                  return '';
                }
              // charcode for l

              case 108:
                {
                  // charcode for b
                  // this ignores label
                  if (content.charCodeAt(2) === 98) {
                    return '';
                  }
                }
            }

            break;
          }
        // selector

        case 2:
          {
            if (ns === 0) return content + delimiter;
            break;
          }
        // at-rule

        case 3:
          {
            switch (ns) {
              // @font-face, @page
              case 102:
              case 112:
                {
                  Sheet.current.insert(selectors[0] + content);
                  return '';
                }

              default:
                {
                  return content + (at === 0 ? delimiter : '');
                }
            }
          }

        case -2:
          {
            content.split(needle).forEach(toSheet);
          }
      }
    };

    var createCache = function createCache(options) {
      if (options === undefined) options = {};
      var key = options.key || 'css';
      var stylisOptions;

      if (options.prefix !== undefined) {
        stylisOptions = {
          prefix: options.prefix
        };
      }

      var stylis = new stylis_min(stylisOptions);

      {
        // $FlowFixMe
        if (/[^a-z-]/.test(key)) {
          throw new Error("Emotion key must only contain lower case alphabetical characters and - but \"" + key + "\" was passed");
        }
      }

      var inserted = {}; // $FlowFixMe

      var container;

      {
        container = options.container || document.head;
        var nodes = document.querySelectorAll("style[data-emotion-" + key + "]");
        Array.prototype.forEach.call(nodes, function (node) {
          var attrib = node.getAttribute("data-emotion-" + key); // $FlowFixMe

          attrib.split(' ').forEach(function (id) {
            inserted[id] = true;
          });

          if (node.parentNode !== container) {
            container.appendChild(node);
          }
        });
      }

      var _insert;

      {
        stylis.use(options.stylisPlugins)(ruleSheet);

        _insert = function insert(selector, serialized, sheet, shouldCache) {
          var name = serialized.name;
          Sheet.current = sheet;

          if ( serialized.map !== undefined) {
            var map = serialized.map;
            Sheet.current = {
              insert: function insert(rule) {
                sheet.insert(rule + map);
              }
            };
          }

          stylis(selector, serialized.styles);

          if (shouldCache) {
            cache.inserted[name] = true;
          }
        };
      }

      {
        // https://esbench.com/bench/5bf7371a4cd7e6009ef61d0a
        var commentStart = /\/\*/g;
        var commentEnd = /\*\//g;
        stylis.use(function (context, content) {
          switch (context) {
            case -1:
              {
                while (commentStart.test(content)) {
                  commentEnd.lastIndex = commentStart.lastIndex;

                  if (commentEnd.test(content)) {
                    commentStart.lastIndex = commentEnd.lastIndex;
                    continue;
                  }

                  throw new Error('Your styles have an unterminated comment ("/*" without corresponding "*/").');
                }

                commentStart.lastIndex = 0;
                break;
              }
          }
        });
        stylis.use(function (context, content, selectors) {
          switch (context) {
            case -1:
              {
                var flag = 'emotion-disable-server-rendering-unsafe-selector-warning-please-do-not-use-this-the-warning-exists-for-a-reason';
                var unsafePseudoClasses = content.match(/(:first|:nth|:nth-last)-child/g);

                if (unsafePseudoClasses && cache.compat !== true) {
                  unsafePseudoClasses.forEach(function (unsafePseudoClass) {
                    var ignoreRegExp = new RegExp(unsafePseudoClass + ".*\\/\\* " + flag + " \\*\\/");
                    var ignore = ignoreRegExp.test(content);

                    if (unsafePseudoClass && !ignore) {
                      console.error("The pseudo class \"" + unsafePseudoClass + "\" is potentially unsafe when doing server-side rendering. Try changing it to \"" + unsafePseudoClass.split('-child')[0] + "-of-type\".");
                    }
                  });
                }

                break;
              }
          }
        });
      }

      var cache = {
        key: key,
        sheet: new StyleSheet({
          key: key,
          container: container,
          nonce: options.nonce,
          speedy: options.speedy
        }),
        nonce: options.nonce,
        inserted: inserted,
        registered: {},
        insert: _insert
      };
      return cache;
    };

    /* eslint-disable */
    // Inspired by https://github.com/garycourt/murmurhash-js
    // Ported from https://github.com/aappleby/smhasher/blob/61a0530f28277f2e850bfc39600ce61d02b518de/src/MurmurHash2.cpp#L37-L86
    function murmur2(str) {
      // 'm' and 'r' are mixing constants generated offline.
      // They're not really 'magic', they just happen to work well.
      // const m = 0x5bd1e995;
      // const r = 24;
      // Initialize the hash
      var h = 0; // Mix 4 bytes at a time into the hash

      var k,
          i = 0,
          len = str.length;

      for (; len >= 4; ++i, len -= 4) {
        k = str.charCodeAt(i) & 0xff | (str.charCodeAt(++i) & 0xff) << 8 | (str.charCodeAt(++i) & 0xff) << 16 | (str.charCodeAt(++i) & 0xff) << 24;
        k =
        /* Math.imul(k, m): */
        (k & 0xffff) * 0x5bd1e995 + ((k >>> 16) * 0xe995 << 16);
        k ^=
        /* k >>> r: */
        k >>> 24;
        h =
        /* Math.imul(k, m): */
        (k & 0xffff) * 0x5bd1e995 + ((k >>> 16) * 0xe995 << 16) ^
        /* Math.imul(h, m): */
        (h & 0xffff) * 0x5bd1e995 + ((h >>> 16) * 0xe995 << 16);
      } // Handle the last few bytes of the input array


      switch (len) {
        case 3:
          h ^= (str.charCodeAt(i + 2) & 0xff) << 16;

        case 2:
          h ^= (str.charCodeAt(i + 1) & 0xff) << 8;

        case 1:
          h ^= str.charCodeAt(i) & 0xff;
          h =
          /* Math.imul(h, m): */
          (h & 0xffff) * 0x5bd1e995 + ((h >>> 16) * 0xe995 << 16);
      } // Do a few final mixes of the hash to ensure the last few
      // bytes are well-incorporated.


      h ^= h >>> 13;
      h =
      /* Math.imul(h, m): */
      (h & 0xffff) * 0x5bd1e995 + ((h >>> 16) * 0xe995 << 16);
      return ((h ^ h >>> 15) >>> 0).toString(36);
    }

    var unitlessKeys = {
      animationIterationCount: 1,
      borderImageOutset: 1,
      borderImageSlice: 1,
      borderImageWidth: 1,
      boxFlex: 1,
      boxFlexGroup: 1,
      boxOrdinalGroup: 1,
      columnCount: 1,
      columns: 1,
      flex: 1,
      flexGrow: 1,
      flexPositive: 1,
      flexShrink: 1,
      flexNegative: 1,
      flexOrder: 1,
      gridRow: 1,
      gridRowEnd: 1,
      gridRowSpan: 1,
      gridRowStart: 1,
      gridColumn: 1,
      gridColumnEnd: 1,
      gridColumnSpan: 1,
      gridColumnStart: 1,
      msGridRow: 1,
      msGridRowSpan: 1,
      msGridColumn: 1,
      msGridColumnSpan: 1,
      fontWeight: 1,
      lineHeight: 1,
      opacity: 1,
      order: 1,
      orphans: 1,
      tabSize: 1,
      widows: 1,
      zIndex: 1,
      zoom: 1,
      WebkitLineClamp: 1,
      // SVG-related properties
      fillOpacity: 1,
      floodOpacity: 1,
      stopOpacity: 1,
      strokeDasharray: 1,
      strokeDashoffset: 1,
      strokeMiterlimit: 1,
      strokeOpacity: 1,
      strokeWidth: 1
    };

    function memoize(fn) {
      var cache = {};
      return function (arg) {
        if (cache[arg] === undefined) cache[arg] = fn(arg);
        return cache[arg];
      };
    }

    var ILLEGAL_ESCAPE_SEQUENCE_ERROR = "You have illegal escape sequence in your template literal, most likely inside content's property value.\nBecause you write your CSS inside a JavaScript string you actually have to do double escaping, so for example \"content: '\\00d7';\" should become \"content: '\\\\00d7';\".\nYou can read more about this here:\nhttps://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#ES2018_revision_of_illegal_escape_sequences";
    var UNDEFINED_AS_OBJECT_KEY_ERROR = "You have passed in falsy value as style object's key (can happen when in example you pass unexported component as computed key).";
    var hyphenateRegex = /[A-Z]|^ms/g;
    var animationRegex = /_EMO_([^_]+?)_([^]*?)_EMO_/g;

    var isCustomProperty = function isCustomProperty(property) {
      return property.charCodeAt(1) === 45;
    };

    var isProcessableValue = function isProcessableValue(value) {
      return value != null && typeof value !== 'boolean';
    };

    var processStyleName = memoize(function (styleName) {
      return isCustomProperty(styleName) ? styleName : styleName.replace(hyphenateRegex, '-$&').toLowerCase();
    });

    var processStyleValue = function processStyleValue(key, value) {
      switch (key) {
        case 'animation':
        case 'animationName':
          {
            if (typeof value === 'string') {
              return value.replace(animationRegex, function (match, p1, p2) {
                cursor = {
                  name: p1,
                  styles: p2,
                  next: cursor
                };
                return p1;
              });
            }
          }
      }

      if (unitlessKeys[key] !== 1 && !isCustomProperty(key) && typeof value === 'number' && value !== 0) {
        return value + 'px';
      }

      return value;
    };

    {
      var contentValuePattern = /(attr|calc|counters?|url)\(/;
      var contentValues = ['normal', 'none', 'counter', 'open-quote', 'close-quote', 'no-open-quote', 'no-close-quote', 'initial', 'inherit', 'unset'];
      var oldProcessStyleValue = processStyleValue;
      var msPattern = /^-ms-/;
      var hyphenPattern = /-(.)/g;
      var hyphenatedCache = {};

      processStyleValue = function processStyleValue(key, value) {
        if (key === 'content') {
          if (typeof value !== 'string' || contentValues.indexOf(value) === -1 && !contentValuePattern.test(value) && (value.charAt(0) !== value.charAt(value.length - 1) || value.charAt(0) !== '"' && value.charAt(0) !== "'")) {
            console.error("You seem to be using a value for 'content' without quotes, try replacing it with `content: '\"" + value + "\"'`");
          }
        }

        var processed = oldProcessStyleValue(key, value);

        if (processed !== '' && !isCustomProperty(key) && key.indexOf('-') !== -1 && hyphenatedCache[key] === undefined) {
          hyphenatedCache[key] = true;
          console.error("Using kebab-case for css properties in objects is not supported. Did you mean " + key.replace(msPattern, 'ms-').replace(hyphenPattern, function (str, _char) {
            return _char.toUpperCase();
          }) + "?");
        }

        return processed;
      };
    }

    var shouldWarnAboutInterpolatingClassNameFromCss = true;

    function handleInterpolation(mergedProps, registered, interpolation, couldBeSelectorInterpolation) {
      if (interpolation == null) {
        return '';
      }

      if (interpolation.__emotion_styles !== undefined) {
        if ( interpolation.toString() === 'NO_COMPONENT_SELECTOR') {
          throw new Error('Component selectors can only be used in conjunction with babel-plugin-emotion.');
        }

        return interpolation;
      }

      switch (typeof interpolation) {
        case 'boolean':
          {
            return '';
          }

        case 'object':
          {
            if (interpolation.anim === 1) {
              cursor = {
                name: interpolation.name,
                styles: interpolation.styles,
                next: cursor
              };
              return interpolation.name;
            }

            if (interpolation.styles !== undefined) {
              var next = interpolation.next;

              if (next !== undefined) {
                // not the most efficient thing ever but this is a pretty rare case
                // and there will be very few iterations of this generally
                while (next !== undefined) {
                  cursor = {
                    name: next.name,
                    styles: next.styles,
                    next: cursor
                  };
                  next = next.next;
                }
              }

              var styles = interpolation.styles + ";";

              if ( interpolation.map !== undefined) {
                styles += interpolation.map;
              }

              return styles;
            }

            return createStringFromObject(mergedProps, registered, interpolation);
          }

        case 'function':
          {
            if (mergedProps !== undefined) {
              var previousCursor = cursor;
              var result = interpolation(mergedProps);
              cursor = previousCursor;
              return handleInterpolation(mergedProps, registered, result, couldBeSelectorInterpolation);
            } else {
              console.error('Functions that are interpolated in css calls will be stringified.\n' + 'If you want to have a css call based on props, create a function that returns a css call like this\n' + 'let dynamicStyle = (props) => css`color: ${props.color}`\n' + 'It can be called directly with props or interpolated in a styled call like this\n' + "let SomeComponent = styled('div')`${dynamicStyle}`");
            }

            break;
          }

        case 'string':
          {
            var matched = [];
            var replaced = interpolation.replace(animationRegex, function (match, p1, p2) {
              var fakeVarName = "animation" + matched.length;
              matched.push("const " + fakeVarName + " = keyframes`" + p2.replace(/^@keyframes animation-\w+/, '') + "`");
              return "${" + fakeVarName + "}";
            });

            if (matched.length) {
              console.error('`keyframes` output got interpolated into plain string, please wrap it with `css`.\n\n' + 'Instead of doing this:\n\n' + [].concat(matched, ["`" + replaced + "`"]).join('\n') + '\n\nYou should wrap it with `css` like this:\n\n' + ("css`" + replaced + "`"));
            }
          }

          break;
      } // finalize string values (regular strings and functions interpolated into css calls)


      if (registered == null) {
        return interpolation;
      }

      var cached = registered[interpolation];

      if ( couldBeSelectorInterpolation && shouldWarnAboutInterpolatingClassNameFromCss && cached !== undefined) {
        console.error('Interpolating a className from css`` is not recommended and will cause problems with composition.\n' + 'Interpolating a className from css`` will be completely unsupported in a future major version of Emotion');
        shouldWarnAboutInterpolatingClassNameFromCss = false;
      }

      return cached !== undefined && !couldBeSelectorInterpolation ? cached : interpolation;
    }

    function createStringFromObject(mergedProps, registered, obj) {
      var string = '';

      if (Array.isArray(obj)) {
        for (var i = 0; i < obj.length; i++) {
          string += handleInterpolation(mergedProps, registered, obj[i], false);
        }
      } else {
        for (var _key in obj) {
          var value = obj[_key];

          if (typeof value !== 'object') {
            if (registered != null && registered[value] !== undefined) {
              string += _key + "{" + registered[value] + "}";
            } else if (isProcessableValue(value)) {
              string += processStyleName(_key) + ":" + processStyleValue(_key, value) + ";";
            }
          } else {
            if (_key === 'NO_COMPONENT_SELECTOR' && undefined !== 'production') {
              throw new Error('Component selectors can only be used in conjunction with babel-plugin-emotion.');
            }

            if (Array.isArray(value) && typeof value[0] === 'string' && (registered == null || registered[value[0]] === undefined)) {
              for (var _i = 0; _i < value.length; _i++) {
                if (isProcessableValue(value[_i])) {
                  string += processStyleName(_key) + ":" + processStyleValue(_key, value[_i]) + ";";
                }
              }
            } else {
              var interpolated = handleInterpolation(mergedProps, registered, value, false);

              switch (_key) {
                case 'animation':
                case 'animationName':
                  {
                    string += processStyleName(_key) + ":" + interpolated + ";";
                    break;
                  }

                default:
                  {
                    if ( _key === 'undefined') {
                      console.error(UNDEFINED_AS_OBJECT_KEY_ERROR);
                    }

                    string += _key + "{" + interpolated + "}";
                  }
              }
            }
          }
        }
      }

      return string;
    }

    var labelPattern = /label:\s*([^\s;\n{]+)\s*;/g;
    var sourceMapPattern;

    {
      sourceMapPattern = /\/\*#\ssourceMappingURL=data:application\/json;\S+\s+\*\//;
    } // this is the cursor for keyframes
    // keyframes are stored on the SerializedStyles object as a linked list


    var cursor;
    var serializeStyles = function serializeStyles(args, registered, mergedProps) {
      if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null && args[0].styles !== undefined) {
        return args[0];
      }

      var stringMode = true;
      var styles = '';
      cursor = undefined;
      var strings = args[0];

      if (strings == null || strings.raw === undefined) {
        stringMode = false;
        styles += handleInterpolation(mergedProps, registered, strings, false);
      } else {
        if ( strings[0] === undefined) {
          console.error(ILLEGAL_ESCAPE_SEQUENCE_ERROR);
        }

        styles += strings[0];
      } // we start at 1 since we've already handled the first arg


      for (var i = 1; i < args.length; i++) {
        styles += handleInterpolation(mergedProps, registered, args[i], styles.charCodeAt(styles.length - 1) === 46);

        if (stringMode) {
          if ( strings[i] === undefined) {
            console.error(ILLEGAL_ESCAPE_SEQUENCE_ERROR);
          }

          styles += strings[i];
        }
      }

      var sourceMap;

      {
        styles = styles.replace(sourceMapPattern, function (match) {
          sourceMap = match;
          return '';
        });
      } // using a global regex with .exec is stateful so lastIndex has to be reset each time


      labelPattern.lastIndex = 0;
      var identifierName = '';
      var match; // https://esbench.com/bench/5b809c2cf2949800a0f61fb5

      while ((match = labelPattern.exec(styles)) !== null) {
        identifierName += '-' + // $FlowFixMe we know it's not null
        match[1];
      }

      var name = murmur2(styles) + identifierName;

      {
        // $FlowFixMe SerializedStyles type doesn't have toString property (and we don't want to add it)
        return {
          name: name,
          styles: styles,
          map: sourceMap,
          next: cursor,
          toString: function toString() {
            return "You have tried to stringify object returned from `css` function. It isn't supposed to be used directly (e.g. as value of the `className` prop), but rather handed to emotion so it can handle it (e.g. as value of `css` prop).";
          }
        };
      }
    };

    var isBrowser = "object" !== 'undefined';
    function getRegisteredStyles(registered, registeredStyles, classNames) {
      var rawClassName = '';
      classNames.split(' ').forEach(function (className) {
        if (registered[className] !== undefined) {
          registeredStyles.push(registered[className]);
        } else {
          rawClassName += className + " ";
        }
      });
      return rawClassName;
    }
    var insertStyles = function insertStyles(cache, serialized, isStringTag) {
      var className = cache.key + "-" + serialized.name;

      if ( // we only need to add the styles to the registered cache if the
      // class name could be used further down
      // the tree but if it's a string tag, we know it won't
      // so we don't have to add it to registered cache.
      // this improves memory usage since we can avoid storing the whole style string
      (isStringTag === false || // we need to always store it if we're in compat mode and
      // in node since emotion-server relies on whether a style is in
      // the registered cache to know whether a style is global or not
      // also, note that this check will be dead code eliminated in the browser
      isBrowser === false ) && cache.registered[className] === undefined) {
        cache.registered[className] = serialized.styles;
      }

      if (cache.inserted[serialized.name] === undefined) {
        var current = serialized;

        do {
          var maybeStyles = cache.insert("." + className, current, cache.sheet, true);

          current = current.next;
        } while (current !== undefined);
      }
    };

    function insertWithoutScoping(cache, serialized) {
      if (cache.inserted[serialized.name] === undefined) {
        return cache.insert('', serialized, cache.sheet, true);
      }
    }

    function merge(registered, css, className) {
      var registeredStyles = [];
      var rawClassName = getRegisteredStyles(registered, registeredStyles, className);

      if (registeredStyles.length < 2) {
        return className;
      }

      return rawClassName + css(registeredStyles);
    }

    var createEmotion = function createEmotion(options) {
      var cache = createCache(options); // $FlowFixMe

      cache.sheet.speedy = function (value) {
        if ( this.ctr !== 0) {
          throw new Error('speedy must be changed before any rules are inserted');
        }

        this.isSpeedy = value;
      };

      cache.compat = true;

      var css = function css() {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        var serialized = serializeStyles(args, cache.registered, undefined);
        insertStyles(cache, serialized, false);
        return cache.key + "-" + serialized.name;
      };

      var keyframes = function keyframes() {
        for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }

        var serialized = serializeStyles(args, cache.registered);
        var animation = "animation-" + serialized.name;
        insertWithoutScoping(cache, {
          name: serialized.name,
          styles: "@keyframes " + animation + "{" + serialized.styles + "}"
        });
        return animation;
      };

      var injectGlobal = function injectGlobal() {
        for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
          args[_key3] = arguments[_key3];
        }

        var serialized = serializeStyles(args, cache.registered);
        insertWithoutScoping(cache, serialized);
      };

      var cx = function cx() {
        for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
          args[_key4] = arguments[_key4];
        }

        return merge(cache.registered, css, classnames(args));
      };

      return {
        css: css,
        cx: cx,
        injectGlobal: injectGlobal,
        keyframes: keyframes,
        hydrate: function hydrate(ids) {
          ids.forEach(function (key) {
            cache.inserted[key] = true;
          });
        },
        flush: function flush() {
          cache.registered = {};
          cache.inserted = {};
          cache.sheet.flush();
        },
        // $FlowFixMe
        sheet: cache.sheet,
        cache: cache,
        getRegisteredStyles: getRegisteredStyles.bind(null, cache.registered),
        merge: merge.bind(null, cache.registered, css)
      };
    };

    var classnames = function classnames(args) {
      var cls = '';

      for (var i = 0; i < args.length; i++) {
        var arg = args[i];
        if (arg == null) continue;
        var toAdd = void 0;

        switch (typeof arg) {
          case 'boolean':
            break;

          case 'object':
            {
              if (Array.isArray(arg)) {
                toAdd = classnames(arg);
              } else {
                toAdd = '';

                for (var k in arg) {
                  if (arg[k] && k) {
                    toAdd && (toAdd += ' ');
                    toAdd += k;
                  }
                }
              }

              break;
            }

          default:
            {
              toAdd = arg;
            }
        }

        if (toAdd) {
          cls && (cls += ' ');
          cls += toAdd;
        }
      }

      return cls;
    };

    var _createEmotion = createEmotion(),
        keyframes = _createEmotion.keyframes,
        css = _createEmotion.css;

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\Circle.svelte generated by Svelte v3.19.2 */
    const file = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\Circle.svelte";

    function create_fragment(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", /*circle*/ ctx[0]);
    			set_style(div, "animation", "0.75s linear 0s infinite normal none running " + /*rotate*/ ctx[1]);
    			add_location(div, file, 22, 0, 517);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
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

    	const rotate = keyframes`
  0% {transform: rotate(0)}
  100% {transform: rotate(360deg)}
`;

    	const circle = css`
    height: ${size + unit};
    width: ${size + unit};
    border-color: ${color} transparent ${color} ${color};
    border-width: ${size / 15 + unit};
    border-style: solid;
    border-image: initial;
    border-radius: 50%;
  `;

    	const writable_props = ["size", "color", "unit"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Circle> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Circle", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("color" in $$props) $$invalidate(3, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(4, unit = $$props.unit);
    	};

    	$$self.$capture_state = () => ({
    		css,
    		keyframes,
    		size,
    		color,
    		unit,
    		rotate,
    		circle
    	});

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("color" in $$props) $$invalidate(3, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(4, unit = $$props.unit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [circle, rotate, size, color, unit];
    }

    class Circle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { size: 2, color: 3, unit: 4, circle: 0 });

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

    	get circle() {
    		return this.$$.ctx[0];
    	}

    	set circle(value) {
    		throw new Error("<Circle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\Circle2.svelte generated by Svelte v3.19.2 */
    const file$1 = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\Circle2.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let div_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", div_class_value = "" + (/*circle*/ ctx[0] + " " + /*$$props*/ ctx[1].class));
    			add_location(div, file$1, 52, 0, 1222);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$$props*/ 2 && div_class_value !== (div_class_value = "" + (/*circle*/ ctx[0] + " " + /*$$props*/ ctx[1].class))) {
    				attr_dev(div, "class", div_class_value);
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

    	const circleSpin = keyframes`
  0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  `;

    	const circle = css`
    width: ${size + unit};
    height: ${size + unit};
    box-sizing: border-box;
    position: relative;
    border: 3px solid transparent;
    border-top-color: ${colorOuter};
    border-radius: 50%;
    animation: ${circleSpin} 2s linear infinite;
    :before,
    :after {
      content: "";
      box-sizing: border-box;
      position: absolute;
      border: 3px solid transparent;
      border-radius: 50%;
    }
    &:after {
      border-top-color: ${colorInner};
      top: 9px;
      left: 9px;
      right: 9px;
      bottom: 9px;
      animation: ${circleSpin} 1.5s linear infinite;
    }
    :before {
      border-top-color: ${colorCenter};
      top: 3px;
      left: 3px;
      right: 3px;
      bottom: 3px;
      animation: ${circleSpin} 3s linear infinite;
    }
  `;

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Circle2", $$slots, []);

    	$$self.$set = $$new_props => {
    		$$invalidate(1, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("size" in $$new_props) $$invalidate(2, size = $$new_props.size);
    		if ("unit" in $$new_props) $$invalidate(3, unit = $$new_props.unit);
    		if ("colorOuter" in $$new_props) $$invalidate(4, colorOuter = $$new_props.colorOuter);
    		if ("colorCenter" in $$new_props) $$invalidate(5, colorCenter = $$new_props.colorCenter);
    		if ("colorInner" in $$new_props) $$invalidate(6, colorInner = $$new_props.colorInner);
    	};

    	$$self.$capture_state = () => ({
    		css,
    		keyframes,
    		size,
    		unit,
    		colorOuter,
    		colorCenter,
    		colorInner,
    		circleSpin,
    		circle
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(1, $$props = assign(assign({}, $$props), $$new_props));
    		if ("size" in $$props) $$invalidate(2, size = $$new_props.size);
    		if ("unit" in $$props) $$invalidate(3, unit = $$new_props.unit);
    		if ("colorOuter" in $$props) $$invalidate(4, colorOuter = $$new_props.colorOuter);
    		if ("colorCenter" in $$props) $$invalidate(5, colorCenter = $$new_props.colorCenter);
    		if ("colorInner" in $$props) $$invalidate(6, colorInner = $$new_props.colorInner);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$props = exclude_internal_props($$props);
    	return [circle, $$props, size, unit, colorOuter, colorCenter, colorInner];
    }

    class Circle2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			size: 2,
    			unit: 3,
    			colorOuter: 4,
    			colorCenter: 5,
    			colorInner: 6
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

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\Circle3.svelte generated by Svelte v3.19.2 */
    const file$2 = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\Circle3.svelte";

    function create_fragment$2(ctx) {
    	let div10;
    	let div9;
    	let div8;
    	let div1;
    	let div0;
    	let t0;
    	let div0_class_value;
    	let t1;
    	let div3;
    	let div2;
    	let t2;
    	let div2_class_value;
    	let t3;
    	let div5;
    	let div4;
    	let t4;
    	let div4_class_value;
    	let t5;
    	let div7;
    	let div6;
    	let t6;
    	let div6_class_value;

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			div9 = element("div");
    			div8 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(" ");
    			t1 = space();
    			div3 = element("div");
    			div2 = element("div");
    			t2 = text(" ");
    			t3 = space();
    			div5 = element("div");
    			div4 = element("div");
    			t4 = text(" ");
    			t5 = space();
    			div7 = element("div");
    			div6 = element("div");
    			t6 = text(" ");
    			attr_dev(div0, "class", div0_class_value = "" + (/*ball*/ ctx[4] + " " + /*ballTL*/ ctx[5]));
    			add_location(div0, file$2, 91, 8, 1962);
    			attr_dev(div1, "class", /*singleBall*/ ctx[3]);
    			add_location(div1, file$2, 90, 6, 1926);
    			attr_dev(div2, "class", div2_class_value = "" + (/*ball*/ ctx[4] + " " + /*ballTR*/ ctx[6]));
    			add_location(div2, file$2, 94, 8, 2063);
    			attr_dev(div3, "class", "contener_mixte");
    			add_location(div3, file$2, 93, 6, 2025);
    			attr_dev(div4, "class", div4_class_value = "" + (/*ball*/ ctx[4] + " " + /*ballBL*/ ctx[7]));
    			add_location(div4, file$2, 97, 8, 2164);
    			attr_dev(div5, "class", "contener_mixte");
    			add_location(div5, file$2, 96, 6, 2126);
    			attr_dev(div6, "class", div6_class_value = "" + (/*ball*/ ctx[4] + " " + /*ballBR*/ ctx[8]));
    			add_location(div6, file$2, 100, 8, 2265);
    			attr_dev(div7, "class", "contener_mixte");
    			add_location(div7, file$2, 99, 6, 2227);
    			attr_dev(div8, "class", /*ballContainer*/ ctx[2]);
    			add_location(div8, file$2, 89, 4, 1889);
    			attr_dev(div9, "class", /*inner*/ ctx[1]);
    			add_location(div9, file$2, 88, 2, 1862);
    			attr_dev(div10, "class", /*wrapper*/ ctx[0]);
    			add_location(div10, file$2, 87, 0, 1835);
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
    			append_dev(div0, t0);
    			append_dev(div8, t1);
    			append_dev(div8, div3);
    			append_dev(div3, div2);
    			append_dev(div2, t2);
    			append_dev(div8, t3);
    			append_dev(div8, div5);
    			append_dev(div5, div4);
    			append_dev(div4, t4);
    			append_dev(div8, t5);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, t6);
    		},
    		p: noop,
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

    	const ballOne = keyframes`
  0% {
      position: absolute;
    }
    50% {
      top: 12px;
      left: 12px;
      position: absolute;
      opacity: 0.5;
    }
    100% {
      position: absolute;
    }
  `;

    	const ballTwo = keyframes`
  0% {
      transform: rotate(0deg) scale(1);
    }
    50% {
      transform: rotate(360deg) scale(1.3);
    }
    100% {
      transform: rotate(720deg) scale(1);
    }
  `;

    	const wrapper = css`
    width: ${size + unit};
    height: ${size + unit};
    display: flex;
    justify-content: center;
    align-items: center;
    line-height: 0;
    box-sizing: border-box;
  `;

    	const inner = css`
    transform: scale(${parseInt(size) / 52});
  `;

    	const ballContainer = css`
    animation: ${ballTwo} 1.5s infinite;
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    position: relative;
  `;

    	const singleBall = css`
    width: 44px;
    height: 44px;
    position: absolute;
  `;

    	const ball = css`
    width: 20px;
    height: 20px;
    border-radius: 50%;
    position: absolute;
    animation: ${ballOne} 1.5s infinite ease;
  `;

    	const ballTL = css`
    background-color: ${ballTopLeft};
    top: 0;
    left: 0;
  `;

    	const ballTR = css`
    background-color: ${ballTopRight};
    top: 0;
    left: 24px;
  `;

    	const ballBL = css`
    background-color: ${ballBottomLeft};
    top: 24px;
    left: 0;
  `;

    	const ballBR = css`
    background-color: ${ballBottomRight};
    top: 24px;
    left: 24px;
  `;

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
    		if ("size" in $$props) $$invalidate(9, size = $$props.size);
    		if ("unit" in $$props) $$invalidate(10, unit = $$props.unit);
    		if ("ballTopLeft" in $$props) $$invalidate(11, ballTopLeft = $$props.ballTopLeft);
    		if ("ballTopRight" in $$props) $$invalidate(12, ballTopRight = $$props.ballTopRight);
    		if ("ballBottomLeft" in $$props) $$invalidate(13, ballBottomLeft = $$props.ballBottomLeft);
    		if ("ballBottomRight" in $$props) $$invalidate(14, ballBottomRight = $$props.ballBottomRight);
    	};

    	$$self.$capture_state = () => ({
    		css,
    		keyframes,
    		size,
    		unit,
    		ballTopLeft,
    		ballTopRight,
    		ballBottomLeft,
    		ballBottomRight,
    		ballOne,
    		ballTwo,
    		wrapper,
    		inner,
    		ballContainer,
    		singleBall,
    		ball,
    		ballTL,
    		ballTR,
    		ballBL,
    		ballBR
    	});

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(9, size = $$props.size);
    		if ("unit" in $$props) $$invalidate(10, unit = $$props.unit);
    		if ("ballTopLeft" in $$props) $$invalidate(11, ballTopLeft = $$props.ballTopLeft);
    		if ("ballTopRight" in $$props) $$invalidate(12, ballTopRight = $$props.ballTopRight);
    		if ("ballBottomLeft" in $$props) $$invalidate(13, ballBottomLeft = $$props.ballBottomLeft);
    		if ("ballBottomRight" in $$props) $$invalidate(14, ballBottomRight = $$props.ballBottomRight);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		wrapper,
    		inner,
    		ballContainer,
    		singleBall,
    		ball,
    		ballTL,
    		ballTR,
    		ballBL,
    		ballBR,
    		size,
    		unit,
    		ballTopLeft,
    		ballTopRight,
    		ballBottomLeft,
    		ballBottomRight
    	];
    }

    class Circle3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			size: 9,
    			unit: 10,
    			ballTopLeft: 11,
    			ballTopRight: 12,
    			ballBottomLeft: 13,
    			ballBottomRight: 14
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

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\DoubleBounce.svelte generated by Svelte v3.19.2 */
    const file$3 = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\DoubleBounce.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (32:4) {#each range(2, 1) as version}
    function create_each_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", /*circle*/ ctx[2]);
    			set_style(div, "animation", /*bounce*/ ctx[0] + " 2.1s " + (/*version*/ ctx[6] === 1 ? `1s` : `0s`) + " infinite  ease-in-out");
    			add_location(div, file$3, 32, 4, 707);
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
    		source: "(32:4) {#each range(2, 1) as version}",
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

    			attr_dev(div, "class", /*wrapper*/ ctx[1]);
    			add_location(div, file$3, 30, 0, 642);
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
    			if (dirty & /*circle, bounce, range*/ 5) {
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

    	const bounce = keyframes`
  0%, 100% {transform: scale(0)}
  50% {transform: scale(1.0)}
`;

    	const wrapper = css`
    position: relative;
    width: ${size + unit};
    height: ${size + unit};
  `;

    	const circle = css`
    position: absolute;
    width: ${size + unit};
    height: ${size + unit};
    background-color: ${color};
    border-radius: 100%;
    opacity: 0.6;
    top: 0;
    left: 0;
    animation-fill-mode: both;
  `;

    	const writable_props = ["size", "color", "unit"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DoubleBounce> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("DoubleBounce", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(3, size = $$props.size);
    		if ("color" in $$props) $$invalidate(4, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(5, unit = $$props.unit);
    	};

    	$$self.$capture_state = () => ({
    		css,
    		keyframes,
    		range,
    		size,
    		color,
    		unit,
    		bounce,
    		wrapper,
    		circle
    	});

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(3, size = $$props.size);
    		if ("color" in $$props) $$invalidate(4, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(5, unit = $$props.unit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [bounce, wrapper, circle, size, color, unit];
    }

    class DoubleBounce extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { size: 3, color: 4, unit: 5 });

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

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\GoogleSpin.svelte generated by Svelte v3.19.2 */

    const file$4 = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\GoogleSpin.svelte";

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

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\ScaleOut.svelte generated by Svelte v3.19.2 */
    const file$5 = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\ScaleOut.svelte";

    function create_fragment$5(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", /*circle*/ ctx[1]);
    			add_location(div0, file$5, 25, 2, 663);
    			attr_dev(div1, "class", /*wrapper*/ ctx[0]);
    			add_location(div1, file$5, 24, 0, 635);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: noop,
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

    	const scaleOut = keyframes`
    0% {transform: scale(0);}
    100% {transform: scale(1);opacity: 0;}
  `;

    	const wrapper = css`
    width: ${size + unit};
    height: ${size + unit};
  `;

    	const circle = css`
    width: ${size + unit};
    height: ${size + unit};
    background-color: ${color};
    animation-duration: ${duration};
    border-radius: 100%;
    display: inline-block;
    animation: ${scaleOut} 1s ease-in-out infinite;`;

    	const writable_props = ["size", "color", "duration", "unit"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ScaleOut> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ScaleOut", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("color" in $$props) $$invalidate(3, color = $$props.color);
    		if ("duration" in $$props) $$invalidate(4, duration = $$props.duration);
    		if ("unit" in $$props) $$invalidate(5, unit = $$props.unit);
    	};

    	$$self.$capture_state = () => ({
    		css,
    		keyframes,
    		size,
    		color,
    		duration,
    		unit,
    		scaleOut,
    		wrapper,
    		circle
    	});

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("color" in $$props) $$invalidate(3, color = $$props.color);
    		if ("duration" in $$props) $$invalidate(4, duration = $$props.duration);
    		if ("unit" in $$props) $$invalidate(5, unit = $$props.unit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [wrapper, circle, size, color, duration, unit];
    }

    class ScaleOut extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { size: 2, color: 3, duration: 4, unit: 5 });

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

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\SpinLine.svelte generated by Svelte v3.19.2 */
    const file$6 = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\SpinLine.svelte";

    function create_fragment$6(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", /*line*/ ctx[1]);
    			add_location(div0, file$6, 41, 2, 1314);
    			attr_dev(div1, "class", /*wrapper*/ ctx[0]);
    			add_location(div1, file$6, 40, 0, 1287);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: noop,
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

    	const spineLine = keyframes`
    0% {transform: rotate(-20deg);height: 5px;width: 75px;}
    5% {height: 5px;width: 75px;}
    30% {transform: rotate(380deg);height: 5px;width: 75px;}
    40% {transform: rotate(360deg);height: 5px;width: 75px;}
    55% {transform: rotate(0deg);height: 5px;width: 5px;}
    65% {transform: rotate(0deg);height: 5px;width: 85px;}
    68% {transform: rotate(0deg);height: 5px;}
    75% {transform: rotate(0deg);height: 5px;width: 1px;}
    78% {height: 5px;width: 5px;}
    90% {height: 5px;width: 75px;transform: rotate(0deg);}
    99%,
    100% {height: 5px;width: 75px;transform: rotate(-20deg);}
  `;

    	const wrapper = css`
    width: ${size + unit};
    height: ${stroke};
    transform: scale(${parseInt(size) / 75});
    display: flex;
    justify-content: center;
    align-items: center;
  `;

    	const line = css`
    width: ${size + unit};
    height: ${stroke};
    background: ${color};
    border-radius: ${stroke};
    transform-origin: center center;
    animation: ${spineLine} 4s ease infinite;
  `;

    	const writable_props = ["size", "color", "unit", "stroke"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SpinLine> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("SpinLine", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("color" in $$props) $$invalidate(3, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(4, unit = $$props.unit);
    		if ("stroke" in $$props) $$invalidate(5, stroke = $$props.stroke);
    	};

    	$$self.$capture_state = () => ({
    		css,
    		keyframes,
    		size,
    		color,
    		unit,
    		stroke,
    		spineLine,
    		wrapper,
    		line
    	});

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("color" in $$props) $$invalidate(3, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(4, unit = $$props.unit);
    		if ("stroke" in $$props) $$invalidate(5, stroke = $$props.stroke);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [wrapper, line, size, color, unit, stroke];
    }

    class SpinLine extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { size: 2, color: 3, unit: 4, stroke: 5 });

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

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\Stretch.svelte generated by Svelte v3.19.2 */
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
    			attr_dev(div, "class", "rect svelte-w0x6cj");

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

    			attr_dev(div, "class", "wrapper svelte-w0x6cj");
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

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\BarLoader.svelte generated by Svelte v3.19.2 */
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
    			attr_dev(div, "class", div_class_value = "lines small-lines " + /*version*/ ctx[4] + " svelte-1k7sh9c");
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

    			attr_dev(div, "class", "wrapper svelte-1k7sh9c");
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

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\Jumper.svelte generated by Svelte v3.19.2 */
    const file$9 = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\Jumper.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (31:4) {#each range(3, 1) as version}
    function create_each_block$3(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", /*circle*/ ctx[1]);

    			set_style(div, "animation-delay", /*version*/ ctx[6] === 1
    			? `0s`
    			: /*version*/ ctx[6] === 2
    				? `0.33333s`
    				: /*version*/ ctx[6] === 3 ? `0.66666s` : `0s`);

    			add_location(div, file$9, 31, 4, 717);
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
    		source: "(31:4) {#each range(3, 1) as version}",
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

    			attr_dev(div, "class", /*wrapper*/ ctx[0]);
    			add_location(div, file$9, 29, 0, 652);
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
    			if (dirty & /*circle, range*/ 2) {
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

    	const bounce = keyframes`
  0% {opacity: 0;transform: scale(0);}
  5% {opacity: 1;}
  100% {opacity: 0;}
`;

    	const wrapper = css`
    width: ${size + unit};
    height: ${size + unit};
  `;

    	const circle = css`
    border-radius: 100%;
    animation-fill-mode: both;
    position: absolute;
    opacity: 0;
    width: ${size + unit};
    height: ${size + unit};
    animation: ${bounce} 1s linear infinite;
    background-color: ${color};
  `;

    	const writable_props = ["size", "color", "unit"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Jumper> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Jumper", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("color" in $$props) $$invalidate(3, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(4, unit = $$props.unit);
    	};

    	$$self.$capture_state = () => ({
    		css,
    		keyframes,
    		range,
    		size,
    		color,
    		unit,
    		bounce,
    		wrapper,
    		circle
    	});

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("color" in $$props) $$invalidate(3, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(4, unit = $$props.unit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [wrapper, circle, size, color, unit];
    }

    class Jumper extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { size: 2, color: 3, unit: 4 });

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

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\RingLoader.svelte generated by Svelte v3.19.2 */
    const file$a = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\RingLoader.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (38:4) {#each range(2, 1) as version}
    function create_each_block$4(ctx) {
    	let div;
    	let div_version_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", /*border*/ ctx[3]);

    			set_style(div, "animation", "2s linear 0s infinite normal none running " + (/*version*/ ctx[7] === 1
    			? /*ringOne*/ ctx[0]
    			: /*version*/ ctx[7] === 2 ? /*ringTwo*/ ctx[1] : ``));

    			attr_dev(div, "version", div_version_value = /*version*/ ctx[7]);
    			add_location(div, file$a, 38, 4, 1018);
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
    		source: "(38:4) {#each range(2, 1) as version}",
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

    			attr_dev(div, "class", /*wrapper*/ ctx[2]);
    			add_location(div, file$a, 36, 0, 953);
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
    			if (dirty & /*border, range, ringOne, ringTwo*/ 11) {
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

    	const ringOne = keyframes`
    0% {transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);}
    100% {transform: rotateX(360deg) rotateY(180deg) rotateZ(360deg);}
`;

    	const ringTwo = keyframes`
    0% {transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);}
    100% {transform: rotateX(180deg) rotateY(360deg) rotateZ(360deg);}
`;

    	const wrapper = css`
    position: relative;
    width: ${size + unit};
    height: ${size + unit};
  `;

    	const border = css`
    border-color: ${color};
    position: absolute;
    top: 0px;
    left: 0px;
    width: ${size + unit};
    height: ${size + unit};
    opacity: 0.4;
    perspective: 800px;
    border-width: 6px;
    border-style: solid;
    border-image: initial;
    border-radius: 100%;
  `;

    	const writable_props = ["size", "color", "unit"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<RingLoader> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("RingLoader", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(4, size = $$props.size);
    		if ("color" in $$props) $$invalidate(5, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(6, unit = $$props.unit);
    	};

    	$$self.$capture_state = () => ({
    		css,
    		keyframes,
    		range,
    		size,
    		color,
    		unit,
    		ringOne,
    		ringTwo,
    		wrapper,
    		border
    	});

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(4, size = $$props.size);
    		if ("color" in $$props) $$invalidate(5, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(6, unit = $$props.unit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [ringOne, ringTwo, wrapper, border, size, color, unit];
    }

    class RingLoader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { size: 4, color: 5, unit: 6 });

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

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\SyncLoader.svelte generated by Svelte v3.19.2 */
    const file$b = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\SyncLoader.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (95:2) {#each range(3, 1) as i}
    function create_each_block$5(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "dot svelte-1r1543b");
    			set_style(div, "--dotSize", /*size*/ ctx[0] * 0.25 + /*unit*/ ctx[2]);
    			set_style(div, "--color", /*color*/ ctx[1]);
    			set_style(div, "animation-delay", /*i*/ ctx[3] * 0.07 + "s");
    			add_location(div, file$b, 95, 2, 2341);
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
    		source: "(95:2) {#each range(3, 1) as i}",
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

    			attr_dev(div, "class", "wrapper svelte-1r1543b");
    			set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[2]);
    			add_location(div, file$b, 93, 0, 2260);
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

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\Rainbow.svelte generated by Svelte v3.19.2 */

    const file$c = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\Rainbow.svelte";

    function create_fragment$c(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", "rainbow svelte-69jr3g");
    			add_location(div0, file$c, 46, 2, 995);
    			attr_dev(div1, "class", "wrapper svelte-69jr3g");
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

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\Wave.svelte generated by Svelte v3.19.2 */
    const file$d = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\Wave.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (36:4) {#each range(10, 1) as version}
    function create_each_block$6(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", /*bar*/ ctx[3]);
    			set_style(div, "left", /*version*/ ctx[7] * (/*size*/ ctx[0] / 5 + (/*size*/ ctx[0] / 15 - /*size*/ ctx[0] / 100)) + /*unit*/ ctx[1]);
    			set_style(div, "animation-delay", /*version*/ ctx[7] * 0.15 + "s");
    			add_location(div, file$d, 36, 4, 933);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*size, unit*/ 3) {
    				set_style(div, "left", /*version*/ ctx[7] * (/*size*/ ctx[0] / 5 + (/*size*/ ctx[0] / 15 - /*size*/ ctx[0] / 100)) + /*unit*/ ctx[1]);
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
    		source: "(36:4) {#each range(10, 1) as version}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let div;
    	let each_value = range(10, 1);
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

    			attr_dev(div, "class", /*wrapper*/ ctx[2]);
    			add_location(div, file$d, 34, 0, 867);
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
    			if (dirty & /*bar, range, size, unit*/ 11) {
    				each_value = range(10, 1);
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
    	let y = 0;

    	const motion = keyframes`
    25% {transform: skewY(25deg);}
    50% {height: 100%;margin-top: 0;}
    75% {transform: skewY(-25deg);}
  `;

    	const wrapper = css`
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: ${size * 2.5 + unit};
    height: ${size + unit};
    overflow: hidden;
  `;

    	const bar = css`
    position: absolute;
    top: ${y + size / 10 + unit};
    width: ${size / 5 + unit};
    height: ${size / 10 + unit};
    margin-top: ${size - size / 10 + unit};
    transform: skewY(0deg);
    background-color: ${color};
    animation: ${motion} 1.25s ease-in-out infinite;
`;

    	const writable_props = ["size", "color", "unit"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Wave> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Wave", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(4, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(1, unit = $$props.unit);
    	};

    	$$self.$capture_state = () => ({
    		css,
    		keyframes,
    		range,
    		size,
    		color,
    		unit,
    		y,
    		motion,
    		wrapper,
    		bar
    	});

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("color" in $$props) $$invalidate(4, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(1, unit = $$props.unit);
    		if ("y" in $$props) y = $$props.y;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, unit, wrapper, bar, color];
    }

    class Wave extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { size: 0, color: 4, unit: 1 });

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

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\Firework.svelte generated by Svelte v3.19.2 */
    const file$e = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\Firework.svelte";

    function create_fragment$e(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", /*firework*/ ctx[1]);
    			add_location(div0, file$e, 27, 4, 712);
    			attr_dev(div1, "class", /*wrapper*/ ctx[0]);
    			add_location(div1, file$e, 26, 0, 683);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: noop,
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

    	const fire = keyframes`
    0% {opacity: 1;transform: scale(0.1);}
    25% {opacity: 0.85;}
    100% {transform: scale(1);opacity: 0;}
`;

    	const wrapper = css`
    width: ${size * 1.3 + unit};
    height: ${size * 1.3 + unit};
    display: flex;
    justify-content: center;
    align-items: center;
`;

    	const firework = css`
    border: ${size / 10 + unit} dotted ${color};
    width: ${size + unit};
    height: ${size + unit};
    border-radius: 50%;
    animation: ${fire} 1.25s cubic-bezier(0.165, 0.84, 0.44, 1) infinite;
`;

    	const writable_props = ["size", "color", "unit"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Firework> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Firework", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("color" in $$props) $$invalidate(3, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(4, unit = $$props.unit);
    	};

    	$$self.$capture_state = () => ({
    		css,
    		keyframes,
    		size,
    		color,
    		unit,
    		fire,
    		wrapper,
    		firework
    	});

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("color" in $$props) $$invalidate(3, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(4, unit = $$props.unit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [wrapper, firework, size, color, unit];
    }

    class Firework extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { size: 2, color: 3, unit: 4 });

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

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\Pulse.svelte generated by Svelte v3.19.2 */
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
    			attr_dev(div, "class", "cube svelte-sax99r");
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

    			attr_dev(div, "class", "wrapper svelte-sax99r");
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

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\Jellyfish.svelte generated by Svelte v3.19.2 */
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
    			attr_dev(div, "class", "ring svelte-1uxedtb");
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

    			attr_dev(div, "class", "wrapper svelte-1uxedtb");
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

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\Chasing.svelte generated by Svelte v3.19.2 */
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
    			attr_dev(div, "class", "dot svelte-vgpofk");
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

    			attr_dev(div0, "class", "spinner svelte-vgpofk");
    			add_location(div0, file$h, 43, 2, 929);
    			attr_dev(div1, "class", "wrapper svelte-vgpofk");
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

    /* C:\Users\Alexander\Documents\projects\svelte-loading-spinners\src\Shadow.svelte generated by Svelte v3.19.2 */
    const file$i = "C:\\Users\\Alexander\\Documents\\projects\\svelte-loading-spinners\\src\\Shadow.svelte";

    function create_fragment$i(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", /*shadow*/ ctx[1]);
    			add_location(div0, file$i, 44, 2, 1719);
    			attr_dev(div1, "class", /*wrapper*/ ctx[0]);
    			add_location(div1, file$i, 43, 0, 1692);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: noop,
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

    	const load = keyframes`
    0% {box-shadow: 0 -0.83em 0 -0.4em, 0 -0.83em 0 -0.42em, 0 -0.83em 0 -0.44em, 0 -0.83em 0 -0.46em, 0 -0.83em 0 -0.477em;}
    5%,
    95% {box-shadow: 0 -0.83em 0 -0.4em, 0 -0.83em 0 -0.42em, 0 -0.83em 0 -0.44em, 0 -0.83em 0 -0.46em, 0 -0.83em 0 -0.477em;}
    10%,
    59% {box-shadow: 0 -0.83em 0 -0.4em, -0.087em -0.825em 0 -0.42em, -0.173em -0.812em 0 -0.44em, -0.256em -0.789em 0 -0.46em, -0.297em -0.775em 0 -0.477em;}
    20% {box-shadow: 0 -0.83em 0 -0.4em, -0.338em -0.758em 0 -0.42em, -0.555em -0.617em 0 -0.44em, -0.671em -0.488em 0 -0.46em, -0.749em -0.34em 0 -0.477em;}
    38% {box-shadow: 0 -0.83em 0 -0.4em, -0.377em -0.74em 0 -0.42em, -0.645em -0.522em 0 -0.44em, -0.775em -0.297em 0 -0.46em, -0.82em -0.09em 0 -0.477em;}
    100% {box-shadow: 0 -0.83em 0 -0.4em, 0 -0.83em 0 -0.42em, 0 -0.83em 0 -0.44em, 0 -0.83em 0 -0.46em, 0 -0.83em 0 -0.477em;}
  `;

    	const round = keyframes`
  0% {transform: rotate(0deg);}
  100% {transform: rotate(360deg);}
  `;

    	const wrapper = css`
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: ${size + unit};
    height: ${size + unit};
  `;

    	const shadow = css`
    color: ${color};
    font-size: ${size + unit};
    overflow: hidden;
    width: ${size + unit};
    height: ${size + unit};
    border-radius: 50%;
    margin: 28px auto;
    position: relative;
    transform: translateZ(0);
    animation: ${load} 1.7s infinite ease, ${round} 1.7s infinite ease;
  `;

    	const writable_props = ["size", "color", "unit"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Shadow> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Shadow", $$slots, []);

    	$$self.$set = $$props => {
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("color" in $$props) $$invalidate(3, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(4, unit = $$props.unit);
    	};

    	$$self.$capture_state = () => ({
    		css,
    		keyframes,
    		size,
    		color,
    		unit,
    		load,
    		round,
    		wrapper,
    		shadow
    	});

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("color" in $$props) $$invalidate(3, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(4, unit = $$props.unit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [wrapper, shadow, size, color, unit];
    }

    class Shadow extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, { size: 2, color: 3, unit: 4 });

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

    /* src\App.svelte generated by Svelte v3.19.2 */

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
    	let t42;
    	let div28;
    	let t43;
    	let div27;
    	let t45;
    	let div30;
    	let t46;
    	let div29;
    	let t48;
    	let div32;
    	let t49;
    	let div31;
    	let t51;
    	let div34;
    	let t52;
    	let div33;
    	let t54;
    	let div36;
    	let t55;
    	let div35;
    	let t57;
    	let div38;
    	let t58;
    	let div37;
    	let current;

    	const spinline = new SpinLine({
    			props: { size: "60", color: "#FF3E00" },
    			$$inline: true
    		});

    	const circle2 = new Circle2({
    			props: {
    				size: "60",
    				unit: "px",
    				colorOuter: "#FF3E00",
    				colorCenter: "#40B3FF",
    				colorInner: "#676778"
    			},
    			$$inline: true
    		});

    	const doublebounce = new DoubleBounce({
    			props: { size: "60", color: "#FF3E00" },
    			$$inline: true
    		});

    	const circle = new Circle({
    			props: { size: "60", color: "#FF3E00", unit: "px" },
    			$$inline: true
    		});

    	const stretch = new Stretch({
    			props: { size: "60", color: "#FF3E00" },
    			$$inline: true
    		});

    	const circle3 = new Circle3({
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

    	const barloader = new BarLoader({
    			props: { size: "60", color: "#FF3E00", unit: "px" },
    			$$inline: true
    		});

    	const syncloader = new SyncLoader({
    			props: { size: "60", color: "#FF3E00" },
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

    	const wave = new Wave({
    			props: { size: "60", color: "#FF3E00" },
    			$$inline: true
    		});

    	const firework = new Firework({
    			props: { size: "60", color: "#FF3E00" },
    			$$inline: true
    		});

    	const pulse = new Pulse({
    			props: { size: "60", color: "#FF3E00" },
    			$$inline: true
    		});

    	const jellyfish = new Jellyfish({
    			props: { size: "60", color: "#FF3E00" },
    			$$inline: true
    		});

    	const chasing = new Chasing({
    			props: { size: "60", color: "#FF3E00", unit: "px" },
    			$$inline: true
    		});

    	const shadow = new Shadow({
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
    			attr_dev(h1, "class", "svelte-lait99");
    			add_location(h1, file$j, 77, 1, 1381);
    			attr_dev(a, "href", "https://github.com/Schum123/svelte-loading-spinners");
    			attr_dev(a, "class", "btn svelte-lait99");
    			add_location(a, file$j, 78, 1, 1407);
    			attr_dev(div0, "class", "header svelte-lait99");
    			add_location(div0, file$j, 76, 2, 1358);
    			attr_dev(div1, "class", "spinner-title svelte-lait99");
    			add_location(div1, file$j, 86, 4, 1604);
    			attr_dev(div2, "class", "spinner-item svelte-lait99");
    			add_location(div2, file$j, 84, 1, 1529);
    			attr_dev(div3, "class", "spinner-title svelte-lait99");
    			add_location(div3, file$j, 91, 5, 1800);
    			attr_dev(div4, "class", "spinner-item svelte-lait99");
    			add_location(div4, file$j, 89, 3, 1666);
    			attr_dev(div5, "class", "spinner-title svelte-lait99");
    			add_location(div5, file$j, 95, 5, 1937);
    			attr_dev(div6, "class", "spinner-item svelte-lait99");
    			add_location(div6, file$j, 93, 3, 1856);
    			attr_dev(div7, "class", "spinner-title svelte-lait99");
    			add_location(div7, file$j, 99, 5, 2083);
    			attr_dev(div8, "class", "spinner-item svelte-lait99");
    			add_location(div8, file$j, 97, 3, 1998);
    			attr_dev(div9, "class", "spinner-title svelte-lait99");
    			add_location(div9, file$j, 103, 5, 2214);
    			attr_dev(div10, "class", "spinner-item svelte-lait99");
    			add_location(div10, file$j, 101, 3, 2138);
    			attr_dev(div11, "class", "spinner-title svelte-lait99");
    			add_location(div11, file$j, 107, 5, 2436);
    			attr_dev(div12, "class", "spinner-item svelte-lait99");
    			add_location(div12, file$j, 105, 3, 2270);
    			attr_dev(div13, "class", "spinner-title svelte-lait99");
    			add_location(div13, file$j, 111, 5, 2581);
    			attr_dev(div14, "class", "spinner-item svelte-lait99");
    			add_location(div14, file$j, 109, 3, 2492);
    			attr_dev(div15, "class", "spinner-title svelte-lait99");
    			add_location(div15, file$j, 115, 5, 2718);
    			attr_dev(div16, "class", "spinner-item svelte-lait99");
    			add_location(div16, file$j, 113, 3, 2639);
    			attr_dev(div17, "class", "spinner-title svelte-lait99");
    			add_location(div17, file$j, 119, 5, 2852);
    			attr_dev(div18, "class", "spinner-item svelte-lait99");
    			add_location(div18, file$j, 117, 3, 2777);
    			attr_dev(div19, "class", "spinner-title svelte-lait99");
    			add_location(div19, file$j, 123, 5, 2972);
    			attr_dev(div20, "class", "spinner-item svelte-lait99");
    			add_location(div20, file$j, 121, 3, 2907);
    			attr_dev(div21, "class", "spinner-title svelte-lait99");
    			add_location(div21, file$j, 127, 5, 3108);
    			attr_dev(div22, "class", "spinner-item svelte-lait99");
    			add_location(div22, file$j, 125, 3, 3031);
    			attr_dev(div23, "class", "spinner-title svelte-lait99");
    			add_location(div23, file$j, 131, 4, 3243);
    			attr_dev(div24, "class", "spinner-item svelte-lait99");
    			add_location(div24, file$j, 129, 3, 3165);
    			attr_dev(div25, "class", "spinner-title svelte-lait99");
    			add_location(div25, file$j, 135, 4, 3375);
    			attr_dev(div26, "class", "spinner-item svelte-lait99");
    			add_location(div26, file$j, 133, 2, 3300);
    			attr_dev(div27, "class", "spinner-title svelte-lait99");
    			add_location(div27, file$j, 139, 4, 3501);
    			attr_dev(div28, "class", "spinner-item svelte-lait99");
    			add_location(div28, file$j, 137, 2, 3429);
    			attr_dev(div29, "class", "spinner-title svelte-lait99");
    			add_location(div29, file$j, 143, 4, 3628);
    			attr_dev(div30, "class", "spinner-item svelte-lait99");
    			add_location(div30, file$j, 141, 2, 3552);
    			attr_dev(div31, "class", "spinner-title svelte-lait99");
    			add_location(div31, file$j, 147, 4, 3756);
    			attr_dev(div32, "class", "spinner-item svelte-lait99");
    			add_location(div32, file$j, 145, 2, 3683);
    			attr_dev(div33, "class", "spinner-title svelte-lait99");
    			add_location(div33, file$j, 151, 3, 3884);
    			attr_dev(div34, "class", "spinner-item svelte-lait99");
    			add_location(div34, file$j, 149, 2, 3810);
    			attr_dev(div35, "class", "spinner-title svelte-lait99");
    			add_location(div35, file$j, 155, 3, 4022);
    			attr_dev(div36, "class", "spinner-item svelte-lait99");
    			add_location(div36, file$j, 153, 2, 3940);
    			attr_dev(div37, "class", "spinner-title svelte-lait99");
    			add_location(div37, file$j, 159, 3, 4147);
    			attr_dev(div38, "class", "spinner-item svelte-lait99");
    			add_location(div38, file$j, 157, 2, 4076);
    			attr_dev(section, "class", "svelte-lait99");
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
