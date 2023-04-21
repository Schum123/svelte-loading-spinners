# svelte-loading-spinners

> collection of loading spinners with Svelte.js

## Installation

```bash
npm i --save-dev svelte-loading-spinners
```

or

```bash
yarn add -D svelte-loading-spinners
```

## Usage

Import `navigating` from `$app/stores`.
When navigating starts, it's value is a Navigation object with from, to, type and (if type === 'popstate') delta properties. When navigating finishes, its value reverts to null. 

Read More: [Sveltekit Docs](https://kit.svelte.dev/docs/modules#$app-stores-navigating) and [Stackoverflow](https://stackoverflow.com/questions/70218035/sveltekit-loading-indicator-when-a-page-load-time-threshold-is-exceeded)


By using an `{#if $navigating}` this allows us to show the loading animation when the page is loading and stop once it's fully rendered.

```svelte
<script>
	import { Jumper } from 'svelte-loading-spinners';
	import { navigating } from '$app/stores'
</script>

{#if $navigating}
	<Jumper size="60" color="#FF3E00" unit="px" duration="1s" />
{/if}
```

## List of available spinners

Props: `size`, `color`, `unit`, `duration` and `pause`.
The default props; `unit` is `px`, `color` is `#FF3E00` and `size` `60px`.

Notes:

`Circle2` instead of the `color` and `duration` props has `colorOuter`, `colorCenter`, `colorInner`, `durationOuter`, `durationCenter`, `durationInner` props.

`Circle3` has `ballTopLeft`, `ballTopRight`, `ballBottomLeft` and `ballBottomRight` as props aswell.

|      Loaders |
| -----------: |
|    BarLoader |
|      Chasing |
|       Circle |
|      Circle2 |
|      Circle3 |
| DoubleBounce |
|     Firework |
|    Jellyfish |
|       Jumper |
|        Pulse |
|      Rainbow |
|   RingLoader |
|     ScaleOut |
|       Shadow |
|     SpinLine |
|      Stretch |
|   SyncLoader |
|         Wave |
|       Square |
|         Moon |

## Demo

List of all spinner: [Demo](https://schum123.github.io/svelte-loading-spinners/)

## Development Setup
