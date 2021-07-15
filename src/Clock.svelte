<script lang="ts">
    import type { SpinnerTypes } from "./types/spinner.type";
    export let color: SpinnerTypes["color"] = "#FF3E00";
    export let unit: SpinnerTypes["unit"] = "px";
    export let duration: SpinnerTypes["duration"] = "8s";
    export let size: SpinnerTypes["size"] = "60";
</script>

<style>
    div {
        position: relative;
        width: var(--size);
        height: var(--size);
        background-color: transparent;
        box-shadow: inset 0px 0px 0px 2px var(--color);
        border-radius: 50%;
    }
    div::before,
    div:after {
        position: absolute;
        content: "";
        background-color: var(--color);
    }
    div:after {
        width: calc(var(--size) / 2.4);
        height: 2px;
        top: calc(var(--size) / 2);
        left: calc(var(--size) / 2);
        transform-origin: 1px 1px;
        animation: rotate calc(var(--duration) / 4) linear infinite;
    }
    div:before {
        width: calc(var(--size) / 3);
        height: 2px;
        top: calc((var(--size) / 2));
        left: calc((var(--size) / 2));
        transform-origin: 1px 1px;
        animation: rotate var(--duration) linear infinite;
    }
    @keyframes rotate {
        100% {
            transform: rotate(360deg);
        }
    }
</style>

<div style="--size: {size}{unit}; --color:{color}; --duration:{duration}" />
