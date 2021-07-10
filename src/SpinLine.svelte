<script lang="ts">
  import type { SpinnerTypes } from "./types/spinner.type";
  export let color: SpinnerTypes["color"] = "#FF3E00";
  export let unit: SpinnerTypes["unit"] = "px";
  export let duration: SpinnerTypes["duration"] = "4s";
  export let size: SpinnerTypes["size"] = "60";
  export let stroke = +size / 12 + unit;
</script>

<style>
  .wrapper {
    width: var(--size);
    height: var(--stroke);
    transform: scale(calc(var(--floatSize) / 75));
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .line {
    width: var(--size);
    height: var(--stroke);
    background: var(--color);
    border-radius: var(--stroke);
    transform-origin: center center;
    animation: spineLine var(--duration) ease infinite;
  }
  @keyframes spineLine {
    0% {
      transform: rotate(-20deg);
      height: 5px;
      width: 75px;
    }
    5% {
      height: 5px;
      width: 75px;
    }
    30% {
      transform: rotate(380deg);
      height: 5px;
      width: 75px;
    }
    40% {
      transform: rotate(360deg);
      height: 5px;
      width: 75px;
    }
    55% {
      transform: rotate(0deg);
      height: 5px;
      width: 5px;
    }
    65% {
      transform: rotate(0deg);
      height: 5px;
      width: 85px;
    }
    68% {
      transform: rotate(0deg);
      height: 5px;
    }
    75% {
      transform: rotate(0deg);
      height: 5px;
      width: 1px;
    }
    78% {
      height: 5px;
      width: 5px;
    }
    90% {
      height: 5px;
      width: 75px;
      transform: rotate(0deg);
    }
    99%,
    100% {
      height: 5px;
      width: 75px;
      transform: rotate(-20deg);
    }
  }
</style>

<div
  class="wrapper"
  style="--size: {size}{unit}; --color: {color}; --stroke: {stroke}; --floatSize: {size}; --duration: {duration}">
  <div class="line" />
</div>
